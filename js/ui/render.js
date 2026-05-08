function escaparHtml(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function llenarSelect(select, usuarios, idSeleccionado) {
  select.innerHTML = usuarios
    .map((usuario) => `<option value="${usuario.id}">${usuario.name}</option>`)
    .join("");

  if (idSeleccionado) {
    select.value = idSeleccionado;
  }
}

export function renderizarUsuarios(elementoGrid, usuarios) {
  elementoGrid.innerHTML = usuarios
    .map(
      (usuario) => `
        <article class="user-card">
          <div class="user-top">
            <div class="avatar" style="background:${usuario.color}">${usuario.name.slice(0, 2).toUpperCase()}</div>
            <div class="user-meta">
              <h3>${usuario.name}</h3>
              <p>${usuario.role}</p>
            </div>
          </div>

          <div class="chip-list">
            <span class="chip success">RSA cifrado: ${usuario.infoCifrado.huella}</span>
            <span class="chip warning">RSA firma: ${usuario.infoFirma.huella}</span>
          </div>

          <p class="user-meta">
            Cada usuario tiene una pareja de llaves para cifrado asimetrico
            y otra pareja para firmas digitales.
          </p>
        </article>
      `
    )
    .join("");
}

export function renderizarPlaceholder(elemento, texto) {
  elemento.classList.add("empty");
  elemento.innerHTML = `<p>${texto}</p>`;
}

function lineaDeResultado(etiqueta, valor) {
  return `
    <div class="result-line">
      <span class="line-label">${escaparHtml(etiqueta)}</span>
      <span class="line-value">${escaparHtml(valor)}</span>
    </div>
  `;
}

function chipDeResultado(etiqueta, tipo) {
  return `<span class="chip ${tipo}">${escaparHtml(etiqueta)}</span>`;
}

function pasoDeResultado(paso, indice) {
  return `
    <div class="result-step">
      <div class="result-step-number">${indice + 1}</div>
      <div class="result-step-content">
        <span class="result-step-title">${escaparHtml(paso.title)}</span>
        <span class="result-step-detail">${escaparHtml(paso.detail)}</span>
      </div>
    </div>
  `;
}

export function renderizarResultado(elemento, opciones) {
  elemento.classList.remove("empty");

  const lineas = opciones.lines.map((linea) => lineaDeResultado(linea.label, linea.value)).join("");
  const chips = opciones.chips.map((chip) => chipDeResultado(chip.label, chip.type)).join("");
  const pasos = (opciones.steps || []).map((paso, indice) => pasoDeResultado(paso, indice)).join("");

  elemento.innerHTML = `
    <div class="result-group">
      ${pasos ? `<div class="result-steps">${pasos}</div>` : ""}
      ${lineas}
    </div>
    <div class="result-footer chip-list">
      ${chips}
    </div>
  `;
}

export function activarVista(configuracion) {
  configuracion.buttons.forEach((boton) => {
    boton.classList.toggle("active", boton.dataset.view === configuracion.activeView);
  });

  configuracion.sections.forEach((seccion) => {
    seccion.classList.toggle("active", seccion.id === configuracion.activeView);
  });
}

function filaDeIntento(intento) {
  return `
    <div class="attempt-row">
      <div class="attempt-header">
        <span class="attempt-user">${escaparHtml(intento.userName)}</span>
        <span class="chip ${intento.success ? "success" : "danger"}">
          ${intento.success ? "Puede leer" : "No puede leer"}
        </span>
      </div>
      <div class="attempt-output">${escaparHtml(intento.output)}</div>
    </div>
  `;
}

export function renderizarDemoDeMensajes(contenedor, elementoResumen, mensajes) {
  const totalLecturas = mensajes.reduce(
    (total, mensaje) => total + mensaje.attempts.filter((intento) => intento.success).length,
    0
  );
  const totalBloqueados = mensajes.reduce(
    (total, mensaje) => total + mensaje.attempts.filter((intento) => !intento.success).length,
    0
  );

  elementoResumen.innerHTML = `
    <span class="chip success">Lecturas correctas: ${totalLecturas}</span>
    <span class="chip danger">Intentos bloqueados: ${totalBloqueados}</span>
    <span class="chip warning">Mensajes definidos: ${mensajes.length}</span>
  `;

  contenedor.innerHTML = mensajes
    .map(
      (mensaje) => `
        <article class="message-card">
          <div class="message-head">
            <div>
              <h3>${escaparHtml(mensaje.title)}</h3>
              <p class="message-meta">
                ${escaparHtml(mensaje.senderName)} envia a ${escaparHtml(mensaje.receiverName)} con ${escaparHtml(mensaje.modeLabel)}
              </p>
            </div>
            <span class="chip">${escaparHtml(mensaje.modeShort)}</span>
          </div>

          <div>
            <span class="line-label">Texto cifrado</span>
            <div class="cipher-box">${escaparHtml(mensaje.ciphertext)}</div>
          </div>

          <div class="attempts-grid">
            ${mensaje.attempts.map((intento) => filaDeIntento(intento)).join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function panelDeParte(titulo, subtitulo, color, iniciales, campos) {
  return `
    <section class="signature-panel">
      <div class="signature-party-head">
        <div class="signature-avatar" style="background:${escaparHtml(color)}">${escaparHtml(iniciales)}</div>
        <div>
          <h3>${escaparHtml(titulo)}</h3>
          <p class="signature-role">${escaparHtml(subtitulo)}</p>
        </div>
      </div>

      <div class="signature-field-list">
        ${campos
          .map(
            (campo) => `
              <div class="signature-field ${campo.wide ? "wide" : ""}">
                <label>${escaparHtml(campo.label)}</label>
                <div class="signature-box ${campo.large ? "large" : ""} ${campo.soft ? "soft" : ""}">
                  ${escaparHtml(campo.value)}
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function resumirEnVista(texto, limite = 92) {
  const valor = String(texto || "");

  if (valor.length <= limite) {
    return valor;
  }

  return `${valor.slice(0, limite)}...`;
}

function valorDeCaja(valor, pendiente = "Pendiente") {
  return escaparHtml(valor || pendiente);
}

function claseActiva(condicion) {
  return condicion ? "is-active" : "";
}

function atributoDeshabilitado(condicion) {
  return condicion ? "disabled" : "";
}

function construirTextoAtaqueVista(mensaje) {
  if (!mensaje.trim()) {
    return "Mensaje alterado por un atacante.";
  }

  if (mensaje.includes("500 pesos")) {
    return mensaje.replace("500 pesos", "5000 pesos");
  }

  return `${mensaje} [alterado]`;
}

export function renderizarModalDeFirma(elemento, escenario, laboratorio = null) {
  if (!escenario) {
    elemento.innerHTML = "";
    return;
  }

  const lab = laboratorio || {
    llavesGeneradas: true,
    infoFirmaFirmante: escenario.firmante.infoFirma,
    infoCifradoReceptor: escenario.verificador.infoCifrado,
    mensaje: escenario.mensaje,
    hashOriginal: escenario.hashOriginal,
    firma: escenario.firma,
    textoCifrado: "",
    ataque: false,
    ataqueDecision: "no",
    enviado: true,
    ataqueAplicado: false,
    mensajeEnviado: escenario.mensaje,
    textoCifradoEnviado: "",
    hashRecibido: escenario.hashOriginal,
    receptorDecision: "aceptar",
    mensajeDescifrado: escenario.mensaje,
    hashRecalculado: escenario.hashOriginal,
    verificacionReceptor: escenario.verificacionPrincipal,
    estado: "Laboratorio listo."
  };

  const firmaVista = resumirEnVista(lab.firma, 112);
  const cifradoVista = resumirEnVista(lab.textoCifradoEnviado || lab.textoCifrado, 132);
  const hashRecibidoVista = resumirEnVista(lab.hashRecibido, 96);
  const hashRecalculadoVista = resumirEnVista(lab.hashRecalculado, 96);
  const infoFirmaFirmante = lab.infoFirmaFirmante || escenario.firmante.infoFirma;
  const infoCifradoReceptor = lab.infoCifradoReceptor || escenario.verificador.infoCifrado;
  const puedeGenerarHash = lab.llavesGeneradas;
  const puedeFirmarHash = puedeGenerarHash && lab.hashOriginal;
  const puedeCifrarMensaje = puedeFirmarHash && lab.firma;
  const puedeEnviarMensaje = puedeCifrarMensaje && lab.textoCifrado;
  const puedeDecidirAtaque = lab.enviado;
  const ataqueDecidido = Boolean(lab.ataqueDecision);
  const puedeDecidirReceptor = lab.enviado && ataqueDecidido;
  const puedeVerificar = lab.enviado && ataqueDecidido && lab.receptorDecision;
  const decisionTexto =
    lab.verificacionReceptor === null
      ? "Sin verificar"
      : lab.verificacionReceptor
        ? "Aceptar"
        : "Rechazar";
  const decisionClase =
    lab.verificacionReceptor === null ? "" : lab.verificacionReceptor ? "accept" : "reject";
  const estadoTipo = lab.estado && lab.estado.startsWith("Error:") ? "danger" : lab.verificacionReceptor === false ? "danger" : "success";

  elemento.innerHTML = `
    <div class="signature-modal">
      <header class="signature-modal-header">
        <div>
          <h2 id="signatureModalTitle">Laboratorio de firma digital</h2>
          <p class="signature-modal-note">
            Ejecuta el envio paso a paso: claves, hash, firma, cifrado, ataque y verificacion.
          </p>
        </div>
        <div class="chip-list signature-modal-status">
          <span class="chip success">${escaparHtml(`${escenario.firmante.name} firma`)}</span>
          <span class="chip warning">${escaparHtml(`${escenario.verificador.name} revisa`)}</span>
          <span class="chip ${lab.ataque ? "danger" : "success"}">${escaparHtml(lab.ataque ? "Ataque activo" : "Sin ataque")}</span>
          <span class="chip ${estadoTipo}">${escaparHtml(lab.estado || "Listo")}</span>
        </div>
      </header>

      <div class="signature-lab-app">
        <section class="signature-workbench signature-workbench-left">
          <div class="signature-person">
            <div class="signature-avatar" style="background:${escaparHtml(escenario.firmante.color)}">
              ${escaparHtml(escenario.firmante.name.slice(0, 2).toUpperCase())}
            </div>
            <div>
              <h3>${escaparHtml(escenario.firmante.name)}</h3>
              <p>${escaparHtml(escenario.firmante.role)}</p>
            </div>
          </div>

          <div class="signature-step-row">
            <div>
              <h4>1.- Generar claves</h4>
              <button class="lab-action-btn success" data-signature-action="generate-keys" type="button">Generar</button>
            </div>
            <div class="signature-key-grid">
              <label>Clave privada</label>
              <div class="signature-lab-box">${valorDeCaja(lab.llavesGeneradas ? infoFirmaFirmante.huellaPrivada : "")}</div>
              <label>Clave publica</label>
              <div class="signature-lab-box">${valorDeCaja(lab.llavesGeneradas ? infoFirmaFirmante.huellaPublica : "")}</div>
            </div>
          </div>

          <div class="signature-step-row">
            <h4>2.- Escribir mensaje en texto plano</h4>
            <textarea id="signatureLabMessage" class="signature-lab-message" rows="4">${escaparHtml(lab.mensaje)}</textarea>
          </div>

          <div class="signature-step-row compact-step">
            <h4>3.- Generar hash</h4>
            <button class="lab-action-btn success" data-signature-action="generate-hash" type="button" ${atributoDeshabilitado(!puedeGenerarHash)}>Generar</button>
            <div class="signature-lab-box small">${valorDeCaja(resumirEnVista(lab.hashOriginal, 92))}</div>
          </div>

          <div class="signature-step-row compact-step">
            <h4>4.- Encriptar el hash</h4>
            <button class="lab-action-btn success" data-signature-action="encrypt-hash" type="button" ${atributoDeshabilitado(!puedeFirmarHash)}>Encriptar</button>
            <div class="signature-lab-box small">${valorDeCaja(firmaVista)}</div>
          </div>

          <div class="signature-step-row compact-step">
            <h4>5.- Encriptar mensaje</h4>
            <button class="lab-action-btn success" data-signature-action="encrypt-message" type="button" ${atributoDeshabilitado(!puedeCifrarMensaje)}>Encriptar</button>
            <div class="signature-lab-box small">${valorDeCaja(resumirEnVista(lab.textoCifrado, 92))}</div>
          </div>

          <div class="signature-step-row compact-step send-row">
            <h4>6.- Enviar mensaje</h4>
            <button class="lab-action-btn success wide" data-signature-action="send-message" type="button" ${atributoDeshabilitado(!puedeEnviarMensaje)}>Enviar mensaje</button>
            <strong>${escaparHtml(lab.enviado ? "MENSAJE ENVIADO!!" : "")}</strong>
          </div>
        </section>

        <section class="signature-attack-console">
          <div class="signature-lock">RSA-PSS<br>RSA-OAEP</div>
          <div class="signature-direction" aria-hidden="true">
            <span>&lt;-</span>
            <span>-&gt;</span>
          </div>
          <h3>Desea hacer un ataque?</h3>
          <div class="signature-toggle-row">
            <button class="lab-action-btn danger ${claseActiva(lab.ataqueDecision === "si")}" data-signature-action="attack-yes" type="button" ${atributoDeshabilitado(!puedeDecidirAtaque)}>Si</button>
            <button class="lab-action-btn muted ${claseActiva(lab.ataqueDecision === "no")}" data-signature-action="attack-no" type="button" ${atributoDeshabilitado(!puedeDecidirAtaque)}>No</button>
          </div>
          <div class="signature-attack-result">
            <span class="line-label">Mensaje que viajara</span>
            ${
              lab.enviado && lab.ataque
                ? `<textarea id="signatureAttackMessage" class="signature-lab-message attack-message" rows="5">${escaparHtml(lab.mensajeEnviado || construirTextoAtaqueVista(lab.mensaje))}</textarea>`
                : `<div class="signature-lab-box soft">
                    ${valorDeCaja(lab.enviado ? lab.mensajeEnviado : lab.mensaje)}
                  </div>`
            }
          </div>
        </section>

        <section class="signature-workbench signature-workbench-right">
          <div class="signature-person right">
            <div class="signature-avatar" style="background:${escaparHtml(escenario.verificador.color)}">
              ${escaparHtml(escenario.verificador.name.slice(0, 2).toUpperCase())}
            </div>
            <div>
              <h3>${escaparHtml(escenario.verificador.name)}</h3>
              <p>${escaparHtml(escenario.verificador.role)}</p>
            </div>
          </div>

          <div class="signature-step-row">
            <div class="signature-key-grid">
              <label>Privada receptor</label>
              <div class="signature-lab-box">${valorDeCaja(lab.llavesGeneradas ? infoCifradoReceptor.huellaPrivada : "")}</div>
              <label>Publica receptor</label>
              <div class="signature-lab-box">${valorDeCaja(lab.llavesGeneradas ? infoCifradoReceptor.huellaPublica : "")}</div>
              <label>Publica firmante</label>
              <div class="signature-lab-box">${valorDeCaja(lab.llavesGeneradas ? infoFirmaFirmante.huellaPublica : "")}</div>
            </div>
          </div>

          <div class="signature-step-row compact-step">
            <h4>2.- Que desea hacer con el mensaje?</h4>
            <div class="signature-toggle-row left">
              <button class="lab-action-btn accept ${claseActiva(lab.receptorDecision === "aceptar")}" data-signature-action="accept-message" type="button" ${atributoDeshabilitado(!puedeDecidirReceptor)}>Aceptar</button>
              <button class="lab-action-btn reject ${claseActiva(lab.receptorDecision === "rechazar")}" data-signature-action="reject-message" type="button" ${atributoDeshabilitado(!puedeDecidirReceptor)}>Rechazar</button>
            </div>
          </div>

          ${
            lab.receptorDecision
              ? `
                <div class="signature-step-row">
                  <h4>3.- Hash recibido</h4>
                  <div class="signature-lab-box large">${valorDeCaja(hashRecibidoVista)}</div>
                </div>

                <div class="signature-step-row">
                  <h4>4.- Mensaje encriptado</h4>
                  <div class="signature-lab-box large">${valorDeCaja(cifradoVista)}</div>
                </div>
              `
              : ""
          }

          <div class="signature-step-row">
            <h4>5.- Verificar y desencriptar mensaje</h4>
            <button class="lab-action-btn reject wide" data-signature-action="verify-decrypt" type="button" ${atributoDeshabilitado(!puedeVerificar)}>Desencriptar y verificar</button>
            <div class="signature-lab-box large soft">
              ${valorDeCaja(
                lab.mensajeDescifrado
                  ? `Mensaje: ${lab.mensajeDescifrado}\nHash recalculado: ${hashRecalculadoVista}\nDecision: ${decisionTexto}`
                  : ""
              )}
            </div>
            <div class="signature-decision ${decisionClase}">${escaparHtml(decisionTexto)}</div>
          </div>
        </section>
      </div>
    </div>
  `;
}
