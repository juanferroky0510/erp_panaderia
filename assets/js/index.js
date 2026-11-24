const API_LOGIN_URL = "http://127.0.0.1:5000/api/auth/login";

document.addEventListener("DOMContentLoaded", () => {
    // Si ya existe una sesión activa, redirigir directamente a inicio.html
    const sesionActiva = sessionStorage.getItem("usuarioERP");
    if (sesionActiva) {
        window.location.href = "inicio.html";
        return;
    }

    const formLogin = document.getElementById("formLogin");
    const txtCorreo = document.getElementById("txtCorreo");
    const txtContrasena = document.getElementById("txtContrasena");
    const btnTogglePassword = document.getElementById("btnTogglePassword");
    const iconoOjo = document.getElementById("iconoOjo");

    // Mostrar / ocultar contraseña
    btnTogglePassword.addEventListener("click", () => {
        const esPassword = txtContrasena.type === "password";
        txtContrasena.type = esPassword ? "text" : "password";
        iconoOjo.className = esPassword ? "bi bi-eye-slash" : "bi bi-eye";
    });

    // Envío del formulario de inicio de sesión
    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        ocultarAlerta();

        const correo = txtCorreo.value.trim();
        const contrasena = txtContrasena.value.trim();

        if (!correo || !contrasena) {
            mostrarAlerta("Por favor ingresa tu correo electrónico y contraseña.", "warning");
            return;
        }

        cambiarEstadoCarga(true);

        try {
            const respuesta = await fetch(API_LOGIN_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    correo: correo,
                    contrasena: contrasena
                })
            });

            const resultado = await respuesta.json();

            // Validar bandera devuelta por ApiEstatusModel ("1" = éxito)
            if (resultado.ban === "1" && resultado.datos) {
                // Guardar los datos del empleado en sessionStorage
                sessionStorage.setItem("usuarioERP", JSON.stringify(resultado.datos));

                mostrarAlerta(resultado.msg || "Acceso concedido. Redirigiendo...", "success");

                setTimeout(() => {
                    window.location.href = "inicio.html";
                }, 600);
            } else {
                mostrarAlerta(resultado.msg || "Credenciales incorrectas o usuario dado de baja.", "danger");
                cambiarEstadoCarga(false);
            }
        } catch (error) {
            console.error("Error de conexión con el servidor:", error);
            mostrarAlerta("No se pudo conectar con el servidor (http://127.0.0.1:5000). Verifica que Flask esté encendido.", "danger");
            cambiarEstadoCarga(false);
        }
    });
});

function mostrarAlerta(mensaje, tipo) {
    const alerta = document.getElementById("alertaLogin");
    alerta.className = `alert alert-${tipo} py-2 px-3 small`;
    alerta.textContent = mensaje;
    alerta.classList.remove("d-none");
}

function ocultarAlerta() {
    const alerta = document.getElementById("alertaLogin");
    alerta.classList.add("d-none");
}

function cambiarEstadoCarga(cargando) {
    const btn = document.getElementById("btnIniciarSesion");
    const texto = document.getElementById("textoBtn");
    const spinner = document.getElementById("spinnerBtn");

    btn.disabled = cargando;
    texto.textContent = cargando ? "Validando acceso..." : "Iniciar sesión";
    spinner.classList.toggle("d-none", !cargando);
}