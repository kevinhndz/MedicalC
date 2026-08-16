const token = localStorage.getItem("boleto");
const rol = localStorage.getItem("rol");
const user = localStorage.getItem("user");

if (!token) {
    window.location.href = "/";
}

window.addEventListener("pageshow", function (evento) {
    const tokenActual = localStorage.getItem("boleto");

    if (evento.persisted || !tokenActual) {
        window.location.replace("/");
    }
});

document.getElementById("nombreUsuario").textContent = user;
document.getElementById("rolUsuario").textContent = rol;

let listaEstudiantes = [];
let listaAsignaturas = [];

function mostrarMensaje(texto, tipo) {
    const caja = document.getElementById("mensaje");
    caja.textContent = texto;
    caja.className = tipo;

    setTimeout(function () {
        caja.className = "";
        caja.textContent = "";
    }, 4000);
}

function cerrarSesion() {
    localStorage.removeItem("boleto");
    localStorage.removeItem("rol");
    localStorage.removeItem("user");
    window.location.replace("/");
}

async function cargarEstudiantes() {
    try {
        const respuesta = await fetch("/estudiantes/", {
            method: "GET",
            headers: { "token": token }
        });

        if (!respuesta.ok) {
            mostrarMensaje("Error al cargar estudiantes", "error");
            return;
        }

        const datos = await respuesta.json();
        listaEstudiantes = datos.Estudiantes;

        dibujarTablaEstudiantes();

    } catch (error) {
        mostrarMensaje("Error de conexion al cargar estudiantes", "error");
        console.error("Error:", error);
    }
}

function dibujarTablaEstudiantes() {
    const tbody = document.getElementById("tbody-estudiantes");
    tbody.innerHTML = "";

    listaEstudiantes.forEach(est => {
        const fila = document.createElement("tr");
        fila.id = "fila-est-" + est.id;

        fila.innerHTML = `
            <td>${est.id}</td>
            <td class="celda-nombre">${est.nombre}</td>
            <td class="celda-telefono">${est.telefono}</td>
            <td class="celda-correo">${est.correo}</td>
            <td class="celda-acciones" style="display:none;">
                <button class="btn-editar" onclick="activarEdicionEstudiante(${est.id})">Editar</button>
                <button class="btn-borrar" onclick="borrarEstudiante(${est.id})">Borrar</button>
            </td>
        `;
        tbody.appendChild(fila);
    });

    if (rol === "Administrador") {
        document.getElementById("col-acciones").style.display = "table-cell";
        document.querySelectorAll(".celda-acciones").forEach(celda => {
            celda.style.display = "table-cell";
        });
    }
}

function activarEdicionEstudiante(id) {

    const est = listaEstudiantes.find(e => e.id === id);
    if (!est) return;

    const fila = document.getElementById("fila-est-" + id);
    fila.classList.add("fila-editando");

    fila.innerHTML = `
        <td>${est.id}</td>
        <td><input type="text" id="edit-nombre-${id}" value="${est.nombre}"></td>
        <td><input type="text" id="edit-telefono-${id}" value="${est.telefono}"></td>
        <td><input type="email" id="edit-correo-${id}" value="${est.correo}"></td>
        <td>
            <button class="btn-guardar" onclick="guardarEstudiante(${id})">Guardar</button>
            <button class="btn-cancelar" onclick="dibujarTablaEstudiantes()">Cancelar</button>
        </td>
    `;
}

async function guardarEstudiante(id) {

    const nombre = document.getElementById("edit-nombre-" + id).value;
    const telefono = document.getElementById("edit-telefono-" + id).value;
    const correo = document.getElementById("edit-correo-" + id).value;

    try {
        const respuesta = await fetch(`/estudiantes/${id}`, {
            method: "PUT",
            headers: {
                "token": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre, telefono, correo })
        });

        if (respuesta.ok) {
            mostrarMensaje("Estudiante actualizado correctamente", "exito");
            cargarEstudiantes();
        } else {
            const datos = await respuesta.json();
            mostrarMensaje("Error al actualizar: " + datos.detail, "error");
        }
    } catch (error) {
        mostrarMensaje("Error de conexion al actualizar", "error");
        console.error("Error:", error);
    }
}

async function borrarEstudiante(id) {
    try {
        const respuesta = await fetch(`/estudiantes/${id}`, {
            method: "DELETE",
            headers: { "token": token }
        });

        if (respuesta.ok) {
            mostrarMensaje("Estudiante borrado correctamente", "exito");
            cargarEstudiantes();
        } else {
            mostrarMensaje("Error al borrar estudiante", "error");
        }
    } catch (error) {
        mostrarMensaje("Error de conexion al borrar", "error");
        console.error("Error:", error);
    }
}

document.getElementById("form-crear-estudiante").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const telefono = document.getElementById("telefono").value;
    const correo = document.getElementById("correo").value;

    try {
        const respuesta = await fetch("/estudiantes/", {
            method: "POST",
            headers: {
                "token": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre, telefono, correo })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            mostrarMensaje("Estudiante agregado correctamente", "exito");
            this.reset();
            cargarEstudiantes();
        } else {
            mostrarMensaje("Error: " + datos.detail, "error");
        }
    } catch (error) {
        mostrarMensaje("Error de conexion al agregar estudiante", "error");
        console.error("Error:", error);
    }
});

/* ===================== ASIGNATURAS ===================== */

async function cargarAsignaturas() {
    try {
        const respuesta = await fetch("/asignaturas/", {
            method: "GET",
            headers: { "token": token }
        });

        if (!respuesta.ok) {
            mostrarMensaje("Error al cargar asignaturas", "error");
            return;
        }

        const datos = await respuesta.json();
        listaAsignaturas = datos.Asignaturas;

        dibujarTablaAsignaturas();

    } catch (error) {
        mostrarMensaje("Error de conexion al cargar asignaturas", "error");
        console.error("Error:", error);
    }
}

function dibujarTablaAsignaturas() {
    const tbody = document.getElementById("tbody-asignaturas");
    tbody.innerHTML = "";

    listaAsignaturas.forEach(asig => {
        const fila = document.createElement("tr");
        fila.id = "fila-asig-" + asig.id;

        fila.innerHTML = `
            <td>${asig.id}</td>
            <td>${asig.nombre}</td>
            <td>${asig.creditos}</td>
            <td>${asig.seccion}</td>
            <td>${asig.dia}</td>
            <td>${asig.horario}</td>
            <td>
                <button class="btn-editar" onclick="activarEdicionAsignatura(${asig.id})">Editar</button>
                <button class="btn-borrar" onclick="borrarAsignatura(${asig.id})">Borrar</button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

function activarEdicionAsignatura(id) {

    const asig = listaAsignaturas.find(a => a.id === id);
    if (!asig) return;

    const fila = document.getElementById("fila-asig-" + id);
    fila.classList.add("fila-editando");

    fila.innerHTML = `
        <td>${asig.id}</td>
        <td><input type="text" id="edit-nom-asig-${id}" value="${asig.nombre}"></td>
        <td><input type="number" id="edit-creditos-${id}" value="${asig.creditos}"></td>
        <td><input type="text" id="edit-seccion-${id}" value="${asig.seccion}"></td>
        <td><input type="text" id="edit-dia-${id}" value="${asig.dia}"></td>
        <td><input type="text" id="edit-horario-${id}" value="${asig.horario}"></td>
        <td>
            <button class="btn-guardar" onclick="guardarAsignatura(${id})">Guardar</button>
            <button class="btn-cancelar" onclick="dibujarTablaAsignaturas()">Cancelar</button>
        </td>
    `;
}

async function guardarAsignatura(id) {

    const nombre = document.getElementById("edit-nom-asig-" + id).value;
    const creditos = parseInt(document.getElementById("edit-creditos-" + id).value);
    const seccion = document.getElementById("edit-seccion-" + id).value;
    const dia = document.getElementById("edit-dia-" + id).value;
    const horario = document.getElementById("edit-horario-" + id).value;

    try {
        const respuesta = await fetch(`/asignaturas/${id}`, {
            method: "PUT",
            headers: {
                "token": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre, creditos, seccion, dia, horario })
        });

        if (respuesta.ok) {
            mostrarMensaje("Asignatura actualizada correctamente", "exito");
            cargarAsignaturas();
        } else {
            const datos = await respuesta.json();
            mostrarMensaje("Error al actualizar: " + datos.detail, "error");
        }
    } catch (error) {
        mostrarMensaje("Error de conexion al actualizar", "error");
        console.error("Error:", error);
    }
}

async function borrarAsignatura(id) {
    try {
        const respuesta = await fetch(`/asignaturas/${id}`, {
            method: "DELETE",
            headers: { "token": token }
        });

        if (respuesta.ok) {
            mostrarMensaje("Asignatura borrada correctamente", "exito");
            cargarAsignaturas();
        } else {
            mostrarMensaje("Error al borrar asignatura", "error");
        }
    } catch (error) {
        mostrarMensaje("Error de conexion al borrar", "error");
        console.error("Error:", error);
    }
}

document.getElementById("form-crear-asignatura").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nom-asignatura").value;
    const creditos = parseInt(document.getElementById("creditos").value);
    const seccion = document.getElementById("seccion").value;
    const dia = document.getElementById("dia").value;
    const horario = document.getElementById("horario").value;

    try {
        const respuesta = await fetch("/asignaturas/", {
            method: "POST",
            headers: {
                "token": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre, creditos, seccion, dia, horario })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            mostrarMensaje("Asignatura agregada correctamente", "exito");
            this.reset();
            cargarAsignaturas();
        } else {
            mostrarMensaje("Error: " + datos.detail, "error");
        }
    } catch (error) {
        mostrarMensaje("Error de conexion al agregar asignatura", "error");
        console.error("Error:", error);
    }
});


const rolNormalizado = rol ? rol.trim() : "";

if (rolNormalizado === "Administrador") {
    document.getElementById("modulo-estudiantes").style.display = "block";
    document.getElementById("formulario-estudiante").style.display = "block";
    document.getElementById("modulo-asignaturas").style.display = "block";
} else if (rolNormalizado === "Profesor") {
    document.getElementById("modulo-estudiantes").style.display = "block";
    document.getElementById("formulario-estudiante").style.display = "block";
} else {
    mostrarMensaje("Rol no reconocido: '" + rol + "'. Verifica el cargo guardado en la base de datos.", "error");
    setTimeout(cerrarSesion, 3000);
}

cargarEstudiantes();

if (rolNormalizado === "Administrador") {
    cargarAsignaturas();
}