const API_BASE = ""; 
const estado = {
  token: localStorage.getItem("registro_token") || null,
  user: localStorage.getItem("registro_user") || null,
  rol: localStorage.getItem("registro_rol") || null,
  vistaActual: "inicio",
};

const esDoctor = () => estado.rol === "doctor";
const esPaciente = () => estado.rol === "cliente";

// 📝 REEMPLAZA esta función en tu app.js
// Línea 16-51 aproximadamente

// =====================================================================
// Google OAuth - Maneja el login con Google (VERSIÓN MEJORADA)
// =====================================================================

// Esta funcion se ejecuta automaticamente cuando Google termina de verificar al usuario
// response.credential contiene un "papel" de Google que dice "este usuario es valido"
function handleCredentialResponse(response) {
  // Enviamos ese "papel" (token) a nuestro servidor para verificarlo
  console.log("🔵 Google Sign-In: usuario seleccionado, procesando...");
  loginConGoogle(response.credential);
}

// Función que envía el token de Google a nuestro servidor
async function loginConGoogle(idToken) {
  try {
    console.log("🔵 Enviando token a /login/google...");
    console.log("Token (primeros 50 caracteres):", idToken.substring(0, 50) + "...");
    
    // Mandamos el token a nuestro servidor Python
    const datos = await pedir("/login/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    });

    console.log("✅ Login exitoso! Datos recibidos:", datos);
    
    // Si todo va bien, guardamos los datos del usuario
    estado.token = datos.token;
    estado.user = datos.user;
    estado.rol = datos.rol;

    // Guardamos también en localStorage (para que no se pierda al recargar)
    localStorage.setItem("registro_token", datos.token);
    localStorage.setItem("registro_user", datos.user);
    localStorage.setItem("registro_rol", datos.rol);

    // Mostramos un mensaje
    console.log(`✅ Sesión iniciada como: ${datos.user} (${datos.rol})`);
    toast("¡Bienvenido, " + datos.user + "!", "exito");
    
    // Llevamos al usuario a la app
    entrarApp();
    
  } catch (err) {
    // Si algo sale mal, mostramos el error
    console.error("❌ Error al iniciar sesion con Google:");
    console.error("Mensaje:", err.message);
    console.error("Stack:", err.stack);
    
    // Mostrar error más específico según el tipo
    let mensajeUsuario = err.message || "Error al iniciar sesion con Google";
    
    if (err.message.includes("404")) {
      mensajeUsuario = "Usuario no encontrado. Crea una cuenta primero desde 'Crear usuario'";
    } else if (err.message.includes("401")) {
      mensajeUsuario = "Token de Google inválido o expirado. Intenta de nuevo.";
    } else if (err.message.includes("400")) {
      mensajeUsuario = "Error en los datos enviados a Google. Intenta de nuevo.";
    }
    
    toast(mensajeUsuario, "error");
  }
}


async function pedir(ruta, opciones = {}) {
  const headers = { "Content-Type": "application/json", ...(opciones.headers || {}) };
  if (estado.token) headers["token"] = estado.token;

  console.log(`📡 ${opciones.method || 'GET'} ${API_BASE + ruta}`);

  const respuesta = await fetch(API_BASE + ruta, { ...opciones, headers });

  if (respuesta.status === 401) {
    cerrarSesion("Tu sesión expiró. Vuelve a ingresar.");
    throw new Error("401 - Sesión expirada");
  }

  let cuerpo = null;
  const texto = await respuesta.text();
  if (texto) {
    try { 
      cuerpo = JSON.parse(texto); 
    } catch { 
      cuerpo = texto; 
    }
  }

  if (!respuesta.ok) {
    const detalle = (cuerpo && cuerpo.detail) ? cuerpo.detail : `Error ${respuesta.status}`;
    const mensajeError = typeof detalle === "string" ? detalle : JSON.stringify(detalle);
    
    console.error(`❌ Error ${respuesta.status}:`, mensajeError);
    
    throw new Error(mensajeError);
  }

  console.log(`✅ Respuesta exitosa (${respuesta.status})`, cuerpo);
  return cuerpo;
}


async function pedir(ruta, opciones = {}) {
  const headers = { "Content-Type": "application/json", ...(opciones.headers || {}) };
  if (estado.token) headers["token"] = estado.token;

  const respuesta = await fetch(API_BASE + ruta, { ...opciones, headers });

  if (respuesta.status === 401) {
    cerrarSesion("Tu sesión expiró. Vuelve a ingresar.");
    throw new Error("401");
  }

  let cuerpo = null;
  const texto = await respuesta.text();
  if (texto) {
    try { cuerpo = JSON.parse(texto); } catch { cuerpo = texto; }
  }

  if (!respuesta.ok) {
    const detalle = (cuerpo && cuerpo.detail) ? cuerpo.detail : `Error ${respuesta.status}`;
    throw new Error(typeof detalle === "string" ? detalle : JSON.stringify(detalle));
  }

  return cuerpo;
}

// Intenta traer una lista; si el rol no tiene permiso (403) o no existe
// aún (404), regresa [] en silencio para no romper la vista.
async function pedirListaSegura(ruta) {
  try {
    const datos = await pedir(ruta);
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

// =====================================================================
// Tema (claro / oscuro)
// =====================================================================

function aplicarTema(tema) {
  document.documentElement.setAttribute("data-tema", tema);
  document.body.setAttribute("data-tema", tema);
  localStorage.setItem("registro_tema", tema);
}

function alternarTema() {
  const actual = localStorage.getItem("registro_tema") || "claro";
  aplicarTema(actual === "claro" ? "oscuro" : "claro");
}

(function iniciarTema() {
  aplicarTema(localStorage.getItem("registro_tema") || "claro");
})();

document.getElementById("btn-tema-login").addEventListener("click", alternarTema);
document.getElementById("btn-tema-app").addEventListener("click", alternarTema);

// =====================================================================
// Toast
// =====================================================================

let toastTimer = null;
function toast(mensaje, tipo = "exito") {
  const el = document.getElementById("toast");
  el.textContent = mensaje;
  el.className = `toast ${tipo}`;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

// =====================================================================
// Sesión
// =====================================================================

const pantallaLogin = document.getElementById("pantalla-login");
const appEl = document.getElementById("app");
const formLogin = document.getElementById("form-login");
const loginError = document.getElementById("login-error");
const panelCrearUsuario = document.getElementById("panel-crear-usuario");

formLogin.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  loginError.hidden = true;

  const user = document.getElementById("in-user").value.trim();
  const password = document.getElementById("in-pass").value;

  const boton = formLogin.querySelector("button[type=submit]");
  boton.disabled = true;

  try {
    const datos = await pedir("/login", {
      method: "POST",
      body: JSON.stringify({ user, password }),
    });

    estado.token = datos.token;
    estado.user = datos.user;
    estado.rol = datos.rol;

    localStorage.setItem("registro_token", datos.token);
    localStorage.setItem("registro_user", datos.user);
    localStorage.setItem("registro_rol", datos.rol);

    entrarApp();
  } catch (err) {
    loginError.textContent = err.message || "No se pudo iniciar sesión";
    loginError.hidden = false;
  } finally {
    boton.disabled = false;
  }
});

function cerrarSesion(mensaje) {
  estado.token = null;
  estado.user = null;
  estado.rol = null;
  localStorage.removeItem("registro_token");
  localStorage.removeItem("registro_user");
  localStorage.removeItem("registro_rol");

  appEl.classList.add("oculto");
  pantallaLogin.classList.remove("oculto");
  formLogin.reset();
  mostrarPanelAcceso("login");

  if (mensaje) {
    loginError.textContent = mensaje;
    loginError.hidden = false;
  }
}

document.getElementById("btn-salir").addEventListener("click", () => cerrarSesion());

function entrarApp() {
  pantallaLogin.classList.add("oculto");
  appEl.classList.remove("oculto");

  document.getElementById("sesion-user").textContent = estado.user;
  document.getElementById("sesion-rol").textContent = estado.rol;

  // Oculta todo lo que requiere rol "doctor" y, si es paciente,
  // deja visible únicamente el módulo de Citas
  document.querySelectorAll(".nav-item").forEach((el) => {
    const vista = el.dataset.vista;
    const soloDoctor = el.hasAttribute("data-solo-doctor");
    let oculto = false;
    if (soloDoctor && !esDoctor()) oculto = true;
    if (esPaciente() && vista !== "citas") oculto = true;
    el.classList.toggle("oculto", oculto);
  });

  // Si es paciente, solo permite ver citas
  if (esPaciente()) {
    irAVista("citas");
  } else {
    irAVista("inicio");
  }
}

if (estado.token && estado.rol) {
  entrarApp();
}

// =====================================================================
// Panel de acceso (login / crear usuario)
// =====================================================================

function mostrarPanelAcceso(panel) {
  formLogin.classList.toggle("oculto", panel !== "login");
  panelCrearUsuario.classList.toggle("oculto", panel !== "crear");
}

document.getElementById("link-crear-usuario").addEventListener("click", (ev) => {
  ev.preventDefault();
  mostrarPanelAcceso("crear");
  mostrarTabUsuario("paciente");
});

document.querySelectorAll("[data-volver-login]").forEach((link) => {
  link.addEventListener("click", (ev) => {
    ev.preventDefault();
    mostrarPanelAcceso("login");
  });
});

// Tabs para tipo de usuario
function mostrarTabUsuario(tipo) {
  const formPaciente = document.getElementById("form-crear-paciente");
  const formDoctor = document.getElementById("form-crear-doctor");

  document.querySelectorAll(".sub-tab").forEach((btn) => {
    btn.classList.toggle("activo", btn.dataset.tipoUsuario === tipo);
  });

  formPaciente.classList.toggle("oculto", tipo !== "paciente");
  formDoctor.classList.toggle("oculto", tipo !== "doctor");
}

document.querySelectorAll(".sub-tab").forEach((btn) => {
  btn.addEventListener("click", (ev) => {
    ev.preventDefault();
    mostrarTabUsuario(btn.dataset.tipoUsuario);
  });
});

// =====================================================================
// CREAR CUENTA
// =====================================================================

document.getElementById("form-crear-paciente").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const err = document.getElementById("crear-paciente-error");
  err.hidden = true;

  const cuerpoJson = {
    nombre: document.getElementById("cl-nombre").value.trim(),
    identidad: document.getElementById("cl-identidad").value.trim(),
    telefono: document.getElementById("cl-telefono").value.trim(),
    correo: document.getElementById("cl-correo").value.trim(),
    edad: Number(document.getElementById("cl-edad").value),
    user: document.getElementById("cl-user").value.trim(),
    password: document.getElementById("cl-password").value,
    rol: "cliente",
  };

  try {
    await pedir("/crear/nuevo_cliente", { method: "POST", body: JSON.stringify(cuerpoJson) });
    document.getElementById("form-crear-paciente").reset();
    toast(`Usuario "${cuerpoJson.user}" creado exitosamente. ¡Ahora inicia sesión!`);
    mostrarPanelAcceso("login");
  } catch (e) {
    err.textContent = e.message;
    err.hidden = false;
  }
});

document.getElementById("form-crear-doctor").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const err = document.getElementById("crear-doctor-error");
  err.hidden = true;

  const cuerpoJson = {
    nombre: document.getElementById("d-nombre").value.trim(),
    no_colegiacion: document.getElementById("d-colegiacion").value.trim(),
    especialidad: document.getElementById("d-especialidad").value.trim(),
    telefono: document.getElementById("d-telefono").value.trim(),
    correo: document.getElementById("d-correo").value.trim(),
    user: document.getElementById("d-user").value.trim(),
    password: document.getElementById("d-password").value,
    rol: "doctor",
  };

  try {
    await pedir("/crear/nuevo_doctor", { method: "POST", body: JSON.stringify(cuerpoJson) });
    document.getElementById("form-crear-doctor").reset();
    toast(`Usuario "${cuerpoJson.user}" creado exitosamente. ¡Ahora inicia sesión!`);
    mostrarPanelAcceso("login");
  } catch (e) {
    err.textContent = e.message;
    err.hidden = false;
  }
});

// =====================================================================
// Navegación / router simple
// =====================================================================

const VISTAS = {
  inicio:       { titulo: "Panorama",     indice: "Índice 00", render: renderInicio },
  citas:        { titulo: "Citas",        indice: "Índice 01", render: renderCitas },
  consultas:    { titulo: "Consultas",    indice: "Índice 02", render: renderConsultas },
  recetas:      { titulo: "Recetas",      indice: "Índice 03", render: renderRecetas },
  pacientes:    { titulo: "Pacientes",    indice: "Índice 04", render: renderPacientes },
  doctores:     { titulo: "Doctores",     indice: "Índice 05", render: renderDoctores },
  medicamentos: { titulo: "Medicamentos", indice: "Índice 06", render: renderMedicamentos },
};

document.getElementById("barra-nav").addEventListener("click", (ev) => {
  const btn = ev.target.closest(".nav-item");
  if (!btn) return;
  irAVista(btn.dataset.vista);
});

async function irAVista(nombre) {
  // Si es paciente y trata de acceder a algo que no es citas, redirigir
  if (esPaciente() && nombre !== "citas") {
    irAVista("citas");
    return;
  }

  const vista = VISTAS[nombre];
  if (!vista) return;

  estado.vistaActual = nombre;

  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.toggle("activo", el.dataset.vista === nombre);
  });

  document.getElementById("vista-titulo").textContent = vista.titulo;

  const cuerpo = document.getElementById("vista-cuerpo");
  cuerpo.innerHTML = `<p class="estado-vacio">Cargando…</p>`;

  try {
    await vista.render(cuerpo);
  } catch (err) {
    cuerpo.innerHTML = `<p class="aviso aviso-error">${escapar(err.message || "Ocurrió un error")}</p>`;
  }
}

// =====================================================================
// Helpers de formato
// =====================================================================

function escapar(txt) {
  return String(txt ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function formatoFechaHora(valor) {
  if (!valor) return "—";
  const f = new Date(valor);
  if (isNaN(f)) return escapar(valor);
  return f.toLocaleString("es-HN", { dateStyle: "medium", timeStyle: "short" });
}

function pastillaEstado(estadoCita) {
  const clave = (estadoCita || "").toLowerCase();
  const mapa = { pendiente: "pendiente", atendida: "atendida", cancelada: "cancelada" };
  const cls = mapa[clave] || "pendiente";
  return `<span class="pastilla pastilla-${cls}">${escapar(estadoCita)}</span>`;
}

function notaSoloDoctor(nombreModulo) {
  return `<div class="candado-nota">Este módulo requiere una sesión con rol <code>doctor</code>. Tu sesión actual (<code>${escapar(estado.rol)}</code>) no tiene acceso.</div>`;
}

function estadoVacio(texto) {
  return `<div class="estado-vacio"><strong>Nada por aquí todavía</strong>${escapar(texto)}</div>`;
}

// =====================================================================
// PANORAMA (inicio) — resumen simple calculado en cliente
// =====================================================================

async function renderInicio(cuerpo) {
  const [citas, consultas, doctores] = await Promise.all([
    pedirListaSegura("/citas/?limite=90"),
    pedirListaSegura("/consulta/?limite=80"),
    pedirListaSegura("/doctores/?limite=100"),
  ]);
  const pacientes = esDoctor() ? await pedirListaSegura("/pacientes/?limite=100") : [];

  const pendientes = citas.filter((c) => (c.estado || "").toLowerCase() === "pendiente").length;

  cuerpo.innerHTML = `
    <div class="rejilla-fichas">
      <div class="dato-resumen"><span class="num">${citas.length}</span><span class="lbl">Citas totales</span></div>
      <div class="dato-resumen"><span class="num">${pendientes}</span><span class="lbl">Citas pendientes</span></div>
      <div class="dato-resumen"><span class="num">${consultas.length}</span><span class="lbl">Consultas registradas</span></div>
      <div class="dato-resumen"><span class="num">${doctores.length}</span><span class="lbl">Doctores</span></div>
      ${esDoctor() ? `<div class="dato-resumen"><span class="num">${pacientes.length}</span><span class="lbl">Pacientes</span></div>` : ""}
    </div>
  `;
}

// =====================================================================
// CITAS  ·  GET/POST /citas  ·  PATCH /citas/{id}/cancelar
// =====================================================================

// Vista simplificada para el rol "cliente": solo puede agendar,
// no ve el listado completo de citas.
async function renderCitasPaciente(cuerpo) {
  const doctores = await pedirListaSegura("/doctores/?limite=100");

  cuerpo.innerHTML = `
    <div class="ficha">
      <div class="ficha-encabezado">
        <div>
          <h3>Agendar cita</h3>
        </div>
      </div>
      <form id="form-cita" class="form-rejilla">
        <div class="campo">
          <label for="c-identidad">Identidad del paciente</label>
          <input id="c-identidad" required placeholder="0801-1990-00000" />
        </div>
        <div class="campo">
          <label for="c-colegiacion">Doctor</label>
          <select id="c-colegiacion" required>
            <option value="">Selecciona un doctor</option>
            ${doctores.map((d) => `<option value="${escapar(d.no_colegiacion)}">${escapar(d.nombre)} — ${escapar(d.especialidad)} (${escapar(d.no_colegiacion)})</option>`).join("")}
          </select>
        </div>
        <div class="campo">
          <label for="c-fecha">Fecha y hora</label>
          <input id="c-fecha" type="datetime-local" required />
        </div>
        <div class="campo">
          <label for="c-motivo">Motivo</label>
          <input id="c-motivo" required placeholder="Control mensual" />
        </div>
        <div class="campo">
          <button type="submit" class="btn btn-primario">Agendar cita</button>
        </div>
      </form>
      <p id="cita-error" class="aviso aviso-error" hidden></p>
    </div>
  `;

  document.getElementById("form-cita").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const err = document.getElementById("cita-error");
    err.hidden = true;

    const fechaValor = document.getElementById("c-fecha").value; // "YYYY-MM-DDTHH:MM"
    const cuerpoJson = {
      identidad: document.getElementById("c-identidad").value.trim(),
      no_colegiacion: document.getElementById("c-colegiacion").value,
      fecha_hora: fechaValor.length === 16 ? `${fechaValor}:00` : fechaValor,
      motivo: document.getElementById("c-motivo").value.trim(),
    };

    try {
      await pedir("/citas/agendar_cita", { method: "POST", body: JSON.stringify(cuerpoJson) });
      toast(`Cita agendada, ${estado.user}!`);
      document.getElementById("form-cita").reset();
    } catch (e) {
      err.textContent = e.message;
      err.hidden = false;
    }
  });
}

async function renderCitas(cuerpo) {
  if (esPaciente()) return renderCitasPaciente(cuerpo);

  const [citas, doctores, pacientes] = await Promise.all([
    pedirListaSegura("/citas/?limite=90"),
    pedirListaSegura("/doctores/?limite=100"),
    pedirListaSegura("/pacientes/?limite=100"),
  ]);
  const mapaDoctores = new Map(doctores.map((d) => [d.id, d]));
  const mapaClientes = new Map(pacientes.map((p) => [p.id, p]));

  cuerpo.innerHTML = `
    <div class="ficha">
      <div class="ficha-encabezado">
        <div>
          <h3>Agendar cita</h3>
        </div>
      </div>
      <form id="form-cita" class="form-rejilla">
        <div class="campo">
          <label for="c-identidad">Identidad del paciente</label>
          <input id="c-identidad" required placeholder="0801-1990-00000" />
        </div>
        <div class="campo">
          <label for="c-colegiacion">Doctor</label>
          <select id="c-colegiacion" required>
            <option value="">Selecciona un doctor</option>
            ${doctores.map((d) => `<option value="${escapar(d.no_colegiacion)}">${escapar(d.nombre)} — ${escapar(d.especialidad)} (${escapar(d.no_colegiacion)})</option>`).join("")}
          </select>
        </div>
        <div class="campo">
          <label for="c-fecha">Fecha y hora</label>
          <input id="c-fecha" type="datetime-local" required />
        </div>
        <div class="campo">
          <label for="c-motivo">Motivo</label>
          <input id="c-motivo" required placeholder="Control mensual" />
        </div>
        <div class="campo">
          <button type="submit" class="btn btn-primario">Agendar cita</button>
        </div>
      </form>
      <p id="cita-error" class="aviso aviso-error" hidden></p>
    </div>

    <div class="ficha">
      <div class="ficha-encabezado">
        <div><h3>Listado de citas</h3></div>
      </div>
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead><tr>
            <th>ID</th><th>Paciente</th><th>Doctor</th><th>Fecha</th><th>Motivo</th><th>Estado</th><th></th>
          </tr></thead>
          <tbody id="cuerpo-citas"></tbody>
        </table>
      </div>
    </div>
  `;

  pintarTablaCitas(citas, mapaDoctores, mapaClientes);

  document.getElementById("form-cita").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const err = document.getElementById("cita-error");
    err.hidden = true;

    const fechaValor = document.getElementById("c-fecha").value; // "YYYY-MM-DDTHH:MM"
    const cuerpoJson = {
      identidad: document.getElementById("c-identidad").value.trim(),
      no_colegiacion: document.getElementById("c-colegiacion").value,
      fecha_hora: fechaValor.length === 16 ? `${fechaValor}:00` : fechaValor,
      motivo: document.getElementById("c-motivo").value.trim(),
    };

    try {
      await pedir("/citas/agendar_cita", { method: "POST", body: JSON.stringify(cuerpoJson) });
      toast("Cita agendada correctamente");
      renderCitas(cuerpo);
    } catch (e) {
      err.textContent = e.message;
      err.hidden = false;
    }
  });
}

function pintarTablaCitas(citas, mapaDoctores, mapaClientes) {
  const tbody = document.getElementById("cuerpo-citas");
  if (!citas.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="celda-vacia">${estadoVacio("Aún no hay citas agendadas.")}</td></tr>`;
    return;
  }
  tbody.innerHTML = citas.map((cita) => {
    const doctor = mapaDoctores.get(cita.id_doctor);
    const cliente = mapaClientes.get(cita.id_cliente);
    const puedeCancelar = (cita.estado || "").toLowerCase() === "pendiente";
    return `
      <tr>
        <td class="celda-mono">#${cita.id}</td>
        <td>${cliente ? escapar(cliente.nombre) : `<span class="celda-mono">#${cita.id_cliente}</span>`}</td>
        <td>${doctor ? escapar(doctor.nombre) : `<span class="celda-mono">#${cita.id_doctor}</span>`}</td>
        <td>${formatoFechaHora(cita.fecha_hora)}</td>
        <td>${escapar(cita.motivo || "—")}</td>
        <td>${pastillaEstado(cita.estado)}</td>
        <td>${puedeCancelar ? `<button class="btn btn-peligro btn-pequeno" data-cancelar="${cita.id}">Cancelar</button>` : ""}</td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("[data-cancelar]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await pedir(`/citas/${btn.dataset.cancelar}/cancelar`, { method: "PATCH" });
        toast("Cita cancelada");
        irAVista("citas");
      } catch (e) {
        toast(e.message, "error");
        btn.disabled = false;
      }
    });
  });
}

// =====================================================================
// CONSULTAS  ·  GET /consulta/  ·  POST /consulta/crear_consulta
// =====================================================================

async function renderConsultas(cuerpo) {
  const [consultas, citas, pacientes] = await Promise.all([
    pedirListaSegura("/consulta/?limite=80"),
    pedirListaSegura("/citas/?limite=90"),
    pedirListaSegura("/pacientes/?limite=100"),
  ]);

  const mapaClientes = new Map(pacientes.map((p) => [p.id, p]));
  const citasPendientes = citas.filter((c) => (c.estado || "").toLowerCase() === "pendiente");
  const mapaCitas = new Map(citas.map((c) => [c.id, c]));

  cuerpo.innerHTML = `
    <div class="ficha">
      <div class="ficha-encabezado">
        <div>
          <h3>Registrar consulta</h3>
        </div>
      </div>
      <form id="form-consulta" class="form-rejilla">
        <div class="campo">
          <label for="cn-cita">Cita pendiente</label>
          <select id="cn-cita" required>
            <option value="">Selecciona una cita</option>
            ${citasPendientes.map((c) => {
              const cliente = mapaClientes.get(c.id_cliente);
              const nombrePaciente = cliente ? cliente.nombre : `Paciente #${c.id_cliente}`;
              return `<option value="${c.id}">#${c.id} — ${escapar(nombrePaciente)} (${formatoFechaHora(c.fecha_hora)})</option>`;
            }).join("")}
          </select>
        </div>
        <div class="campo">
          <label for="cn-diagnostico">Diagnóstico</label>
          <input id="cn-diagnostico" required />
        </div>
        <div class="campo">
          <label for="cn-tratamiento">Tratamiento</label>
          <input id="cn-tratamiento" required />
        </div>
        <div class="campo">
          <label for="cn-notas">Notas (opcional)</label>
          <input id="cn-notas" />
        </div>
        <div class="campo">
          <button type="submit" class="btn btn-primario">Registrar consulta</button>
        </div>
      </form>
      ${!citasPendientes.length ? `<p class="aviso" style="background:var(--ambar-fondo); color:var(--ambar)">No hay citas pendientes para registrar.</p>` : ""}
      <p id="consulta-error" class="aviso aviso-error" hidden></p>
    </div>

    <div class="ficha">
      <div class="ficha-encabezado"><div><h3>Consultas registradas</h3></div></div>
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead><tr><th>ID</th><th>Cita</th><th>Diagnóstico</th><th>Tratamiento</th><th>Notas</th></tr></thead>
          <tbody>
            ${consultas.length ? consultas.map((c) => `
              <tr>
                <td class="celda-mono">#${c.id}</td>
                <td class="celda-mono">#${c.id_cita}</td>
                <td>${escapar(c.diagnostico)}</td>
                <td>${escapar(c.tratamiento)}</td>
                <td>${escapar(c.notas || "—")}</td>
              </tr>
            `).join("") : `<tr><td colspan="5" class="celda-vacia">${estadoVacio("Todavía no hay consultas registradas.")}</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById("form-consulta").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const err = document.getElementById("consulta-error");
    err.hidden = true;
    const notas = document.getElementById("cn-notas").value.trim();

    const cuerpoJson = {
      id_cita: Number(document.getElementById("cn-cita").value),
      diagnostico: document.getElementById("cn-diagnostico").value.trim(),
      tratamiento: document.getElementById("cn-tratamiento").value.trim(),
      notas: notas || null,
    };

    try {
      await pedir("/consulta/crear_consulta", { method: "POST", body: JSON.stringify(cuerpoJson) });
      toast("Consulta registrada");
      renderConsultas(cuerpo);
    } catch (e) {
      err.textContent = e.message;
      err.hidden = false;
    }
  });
}

// =====================================================================
// RECETAS  ·  requiere rol doctor
// =====================================================================

async function renderRecetas(cuerpo) {
  if (!esDoctor()) { cuerpo.innerHTML = notaSoloDoctor("Recetas"); return; }

  const [recetas, consultas, medicamentos] = await Promise.all([
    pedirListaSegura("/recetas/?limite=100"),
    pedirListaSegura("/consulta/?limite=80"),
    pedirListaSegura("/medicamentos/?limite=100"),
  ]);
  const mapaMed = new Map(medicamentos.map((m) => [m.id, m]));

  cuerpo.innerHTML = `
    <div class="ficha">
      <div class="ficha-encabezado">
        <div><h3>Recetar medicamento</h3></div>
      </div>
      <form id="form-receta" class="form-rejilla">
        <div class="campo">
          <label for="r-consulta">Consulta</label>
          <select id="r-consulta" required>
            <option value="">Selecciona una consulta</option>
            ${consultas.map((c) => `<option value="${c.id}">#${c.id} — ${escapar(c.diagnostico)}</option>`).join("")}
          </select>
        </div>
        <div class="campo">
          <label for="r-medicamento">Medicamento</label>
          <select id="r-medicamento" required>
            <option value="">Selecciona un medicamento</option>
            ${medicamentos.map((m) => `<option value="${m.id}">${escapar(m.nombre)} (stock: ${m.stock})</option>`).join("")}
          </select>
        </div>
        <div class="campo">
          <label for="r-cantidad">Cantidad</label>
          <input id="r-cantidad" type="number" min="1" required />
        </div>
        <div class="campo">
          <label for="r-indicaciones">Indicaciones (opcional)</label>
          <input id="r-indicaciones" placeholder="Cada 8 horas por 5 días" />
        </div>
        <div class="campo">
          <button type="submit" class="btn btn-primario">Crear receta</button>
        </div>
      </form>
      <p id="receta-error" class="aviso aviso-error" hidden></p>
    </div>

    <div class="ficha">
      <div class="ficha-encabezado"><div><h3>Recetas registradas</h3></div></div>
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead><tr><th>ID</th><th>Consulta</th><th>Medicamento</th><th>Cantidad</th><th>Indicaciones</th><th></th></tr></thead>
          <tbody id="cuerpo-recetas"></tbody>
        </table>
      </div>
    </div>
  `;

  pintarTablaRecetas(recetas, mapaMed);

  document.getElementById("form-receta").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const err = document.getElementById("receta-error");
    err.hidden = true;
    const indicaciones = document.getElementById("r-indicaciones").value.trim();

    const cuerpoJson = {
      id_consulta: Number(document.getElementById("r-consulta").value),
      id_medicamento: Number(document.getElementById("r-medicamento").value),
      cantidad: Number(document.getElementById("r-cantidad").value),
      indicaciones: indicaciones || null,
    };

    try {
      const resultado = await pedir("/recetas/", { method: "POST", body: JSON.stringify(cuerpoJson) });
      toast(resultado.mensaje || "Receta creada");
      renderRecetas(cuerpo);
    } catch (e) {
      err.textContent = e.message;
      err.hidden = false;
    }
  });
}

function pintarTablaRecetas(recetas, mapaMed) {
  const tbody = document.getElementById("cuerpo-recetas");
  if (!recetas.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="celda-vacia">${estadoVacio("Todavía no hay recetas.")}</td></tr>`;
    return;
  }
  tbody.innerHTML = recetas.map((r) => {
    const med = mapaMed.get(r.id_medicamento);
    return `
      <tr>
        <td class="celda-mono">#${r.id}</td>
        <td class="celda-mono">#${r.id_consulta}</td>
        <td>${med ? escapar(med.nombre) : `<span class="celda-mono">#${r.id_medicamento}</span>`}</td>
        <td>${r.cantidad}</td>
        <td>${escapar(r.indicaciones || "—")}</td>
        <td><button class="btn btn-peligro btn-pequeno" data-borrar-receta="${r.id}">Eliminar</button></td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("[data-borrar-receta]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta receta? El stock del medicamento se restituirá.")) return;
      try {
        await pedir(`/recetas/${btn.dataset.borrarReceta}`, { method: "DELETE" });
        toast("Receta eliminada");
        irAVista("recetas");
      } catch (e) {
        toast(e.message, "error");
      }
    });
  });
}

// =====================================================================
// PACIENTES  ·  requiere rol doctor
// =====================================================================

async function renderPacientes(cuerpo) {
  if (!esDoctor()) { cuerpo.innerHTML = notaSoloDoctor("Pacientes"); return; }

  const pacientes = await pedirListaSegura("/pacientes/?limite=100");

  cuerpo.innerHTML = `
    <div class="ficha">
      <div class="ficha-encabezado">
        <div><h3>Pacientes registrados</h3></div>
      </div>
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead><tr><th>ID</th><th>Nombre</th><th>Identidad</th><th>Teléfono</th><th>Correo</th><th>Edad</th><th></th></tr></thead>
          <tbody id="cuerpo-pacientes"></tbody>
        </table>
      </div>
    </div>
  `;

  pintarTablaPacientes(pacientes);
}

function pintarTablaPacientes(pacientes) {
  const tbody = document.getElementById("cuerpo-pacientes");
  if (!pacientes.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="celda-vacia">${estadoVacio("No hay pacientes registrados.")}</td></tr>`;
    return;
  }

  tbody.innerHTML = pacientes.map((p) => `
    <tr data-fila-paciente="${p.id}">
      <td class="celda-mono">#${p.id}</td>
      <td data-campo="nombre">${escapar(p.nombre)}</td>
      <td class="celda-mono" data-campo="identidad">${escapar(p.identidad)}</td>
      <td data-campo="telefono">${escapar(p.telefono)}</td>
      <td data-campo="correo">${escapar(p.correo)}</td>
      <td data-campo="edad">${escapar(p.edad)}</td>
      <td>
        <button class="btn btn-linea btn-pequeno" data-editar-paciente="${p.id}">Editar</button>
        <button class="btn btn-peligro btn-pequeno" data-borrar-paciente="${p.id}">Eliminar</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-editar-paciente]").forEach((btn) => {
    btn.addEventListener("click", () => abrirEdicionPaciente(btn.dataset.editarPaciente, pacientes));
  });

  tbody.querySelectorAll("[data-borrar-paciente]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar este paciente?")) return;
      try {
        await pedir(`/pacientes/${btn.dataset.borrarPaciente}`, { method: "DELETE" });
        toast("Paciente eliminado");
        irAVista("pacientes");
      } catch (e) {
        toast(e.message, "error");
      }
    });
  });
}

function abrirEdicionPaciente(id, pacientes) {
  const p = pacientes.find((x) => String(x.id) === String(id));
  if (!p) return;
  const fila = document.querySelector(`[data-fila-paciente="${id}"]`);

  fila.innerHTML = `
    <td class="celda-mono">#${p.id}</td>
    <td><input id="ep-nombre" value="${escapar(p.nombre)}" /></td>
    <td><input id="ep-identidad" value="${escapar(p.identidad)}" /></td>
    <td><input id="ep-telefono" value="${escapar(p.telefono)}" /></td>
    <td><input id="ep-correo" value="${escapar(p.correo)}" type="email" /></td>
    <td><input id="ep-edad" value="${escapar(p.edad)}" type="number" min="0" max="120" /></td>
    <td>
      <button class="btn btn-primario btn-pequeno" id="ep-guardar">Guardar</button>
      <button class="btn btn-fantasma btn-pequeno" id="ep-cancelar">Cancelar</button>
    </td>
  `;
  fila.querySelectorAll("input").forEach((i) => (i.style.color = "var(--tinta)"));

  document.getElementById("ep-cancelar").addEventListener("click", () => irAVista("pacientes"));

  document.getElementById("ep-guardar").addEventListener("click", async () => {
    const cambios = {
      nombre: document.getElementById("ep-nombre").value.trim(),
      identidad: document.getElementById("ep-identidad").value.trim(),
      telefono: document.getElementById("ep-telefono").value.trim(),
      correo: document.getElementById("ep-correo").value.trim(),
      edad: Number(document.getElementById("ep-edad").value),
    };
    try {
      await pedir(`/pacientes/${id}`, { method: "PATCH", body: JSON.stringify(cambios) });
      toast("Paciente actualizado");
      irAVista("pacientes");
    } catch (e) {
      toast(e.message, "error");
    }
  });
}

// =====================================================================
// DOCTORES  ·  solo lectura (GET /doctores/, abierto a cualquier rol)
// =====================================================================

async function renderDoctores(cuerpo) {
  const doctores = await pedirListaSegura("/doctores/?limite=100");

  cuerpo.innerHTML = `
    <div class="ficha">
      <div class="ficha-encabezado">
        <div><h3>Doctores</h3></div>
      </div>
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead><tr><th>ID</th><th>Nombre</th><th>Colegiación</th><th>Especialidad</th><th>Teléfono</th><th>Correo</th></tr></thead>
          <tbody>
            ${doctores.length ? doctores.map((d) => `
              <tr>
                <td class="celda-mono">#${d.id}</td>
                <td>${escapar(d.nombre)}</td>
                <td class="celda-mono">${escapar(d.no_colegiacion)}</td>
                <td>${escapar(d.especialidad)}</td>
                <td>${escapar(d.telefono)}</td>
                <td>${escapar(d.correo)}</td>
              </tr>
            `).join("") : `<tr><td colspan="6" class="celda-vacia">${estadoVacio("No hay doctores registrados.")}</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// =====================================================================
// MEDICAMENTOS  ·  requiere rol doctor
// =====================================================================

async function renderMedicamentos(cuerpo) {
  if (!esDoctor()) { cuerpo.innerHTML = notaSoloDoctor("Medicamentos"); return; }

  const medicamentos = await pedirListaSegura("/medicamentos/?limite=100");

  cuerpo.innerHTML = `
    <div class="ficha">
      <div class="ficha-encabezado">
        <div><h3>Registrar medicamento</h3></div>
      </div>
      <form id="form-medicamento" class="form-rejilla">
        <div class="campo"><label for="m-nombre">Nombre</label><input id="m-nombre" required /></div>
        <div class="campo"><label for="m-presentacion">Presentación</label><input id="m-presentacion" required placeholder="Tableta 500mg" /></div>
        <div class="campo"><label for="m-stock">Stock inicial</label><input id="m-stock" type="number" min="0" required /></div>
        <div class="campo"><button type="submit" class="btn btn-primario">Guardar medicamento</button></div>
      </form>
      <p id="medicamento-error" class="aviso aviso-error" hidden></p>
    </div>

    <div class="ficha">
      <div class="ficha-encabezado"><div><h3>Inventario</h3></div></div>
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead><tr><th>ID</th><th>Nombre</th><th>Presentación</th><th>Stock</th><th></th></tr></thead>
          <tbody id="cuerpo-medicamentos"></tbody>
        </table>
      </div>
    </div>
  `;

  pintarTablaMedicamentos(medicamentos);

  document.getElementById("form-medicamento").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const err = document.getElementById("medicamento-error");
    err.hidden = true;
    const cuerpoJson = {
      nombre: document.getElementById("m-nombre").value.trim(),
      presentacion: document.getElementById("m-presentacion").value.trim(),
      stock: Number(document.getElementById("m-stock").value),
    };
    try {
      await pedir("/medicamentos/", { method: "POST", body: JSON.stringify(cuerpoJson) });
      toast("Medicamento registrado");
      renderMedicamentos(cuerpo);
    } catch (e) {
      err.textContent = e.message;
      err.hidden = false;
    }
  });
}

function pintarTablaMedicamentos(medicamentos) {
  const tbody = document.getElementById("cuerpo-medicamentos");
  if (!medicamentos.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="celda-vacia">${estadoVacio("No hay medicamentos registrados.")}</td></tr>`;
    return;
  }
  tbody.innerHTML = medicamentos.map((m) => `
    <tr data-fila-med="${m.id}">
      <td class="celda-mono">#${m.id}</td>
      <td>${escapar(m.nombre)}</td>
      <td>${escapar(m.presentacion)}</td>
      <td class="celda-mono">${m.stock}</td>
      <td>
        <button class="btn btn-linea btn-pequeno" data-editar-med="${m.id}">Editar stock</button>
        <button class="btn btn-peligro btn-pequeno" data-borrar-med="${m.id}">Eliminar</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-editar-med]").forEach((btn) => {
    btn.addEventListener("click", () => abrirEdicionMedicamento(btn.dataset.editarMed, medicamentos));
  });

  tbody.querySelectorAll("[data-borrar-med]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar este medicamento?")) return;
      try {
        await pedir(`/medicamentos/${btn.dataset.borrarMed}`, { method: "DELETE" });
        toast("Medicamento eliminado");
        irAVista("medicamentos");
      } catch (e) {
        toast(e.message, "error");
      }
    });
  });
}

function abrirEdicionMedicamento(id, medicamentos) {
  const m = medicamentos.find((x) => String(x.id) === String(id));
  if (!m) return;
  const fila = document.querySelector(`[data-fila-med="${id}"]`);

  fila.innerHTML = `
    <td class="celda-mono">#${m.id}</td>
    <td><input id="em-nombre" value="${escapar(m.nombre)}" /></td>
    <td><input id="em-presentacion" value="${escapar(m.presentacion)}" /></td>
    <td><input id="em-stock" type="number" min="0" value="${m.stock}" /></td>
    <td>
      <button class="btn btn-primario btn-pequeno" id="em-guardar">Guardar</button>
      <button class="btn btn-fantasma btn-pequeno" id="em-cancelar">Cancelar</button>
    </td>
  `;

  document.getElementById("em-cancelar").addEventListener("click", () => irAVista("medicamentos"));

  document.getElementById("em-guardar").addEventListener("click", async () => {
    const cambios = {
      nombre: document.getElementById("em-nombre").value.trim(),
      presentacion: document.getElementById("em-presentacion").value.trim(),
      stock: Number(document.getElementById("em-stock").value),
    };
    try {
      await pedir(`/medicamentos/${id}`, { method: "PATCH", body: JSON.stringify(cambios) });
      toast("Medicamento actualizado");
      irAVista("medicamentos");
    } catch (e) {
      toast(e.message, "error");
    }
  });
}