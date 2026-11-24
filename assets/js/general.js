//evento que se ejecuta cada vez que se carga la pagina
document.addEventListener("DOMContentLoaded", () => {
    //Verificar que exista la sesión en sessionStorage
    const datosGuardados = sessionStorage.getItem("usuarioERP");

    //verificar si existen datos guardados
    if (!datosGuardados) {
        // Si no ha iniciado sesión, regresarlo a index.html
        window.location.href = "index.html";
        return;
    }

    //Convertir el JSON guardado a objeto JavaScript
    const usuario = JSON.parse(datosGuardados);

    //Aplicar visibilidad de menú según el rol
    aplicarPermisosMenu(usuario.rol);

    //Mostrar los datos del usuario en la interfaz
    mostrarDatosUsuario(usuario);

    //Configurar los botones de Cerrar Sesión (escritorio y móvil)
    const botonesLogout = document.querySelectorAll(".btnCerrarSesion");
    botonesLogout.forEach((boton) => {
        boton.addEventListener("click", () => {
            //cuando se cierra sesion, se borra los datos almacenados en sessionStorage y lo regresa al index
            sessionStorage.removeItem("usuarioERP");
            window.location.href = "index.html";
        });
    });
});

//funcion para mostrar los datos del usuario en la pantalla
function mostrarDatosUsuario(usuario) {
    //obtenemos los datos del usuario que estan guardados en sessionStorage
    const nombreCompleto = usuario.nombreCompleto || "Usuario";
    const rol = usuario.rol || "Sin rol";
    const turno = usuario.nombreTurno || "";

    document.getElementById("lblNombreUsuario").textContent = nombreCompleto;
    document.getElementById("lblRolUsuario").textContent = rol;
    document.getElementById("lblTurnoUsuario").textContent = turno ? `Turno ${turno}` : "";

    // Generar iniciales para el avatar (ej. "Juan Fernando..." -> "JF")
    const partes = nombreCompleto.trim().split(" ");
    const iniciales = partes.length >= 2
        ? (partes[0][0] + partes[1][0]).toUpperCase()
        : nombreCompleto.substring(0, 2).toUpperCase();

    document.getElementById("avatarIniciales").textContent = iniciales;
}

//funcion para dar permisos a cada modulo del sistema segun su rol
function aplicarPermisosMenu(rol) {
    //declaramos que rol tiene permiso en cada modulo
    const rolesPermitidosInventario = ["administrador", "almacenista"];
    const rolesPermitidosProduccion = ["administrador", "panadero"];
    const rolesPermitidosCapitalHumano = ["administrador", "recursos humanos"];
    const rolesPermitidosProveedores = ["administrador", "recursos humanos"];
    const rolesPermitidosKardex = ["administrador", "recursos humanos"];
    const rolesPermitidosAsistencias = ["administrador", "recursos humanos", "almacenista", "panadero"];
    //se guarda el rol real del usuario
    const rolNormalizado = (rol || "").trim().toLowerCase();

    //se valida si el rol real del usuario tiene acceso a que modulo
    document.querySelectorAll(".modulo-inventario").forEach((elemento) => {
        if (rolesPermitidosInventario.includes(rolNormalizado)) {
            // Tiene permiso: lo hacemos visible
            elemento.classList.remove("d-none");
        } else {
            // No tiene permiso: lo eliminamos por completo del DOM
            elemento.remove();
        }
    });

    document.querySelectorAll(".modulo-produccion").forEach((elemento) => {
        if (rolesPermitidosProduccion.includes(rolNormalizado)) {
            // Tiene permiso: lo hacemos visible
            elemento.classList.remove("d-none");
        } else {
            // No tiene permiso: lo eliminamos por completo del DOM
            elemento.remove();
        }
    });

    document.querySelectorAll(".modulo-capitalhumano").forEach((elemento) => {
        if (rolesPermitidosCapitalHumano.includes(rolNormalizado)) {
            // Tiene permiso: lo hacemos visible
            elemento.classList.remove("d-none");
        } else {
            // No tiene permiso: lo eliminamos por completo del DOM
            elemento.remove();
        }
    });

    document.querySelectorAll(".modulo-proveedor").forEach((elemento) => {
        if (rolesPermitidosProveedores.includes(rolNormalizado)) {
            // Tiene permiso: lo hacemos visible
            elemento.classList.remove("d-none");
        } else {
            // No tiene permiso: lo eliminamos por completo del DOM
            elemento.remove();
        }
    });

    document.querySelectorAll(".modulo-kardex").forEach((elemento) => {
        if (rolesPermitidosKardex.includes(rolNormalizado)) {
            // Tiene permiso: lo hacemos visible
            elemento.classList.remove("d-none");
        } else {
            // No tiene permiso: lo eliminamos por completo del DOM
            elemento.remove();
        }
    });

    document.querySelectorAll(".modulo-asistencias").forEach((elemento) => {
        if (rolesPermitidosAsistencias.includes(rolNormalizado)) {
            // Tiene permiso: lo hacemos visible
            elemento.classList.remove("d-none");
        } else {
            // No tiene permiso: lo eliminamos por completo del DOM
            elemento.remove();
        }
    });

}