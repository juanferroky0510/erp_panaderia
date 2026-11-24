//se guarda en una variable el endpoint de nuestro servidor para hacer peticiones al controlador de proveedores
const API_BASE_PROVEEDORES = "http://127.0.0.1:5000/api/proveedores";

// Variables globales de estado
let usuarioActual = null;
let listaProveedores = [];
let paginaActual = 1;
//variable que sirve para la paginacion de registros en las tablas
const REGISTROS_POR_PAGINA = 5;

//evento que se ejecuta cada vez que se carga la pagina
document.addEventListener("DOMContentLoaded", () => {
    //Verificar sesión activa en sessionStorage
    const datosGuardados = sessionStorage.getItem("usuarioERP");

    usuarioActual = JSON.parse(datosGuardados);

    //Validar rol autorizado para el módulo de Proveedores
    const rolesPermitidos = ["administrador", "recursos humanos"];
    const rolUsuario = (usuarioActual.rol || "").trim().toLowerCase();

    if (!rolesPermitidos.includes(rolUsuario)) {
        window.location.href = "inicio.html";
        return;
    }

    //Cargar tabla inicial con todos los proveedores (Todos por defecto)
    cargarProveedores();

    //Eventos del formulario
    document.getElementById("btnInsertar").addEventListener("click", insertarProveedor);
    document.getElementById("btnActualizar").addEventListener("click", actualizarProveedor);
    document.getElementById("btnLimpiar").addEventListener("click", resetearFormulario);

    //Eventos de búsqueda y filtro
    document.getElementById("cmbFiltroEstado").addEventListener("change", () => {
        document.getElementById("txtBuscar").value = "";
        cargarProveedores();
    });

    document.getElementById("btnBuscar").addEventListener("click", buscarProveedor);
    document.getElementById("txtBuscar").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            buscarProveedor();
        }
    });

    document.getElementById("btnLimpiarBusqueda").addEventListener("click", () => {
        document.getElementById("txtBuscar").value = "";
        cargarProveedores();
    });
});

// ==========================================
// CARGAR Y FILTRAR PROVEEDORES (vwRptProveedor)
// ==========================================
async function cargarProveedores() {
    const filtro = document.getElementById("cmbFiltroEstado").value; // TODOS | ACTIVOS | BAJA
    // Si es ACTIVOS pedimos ?activos=1, de lo contrario pedimos ?activos=0 (trae todos)
    const paramActivos = filtro === "ACTIVOS" ? "1" : "0";

    try {
        const resp = await fetch(`${API_BASE_PROVEEDORES}/reporte?activos=${paramActivos}`);
        const resultado = await resp.json();

        if (resultado.ban === "1" && Array.isArray(resultado.datos)) {
            let datos = resultado.datos;

            // Si seleccionó "Baja", filtramos los registros con estadoProveedor === "BAJA"
            if (filtro === "BAJA") {
                datos = datos.filter((p) => p.estadoProveedor === "BAJA");
            }

            listaProveedores = datos;
            paginaActual = 1;
            renderizarTabla();
        } else {
            listaProveedores = [];
            renderizarTabla(resultado.msg || "No se encontraron proveedores.");
        }
    } catch (error) {
        console.error("Error al cargar proveedores:", error);
        listaProveedores = [];
        renderizarTabla("Error de conexión con el servidor al cargar proveedores.");
    }
}

// ==========================================
// BUSCAR PROVEEDOR ESPECÍFICO (spBuscarProveedor)
// ==========================================
async function buscarProveedor() {
    const texto = document.getElementById("txtBuscar").value.trim();

    if (!texto) {
        cargarProveedores();
        return;
    }

    try {
        const resp = await fetch(`${API_BASE_PROVEEDORES}/buscar?q=${encodeURIComponent(texto)}`);
        const resultado = await resp.json();

        if (resultado.ban === "1" && Array.isArray(resultado.datos)) {
            const filtro = document.getElementById("cmbFiltroEstado").value;
            let datos = resultado.datos;

            // Respetar el select de filtro si está en Activos o Baja
            if (filtro === "ACTIVOS") {
                datos = datos.filter((p) => p.estadoProveedor === "ACTIVO");
            } else if (filtro === "BAJA") {
                datos = datos.filter((p) => p.estadoProveedor === "BAJA");
            }

            listaProveedores = datos;
            paginaActual = 1;
            renderizarTabla(datos.length === 0 ? "No hay coincidencias con el filtro seleccionado." : "");
        } else {
            listaProveedores = [];
            paginaActual = 1;
            renderizarTabla(resultado.msg || "No se encontraron proveedores con ese criterio.");
        }
    } catch (error) {
        console.error("Error al buscar proveedor:", error);
        listaProveedores = [];
        renderizarTabla("Error de conexión al realizar la búsqueda.");
    }
}

// ==========================================
// RENDERIZAR TABLA Y PAGINACIÓN (5 EN 5)
// ==========================================
function renderizarTabla(mensajeVacio = "No hay proveedores registrados.") {
    const tbody = document.getElementById("tbodyProveedores");
    const lblInfo = document.getElementById("lblInfoRegistros");
    const totalRegistros = listaProveedores.length;

    if (totalRegistros === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox fs-4 d-block mb-1"></i>
                    ${mensajeVacio}
                </td>
            </tr>
        `;
        lblInfo.textContent = "Mostrando 0 de 0 registros";
        document.getElementById("paginacionProveedores").innerHTML = "";
        return;
    }

    // Calcular índices para mostrar solo 5 registros por página
    const totalPaginas = Math.ceil(totalRegistros / REGISTROS_POR_PAGINA);
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
    const fin = Math.min(inicio + REGISTROS_POR_PAGINA, totalRegistros);
    const registrosPagina = listaProveedores.slice(inicio, fin);

    tbody.innerHTML = registrosPagina.map((prov) => {
        const esActivo = prov.estadoProveedor === "ACTIVO";
        const badgeEstado = esActivo
            ? `<span class="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3">ACTIVO</span>`
            : `<span class="badge rounded-pill bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-3">BAJA</span>`;

        return `
            <tr>
                <td class="ps-4 fw-bold text-secondary">#${prov.idProveedor}</td>
                <td class="fw-semibold" style="color: var(--nexora-navy);">${escapeHTML(prov.nombreProv)}</td>
                <td><span class="badge text-bg-light border font-monospace">${escapeHTML(prov.rfc || "-")}</span></td>
                <td>
                    <div><i class="bi bi-envelope text-muted me-1"></i>${escapeHTML(prov.correoProv || "-")}</div>
                    <div class="text-muted"><i class="bi bi-telephone me-1"></i>${escapeHTML(prov.telefonoProv || "-")}</div>
                </td>
                <td style="max-width: 240px;">${escapeHTML(prov.direccion || "-")}</td>
                <td class="text-center">
                    <span class="badge rounded-pill text-bg-light border">
                        ${prov.tiempoEntregaDias} ${prov.tiempoEntregaDias === 1 ? "día" : "días"}
                    </span>
                </td>
                <td class="text-center">${badgeEstado}</td>
                <td class="pe-4 text-center">
                    <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="cargarProveedorEnFormulario(${prov.idProveedor})">
                        <i class="bi bi-pencil-square me-1"></i>Editar
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    // Actualizar mensaje informativo debajo de la tabla
    lblInfo.textContent = `Mostrando ${inicio + 1} a ${fin} de ${totalRegistros} ${totalRegistros === 1 ? "proveedor" : "proveedores"}`;

    // Dibujar índice de paginación
    renderizarPaginacion(totalPaginas);
}

function renderizarPaginacion(totalPaginas) {
    const ul = document.getElementById("paginacionProveedores");
    if (totalPaginas <= 1) {
        ul.innerHTML = "";
        return;
    }

    let html = "";

    // Botón Anterior
    html += `
        <li class="page-item ${paginaActual === 1 ? "disabled" : ""}">
            <button class="page-link" type="button" onclick="cambiarPagina(${paginaActual - 1})">
                &laquo; Anterior
            </button>
        </li>
    `;

    // Números de página
    for (let i = 1; i <= totalPaginas; i++) {
        const activo = i === paginaActual ? "active" : "";
        const estiloActivo = i === paginaActual ? 'style="background-color: var(--nexora-navy); border-color: var(--nexora-navy);"' : "";
        html += `
            <li class="page-item ${activo}">
                <button class="page-link" type="button" ${estiloActivo} onclick="cambiarPagina(${i})">${i}</button>
            </li>
        `;
    }

    // Botón Siguiente
    html += `
        <li class="page-item ${paginaActual === totalPaginas ? "disabled" : ""}">
            <button class="page-link" type="button" onclick="cambiarPagina(${paginaActual + 1})">
                Siguiente &raquo;
            </button>
        </li>
    `;

    ul.innerHTML = html;
}

function cambiarPagina(nuevaPagina) {
    const totalPaginas = Math.ceil(listaProveedores.length / REGISTROS_POR_PAGINA);
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    paginaActual = nuevaPagina;
    renderizarTabla();
}

// ==========================================
// PREPARAR FORMULARIO PARA EDITAR
// ==========================================
function cargarProveedorEnFormulario(idProveedor) {
    const prov = listaProveedores.find((p) => p.idProveedor === idProveedor);
    if (!prov) return;

    document.getElementById("txtIdProveedor").value = prov.idProveedor;
    document.getElementById("txtNombreProv").value = prov.nombreProv || "";
    document.getElementById("txtRfc").value = prov.rfc || "";
    document.getElementById("txtCorreoProv").value = prov.correoProv || "";
    document.getElementById("txtTelefonoProv").value = prov.telefonoProv || "";
    document.getElementById("txtTiempoEntrega").value = prov.tiempoEntregaDias || "";

    // Si la vista trae los campos separados úsalos; si no, desglosa "calle, municipio, estado, pais"
    if (prov.calle !== undefined || prov.municipio !== undefined) {
        document.getElementById("txtCalle").value = prov.calle || "";
        document.getElementById("txtMunicipio").value = prov.municipio || "";
        document.getElementById("txtEstadoUbicacion").value = prov.estadoUbicacion || prov.estado || "";
        document.getElementById("txtPais").value = prov.pais || "México";
    } else if (prov.direccion) {
        const partes = prov.direccion.split(",").map((s) => s.trim());
        document.getElementById("txtCalle").value = partes[0] || "";
        document.getElementById("txtMunicipio").value = partes[1] || "";
        document.getElementById("txtEstadoUbicacion").value = partes[2] || "";
        document.getElementById("txtPais").value = partes[3] || "México";
    }

    // Habilitar select de estadoProveedor (ACTIVO / BAJA)
    const cmbEstado = document.getElementById("cmbEstadoProveedor");
    cmbEstado.disabled = false;
    cmbEstado.value = prov.estadoProveedor || "ACTIVO";
    document.getElementById("ayudaEstado").textContent = "Puedes cambiar el estado a ACTIVO o BAJA.";

    // Cambiar interfaz a modo Edición
    document.getElementById("tituloFormulario").textContent = `Actualizar Proveedor: ${prov.nombreProv}`;
    document.getElementById("badgeIdProveedor").textContent = `Editando ID #${prov.idProveedor}`;
    document.getElementById("badgeIdProveedor").className = "badge rounded-pill text-bg-warning";

    document.getElementById("btnInsertar").disabled = true;
    document.getElementById("btnActualizar").disabled = false;

    ocultarAlertaFormulario();
    document.getElementById("cardFormulario").scrollIntoView({ behavior: "smooth" });
}

// ==========================================
// INSERTAR PROVEEDOR (spInsertarProveedor)
// ==========================================
async function insertarProveedor() {
    const payload = obtenerDatosFormulario(false);
    if (!payload) return;

    try {
        const resp = await fetch(`${API_BASE_PROVEEDORES}/insertar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const resultado = await resp.json();

        if (resultado.ban === "1") {
            resetearFormulario();
            mostrarAlertaFormulario(resultado.msg || "Proveedor registrado correctamente.", "success");
            await cargarProveedores();
        } else {
            mostrarAlertaFormulario(resultado.msg || "No se pudo registrar el proveedor.", "danger");
        }
    } catch (error) {
        console.error("Error al insertar proveedor:", error);
        mostrarAlertaFormulario("Error de conexión con el servidor al registrar.", "danger");
    }
}

// ==========================================
// ACTUALIZAR PROVEEDOR (spActualizarProveedor)
// ==========================================
async function actualizarProveedor() {
    const payload = obtenerDatosFormulario(true);
    if (!payload) return;

    try {
        const resp = await fetch(`${API_BASE_PROVEEDORES}/actualizar`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const resultado = await resp.json();

        if (resultado.ban === "1") {
            resetearFormulario();
            mostrarAlertaFormulario(resultado.msg || "Proveedor actualizado correctamente.", "success");
            await cargarProveedores();
        } else {
            mostrarAlertaFormulario(resultado.msg || "No se pudo actualizar el proveedor.", "danger");
        }
    } catch (error) {
        console.error("Error al actualizar proveedor:", error);
        mostrarAlertaFormulario("Error de conexión con el servidor al actualizar.", "danger");
    }
}

// ==========================================
// UTILIDADES DEL FORMULARIO Y USUARIO
// ==========================================
function obtenerDatosFormulario(esActualizacion) {
    const idProveedor = parseInt(document.getElementById("txtIdProveedor").value, 10);
    const nombreProv = document.getElementById("txtNombreProv").value.trim();
    const rfc = document.getElementById("txtRfc").value.trim().toUpperCase();
    const correoProv = document.getElementById("txtCorreoProv").value.trim();
    const telefonoProv = document.getElementById("txtTelefonoProv").value.trim();
    const tiempoEntregaDias = parseInt(document.getElementById("txtTiempoEntrega").value, 10);
    const pais = document.getElementById("txtPais").value.trim();
    const estado = document.getElementById("txtEstadoUbicacion").value.trim();
    const municipio = document.getElementById("txtMunicipio").value.trim();
    const calle = document.getElementById("txtCalle").value.trim();
    const estadoProveedor = document.getElementById("cmbEstadoProveedor").value;

    if (esActualizacion && !idProveedor) {
        mostrarAlertaFormulario("Selecciona primero un proveedor de la tabla para actualizar.", "warning");
        return null;
    }

    if (!nombreProv || !rfc) {
        mostrarAlertaFormulario("El nombre del proveedor y el RFC son obligatorios.", "warning");
        return null;
    }

    if (isNaN(tiempoEntregaDias) || tiempoEntregaDias <= 0) {
        mostrarAlertaFormulario("El tiempo de entrega debe ser de al menos 1 día.", "warning");
        return null;
    }

    const datos = {
        idEmpleado: usuarioActual.idEmpleado,
        nombreProv,
        correoProv,
        telefonoProv,
        rfc,
        pais,
        estado,
        municipio,
        calle,
        tiempoEntregaDias
    };

    // Solo al actualizar se agregan idProveedor y estadoProveedor
    if (esActualizacion) {
        datos.idProveedor = idProveedor;
        datos.estadoProveedor = estadoProveedor;
    }

    return datos;
}

function resetearFormulario() {
    document.getElementById("formProveedor").reset();
    document.getElementById("txtIdProveedor").value = "";
    document.getElementById("txtPais").value = "México";

    const cmbEstado = document.getElementById("cmbEstadoProveedor");
    cmbEstado.value = "ACTIVO";
    cmbEstado.disabled = true;
    document.getElementById("ayudaEstado").textContent = "Por defecto es ACTIVO al registrar.";

    document.getElementById("tituloFormulario").textContent = "Registrar Nuevo Proveedor";
    document.getElementById("badgeIdProveedor").textContent = "Nuevo registro";
    document.getElementById("badgeIdProveedor").className = "badge rounded-pill text-bg-light border";

    document.getElementById("btnInsertar").disabled = false;
    document.getElementById("btnActualizar").disabled = true;

    ocultarAlertaFormulario();
}

function mostrarAlertaFormulario(mensaje, tipo) {
    const alerta = document.getElementById("alertaFormulario");
    alerta.className = `alert alert-${tipo} py-2 px-3 small mb-3`;
    alerta.textContent = mensaje;
    alerta.classList.remove("d-none");
}

function ocultarAlertaFormulario() {
    document.getElementById("alertaFormulario").classList.add("d-none");
}

function escapeHTML(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}