import {
  base64AArrayBuffer,
  bufferABase64,
  crearHuellaDeClave,
  resumirTexto,
  textoABytes,
  bytesATexto
} from "./helpers.js";

const configuracionRsaCifrado = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256"
};

export async function generarParejaDeClavesDeCifrado() {
  return crypto.subtle.generateKey(configuracionRsaCifrado, true, ["encrypt", "decrypt"]);
}

export async function describirClavePublicaDeCifrado(clavePublica) {
  const huellaPublica = await crearHuellaDeClave(clavePublica, "spki");

  return {
    huella: huellaPublica,
    huellaPublica,
    algoritmo: configuracionRsaCifrado.name
  };
}

export async function describirClaveDeCifrado(clavesDeCifrado) {
  const huellaPublica = await crearHuellaDeClave(clavesDeCifrado.publicKey, "spki");
  const huellaPrivada = await crearHuellaDeClave(clavesDeCifrado.privateKey, "pkcs8");

  return {
    huella: huellaPublica,
    huellaPublica,
    huellaPrivada,
    algoritmo: configuracionRsaCifrado.name
  };
}

export async function cifrarConClavePublica(clavePublica, mensaje) {
  const cifrado = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    clavePublica,
    textoABytes(mensaje)
  );

  return bufferABase64(cifrado);
}

export async function descifrarConClavePrivada(clavePrivada, textoCifrado) {
  const descifrado = await crypto.subtle.decrypt(
    {
      name: "RSA-OAEP"
    },
    clavePrivada,
    base64AArrayBuffer(textoCifrado)
  );

  return bytesATexto(descifrado);
}

export function resumirTextoCifrado(textoCifrado) {
  return resumirTexto(textoCifrado, 68);
}
