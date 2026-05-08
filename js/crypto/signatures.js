import { base64AArrayBuffer, bufferABase64, crearHuellaDeClave, textoABytes } from "./helpers.js";

const configuracionRsaFirma = {
  name: "RSA-PSS",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256"
};

export async function generarParejaDeClavesDeFirma() {
  return crypto.subtle.generateKey(configuracionRsaFirma, true, ["sign", "verify"]);
}

export async function describirClaveDeFirma(clavesDeFirma) {
  const huellaPublica = await crearHuellaDeClave(clavesDeFirma.publicKey, "spki");
  const huellaPrivada = await crearHuellaDeClave(clavesDeFirma.privateKey, "pkcs8");

  return {
    huella: huellaPublica,
    huellaPublica,
    huellaPrivada,
    algoritmo: configuracionRsaFirma.name
  };
}

export async function firmarMensaje(clavePrivada, mensaje) {
  const firma = await crypto.subtle.sign(
    {
      name: "RSA-PSS",
      saltLength: 32
    },
    clavePrivada,
    textoABytes(mensaje)
  );

  return bufferABase64(firma);
}

export async function verificarFirma(clavePublica, mensaje, firma) {
  return crypto.subtle.verify(
    {
      name: "RSA-PSS",
      saltLength: 32
    },
    clavePublica,
    base64AArrayBuffer(firma),
    textoABytes(mensaje)
  );
}
