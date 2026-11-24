//evento que se ejecuta cada vez que se carga la pagina
document.addEventListener("DOMContentLoaded", () => {
    //Verificar que exista la sesión en sessionStorage
    const datosGuardados = sessionStorage.getItem("usuarioERP");

    //Convertir el JSON guardado a objeto JavaScript
    const usuario = JSON.parse(datosGuardados);

    mostrarFechaActual();
    mostrarSaludo(usuario);
});

//funcion que imprime en pantalla la fecha actual del sistema
function mostrarFechaActual() {
    const opciones = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    const hoy = new Date().toLocaleDateString("es-MX", opciones);
    // Capitalizar primera letra
    document.getElementById("fechaActual").textContent = hoy.charAt(0).toUpperCase() + hoy.slice(1);
}

//funcion que imprime un saludo al usuario despues de iniciar sesion
function mostrarSaludo(usuario) {
    const nombreCompleto = usuario.nombreCompleto || "Usuario";
    document.getElementById("saludoNombre").textContent = nombreCompleto.split(" ")[0];
}