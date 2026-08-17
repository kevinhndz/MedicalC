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
let paginaActualEstudiantes = 1;
let paginaActualAsignaturas = 1;
let paginaActualMatriculas = 1;
const REGISTROS_POR_PAGINA = 10;

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
        const respuesta = await fetch(`/estudiantes/?pagina=${paginaActualEstudiantes}&limite=${REGISTROS_POR_PAGINA}`, {
            method: "GET",
            headers: { "token": token }
        });

        if (!respuesta.ok) {
            mostrarMensaje("Error al cargar estudiantes", "error");
            return;
        }

        const datos = await respuesta.json();
        
       
        if (paginaActualEstudiantes === 1) {
            listaEstudiantes = datos.Estudiantes;
        } else {
            listaEstudiantes = listaEstudiantes.concat(datos.Estudiantes);
        }

        dibujarTablaEstudiantes();
        
      
        mostrarBotonVerMasEstudiantes(datos.hay_mas);

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


function mostrarBotonVerMasEstudiantes(hayMas) {
    let boton = document.getElementById("btn-ver-mas-estudiantes");
    
    if (!boton) {
        boton = document.createElement("button");
        boton.id = "btn-ver-mas-estudiantes";
        boton.className = "btn-ver-mas";
        boton.textContent = "Ver más estudiantes";
        boton.style.marginTop = "10px";
        boton.style.padding = "8px 16px";
        boton.style.cursor = "pointer";
        boton.onclick = () => {
            paginaActualEstudiantes++;
            cargarEstudiantes();
        };
        
        const tableContainer = document.getElementById("tbody-estudiantes").parentElement.parentElement;
        tableContainer.appendChild(boton);
    }
    
    boton.style.display = hayMas ? "block" : "none";
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
           
            paginaActualEstudiantes = 1;
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
            
            paginaActualEstudiantes = 1;
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
            
            paginaActualEstudiantes = 1;
            cargarEstudiantes();
        } else {
            mostrarMensaje("Error: " + datos.detail, "error");
        }
    } catch (error) {
        mostrarMensaje("Error de conexion al agregar estudiante", "error");
        console.error("Error:", error);
    }
});



async function cargarAsignaturas() {
    try {
        const respuesta = await fetch(`/asignaturas/?pagina=${paginaActualAsignaturas}&limite=${REGISTROS_POR_PAGINA}`, {
            method: "GET",
            headers: { "token": token }
        });

        if (!respuesta.ok) {
            mostrarMensaje("Error al cargar asignaturas", "error");
            return;
        }

        const datos = await respuesta.json();
        
        
        if (paginaActualAsignaturas === 1) {
            listaAsignaturas = datos.Asignaturas;
        } else {
            listaAsignaturas = listaAsignaturas.concat(datos.Asignaturas);
        }

        dibujarTablaAsignaturas();
     
        mostrarBotonVerMasAsignaturas(datos.hay_mas);

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

function mostrarBotonVerMasAsignaturas(hayMas) {
    let boton = document.getElementById("btn-ver-mas-asignaturas");
    
    if (!boton) {
        boton = document.createElement("button");
        boton.id = "btn-ver-mas-asignaturas";
        boton.className = "btn-ver-mas";
        boton.textContent = "Ver más asignaturas";
        boton.style.marginTop = "10px";
        boton.style.padding = "8px 16px";
        boton.style.cursor = "pointer";
        boton.onclick = () => {
            paginaActualAsignaturas++;
            cargarAsignaturas();
        };
        
        const tableContainer = document.getElementById("tbody-asignaturas").parentElement.parentElement;
        tableContainer.appendChild(boton);
    }
    
    boton.style.display = hayMas ? "block" : "none";
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
        
            paginaActualAsignaturas = 1;
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
            // PAGINACIÓN: Reiniciar a página 1 después de borrar
            paginaActualAsignaturas = 1;
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
        
            paginaActualAsignaturas = 1;
            cargarAsignaturas();
        } else {
            mostrarMensaje("Error: " + datos.detail, "error");
        }
    } catch (error) {
        mostrarMensaje("Error de conexion al agregar asignatura", "error");
        console.error("Error:", error);
    }
});


async function cargarMatriculas() {
    try {
        const respuesta = await fetch(`/matriculas/?pagina=${paginaActualMatriculas}&limite=${REGISTROS_POR_PAGINA}`, {
            method: "GET",
            headers: { "token": token }
        });

        if (!respuesta.ok) {
            mostrarMensaje("Error al cargar matriculas", "error");
            return;
        }

        const datos = await respuesta.json();
        
       
        if (paginaActualMatriculas === 1) {
            listaMatriculas = datos.Matriculas;
        } else {
            listaMatriculas = listaMatriculas.concat(datos.Matriculas);
        }

        dibujarTablaMatriculas();
        

        mostrarBotonVerMasMatriculas(datos.hay_mas);

    } catch (error) {
        mostrarMensaje("Error de conexion al cargar matriculas", "error");
        console.error("Error:", error);
    }
}

function dibujarTablaMatriculas() {
    const tbody = document.getElementById("tbody-matriculas");
    tbody.innerHTML = "";

    listaMatriculas.forEach(mat => {
        const fila = document.createElement("tr");
        fila.id = "fila-mat-" + mat.id;

        fila.innerHTML = `
            <td>${mat.id}</td>
            <td>${mat.nombre_estudiante}</td>
            <td>${mat.correo_estudiante}</td>
            <td>${mat.nombre_asignatura}</td>
            <td>
                <button class="btn-editar" onclick="activarEdicionMatricula(${mat.id})">Editar</button>
                <button class="btn-borrar" onclick="borrarMatricula(${mat.id})">Borrar</button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

// PAGINACIÓN: Función para mostrar/ocultar botón "Ver más"
function mostrarBotonVerMasMatriculas(hayMas) {
    let boton = document.getElementById("btn-ver-mas-matriculas");
    
    if (!boton) {
        boton = document.createElement("button");
        boton.id = "btn-ver-mas-matriculas";
        boton.className = "btn-ver-mas";
        boton.textContent = "Ver más matrículas";
        boton.style.marginTop = "10px";
        boton.style.padding = "8px 16px";
        boton.style.cursor = "pointer";
        boton.onclick = () => {
            paginaActualMatriculas++;
            cargarMatriculas();
        };
        
        const tableContainer = document.getElementById("tbody-matriculas").parentElement.parentElement;
        tableContainer.appendChild(boton);
    }
    
    boton.style.display = hayMas ? "block" : "none";
}

function activarEdicionMatricula(id) {
    const mat = listaMatriculas.find(m => m.id === id);
    if (!mat) return;

    const fila = document.getElementById("fila-mat-" + id);

    fila.innerHTML = `
        <td>${mat.id}</td>
        <td>
            <select id="edit-estudiante-${id}">
                ${listaEstudiantes.map(est => 
                    `<option value="${est.id}" ${est.id === mat.id_est ? 'selected' : ''}>${est.nombre}</option>`
                ).join('')}
            </select>
        </td>
        <td>${mat.correo_estudiante}</td>
        <td>
            <select id="edit-asignatura-${id}">
                ${listaAsignaturas.map(asig => 
                    `<option value="${asig.id}" ${asig.id === mat.id_asig ? 'selected' : ''}>${asig.nombre}</option>`
                ).join('')}
            </select>
        </td>
        <td>
            <button class="btn-guardar" onclick="guardarMatricula(${id})">Guardar</button>
            <button class="btn-cancelar" onclick="dibujarTablaMatriculas()">Cancelar</button>
        </td>
    `;
}

async function guardarMatricula(id) {
    const id_est = parseInt(document.getElementById("edit-estudiante-" + id).value);
    const id_asig = parseInt(document.getElementById("edit-asignatura-" + id).value);

    try {
        const respuesta = await fetch(`/matriculas/${id}`, {
            method: "PUT",
            headers: {
                "token": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id_est, id_asig })
        });

        if (respuesta.ok) {
            mostrarMensaje("Matricula actualizada correctamente", "exito");
            // PAGINACIÓN: Reiniciar a página 1 después de guardar
            paginaActualMatriculas = 1;
            cargarMatriculas();
        } else {
            const datos = await respuesta.json();
            mostrarMensaje("Error al actualizar: " + datos.detail, "error");
        }
    } catch (error) {
        mostrarMensaje("Error de conexion al actualizar", "error");
        console.error("Error:", error);
    }
}

async function borrarMatricula(id) {
    try {
        const respuesta = await fetch(`/matriculas/${id}`, {
            method: "DELETE",
            headers: { "token": token }
        });

        if (respuesta.ok) {
            mostrarMensaje("Matricula borrada correctamente", "exito");
            // PAGINACIÓN: Reiniciar a página 1 después de borrar
            paginaActualMatriculas = 1;
            cargarMatriculas();
        } else {
            mostrarMensaje("Error al borrar matricula", "error");
        }
    } catch (error) {
        mostrarMensaje("Error de conexion al borrar", "error");
        console.error("Error:", error);
    }
}

function actualizarSelectsMatricula() {
    const selectEst = document.getElementById("select-estudiante");
    const selectAsig = document.getElementById("select-asignatura");

    selectEst.innerHTML = '<option value="">-- Selecciona un Estudiante --</option>';
    selectAsig.innerHTML = '<option value="">-- Selecciona una Asignatura --</option>';

    listaEstudiantes.forEach(est => {
        const option = document.createElement("option");
        option.value = est.id;
        option.textContent = est.nombre;
        selectEst.appendChild(option);
    });

    listaAsignaturas.forEach(asig => {
        const option = document.createElement("option");
        option.value = asig.id;
        option.textContent = asig.nombre;
        selectAsig.appendChild(option);
    });
}

document.getElementById("form-crear-matricula").addEventListener("submit", async function (e) {
    e.preventDefault();

    const id_est = parseInt(document.getElementById("select-estudiante").value);
    const id_asig = parseInt(document.getElementById("select-asignatura").value);

    if (!id_est || !id_asig) {
        mostrarMensaje("Por favor selecciona estudiante y asignatura", "error");
        return;
    }

    try {
        const respuesta = await fetch("/matriculas/", {
            method: "POST",
            headers: {
                "token": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id_est, id_asig })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            mostrarMensaje("Matricula agregada correctamente", "exito");
            this.reset();
            actualizarSelectsMatricula();
            paginaActualMatriculas = 1;
            cargarMatriculas();
        } else {
            mostrarMensaje("Error: " + datos.detail, "error");
        }
    } catch (error) {
        mostrarMensaje("Error de conexion al agregar matricula", "error");
        console.error("Error:", error);
    }
});


let listaMatriculas = [];

const rolNormalizado = rol ? rol.trim() : "";

if (rolNormalizado === "Administrador") {
    document.getElementById("modulo-estudiantes").style.display = "block";
    document.getElementById("formulario-estudiante").style.display = "block";
    document.getElementById("modulo-asignaturas").style.display = "block";
    document.getElementById("modulo-matriculas").style.display = "block";
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
    
    
    setTimeout(() => {
        actualizarSelectsMatricula();
        cargarMatriculas();
    }, 500);
}