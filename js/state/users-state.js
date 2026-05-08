import { usuariosBase } from "../data/users.js";
import { describirClaveDeCifrado, generarParejaDeClavesDeCifrado } from "../crypto/asymmetric.js";
import { describirClaveDeFirma, generarParejaDeClavesDeFirma } from "../crypto/signatures.js";

export async function crearUsuarios() {
  const usuarios = [];

  for (const usuarioBase of usuariosBase) {
    const clavesDeCifrado = await generarParejaDeClavesDeCifrado();
    const clavesDeFirma = await generarParejaDeClavesDeFirma();
    const infoCifrado = await describirClaveDeCifrado(clavesDeCifrado);
    const infoFirma = await describirClaveDeFirma(clavesDeFirma);

    usuarios.push({
      ...usuarioBase,
      clavesDeCifrado,
      clavesDeFirma,
      infoCifrado,
      infoFirma
    });
  }

  return usuarios;
}
