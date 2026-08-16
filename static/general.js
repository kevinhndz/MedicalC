const token = localStorage.getItem("boleto");
const rol = localStorage.getItem("rol");
const user = localStorage.getItem("user");

if (!token) {
    window.location.href = "/";
}

document.getElementById("nombreUsuario").textContent = user;
document.getElementById("rolUsuario").textContent = rol;

function cerrarSesion() {
    localStorage.removeItem("boleto");
    localStorage.removeItem("rol");
    localStorage.removeItem("user");
    window.location.href = "/";
}

async function cargarEstudiantes() {
    try {
        const respuesta = await fetch("/estudiantes/", {
            method: "GET",
            headers: { "token": token }
        });

        if (!respuesta.ok) {
            alert("Error al cargar estudiantes");
            return;
        }

        const datos = await respuesta.json();
        const tbody = document.getElementById("tbody-estudiantes");
        tbody.innerHTML = "";

        datos.Estudiantes.forEach(est => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${est.id}</td>
                <td>${est.nombre}</td>
                <td>${est.telefono}</td>
                <td>${est.correo}</td>
                <td id="celda-acciones-${est.id}" style="display:none;">
                    <button onclick="editarEstudiante(${est.id}, '${est.nombre}', '${est.telefono}', '${est.correo}')">Editar</button>
                    <button onclick="borrarEstudiante(${est.id})">Borrar</button>
                </td>
            `;
            tbody.appendChild(fila);
        });

        if (rol === "Administrador") {
            document.getElementById("col-acciones").style.display = "table-cell";
            for (let i = 0; i < datos.Estudiantes.length; i++) {
                document.getElementById(`celda-acciones-${datos.Estudiantes[i].id}`).style.display = "table-cell";
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

async function cargarAsignaturas() {
    try {
        const respuesta = await fetch("/asignaturas/", {
            method: "GET",
            headers: { "token": token }
        });

        if (!respuesta.ok) {
            alert("Error al cargar asignaturas");
            return;
        }

        const datos = await respuesta.json();
        const tbody = document.getElementById("tbody-asignaturas");
        tbody.innerHTML = "";

        datos.Asignaturas.forEach(asig => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${asig.id}</td>
                <td>${asig.nombre}</td>
                <td>${asig.creditos}</td>
                <td>${asig.seccion}</td>
                <td>${asig.dia}</td>
                <td>${asig.horario}</td>
                <td>
                    <button onclick="editarAsignatura(${asig.id}, '${asig.nombre}', ${asig.creditos}, '${asig.seccion}', '${asig.dia}', '${asig.horario}')">Editar</button>
                    <button onclick="borrarAsignatura(${asig.id})">Borrar</button>
                </td>
            `;
            tbody.appendChild(fila);
        });

    } catch (error) {
        console.error("Error:", error);
    }
}

function mostrarFormularioEstudiante() {
    const formulario = document.getElementById("formulario-estudiante");
    formulario.style.display = formulario.style.display === "none" ? "block" : "none";
}

document.getElementById("form-crear-estudiante").addEventListener("submit", async function(e) {
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
            alert("Estudiante agregado correctamente");
            this.reset();
            cargarEstudiantes();
        } else {
            alert("Error: " + datos.detail);
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

async function borrarEstudiante(id) {
    if (confirm("Seguro de borrar este estudiante?")) {
        try {
            const respuesta = await fetch(`/estudiantes/${id}`, {
                method: "DELETE",
                headers: { "token": token }
            });

            if (respuesta.ok) {
                alert("Estudiante borrado correctamente");
                cargarEstudiantes();
            } else {
                alert("Error al borrar");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
}

function editarEstudiante(id, nombre, telefono, correo) {
    const nuevoNombre = prompt("Nuevo nombre:", nombre);
    if (nuevoNombre === null) return;

    const nuevoTelefono = prompt("Nuevo telefono:", telefono);
    if (nuevoTelefono === null) return;

    const nuevoCorreo = prompt("Nuevo correo:", correo);
    if (nuevoCorreo === null) return;

    actualizarEstudiante(id, nuevoNombre, nuevoTelefono, nuevoCorreo);
}

async function actualizarEstudiante(id, nombre, telefono, correo) {
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
            alert("Estudiante actualizado correctamente");
            cargarEstudiantes();
        } else {
            alert("Error al actualizar");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

document.getElementById("form-crear-asignatura").addEventListener("submit", async function(e) {
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
            alert("Asignatura agregada correctamente");
            this.reset();
            cargarAsignaturas();
        } else {
            alert("Error: " + datos.detail);
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

async function borrarAsignatura(id) {
    if (confirm("Seguro de borrar esta asignatura?")) {
        try {
            const respuesta = await fetch(`/asignaturas/${id}`, {
                method: "DELETE",
                headers: { "token": token }
            });

            if (respuesta.ok) {
                alert("Asignatura borrada correctamente");
                cargarAsignaturas();
            } else {
                alert("Error al borrar");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
}

function editarAsignatura(id, nombre, creditos, seccion, dia, horario) {
    const nuevoNombre = prompt("Nuevo nombre:", nombre);
    if (nuevoNombre === null) return;

    const nuevoCreditos = prompt("Nuevos creditos:", creditos);
    if (nuevoCreditos === null) return;

    const nuevoSeccion = prompt("Nueva seccion:", seccion);
    if (nuevoSeccion === null) return;

    const nuevoDia = prompt("Nuevo dia:", dia);
    if (nuevoDia === null) return;

    const nuevoHorario = prompt("Nuevo horario:", horario);
    if (nuevoHorario === null) return;

    actualizarAsignatura(id, nuevoNombre, parseInt(nuevoCreditos), nuevoSeccion, nuevoDia, nuevoHorario);
}

async function actualizarAsignatura(id, nombre, creditos, seccion, dia, horario) {
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
            alert("Asignatura actualizada correctamente");
            cargarAsignaturas();
        } else {
            alert("Error al actualizar");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

const rolNormalizado = rol ? rol.trim() : "";

if (rolNormalizado === "Administrador") {
    document.getElementById("modulo-estudiantes").style.display = "block";
    document.getElementById("formulario-estudiante").style.display = "block";
    document.getElementById("modulo-asignaturas").style.display = "block";
} else if (rolNormalizado === "Profesor") {
    document.getElementById("modulo-estudiantes").style.display = "block";
    document.getElementById("formulario-estudiante").style.display = "block";
} else {
    alert("Rol no reconocido: '" + rol + "'. Verifica que el cargo se haya guardado correctamente en la base de datos.");
    cerrarSesion();
}

cargarEstudiantes();

if (rolNormalizado === "Administrador") {
    cargarAsignaturas();
}