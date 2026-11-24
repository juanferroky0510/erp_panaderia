document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificar que exista la sesión en sessionStorage
    const datosGuardados = sessionStorage.getItem("usuarioERP");

    if (!datosGuardados) {
        // Si no ha iniciado sesión, regresarlo a index.html
        window.location.href = "index.html";
        return;
    }

    // 2. Convertir el JSON guardado a objeto JavaScript
    const usuario = JSON.parse(datosGuardados);

    mostrarFechaActual();
    mostrarSaludo(usuario);
});

function mostrarFechaActual() {
    const opciones = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    const hoy = new Date().toLocaleDateString("es-MX", opciones);
    // Capitalizar primera letra
    document.getElementById("fechaActual").textContent = hoy.charAt(0).toUpperCase() + hoy.slice(1);
}

function mostrarSaludo(usuario) {
    const nombreCompleto = usuario.nombreCompleto || "Usuario";
    document.getElementById("saludoNombre").textContent = nombreCompleto.split(" ")[0];
}