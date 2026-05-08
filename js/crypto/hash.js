import { bufferAHex, textoABytes } from "./helpers.js";

export async function generarHashDeTexto(algoritmo, mensaje) {
  const resumen = await crypto.subtle.digest(algoritmo, textoABytes(mensaje));
  return bufferAHex(resumen);
}

export function construirMensajeAlterado(mensaje) {
  if (!mensaje.trim()) {
    return "Mensaje alterado por un atacante.";
  }

  if (mensaje.includes("500 pesos")) {
    return mensaje.replace("500 pesos", "5000 pesos");
  }

  return `${mensaje} [alterado]`;
}
