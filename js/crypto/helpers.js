const codificador = new TextEncoder();
const decodificador = new TextDecoder();

export function textoABytes(texto) {
  return codificador.encode(texto);
}

export function bytesATexto(buffer) {
  return decodificador.decode(buffer);
}

export function bufferABase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binario = "";

  for (const byte of bytes) {
    binario += String.fromCharCode(byte);
  }

  return btoa(binario);
}

export function base64AArrayBuffer(base64) {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);

  for (let indice = 0; indice < binario.length; indice += 1) {
    bytes[indice] = binario.charCodeAt(indice);
  }

  return bytes.buffer;
}

export function bufferAHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashDeBuffer(algoritmo, buffer) {
  const resumen = await crypto.subtle.digest(algoritmo, buffer);
  return bufferAHex(resumen);
}

export function resumirTexto(texto, limite = 52) {
  if (texto.length <= limite) {
    return texto;
  }

  return `${texto.slice(0, limite)}...`;
}

export function formatearError(error) {
  if (!error) {
    return "Error desconocido.";
  }

  if (error.name && error.message) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

export function obtenerIdDePareja(primerId, segundoId) {
  return [primerId, segundoId].sort().join("::");
}

export async function crearHuellaDeClave(clave, formato = "spki") {
  const claveExportada = await crypto.subtle.exportKey(formato, clave);
  const resumen = await hashDeBuffer("SHA-256", claveExportada);
  return resumen.slice(0, 16);
}
