document.getElementById("login").addEventListener("submit", async function(e){

e.preventDefault()

const user = document.getElementById("user").value;
const password = document.getElementById("password").value;



const respuesta = await fetch( "/login", {

    method: "POST",
    headers: {"Content - Type" :"application/json"},
    body: JSON.stringify({user: user, password: password})

});

const datos = await respuesta.json()

if (respuesta.ok){

    localStorage.setItem("boleto", datos.boleto);
    localStorage.setItem("rol", datos.rol);
    localStorage.setItem("user", datos.user);
    window.location.href = "/general"
}
else{

    alert("Hubo un error a la hora de entrar, intenta de nuevo");
  
}

}); 


