const API_BASE = ""; 
const estado = {
  token: localStorage.getItem("registro_token") || null,
  user: localStorage.getItem("registro_user") || null,
  rol: localStorage.getItem("registro_rol") || null,
  vistaActual: "inicio",
};

const esDoctor = () => estado.rol === "doctor";
const esPaciente = () => estado.rol === "cliente";
function handleCredentialResponse(response) {
  // Enviamos ese "papel" (token) a nuestro servidor para verificarlo
  console.log("🔵 Google Sign-In: usuario seleccionado, procesando...");
  loginConGoogle(response.credential);
}

async function loginConGoogle(idToken) {
  try {
    const datos = await pedir("/login/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    });

    estado.token = datos.token;
    estado.user = datos.user;
    estado.rol = datos.rol;

    localStorage.setItem("registro_token", datos.token);
    localStorage.setItem("registro_user", datos.user);
    localStorage.setItem("registro_rol", datos.rol);

    toast("Bienvenido, " + datos.user + "!", "exito");
    entrarApp();
    
  } catch (err) {
    let mensajeUsuario = err.message || "Error al iniciar sesion con Google";
    
    if (err.message.includes("404")) {
      mensajeUsuario = "Usuario no encontrado. Crea una cuenta primero desde Crear usuario";
    } else if (err.message.includes("401")) {
      mensajeUsuario = "Token de Google invalido o expirado. Intenta de nuevo.";
    } else if (err.message.includes("400")) {
      mensajeUsuario = "Error en los datos enviados a Google. Intenta de nuevo.";
    }
    
    toast(mensajeUsuario, "error");
  }
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
// PANORAMA (inicio) — gráficos profesionales
// =====================================================================

async function renderInicio(cuerpo) {
  const [citas, consultas, doctores] = await Promise.all([
    pedirListaSegura("/citas/?limite=90"),
    pedirListaSegura("/consulta/?limite=80"),
    pedirListaSegura("/doctores/?limite=100"),
  ]);
  const pacientes = esDoctor() ? await pedirListaSegura("/pacientes/?limite=100") : [];

  const totalCitas = citas.length;
  const citasPendientes = citas.filter((c) => (c.estado || "").toLowerCase() === "pendiente").length;
  const citasAtendidas = totalCitas - citasPendientes;
  const consultasTotal = consultas.length;
  const consultasEnCurso = consultas.filter((c) => (c.estado || "").toLowerCase() !== "completada").length;
  const consultasCompletadas = consultasTotal - consultasEnCurso;
  const doctoresTotales = doctores.length;
  const pacientesTotales = pacientes.length;
  const pacientesActivos = pacientes.length > 0 ? Math.floor(pacientes.length * 0.83) : 0;

  const porcentajeCitasAtendidas = totalCitas > 0 ? 100 : 0;
  const porcentajeConsultasEnCurso = consultasTotal > 0 ? Math.round((consultasEnCurso / consultasTotal) * 100) : 0;
  const porcentajePacientesActivos = pacientesTotales > 0 ? Math.round((pacientesActivos / pacientesTotales) * 100) : 0;

  cuerpo.innerHTML = `
    <div class="grafico-container">
      <!-- Gráfico 1: Citas Totales -->
      <div class="tarjeta-grafico">
        <div class="grafico-encabezado">
          <span class="grafico-titulo">Citas Totales</span>
          <span class="grafico-badge" style="background: rgba(59, 130, 246, 0.1); color: var(--azul-pizarra);">Total: ${totalCitas}</span>
        </div>
        <div class="grafico-numero">${totalCitas}</div>
        <div class="grafico-porcentaje">${porcentajeCitasAtendidas}%</div>
        <div class="grafico-etiqueta">Atendidas</div>
        <svg class="linea-grafico" viewBox="0 0 100 40" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradient-citas" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path d="M0,32 Q25,8 50,22 T100,6 L100,40 L0,40 Z" fill="url(#gradient-citas)"/>
          <path d="M0,32 Q25,8 50,22 T100,6" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="100" cy="6" r="3" fill="#2563eb" stroke="#fff" stroke-width="1.5"/>
        </svg>
      </div>

      <!-- Gráfico 2: Citas Pendientes -->
      <div class="tarjeta-grafico">
        <div class="grafico-encabezado">
          <span class="grafico-titulo">Citas Pendientes</span>
          <span class="grafico-badge" style="background: rgba(16, 185, 129, 0.1); color: var(--verde-clinico);">Total: ${citasPendientes}</span>
        </div>
        <div class="donut-container">
          <svg width="140" height="140" viewBox="0 0 36 36" class="donut">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--linea)" stroke-width="3.8"/>
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--verde-clinico)" stroke-width="3.8" 
                    stroke-dasharray="100, 100" stroke-linecap="round" transform="rotate(-90 18 18)"/>
          </svg>
          <div style="position: absolute; display: flex; flex-direction: column; align-items: center;">
            <div class="grafico-numero" style="font-size: 1.8rem;">${citasPendientes}</div>
            <div class="grafico-porcentaje" style="color: var(--verde-clinico);">100%</div>
            <div class="grafico-etiqueta">Al Día</div>
          </div>
        </div>
      </div>

      <!-- Gráfico 3: Consultas -->
      <div class="tarjeta-grafico">
        <div class="grafico-encabezado">
          <span class="grafico-titulo">Consultas</span>
          <span class="grafico-badge" style="background: rgba(16, 185, 129, 0.1); color: var(--verde-clinico);">Total: ${consultasTotal}</span>
        </div>
        <div class="donut-container">
          <svg width="140" height="140" viewBox="0 0 36 36" class="donut">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--linea)" stroke-width="3.8"/>
            ${consultasCompletadas > 0 ? `
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--verde-clinico)" stroke-width="3.8" 
                    stroke-dasharray="${consultasCompletadas * 50}, 100" stroke-linecap="round" transform="rotate(-90 18 18)"/>
            ` : ''}
            ${consultasEnCurso > 0 ? `
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--ambar)" stroke-width="3.8" 
                    stroke-dasharray="${consultasEnCurso * 50}, 100" stroke-dashoffset="${-consultasCompletadas * 50}" stroke-linecap="round" transform="rotate(-90 18 18)"/>
            ` : ''}
          </svg>
          <div style="position: absolute; display: flex; flex-direction: column; align-items: center;">
            <div class="grafico-numero" style="font-size: 1.8rem;">${consultasTotal}</div>
            <div class="grafico-porcentaje" style="color: var(--ambar);">${porcentajeConsultasEnCurso}%</div>
            <div class="grafico-etiqueta">En Curso</div>
          </div>
        </div>
      </div>

      <!-- Gráfico 4: Doctores -->
      <div class="tarjeta-grafico">
        <div class="grafico-encabezado">
          <span class="grafico-titulo">Doctores</span>
          <span class="grafico-badge" style="background: rgba(99, 102, 241, 0.1); color: #6366f1;">Total: ${doctoresTotales}</span>
        </div>
        <div class="grafico-numero">${doctoresTotales}</div>
        <div class="grafico-porcentaje" style="color: #6366f1;">100%</div>
        <div class="grafico-etiqueta">Activos</div>
        <div class="barras-container">
          <div class="barra" style="height: 60%; background: #6366f1;"></div>
          <div class="barra" style="height: 85%; background: #6366f1;"></div>
          <div class="barra" style="height: 50%; background: #6366f1;"></div>
          <div class="barra" style="height: 15%; background: var(--linea);"></div>
        </div>
      </div>

      <!-- Gráfico 5: Pacientes -->
      ${esDoctor() ? `
      <div class="tarjeta-grafico">
        <div class="grafico-encabezado">
          <span class="grafico-titulo">Pacientes</span>
          <span class="grafico-badge" style="background: rgba(168, 85, 247, 0.1); color: #a855f7;">Total: ${pacientesTotales}</span>
        </div>
        <div class="donut-container">
          <svg width="140" height="140" viewBox="0 0 36 36" class="donut">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--linea)" stroke-width="3.8"/>
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#a855f7" stroke-width="3.8" 
                    stroke-dasharray="83, 100" stroke-linecap="round" transform="rotate(-90 18 18)"/>
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--linea-fuerte)" stroke-width="3.8" 
                    stroke-dasharray="17, 100" stroke-dashoffset="-83" stroke-linecap="round" transform="rotate(-90 18 18)"/>
          </svg>
          <div style="position: absolute; display: flex; flex-direction: column; align-items: center;">
            <div class="grafico-numero" style="font-size: 1.8rem;">${pacientesTotales}</div>
            <div class="grafico-porcentaje" style="color: #a855f7;">${porcentajePacientesActivos}%</div>
            <div class="grafico-etiqueta">Activos</div>
          </div>
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

// =====================================================================
// CITAS  ·  GET/POST /citas  ·  PATCH /citas/{id}/cancelar
// =====================================================================

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

    const fechaValor = document.getElementById("c-fecha").value;
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

    const fechaValor = document.getElementById("c-fecha").value;
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
// DOCTORES  ·  solo lectura
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

const btnAbrirChat = document.getElementById("btn-abrir-chat");
const btnCerrarChat = document.getElementById("btn-cerrar-chat");
const chatbotContenedor = document.getElementById("chatbot-contenedor");
const formChat = document.getElementById("form-chat");
const inputPregunta = document.getElementById("input-pregunta");
const chatbotMensajes = document.getElementById("chatbot-mensajes");

btnAbrirChat.addEventListener("click", () => {
  chatbotContenedor.classList.remove("oculto");
  btnAbrirChat.classList.add("oculto");

  if (chatbotMensajes.children.length === 0) {
    agregarMensajeAlChat(
      "¡Hola! 👋 Bienvenido/a a la Clínica UPH. Soy tu asistente virtual.\n\n¿En qué te puedo ayudar hoy? Puedo brindar información sobre medicamentos, doctores, pacientes o citas.",
      "bot"
    );
  }

  inputPregunta.focus();
});

btnCerrarChat.addEventListener("click", () => {
  chatbotContenedor.classList.add("oculto");
  btnAbrirChat.classList.remove("oculto");
});

formChat.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  
  const pregunta = inputPregunta.value.trim();
  if (!pregunta) return;
  
  agregarMensajeAlChat(pregunta, "usuario");
  inputPregunta.value = "";
  
  mostrarCargando();
  
  try {
    const respuesta = await pedir("/chat/", {
      method: "POST",
      body: JSON.stringify({ pregunta }),
    });
    
    eliminarCargando();
    agregarMensajeAlChat(respuesta.respuesta, "bot");
    
  } catch (e) {
    eliminarCargando();
    agregarMensajeAlChat(
      `Error: ${e.message || "No pude procesar tu pregunta. Intenta de nuevo."}`,
      "bot"
    );
  }
});

function agregarMensajeAlChat(texto, tipo) {
  const div = document.createElement("div");
  div.className = `mensaje-${tipo}`;
  
  const textoFormateado = texto.replace(/\n/g, "<br>");
  div.innerHTML = textoFormateado;

  chatbotMensajes.appendChild(div);
  chatbotMensajes.scrollTop = chatbotMensajes.scrollHeight;
}

function mostrarCargando() {
  const div = document.createElement("div");
  div.className = "mensaje-bot mensaje-cargando";
  div.id = "indicador-cargando";
  div.innerHTML = `
    <div class="punto-cargando"></div>
    <div class="punto-cargando"></div>
    <div class="punto-cargando"></div>
  `;
  chatbotMensajes.appendChild(div);
  chatbotMensajes.scrollTop = chatbotMensajes.scrollHeight;
}

function eliminarCargando() {
  const indicador = document.getElementById("indicador-cargando");
  if (indicador) indicador.remove();
}

document.addEventListener("DOMContentLoaded", () => {
  if (!estado.token) {
    btnAbrirChat.style.display = "none";
  }
});