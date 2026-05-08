import {
  base64AArrayBuffer,
  bufferABase64,
  formatearError,
  obtenerIdDePareja,
  hashDeBuffer,
  textoABytes,
  bytesATexto
} from "./helpers.js";

const clavesDePareja = new Map();

async function crearClaveCompartida() {
  return crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function obtenerClaveCompartida(primerUsuarioId, segundoUsuarioId) {
  const idPareja = obtenerIdDePareja(primerUsuarioId, segundoUsuarioId);

  if (!clavesDePareja.has(idPareja)) {
    const clave = await crearClaveCompartida();
    clavesDePareja.set(idPareja, clave);
  }

  return clavesDePareja.get(idPareja);
}

export async function obtenerDetalleClaveCompartida(primerUsuarioId, segundoUsuarioId) {
  const idPareja = obtenerIdDePareja(primerUsuarioId, segundoUsuarioId);
  const existia = clavesDePareja.has(idPareja);
  const clave = await obtenerClaveCompartida(primerUsuarioId, segundoUsuarioId);

  return {
    clave,
    idPareja,
    creadaAhora: !existia,
    algoritmo: "AES-GCM",
    huella: await describirClaveCompartida(clave)
  };
}

export async function describirClaveCompartida(clave) {
  const claveCruda = await crypto.subtle.exportKey("raw", clave);
  const resumen = await hashDeBuffer("SHA-256", claveCruda);
  return resumen.slice(0, 16);
}

export async function cifrarSimetrico(clave, mensaje) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cifrado = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    clave,
    textoABytes(mensaje)
  );

  return {
    iv: bufferABase64(iv),
    textoCifrado: bufferABase64(cifrado)
  };
}

export async function descifrarSimetrico(clave, carga) {
  try {
    const descifrado = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(base64AArrayBuffer(carga.iv))
      },
      clave,
      base64AArrayBuffer(carga.textoCifrado)
    );

    return bytesATexto(descifrado);
  } catch (error) {
    throw new Error(`No se pudo descifrar con la clave indicada. ${formatearError(error)}`);
  }
}
