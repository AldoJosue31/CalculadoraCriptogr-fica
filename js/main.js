import { crearHuellaDeClave, resumirTexto, formatearError } from "./crypto/helpers.js";
import {
  resumirTextoCifrado,
  cifrarConClavePublica,
  descifrarConClavePrivada,
  generarParejaDeClavesDeCifrado,
  describirClaveDeCifrado
} from "./crypto/asymmetric.js";
import { generarHashDeTexto, construirMensajeAlterado } from "./crypto/hash.js";
import {
  firmarMensaje,
  verificarFirma,
  generarParejaDeClavesDeFirma,
  describirClaveDeFirma
} from "./crypto/signatures.js";
import {
  descifrarSimetrico,
  cifrarSimetrico,
  obtenerClaveCompartida,
  obtenerDetalleClaveCompartida
} from "./crypto/symmetric.js";
import { crearUsuarios } from "./state/users-state.js";
import {
  llenarSelect,
  renderizarDemoDeMensajes,
  renderizarModalDeFirma,
  renderizarPlaceholder,
  renderizarResultado,
  renderizarUsuarios
} from "./ui/render.js";

const estado = {
  usuarios: [],
  mensajesDemo: [],
  ultimoEscenarioDeFirma: null,
  laboratorioFirma: null
};

const elementos = {
  appStatus: document.querySelector("#appStatus"),
  labSection: document.querySelector("#labSection"),
  demoSection: document.querySelector("#demoSection"),
  usersGrid: document.querySelector("#usersGrid"),
  demoSummary: document.querySelector("#demoSummary"),
  messagesGrid: document.querySelector("#messagesGrid"),
  textoMensaje1: document.querySelector("#textoMensaje1"),
  textoMensaje2: document.querySelector("#textoMensaje2"),
  textoMensaje3: document.querySelector("#textoMensaje3"),
  updateMessagesBtn: document.querySelector("#updateMessagesBtn"),
  symSender: document.querySelector("#symSender"),
  symReceiver: document.querySelector("#symReceiver"),
  symMessage: document.querySelector("#symMessage"),
  symResult: document.querySelector("#symResult"),
  runSymmetricBtn: document.querySelector("#runSymmetricBtn"),
  asymSender: document.querySelector("#asymSender"),
  asymReceiver: document.querySelector("#asymReceiver"),
  asymMessage: document.querySelector("#asymMessage"),
  asymResult: document.querySelector("#asymResult"),
  runAsymmetricBtn: document.querySelector("#runAsymmetricBtn"),
  hashMessage: document.querySelector("#hashMessage"),
  hashTampered: document.querySelector("#hashTampered"),
  hashResult: document.querySelector("#hashResult"),
  runHashBtn: document.querySelector("#runHashBtn"),
  signUser: document.querySelector("#signUser"),
  signVerifier: document.querySelector("#signVerifier"),
  signMessage: document.querySelector("#signMessage"),
  signatureResult: document.querySelector("#signatureResult"),
  runSignatureBtn: document.querySelector("#runSignatureBtn"),
  openSignatureModalBtn: document.querySelector("#openSignatureModalBtn"),
  cryptoCarouselTrack: document.querySelector("#cryptoCarouselTrack"),
  cryptoCarouselDots: document.querySelector("#cryptoCarouselDots"),
  prevDemoSlide: document.querySelector("#prevDemoSlide"),
  nextDemoSlide: document.querySelector("#nextDemoSlide"),
  carouselViewport: document.querySelector(".carousel-viewport"),
  signatureModal: document.querySelector("#signatureModal"),
  closeSignatureModal: document.querySelector("#closeSignatureModal"),
  signatureModalBody: document.querySelector("#signatureModalBody")
};

let indiceCarruselPruebas = 0;

const mensajesPredefinidos = [
  {
    title: "Mensaje 1",
    mode: "symmetric",
    senderId: "alicia",
    receiverId: "beto",
    plaintext: "Ana comparte una clave con Luis para enviar el reporte diario."
  },
  {
    title: "Mensaje 2",
    mode: "asymmetric",
    senderId: "marta",
    receiverId: "alicia",
    plaintext: "Marta cifra con la llave publica de Ana el informe de auditoria."
  },
  {
    title: "Mensaje 3",
    mode: "symmetric",
    senderId: "beto",
    receiverId: "marta",
    plaintext: "Luis y Marta protegen la incidencia con una clave simetrica."
  }
];

function sincronizarTextosDeMensajes() {
  elementos.textoMensaje1.value = mensajesPredefinidos[0].plaintext;
  elementos.textoMensaje2.value = mensajesPredefinidos[1].plaintext;
  elementos.textoMensaje3.value = mensajesPredefinidos[2].plaintext;
}

function aplicarTextosDeMensajes() {
  mensajesPredefinidos[0].plaintext = elementos.textoMensaje1.value.trim() || mensajesPredefinidos[0].plaintext;
  mensajesPredefinidos[1].plaintext = elementos.textoMensaje2.value.trim() || mensajesPredefinidos[1].plaintext;
  mensajesPredefinidos[2].plaintext = elementos.textoMensaje3.value.trim() || mensajesPredefinidos[2].plaintext;
}

function obtenerUsuarioPorId(usuarioId) {
  return estado.usuarios.find((usuario) => usuario.id === usuarioId);
}

function obtenerOtroUsuario(idsExcluidos) {
  return estado.usuarios.find((usuario) => !idsExcluidos.includes(usuario.id));
}

function sincronizarSelectoresDeFirma() {
  const firmanteId = elementos.signUser.value;

  if (elementos.signVerifier.value === firmanteId) {
    const alternativa = obtenerOtroUsuario([firmanteId]);

    if (alternativa) {
      elementos.signVerifier.value = alternativa.id;
    }
  }
}

function actualizarEstado(texto) {
  elementos.appStatus.textContent = texto;
}

function abrirModalDeFirma() {
  elementos.signatureModal.classList.add("open");
  elementos.signatureModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function cerrarModalDeFirma() {
  elementos.signatureModal.classList.remove("open");
  elementos.signatureModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function crearEstadoLaboratorioFirma(escenario) {
  return {
    llavesGeneradas: false,
    clavesFirmaFirmante: null,
    infoFirmaFirmante: null,
    clavesCifradoReceptor: null,
    infoCifradoReceptor: null,
    mensaje: escenario.mensaje,
    hashOriginal: "",
    firma: "",
    textoCifrado: "",
    ataque: false,
    ataqueDecision: "",
    enviado: false,
    ataqueAplicado: false,
    mensajeEnviado: "",
    textoCifradoEnviado: "",
    hashRecibido: "",
    receptorDecision: "",
    mensajeDescifrado: "",
    hashRecalculado: "",
    verificacionReceptor: null,
    estado: "Listo para generar claves."
  };
}

function renderizarLaboratorioDeFirma() {
  renderizarModalDeFirma(
    elementos.signatureModalBody,
    estado.ultimoEscenarioDeFirma,
    estado.laboratorioFirma
  );
}

function tomarMensajeDelLaboratorio() {
  const cajaMensaje = elementos.signatureModalBody.querySelector("#signatureLabMessage");

  if (cajaMensaje && estado.laboratorioFirma) {
    const mensajeActualizado = cajaMensaje.value.trim() || "Mensaje firmado de ejemplo.";
    const cambioMensaje = mensajeActualizado !== estado.laboratorioFirma.mensaje;
    estado.laboratorioFirma.mensaje = mensajeActualizado;
    return cambioMensaje;
  }

  return false;
}

function limpiarSalidaPosteriorDelLaboratorio() {
  if (!estado.laboratorioFirma) {
    return;
  }

  limpiarPasosPosterioresALasClaves(estado.laboratorioFirma);
}

function limpiarPasosPosterioresALasClaves(laboratorio) {
  Object.assign(laboratorio, {
    hashOriginal: "",
    firma: "",
    textoCifrado: "",
    ataque: false,
    ataqueDecision: "",
    enviado: false,
    ataqueAplicado: false,
    mensajeEnviado: "",
    textoCifradoEnviado: "",
    hashRecibido: "",
    receptorDecision: "",
    mensajeDescifrado: "",
    hashRecalculado: "",
    verificacionReceptor: null
  });
}

function limpiarRecepcionDelLaboratorio(laboratorio) {
  Object.assign(laboratorio, {
    receptorDecision: "",
    mensajeDescifrado: "",
    hashRecalculado: "",
    verificacionReceptor: null
  });
}

function laboratorioListoParaEnviar(laboratorio) {
  return Boolean(
    laboratorio.llavesGeneradas &&
    laboratorio.hashOriginal &&
    laboratorio.firma &&
    laboratorio.textoCifrado
  );
}

async function aplicarMensajeAlteradoDelLaboratorio(laboratorio, mensajeAlterado) {
  laboratorio.mensajeEnviado = mensajeAlterado.trim() || construirMensajeAlterado(laboratorio.mensaje);
  laboratorio.textoCifradoEnviado = await cifrarConClavePublica(
    laboratorio.clavesCifradoReceptor.publicKey,
    laboratorio.mensajeEnviado
  );
  laboratorio.hashRecibido = await generarHashDeTexto("SHA-256", laboratorio.mensajeEnviado);
  limpiarRecepcionDelLaboratorio(laboratorio);
}

function obtenerSlidesDelCarrusel() {
  return Array.from(elementos.cryptoCarouselTrack?.querySelectorAll(".carousel-slide") || []);
}

function moverCarruselDePruebas(indiceDestino) {
  const slides = obtenerSlidesDelCarrusel();

  if (!slides.length) {
    return;
  }

  const totalSlides = slides.length;
  indiceCarruselPruebas = (indiceDestino + totalSlides) % totalSlides;
  elementos.cryptoCarouselTrack.style.transform = `translateX(-${indiceCarruselPruebas * 100}%)`;

  slides.forEach((slide, indice) => {
    const activo = indice === indiceCarruselPruebas;
    slide.classList.toggle("is-active", activo);
    slide.setAttribute("aria-hidden", String(!activo));
    slide.inert = !activo;
  });

  Array.from(elementos.cryptoCarouselDots.children).forEach((dot, indice) => {
    const activo = indice === indiceCarruselPruebas;
    dot.classList.toggle("is-active", activo);
    dot.setAttribute("aria-current", activo ? "true" : "false");
  });
}

function avanzarCarruselDePruebas(direccion) {
  moverCarruselDePruebas(indiceCarruselPruebas + direccion);
}

function configurarCarruselDePruebas() {
  const slides = obtenerSlidesDelCarrusel();

  if (!elementos.cryptoCarouselTrack || !elementos.cryptoCarouselDots || !slides.length) {
    return;
  }

  elementos.cryptoCarouselDots.innerHTML = slides
    .map((slide, indice) => {
      const titulo = slide.dataset.carouselTitle || `Prueba ${indice + 1}`;
      return `<button class="carousel-dot" type="button" data-carousel-index="${indice}">${titulo}</button>`;
    })
    .join("");

  elementos.prevDemoSlide.addEventListener("click", () => avanzarCarruselDePruebas(-1));
  elementos.nextDemoSlide.addEventListener("click", () => avanzarCarruselDePruebas(1));
  elementos.cryptoCarouselDots.addEventListener("click", (evento) => {
    const dot = evento.target.closest("[data-carousel-index]");

    if (dot) {
      moverCarruselDePruebas(Number(dot.dataset.carouselIndex));
    }
  });

  elementos.carouselViewport.addEventListener("keydown", (evento) => {
    if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      avanzarCarruselDePruebas(-1);
    }

    if (evento.key === "ArrowRight") {
      evento.preventDefault();
      avanzarCarruselDePruebas(1);
    }

    if (evento.key === "Home") {
      evento.preventDefault();
      moverCarruselDePruebas(0);
    }

    if (evento.key === "End") {
      evento.preventDefault();
      moverCarruselDePruebas(slides.length - 1);
    }
  });

  let inicioTouchX = 0;
  elementos.carouselViewport.addEventListener(
    "touchstart",
    (evento) => {
      inicioTouchX = evento.changedTouches[0].clientX;
    },
    { passive: true }
  );
  elementos.carouselViewport.addEventListener(
    "touchend",
    (evento) => {
      const diferenciaX = evento.changedTouches[0].clientX - inicioTouchX;

      if (Math.abs(diferenciaX) > 48) {
        avanzarCarruselDePruebas(diferenciaX > 0 ? -1 : 1);
      }
    },
    { passive: true }
  );

  moverCarruselDePruebas(0);
}

function validarUsuariosDiferentes(primerUsuario, segundoUsuario, cajaResultado, nombreArea) {
  if (primerUsuario.id === segundoUsuario.id) {
    renderizarResultado(cajaResultado, {
      lines: [
        {
          label: "Aviso",
          value: `Para la prueba de ${nombreArea} debes elegir dos usuarios diferentes.`
        }
      ],
      chips: [
        {
          label: "Configuracion invalida",
          type: "danger"
        }
      ]
    });

    return false;
  }

  return true;
}

async function ejecutarDemoSimetrica() {
  const emisor = obtenerUsuarioPorId(elementos.symSender.value);
  const receptor = obtenerUsuarioPorId(elementos.symReceiver.value);

  if (!validarUsuariosDiferentes(emisor, receptor, elementos.symResult, "cifrado simetrico")) {
    return;
  }

  const mensaje = elementos.symMessage.value.trim() || "Mensaje simetrico de ejemplo.";
  const intruso = obtenerOtroUsuario([emisor.id, receptor.id]);
  const detalleClaveCompartida = await obtenerDetalleClaveCompartida(emisor.id, receptor.id);
  const detalleClaveIntrusa = await obtenerDetalleClaveCompartida(emisor.id, intruso.id);
  const claveCompartida = detalleClaveCompartida.clave;
  const claveIntrusa = detalleClaveIntrusa.clave;
  const carga = await cifrarSimetrico(claveCompartida, mensaje);
  const mensajeDescifrado = await descifrarSimetrico(claveCompartida, carga);
  let intentoIntruso = "Fallo esperado.";

  try {
    await descifrarSimetrico(claveIntrusa, carga);
    intentoIntruso = "La prueba debio fallar, pero no fallo.";
  } catch (error) {
    intentoIntruso = formatearError(error);
  }

  renderizarResultado(elementos.symResult, {
    steps: [
      {
        title: "Hackeo",
        detail: `${intruso.name} intenta leer un mensaje de ${emisor.name} para ${receptor.name}.`
      },
      {
        title: "Llave valida",
        detail: `${emisor.name} y ${receptor.name} comparten ${detalleClaveCompartida.huella}.`
      },
      {
        title: "Ataque",
        detail: `${intruso.name} usa otra llave (${detalleClaveIntrusa.huella}) y falla.`
      },
      {
        title: "Resultado",
        detail: "Solo la pareja correcta puede abrir el mensaje."
      }
    ],
    lines: [
      {
        label: "Llave compartida",
        value: `${emisor.name} <-> ${receptor.name} | huella ${detalleClaveCompartida.huella}`
      },
      {
        label: "Paquete interceptado",
        value: `IV ${carga.iv} | texto cifrado ${resumirTexto(carga.textoCifrado, 72)}`
      },
      {
        label: "Lectura legitima",
        value: `${receptor.name} recupera: "${mensajeDescifrado}"`
      },
      {
        label: "Hackeo",
        value: `${intruso.name} falla con otra clave: ${intentoIntruso}`
      }
    ],
    chips: [
      {
        label: "Hackeo bloqueado",
        type: "success"
      },
      {
        label: "AES-GCM",
        type: "warning"
      }
    ]
  });
}

async function ejecutarDemoAsimetrica() {
  const emisor = obtenerUsuarioPorId(elementos.asymSender.value);
  const receptor = obtenerUsuarioPorId(elementos.asymReceiver.value);

  if (!validarUsuariosDiferentes(emisor, receptor, elementos.asymResult, "cifrado asimetrico")) {
    return;
  }

  const mensaje = elementos.asymMessage.value.trim() || "Mensaje asimetrico de ejemplo.";
  const intruso = obtenerOtroUsuario([emisor.id, receptor.id]);
  const huellaPrivadaReceptor = await crearHuellaDeClave(receptor.clavesDeCifrado.privateKey, "pkcs8");
  const huellaPrivadaIntruso = await crearHuellaDeClave(intruso.clavesDeCifrado.privateKey, "pkcs8");
  const textoCifrado = await cifrarConClavePublica(receptor.clavesDeCifrado.publicKey, mensaje);
  const mensajeDescifrado = await descifrarConClavePrivada(receptor.clavesDeCifrado.privateKey, textoCifrado);
  let intentoIntruso = "Fallo esperado.";

  try {
    await descifrarConClavePrivada(intruso.clavesDeCifrado.privateKey, textoCifrado);
    intentoIntruso = "La prueba debio fallar, pero no fallo.";
  } catch (error) {
    intentoIntruso = formatearError(error);
  }

  renderizarResultado(elementos.asymResult, {
    steps: [
      {
        title: "Hackeo",
        detail: `${intruso.name} intercepta un mensaje cifrado para ${receptor.name}.`
      },
      {
        title: "Llave usada",
        detail: `${emisor.name} cifra con la publica ${receptor.infoCifrado.huellaPublica}.`
      },
      {
        title: "Defensa",
        detail: `${receptor.name} abre el mensaje con su privada ${huellaPrivadaReceptor}.`
      },
      {
        title: "Resultado",
        detail: `${intruso.name} prueba ${huellaPrivadaIntruso} y no puede descifrar.`
      }
    ],
    lines: [
      {
        label: "Objetivo",
        value: `${emisor.name} cifra con la llave publica de ${receptor.name}.`
      },
      {
        label: "Paquete interceptado",
        value: resumirTextoCifrado(textoCifrado)
      },
      {
        label: "Lectura legitima",
        value: `${receptor.name} usa su llave privada y obtiene: "${mensajeDescifrado}"`
      },
      {
        label: "Hackeo",
        value: `${intruso.name} prueba otra llave privada y falla: ${intentoIntruso}`
      }
    ],
    chips: [
      {
        label: "Hackeo bloqueado",
        type: "success"
      },
      {
        label: "RSA-OAEP",
        type: "warning"
      }
    ]
  });
}

async function ejecutarDemoHash() {
  const mensaje = elementos.hashMessage.value.trim() || "Mensaje original.";
  const mensajeAlterado = elementos.hashTampered.value.trim() || construirMensajeAlterado(mensaje);

  if (!elementos.hashTampered.value.trim()) {
    elementos.hashTampered.value = mensajeAlterado;
  }

  const sha256Original = await generarHashDeTexto("SHA-256", mensaje);
  const sha512Original = await generarHashDeTexto("SHA-512", mensaje);
  const sha256Alterado = await generarHashDeTexto("SHA-256", mensajeAlterado);
  const sha512Alterado = await generarHashDeTexto("SHA-512", mensajeAlterado);

  const integridadComprometida =
    sha256Original !== sha256Alterado && sha512Original !== sha512Alterado;

  renderizarResultado(elementos.hashResult, {
    steps: [
      {
        title: "Hackeo",
        detail: "Un atacante cambia el contenido sin tener llaves."
      },
      {
        title: "Huella original",
        detail: "Se calcula el resumen del mensaje real."
      },
      {
        title: "Huella alterada",
        detail: "Se recalcula el hash del mensaje manipulado."
      },
      {
        title: "Resultado",
        detail: integridadComprometida
          ? "El cambio se detecta porque las huellas ya no coinciden."
          : "No se detectaron cambios."
      }
    ],
    lines: [
      {
        label: "Mensaje original",
        value: mensaje
      },
      {
        label: "SHA-256 original",
        value: resumirTexto(sha256Original, 78)
      },
      {
        label: "SHA-512 original",
        value: resumirTexto(sha512Original, 78)
      },
      {
        label: "Mensaje alterado",
        value: mensajeAlterado
      },
      {
        label: "SHA-256 alterado",
        value: resumirTexto(sha256Alterado, 78)
      },
      {
        label: "SHA-512 alterado",
        value: resumirTexto(sha512Alterado, 78)
      }
    ],
    chips: [
      {
        label: integridadComprometida ? "Hackeo detectado" : "Sin alteracion",
        type: integridadComprometida ? "success" : "warning"
      },
      {
        label: "Sin llaves",
        type: "warning"
      }
    ]
  });
}

async function construirEscenarioDeFirma() {
  const firmante = obtenerUsuarioPorId(elementos.signUser.value);
  const verificador = obtenerUsuarioPorId(elementos.signVerifier.value);

  if (firmante.id === verificador.id) {
    return {
      error: `Para la firma digital, ${firmante.name} no puede verificarse a si mismo en esta demo.`
    };
  }

  const intruso = obtenerOtroUsuario([firmante.id, verificador.id]) || obtenerOtroUsuario([firmante.id]);
  const mensaje = elementos.signMessage.value.trim() || "Mensaje firmado de ejemplo.";
  const mensajeAlterado = construirMensajeAlterado(mensaje);
  const hashOriginal = await generarHashDeTexto("SHA-256", mensaje);
  const hashAlterado = await generarHashDeTexto("SHA-256", mensajeAlterado);
  const firma = await firmarMensaje(firmante.clavesDeFirma.privateKey, mensaje);
  const verificacionPrincipal = await verificarFirma(firmante.clavesDeFirma.publicKey, mensaje, firma);
  const verificacionAlterada = await verificarFirma(
    firmante.clavesDeFirma.publicKey,
    mensajeAlterado,
    firma
  );
  const verificacionConIntruso = await verificarFirma(
    intruso.clavesDeFirma.publicKey,
    mensaje,
    firma
  );

  return {
    firmante,
    verificador,
    intruso,
    mensaje,
    mensajeAlterado,
    mensajeAlteradoVista: resumirTexto(mensajeAlterado, 68),
    hashOriginal,
    hashAlterado,
    hashOriginalVista: resumirTexto(hashOriginal, 46),
    hashAlteradoVista: resumirTexto(hashAlterado, 46),
    firma,
    firmaVista: resumirTexto(firma, 84),
    verificacionPrincipal,
    verificacionAlterada,
    verificacionConIntruso,
    flujo: [
      {
        title: "1. Firma",
        detail: `${firmante.name} usa su privada ${firmante.infoFirma.huellaPrivada}.`
      },
      {
        title: "2. Hash",
        detail: `Se calcula ${resumirTexto(hashOriginal, 22)}`
      },
      {
        title: "3. Verifica",
        detail: `${verificador.name} revisa con la publica ${firmante.infoFirma.huellaPublica}.`
      },
      {
        title: "4. Hackeo 1",
        detail: `Cambio de mensaje -> ${verificacionAlterada ? "pasa" : "bloqueado"}`
      },
      {
        title: "5. Hackeo 2",
        detail: `Llave falsa -> ${verificacionConIntruso ? "pasa" : "bloqueado"}`
      }
    ]
  };
}

async function ejecutarDemoFirma() {
  const escenario = await construirEscenarioDeFirma();

  if (escenario.error) {
    estado.ultimoEscenarioDeFirma = null;
    estado.laboratorioFirma = null;
    renderizarLaboratorioDeFirma();
    renderizarResultado(elementos.signatureResult, {
      lines: [
        {
          label: "Aviso",
          value: escenario.error
        }
      ],
      chips: [
        {
          label: "Configuracion invalida",
          type: "danger"
        }
      ]
    });

    return;
  }

  estado.ultimoEscenarioDeFirma = escenario;
  estado.laboratorioFirma = crearEstadoLaboratorioFirma(escenario);
  renderizarLaboratorioDeFirma();

  renderizarResultado(elementos.signatureResult, {
    steps: [
      {
        title: "Hackeo",
        detail: `${escenario.intruso.name} intenta falsificar o alterar la firma.`
      },
      {
        title: "Llave privada",
        detail: `${escenario.firmante.name} firma con ${escenario.firmante.infoFirma.huellaPrivada}.`
      },
      {
        title: "Llave publica",
        detail: `${escenario.verificador.name} verifica con ${escenario.firmante.infoFirma.huellaPublica}.`
      },
      {
        title: "Resultado",
        detail: `${!escenario.verificacionAlterada && !escenario.verificacionConIntruso ? "Los dos hackeos fueron bloqueados." : "Alguno de los hackeos paso."}`
      }
    ],
    lines: [
      {
        label: "Firmante",
        value: `${escenario.firmante.name} firma con su llave privada.`
      },
      {
        label: "Verificador",
        value: `${escenario.verificador.name} valida con la llave publica del firmante.`
      },
      {
        label: "Firma generada",
        value: escenario.firmaVista
      },
      {
        label: "Validacion",
        value: `${escenario.verificador.name} obtiene: ${escenario.verificacionPrincipal}`
      },
      {
        label: "Hackeo por cambio",
        value: `"${escenario.mensajeAlteradoVista}" -> ${escenario.verificacionAlterada}`
      },
      {
        label: "Hackeo por llave falsa",
        value: `${escenario.intruso.name} intenta verificar con otra llave publica: ${escenario.verificacionConIntruso}`
      }
    ],
    chips: [
      {
        label: escenario.verificacionPrincipal ? "Firma valida" : "Firma falsa",
        type: escenario.verificacionPrincipal ? "success" : "danger"
      },
      {
        label: !escenario.verificacionAlterada ? "Hackeo por cambio bloqueado" : "Hackeo por cambio exitoso",
        type: !escenario.verificacionAlterada ? "success" : "danger"
      },
      {
        label: !escenario.verificacionConIntruso ? "Llave falsa bloqueada" : "Llave falsa aceptada",
        type: !escenario.verificacionConIntruso ? "success" : "danger"
      }
    ]
  });
}

async function manejarAccionDelLaboratorioDeFirma(accion) {
  const escenario = estado.ultimoEscenarioDeFirma;
  const laboratorio = estado.laboratorioFirma;

  if (!escenario || !laboratorio) {
    return;
  }

  try {
    if (accion !== "attack-yes" && accion !== "attack-no" && accion !== "reject-message") {
      const cambioMensaje = tomarMensajeDelLaboratorio();

      if (cambioMensaje) {
        limpiarSalidaPosteriorDelLaboratorio();
      }
    }

    if (accion === "generate-keys") {
      laboratorio.clavesFirmaFirmante = await generarParejaDeClavesDeFirma();
      laboratorio.infoFirmaFirmante = await describirClaveDeFirma(laboratorio.clavesFirmaFirmante);
      laboratorio.clavesCifradoReceptor = await generarParejaDeClavesDeCifrado();
      laboratorio.infoCifradoReceptor = await describirClaveDeCifrado(laboratorio.clavesCifradoReceptor);
      laboratorio.llavesGeneradas = true;
      limpiarPasosPosterioresALasClaves(laboratorio);
      laboratorio.estado = "Claves nuevas listas para firmar, cifrar y verificar.";
    }

    if (accion === "attack-yes" || accion === "attack-no") {
      if (!laboratorio.enviado) {
        laboratorio.estado = "Primero envia el mensaje para decidir si habra ataque.";
      } else if (accion === "attack-yes") {
        laboratorio.ataque = true;
        laboratorio.ataqueDecision = "si";
        laboratorio.ataqueAplicado = true;
        await aplicarMensajeAlteradoDelLaboratorio(
          laboratorio,
          laboratorio.mensajeEnviado && laboratorio.mensajeEnviado !== laboratorio.mensaje
            ? laboratorio.mensajeEnviado
            : construirMensajeAlterado(laboratorio.mensaje)
        );
        laboratorio.estado = "Ataque activado. Puedes editar el mensaje interceptado.";
      } else {
        laboratorio.ataque = false;
        laboratorio.ataqueDecision = "no";
        laboratorio.ataqueAplicado = false;
        laboratorio.mensajeEnviado = laboratorio.mensaje;
        laboratorio.textoCifradoEnviado = laboratorio.textoCifrado;
        laboratorio.hashRecibido = laboratorio.hashOriginal;
        limpiarRecepcionDelLaboratorio(laboratorio);
        laboratorio.estado = "Ataque desactivado. El mensaje recibido vuelve al original.";
      }
    }

    if (accion === "generate-hash") {
      if (!laboratorio.llavesGeneradas) {
        laboratorio.estado = "Primero genera claves nuevas.";
      } else {
      limpiarSalidaPosteriorDelLaboratorio();
      laboratorio.hashOriginal = await generarHashDeTexto("SHA-256", laboratorio.mensaje);
      laboratorio.estado = "Hash SHA-256 generado.";
      }
    }

    if (accion === "encrypt-hash") {
      if (!laboratorio.llavesGeneradas) {
        laboratorio.estado = "Primero genera claves nuevas.";
      } else {
      if (!laboratorio.hashOriginal) {
        laboratorio.hashOriginal = await generarHashDeTexto("SHA-256", laboratorio.mensaje);
      }

      laboratorio.firma = await firmarMensaje(
        laboratorio.clavesFirmaFirmante.privateKey,
        laboratorio.hashOriginal
      );
      laboratorio.estado = "Hash firmado con la clave privada del emisor.";
      }
    }

    if (accion === "encrypt-message") {
      if (!laboratorio.llavesGeneradas) {
        laboratorio.estado = "Primero genera claves nuevas.";
      } else {
      laboratorio.textoCifrado = await cifrarConClavePublica(
        laboratorio.clavesCifradoReceptor.publicKey,
        laboratorio.mensaje
      );
      laboratorio.estado = "Mensaje encriptado con la clave publica del receptor.";
      }
    }

    if (accion === "send-message") {
      if (!laboratorioListoParaEnviar(laboratorio)) {
        laboratorio.estado = "Completa primero claves, hash, firma y cifrado del mensaje.";
      } else {
        laboratorio.mensajeEnviado = laboratorio.mensaje;
        laboratorio.textoCifradoEnviado = laboratorio.textoCifrado;
        laboratorio.enviado = true;
        laboratorio.ataque = false;
        laboratorio.ataqueDecision = "";
        laboratorio.ataqueAplicado = false;
        laboratorio.hashRecibido = "";
        laboratorio.receptorDecision = "";
        laboratorio.mensajeDescifrado = "";
        laboratorio.hashRecalculado = "";
        laboratorio.verificacionReceptor = null;
        laboratorio.estado = "MENSAJE ENVIADO. Ahora decide si habra ataque.";
      }
    }

    if (accion === "accept-message") {
      if (!laboratorio.ataqueDecision) {
        laboratorio.estado = "Primero decide si habra ataque.";
      } else {
        laboratorio.receptorDecision = "aceptar";
        laboratorio.estado = "El receptor acepta revisar el mensaje.";
      }
    }

    if (accion === "reject-message") {
      if (!laboratorio.ataqueDecision) {
        laboratorio.estado = "Primero decide si habra ataque.";
      } else {
      laboratorio.receptorDecision = "rechazar";
      laboratorio.mensajeDescifrado = "";
      laboratorio.hashRecalculado = "";
      laboratorio.verificacionReceptor = null;
      laboratorio.estado = "El receptor rechazo el mensaje.";
      }
    }

    if (accion === "verify-decrypt") {
      if (!laboratorio.enviado) {
        laboratorio.estado = "Primero envia el mensaje.";
      } else if (!laboratorio.ataqueDecision) {
        laboratorio.estado = "Primero decide si habra ataque.";
      } else if (!laboratorio.receptorDecision) {
        laboratorio.estado = "Primero decide si el receptor acepta o rechaza el mensaje.";
      } else if (laboratorio.receptorDecision === "rechazar") {
        laboratorio.estado = "El receptor rechazo el mensaje. Cambia a Aceptar para verificarlo.";
      } else {
        laboratorio.mensajeDescifrado = await descifrarConClavePrivada(
          laboratorio.clavesCifradoReceptor.privateKey,
          laboratorio.textoCifradoEnviado
        );
        laboratorio.hashRecalculado = await generarHashDeTexto("SHA-256", laboratorio.mensajeDescifrado);
        laboratorio.verificacionReceptor = await verificarFirma(
          laboratorio.clavesFirmaFirmante.publicKey,
          laboratorio.hashRecalculado,
          laboratorio.firma
        );
        laboratorio.estado = laboratorio.verificacionReceptor
          ? "Firma valida. El mensaje coincide con el firmado."
          : "Firma invalida. Se detecto alteracion o firma falsa.";
      }
    }
  } catch (error) {
    laboratorio.estado = `Error: ${formatearError(error)}`;
  }

  renderizarLaboratorioDeFirma();
}

async function construirMensajeDemoSimetrico(mensajeDemo) {
  const emisor = obtenerUsuarioPorId(mensajeDemo.senderId);
  const receptor = obtenerUsuarioPorId(mensajeDemo.receiverId);
  const clave = await obtenerClaveCompartida(emisor.id, receptor.id);
  const cargaCifrada = await cifrarSimetrico(clave, mensajeDemo.plaintext);
  const textoCifrado = `IV ${cargaCifrada.iv} | ${resumirTexto(cargaCifrada.textoCifrado, 88)}`;
  const intentos = await Promise.all(
    estado.usuarios.map(async (usuario) => {
      let exito = false;
      let salida = "No puede descifrar este mensaje.";

      try {
        const claveCandidata = await obtenerClaveCompartida(emisor.id, usuario.id);
        const descifrado = await descifrarSimetrico(claveCandidata, cargaCifrada);
        exito = usuario.id === receptor.id;
        salida = exito ? `Lee: "${descifrado}"` : `Resultado inesperado: "${descifrado}"`;
      } catch (error) {
        salida = "Solo observa el cifrado; la clave no coincide.";
      }

      return {
        userName: usuario.name,
        success: exito,
        output: salida
      };
    })
  );

  return {
    ...mensajeDemo,
    senderName: emisor.name,
    receiverName: receptor.name,
    modeLabel: "cifrado simetrico AES-GCM",
    modeShort: "AES-GCM",
    ciphertext: textoCifrado,
    attempts: intentos
  };
}

async function construirMensajeDemoAsimetrico(mensajeDemo) {
  const emisor = obtenerUsuarioPorId(mensajeDemo.senderId);
  const receptor = obtenerUsuarioPorId(mensajeDemo.receiverId);
  const textoCifradoCompleto = await cifrarConClavePublica(receptor.clavesDeCifrado.publicKey, mensajeDemo.plaintext);
  const intentos = await Promise.all(
    estado.usuarios.map(async (usuario) => {
      let exito = false;
      let salida = "No puede descifrar este mensaje.";

      try {
        const descifrado = await descifrarConClavePrivada(usuario.clavesDeCifrado.privateKey, textoCifradoCompleto);
        exito = usuario.id === receptor.id;
        salida = exito ? `Lee: "${descifrado}"` : `Resultado inesperado: "${descifrado}"`;
      } catch (error) {
        salida = "Solo observa el cifrado; su llave privada no sirve para este mensaje.";
      }

      return {
        userName: usuario.name,
        success: exito,
        output: salida
      };
    })
  );

  return {
    ...mensajeDemo,
    senderName: emisor.name,
    receiverName: receptor.name,
    modeLabel: "cifrado asimetrico RSA-OAEP",
    modeShort: "RSA-OAEP",
    ciphertext: resumirTextoCifrado(textoCifradoCompleto),
    attempts: intentos
  };
}

async function construirDemoMultiusuario() {
  const mensajesDemo = [];

  for (const mensaje of mensajesPredefinidos) {
    if (mensaje.mode === "symmetric") {
      mensajesDemo.push(await construirMensajeDemoSimetrico(mensaje));
    } else {
      mensajesDemo.push(await construirMensajeDemoAsimetrico(mensaje));
    }
  }

  estado.mensajesDemo = mensajesDemo;
  renderizarDemoDeMensajes(elementos.messagesGrid, elementos.demoSummary, mensajesDemo);
}

async function actualizarMensajesPredefinidos() {
  aplicarTextosDeMensajes();
  await construirDemoMultiusuario();
  actualizarEstado("Mensajes actualizados.");
}

async function ejecutarTodasLasDemos() {
  actualizarEstado("Ejecutando todas las pruebas...");
  await ejecutarDemoSimetrica();
  await ejecutarDemoAsimetrica();
  await ejecutarDemoHash();
  await ejecutarDemoFirma();
  await construirDemoMultiusuario();
  actualizarEstado("Listo. Puedes cambiar usuarios o mensajes y volver a probar.");
}

function configurarSelectores() {
  llenarSelect(elementos.symSender, estado.usuarios, "alicia");
  llenarSelect(elementos.symReceiver, estado.usuarios, "beto");
  llenarSelect(elementos.asymSender, estado.usuarios, "alicia");
  llenarSelect(elementos.asymReceiver, estado.usuarios, "marta");
  llenarSelect(elementos.signUser, estado.usuarios, "beto");
  llenarSelect(elementos.signVerifier, estado.usuarios, "alicia");
  sincronizarSelectoresDeFirma();
}

function conectarEventos() {
  elementos.runSymmetricBtn.addEventListener("click", ejecutarDemoSimetrica);
  elementos.runAsymmetricBtn.addEventListener("click", ejecutarDemoAsimetrica);
  elementos.runHashBtn.addEventListener("click", ejecutarDemoHash);
  elementos.runSignatureBtn.addEventListener("click", ejecutarDemoFirma);
  elementos.openSignatureModalBtn.addEventListener("click", async () => {
    await ejecutarDemoFirma();
    if (estado.ultimoEscenarioDeFirma) {
      abrirModalDeFirma();
    }
  });
  elementos.signatureModalBody.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-signature-action]");

    if (boton) {
      manejarAccionDelLaboratorioDeFirma(boton.dataset.signatureAction);
    }
  });
  elementos.signatureModalBody.addEventListener("change", async (evento) => {
    if (evento.target.matches("#signatureLabMessage") && estado.laboratorioFirma) {
      tomarMensajeDelLaboratorio();
      limpiarSalidaPosteriorDelLaboratorio();
      estado.laboratorioFirma.estado = "Mensaje actualizado. Vuelve a generar hash, firma y cifrado.";
      renderizarLaboratorioDeFirma();
    }

    if (evento.target.matches("#signatureAttackMessage") && estado.laboratorioFirma) {
      await aplicarMensajeAlteradoDelLaboratorio(estado.laboratorioFirma, evento.target.value);
      estado.laboratorioFirma.estado = "Mensaje interceptado actualizado. Vuelve a decidir y verificar.";
      renderizarLaboratorioDeFirma();
    }
  });
  elementos.updateMessagesBtn.addEventListener("click", actualizarMensajesPredefinidos);
  elementos.signUser.addEventListener("change", sincronizarSelectoresDeFirma);
  elementos.closeSignatureModal.addEventListener("click", cerrarModalDeFirma);
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && elementos.signatureModal.classList.contains("open")) {
      cerrarModalDeFirma();
    }
  });
}

async function iniciarAplicacion() {
  renderizarPlaceholder(elementos.symResult, "Aqui apareceran los resultados del cifrado simetrico.");
  renderizarPlaceholder(elementos.asymResult, "Aqui apareceran los resultados del cifrado asimetrico.");
  renderizarPlaceholder(elementos.hashResult, "Aqui apareceran los hashes y la prueba de integridad.");
  renderizarPlaceholder(elementos.signatureResult, "Aqui apareceran los resultados de la firma digital.");
  renderizarPlaceholder(elementos.messagesGrid, "Aqui aparecera la demostracion multiusuario con mensajes predefinidos.");

  actualizarEstado("Generando usuarios y llaves criptograficas...");
  estado.usuarios = await crearUsuarios();
  renderizarUsuarios(elementos.usersGrid, estado.usuarios);
  sincronizarTextosDeMensajes();
  configurarSelectores();
  configurarCarruselDePruebas();
  conectarEventos();
  await ejecutarTodasLasDemos();
}

iniciarAplicacion().catch((error) => {
  actualizarEstado(`Ocurrio un problema al inicializar: ${formatearError(error)}`);
});
