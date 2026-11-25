const API_BASE_ASISTENCIAS = "http://127.0.0.1:5000/api/capital-humano/asistencias";

let usuarioActual = null;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificar sesión activa en sessionStorage
    const datosGuardados = sessionStorage.getItem("usuarioERP");

    usuarioActual = JSON.parse(datosGuardados);

        //Validar rol autorizado para el módulo de Proveedores
    const rolesPermitidos = ["administrador", "recursos humanos", "almacenista", "panadero"];
    const rolUsuario = (usuarioActual.rol || "").trim().toLowerCase();

    if (!rolesPermitidos.includes(rolUsuario)) {
        window.location.href = "inicio.html";
        return;
    }

    // 4. Iniciar reloj en tiempo real
    actualizarReloj();
    setInterval(actualizarReloj, 1000);

    // 5. Configurar cierre de sesión
    document.querySelectorAll(".btnCerrarSesion").forEach((btn) => {
        btn.addEventListener("click", () => {
            sessionStorage.removeItem("usuarioERP");
            window.location.href = "index.html";
        });
    });

    // 6. Contador de caracteres para observaciones (máx. 100 en BD)
    const txtObservaciones = document.getElementById("txtObservaciones");
    txtObservaciones.addEventListener("input", () => {
        document.getElementById("contadorCaracteres").textContent = `${txtObservaciones.value.length}/100`;
    });

    // 7. Consultar el estado actual del empleado hoy
    consultarEstadoHoy();

    // 8. Evento de envío del formulario
    document.getElementById("formAsistencia").addEventListener("submit", registrarAsistencia);
});

// ==========================================
// CONSULTAR ESTADO DE HOY (spEstadoAsistenciaHoy)
// ==========================================
async function consultarEstadoHoy() {
    try {
        const resp = await fetch(`${API_BASE_ASISTENCIAS}/estado/${usuarioActual.idEmpleado}`);
        const resultado = await resp.json();

        if (resultado.ban === "1" && resultado.datos) {
            actualizarInterfazEstado(resultado.datos);
        } else {
            mostrarAlerta(resultado.msg || "No se pudo verificar tu estado de asistencia.", "warning");
        }
    } catch (error) {
        console.error("Error al consultar estado de asistencia:", error);
        mostrarAlerta("Error de conexión con el servidor al verificar tu jornada.", "danger");
    }
}

// ==========================================
// REGISTRAR ENTRADA O SALIDA (spRegistrarAsistencia)
// ==========================================
async function registrarAsistencia(e) {
    e.preventDefault();
    ocultarAlerta();

    const txtObservaciones = document.getElementById("txtObservaciones");
    const observaciones = txtObservaciones.value.trim();

    cambiarEstadoCarga(true);

    try {
        const resp = await fetch(`${API_BASE_ASISTENCIAS}/registrar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idEmpleado: usuarioActual.idEmpleado,
                observaciones: observaciones
            })
        });

        const resultado = await resp.json();

        if (resultado.ban === "1" && resultado.datos) {
            txtObservaciones.value = "";
            document.getElementById("contadorCaracteres").textContent = "0/100";

            const esEntrada = resultado.datos.estadoAsistencia === "TRABAJANDO";
            mostrarAlerta(resultado.msg, esEntrada ? "success" : "info");

            // Refrescar tarjetas y botón con los nuevos datos
            await consultarEstadoHoy();
        } else {
            mostrarAlerta(resultado.msg || "No se pudo registrar la asistencia.", "danger");
            cambiarEstadoCarga(false);
        }
    } catch (error) {
        console.error("Error al registrar asistencia:", error);
        mostrarAlerta("No se pudo conectar con el servidor para registrar asistencia.", "danger");
        cambiarEstadoCarga(false);
    }
}

// ==========================================
// ACTUALIZAR TARJETA DE ESTADO Y BOTÓN
// ==========================================
function actualizarInterfazEstado(datos) {
    const estado = datos.estadoAsistencia || "SIN REGISTRO";
    const badge = document.getElementById("badgeEstadoAsistencia");
    const btn = document.getElementById("btnRegistrarAsistencia");
    const textoBtn = document.getElementById("textoBtnAsistencia");
    const iconoBtn = document.getElementById("iconoBtnAsistencia");
    const txtObs = document.getElementById("txtObservaciones");

    document.getElementById("spinnerAsistencia").classList.add("d-none");

    // Pintar horas
    document.getElementById("lblHoraEntrada").textContent = datos.horaEntrada
        ? datos.horaEntrada.split(" ")[1]
        : "--:--";
    document.getElementById("lblHoraSalida").textContent = datos.horaSalida
        ? datos.horaSalida.split(" ")[1]
        : (estado === "TRABAJANDO" ? "En curso" : "--:--");

    if (estado === "SIN REGISTRO") {
        badge.className = "badge rounded-pill text-bg-secondary px-3 py-2";
        badge.textContent = "SIN REGISTRO HOY";
        document.getElementById("lblDetalleTiempo").textContent = "Pendiente";

        btn.disabled = false;
        btn.className = "btn btn-nexora btn-lg py-3 fw-semibold";
        iconoBtn.className = "bi bi-box-arrow-in-right me-2";
        textoBtn.textContent = "Registrar Entrada (Iniciar Turno)";
        txtObs.disabled = false;

    } else if (estado === "TRABAJANDO") {
        badge.className = "badge rounded-pill bg-success px-3 py-2";
        badge.textContent = "TRABAJANDO";
        document.getElementById("lblDetalleTiempo").textContent = `${datos.minutosRetardo || 0} min retardo`;

        btn.disabled = false;
        btn.className = "btn btn-warning btn-lg py-3 fw-semibold text-dark";
        iconoBtn.className = "bi bi-box-arrow-right me-2";
        textoBtn.textContent = "Registrar Salida (Finalizar Turno)";
        txtObs.disabled = false;

    } else if (estado === "FUERA DE SERVICIO") {
        badge.className = "badge rounded-pill bg-primary px-3 py-2";
        badge.textContent = "FUERA DE SERVICIO";
        document.getElementById("lblDetalleTiempo").textContent = `${datos.horasTrabajadas || 0} hrs • ${datos.minutosRetardo || 0} min ret.`;

        btn.disabled = true;
        btn.className = "btn btn-secondary btn-lg py-3 fw-semibold";
        iconoBtn.className = "bi bi-check-circle me-2";
        textoBtn.textContent = "Jornada del día completada";
        txtObs.disabled = true;
    }
}

// ==========================================
// UTILIDADES DE RELOJ, USUARIO Y PERMISOS
// ==========================================
function actualizarReloj() {
    const ahora = new Date();
    document.getElementById("relojVivo").textContent = ahora.toLocaleTimeString("es-MX", { hour12: false });

    const opcionesFecha = { weekday: "short", day: "2-digit", month: "short", year: "numeric" };
    const fechaTexto = ahora.toLocaleDateString("es-MX", opcionesFecha);
    document.getElementById("fechaViva").textContent = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
}

function cambiarEstadoCarga(cargando) {
    const btn = document.getElementById("btnRegistrarAsistencia");
    const spinner = document.getElementById("spinnerAsistencia");
    btn.disabled = cargando;
    spinner.classList.toggle("d-none", !cargando);
}

function mostrarAlerta(mensaje, tipo) {
    const alerta = document.getElementById("alertaAsistencia");
    alerta.className = `alert alert-${tipo} py-2 px-3 small mb-4`;
    alerta.textContent = mensaje;
    alerta.classList.remove("d-none");
}

function ocultarAlerta() {
    document.getElementById("alertaAsistencia").classList.add("d-none");
}