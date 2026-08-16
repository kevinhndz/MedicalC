document.getElementById("registrar").addEventListener("submit", async function(e) {

    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const telefono = document.getElementById("telefono").value;
    const correo = document.getElementById("correo").value;
    const cargo = document.getElementById("cargo").value;
    const user = document.getElementById("user").value;
    const password = document.getElementById("password").value;


    const respuesta = await fetch("/registrar/", { 

        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre, telefono: telefono, correo: correo, cargo: cargo, user: user, password: password })

    });

  
const datos = await respuesta.json();

if (respuesta.ok) {
    window.location = "/general";
} else {
    
    alert("Error de validacion:\n" + JSON.stringify(datos.detail, null, 2));
    console.log(datos.detail);
}

});