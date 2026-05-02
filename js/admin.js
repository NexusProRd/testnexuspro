// ==========================================
// ADMIN.JS - NEXUS PRO V4.1
// ==========================================

// ==========================================
// UTILIDADES DE SEGURIDAD
// ==========================================
function $(id) { return document.getElementById(id); }
function $set(id, prop, val) { var el = document.getElementById(id); if (el) el[prop] = val; }
function $show(id, show) { var el = document.getElementById(id); if (el) el.style.display = show ? 'block' : 'none'; }
function $text(id, txt) { var el = document.getElementById(id); if (el) el.innerText = txt; }
function $html(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
function $val(id, v) { var el = document.getElementById(id); if (el) el.value = v; }
function $class(id, cls, add) { var el = document.getElementById(id); if (el) add ? el.classList.add(cls) : el.classList.remove(cls); }
function $addClass(id, cls) { var el = document.getElementById(id); if (el) el.classList.add(cls); }
function $removeClass(id, cls) { var el = document.getElementById(id); if (el) el.classList.remove(cls); }
function $toggleClass(id, cls, cond) { var el = document.getElementById(id); if (el) el.classList.toggle(cls, cond); }

// ==========================================
// NOTIFICACIONES NATIVAS DEL NAVEGADOR
// ==========================================
async function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
    }
}

async function showNativeNotification(title, body, icon = "📦") {
    if (Notification.permission === "granted") {
        const notif = new Notification(title, {
            body: body,
            icon: "https://cdn-icons-png.flaticon.com/512/685/685655.png",
            tag: "nexus-order",
            requireInteraction: true
        });
        notif.onclick = () => {
            window.focus();
            switchTab('pedidos');
            notif.close();
        };
    }
}

function playNotificationSound() {
    const soundEnabled = localStorage.getItem('nx_sound_enabled');
    if (soundEnabled !== 'false') {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audio.play().catch(() => {});
    }
}

function vibrateDevice() {
    const vibrateEnabled = localStorage.getItem('nx_vibrate_enabled');
    if (vibrateEnabled !== 'false' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
    }
}

function toggleSoundSetting() {
    const enabled = document.getElementById('cfgSound').checked;
    localStorage.setItem('nx_sound_enabled', enabled ? 'true' : 'false');
}

function toggleVibrateSetting() {
    const enabled = document.getElementById('cfgVibrate').checked;
    localStorage.setItem('nx_vibrate_enabled', enabled ? 'true' : 'false');
}

function loadNotificationSettings() {
    document.getElementById('cfgSound').checked = localStorage.getItem('nx_sound_enabled') !== 'false';
    document.getElementById('cfgVibrate').checked = localStorage.getItem('nx_vibrate_enabled') !== 'false';
}

// ==========================================
// MODO MANTENIMIENTO
// ==========================================
function toggleMaintenanceMode() {
    if (!document.getElementById('maintenanceBtn').classList.contains('active')) {
        NexusDialog.confirm("Activar modo mantenimiento? Los clientes no verán la tienda.", "🔧 Mantenimiento").then(confirmado => {
            if (confirmado) {
                localStorage.setItem('nx_maintenance', 'true');
                document.getElementById('maintenanceBtn').classList.add('active', 'bg-rose-500');
                document.getElementById('maintenanceBadge').classList.remove('hidden');
                NexusCore.ejecutar('updateConfig', { maintenance: 'true' });
            }
        });
    } else {
        localStorage.removeItem('nx_maintenance');
        document.getElementById('maintenanceBtn').classList.remove('active', 'bg-rose-500');
        document.getElementById('maintenanceBadge').classList.add('hidden');
        NexusCore.ejecutar('updateConfig', { maintenance: 'false' });
    }
}

function checkMaintenanceStatus() {
    if (localStorage.getItem('nx_maintenance') === 'true') {
        document.getElementById('maintenanceBtn').classList.add('active', 'bg-rose-500');
        document.getElementById('maintenanceBadge').classList.remove('hidden');
    }
}

function toggleModoFeriaFromConfig() {
    var enabled = document.getElementById('cfgModoFeria').checked;
    localStorage.setItem('nx_modo_feria', enabled ? 'true' : 'false');
    NexusCore.ejecutar('updateConfig', { modo_feria: enabled ? 'true' : 'false' });
    var info = document.getElementById('feriaInfo');
    if (info) info.classList.toggle('hidden', !enabled);
}

function toggleMaintenanceFromConfig() {
    var enabled = document.getElementById('cfgMaintenance').checked;
    if (enabled) {
        NexusDialog.confirm("Activar modo mantenimiento? Los clientes no verán la tienda.", "🔧 Mantenimiento").then(function(confirmado) {
            if (confirmado) {
                localStorage.setItem('nx_maintenance', 'true');
                document.getElementById('maintenanceBtn').classList.add('active', 'bg-rose-500');
                document.getElementById('maintenanceBadge').classList.remove('hidden');
                NexusCore.ejecutar('updateConfig', { maintenance: 'true' });
            } else {
                document.getElementById('cfgMaintenance').checked = false;
            }
        });
    } else {
        localStorage.removeItem('nx_maintenance');
        document.getElementById('maintenanceBtn').classList.remove('active', 'bg-rose-500');
        document.getElementById('maintenanceBadge').classList.add('hidden');
        NexusCore.ejecutar('updateConfig', { maintenance: 'false' });
    }
}

function loadSettingsInModal() {
    document.getElementById('cfgModoFeria').checked = localStorage.getItem('nx_modo_feria') === 'true';
    document.getElementById('cfgMaintenance').checked = localStorage.getItem('nx_maintenance') === 'true';
}

// ==========================================
// SISTEMA DE DIÁLOGOS
// ==========================================
const NexusDialog = {
    resolvePromise: null,

    show: function(type, msg, title = "Atención") {
        return new Promise((resolve) => {
            const titleEl = document.getElementById('dialogTitle');
            const msgEl = document.getElementById('dialogMsg');
            const modalEl = document.getElementById('modalDialog');
            
            if (!titleEl || !msgEl || !modalEl) {
                alert(title + ": " + msg);
                resolve();
                return;
            }
            
            titleEl.innerText = title;
            msgEl.innerText = msg;
            
            const inputEl = document.getElementById('dialogInput');
            const btnCancel = document.getElementById('btnDialogCancel');
            
            if (inputEl) {
                inputEl.value = "";
                inputEl.style.display = (type === 'prompt') ? 'block' : 'none';
            }
            if (btnCancel) {
                btnCancel.style.display = (type === 'alert') ? 'none' : 'block';
            }
            
            modalEl.classList.remove('hidden');
            modalEl.classList.add('flex');
            
            if (type === 'prompt' && inputEl) setTimeout(() => inputEl.focus(), 100);
            this.resolvePromise = resolve;
        });
    },

    close: function(value) {
        document.getElementById('modalDialog').classList.add('hidden');
        document.getElementById('modalDialog').classList.remove('flex');
        if (this.resolvePromise) {
            this.resolvePromise(value);
            this.resolvePromise = null;
        }
    },

    submit: function() {
        const inputEl = document.getElementById('dialogInput');
        if (inputEl.style.display === 'block') {
            this.close(inputEl.value);
        } else {
            this.close(true);
        }
    },

    alert:   function(msg, title) { return this.show('alert',   msg, title); },
    confirm: function(msg, title) { return this.show('confirm', msg, title); },
    prompt:  function(msg, title) { return this.show('prompt',  msg, title); }
};

// ==========================================
// VARIABLES GLOBALES
// ==========================================
let appData = { productos: [], pedidos: [], cupones: [], config: {}, resumen: {}, success: true };
let currentPin = "1234";
let pollingInterval;
let currentTab = 'productos';
let currentOrderFilter = 'Todos';
const telefonoSoporte = "18290000000";

// ==========================================
// RATE LIMITING PARA PIN
// ==========================================
function getPinAttempts() {
    const stored = localStorage.getItem('nx_pin_attempts');
    return stored ? JSON.parse(stored) : { count: 0, blockedUntil: null };
}

function incrementPinAttempts() {
    const att = getPinAttempts();
    att.count++;
    localStorage.setItem('nx_pin_attempts', JSON.stringify(att));
}

function isPinBlocked() {
    const att = getPinAttempts();
    if (att.blockedUntil && Date.now() < att.blockedUntil) {
        return true;
    }
    return false;
}

function blockPin(durationMinutes = 30) {
    const att = getPinAttempts();
    att.count = 0;
    att.blockedUntil = Date.now() + (durationMinutes * 60 * 1000);
    localStorage.setItem('nx_pin_attempts', JSON.stringify(att));
}

function resetPinAttempts() {
    localStorage.setItem('nx_pin_attempts', JSON.stringify({ count: 0, blockedUntil: null }));
}

function getBlockTimeRemaining() {
    const att = getPinAttempts();
    if (!att.blockedUntil) return 0;
    const remaining = att.blockedUntil - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
}

// ==========================================
// LOADING OVERLAY
// ==========================================
function showLoading(text = "Procesando...") {
    $text('loadingText', text);
    document.getElementById('loadingOverlay').classList.add('open');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('open');
}

// ==========================================
// TIMER DE INACTIVIDAD
// ==========================================
let inactivityTimer;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    if (localStorage.getItem("nx_session") === "valid") {
        inactivityTimer = setTimeout(() => {
            logout("Sesión cerrada por inactividad (10 min).");
        }, 10 * 60 * 1000);
    }
}

window.addEventListener('mousemove',  resetInactivityTimer);
window.addEventListener('keypress',   resetInactivityTimer);
window.addEventListener('touchstart', resetInactivityTimer);

// ==========================================
// INICIALIZACIÓN
// ==========================================
window.onload = async () => {
    
    var PCC_URL = "https://script.google.com/macros/s/AKfycbxikMAM8onAKt8mDPS-VXfw5M3myiHMFfUbz3t_QaMWrU9V_qvO2ZoP-RD19N6qplnMwQ/exec";
    var MOTOR_FALLBACK = "https://script.google.com/macros/s/AKfycbwr3K5qcSQvmEb1qhoeM0L9E26k1nSHTjmBdoehu3vRcssLltMInwM4AaWw34ZOuKEF/exec";
    
    var params = new URLSearchParams(window.location.search);
    var identifier = params.get('s') || "";
    
    var loginSubtitle = document.getElementById('loginSubtitle');
    if (loginSubtitle) loginSubtitle.innerHTML = '<span class="loader"></span> Validando tienda...';
    
    if (!identifier) {
        if (loginSubtitle) loginSubtitle.innerText = "ERROR: Falta parámetro 's' en la URL";
        return;
    }
    
    // Crear NEXUS_CONFIG
    if (typeof NEXUS_CONFIG === 'undefined') {
        window.NEXUS_CONFIG = {};
    }
    
    var key = identifier.toLowerCase().trim();
    var resolvedShopId = null;
    var motorUrl = MOTOR_FALLBACK;
    
    // 1. Buscar en mapeo local
    if (identifier.length < 30 && typeof SHOP_MAPPING !== 'undefined' && SHOP_MAPPING[key]) {
        console.log(">>> Encontrado en mapeo local:", key);
        resolvedShopId = SHOP_MAPPING[key];
    }
    // 2. Si es un Sheet ID directo (largo), usarlo directamente
    else if (identifier.length > 30) {
        console.log(">>> Usando como Sheet ID directo");
        resolvedShopId = identifier;
    }
    // 3. Consultar al PCC (MasterController)
    else {
        console.log(">>> Consultando al PCC para:", key);
        try {
            var pccResponse = await fetch(PCC_URL, {
                method: "POST",
                body: JSON.stringify({ action: 'obtenerClientes' }),
                redirect: "follow"
            });
            var pccText = await pccResponse.text();
            console.log(">>> Respuesta PCC:", pccText.substring(0, 200));
            
            var pccData = JSON.parse(pccText);
            if (pccData.clients) {
                var cliente = pccData.clients.find(function(c) { 
                    return c.nombre && c.nombre.toLowerCase().trim() === key; 
                });
                
                if (cliente) {
                    console.log(">>> Cliente encontrado en PCC:", cliente.nombre, cliente.sheetId);
                    resolvedShopId = cliente.sheetId;
                }
            }
        } catch(e) {
            console.log(">>> Error consultando PCC:", e.message);
        }
    }
    
    // Si no se encontró el ID, mostrar error
    if (!resolvedShopId) {
        console.log(">>> Tienda no encontrada:", key);
        if (loginSubtitle) loginSubtitle.innerText = "ERROR: Tienda '" + identifier + "' no encontrada";
        NexusDialog.alert("La tienda '" + identifier + "' no existe o no está registrada en el sistema.", "Tienda no encontrada");
        return;
    }
    
    console.log(">>> Sheet ID resuelto:", resolvedShopId);
    
    // Configurar NEXUS_CONFIG con el ID resuelto
    NEXUS_CONFIG.shopId = resolvedShopId;
    NEXUS_CONFIG.pccShopId = identifier;
    NEXUS_CONFIG.API_URL = motorUrl;
    NEXUS_CONFIG.isReady = true;
    NEXUS_CONFIG.getShopId = function() { return this.shopId; };
    
    NEXUS_CONFIG.call = async function(action, data = {}) {
        var url = this.API_URL || MOTOR_FALLBACK;
        var payload = { shopId: this.shopId, action: action, data: data };
        console.log(">>> call payload:", payload);
        
        var response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(payload),
            redirect: "follow"
        });
        return JSON.parse(await response.text());
    };
    
    if (loginSubtitle) loginSubtitle.innerHTML = '<span class="loader"></span> Conectando...';
    
    var shopId = resolvedShopId;
    
    
    if (shopId) {
        var pinContainer = document.getElementById('pinContainer');
        var loginSubtitle = document.getElementById('loginSubtitle');
        if (pinContainer) pinContainer.style.display = 'none';
        if (loginSubtitle) loginSubtitle.innerHTML = '<span class="loader"></span> Sincronizando Motor...';

        try {
            var res = await NexusCore.ejecutar('getInitData');
            console.log(">>> Respuesta del Master:", res);
            
            if (res.success) {
                if (res.pedidos) appData.pedidos = res.pedidos;
                if (res.productos) appData.productos = res.productos;
                if (res.cupones) appData.cupones = res.cupones;
                if (res.config) appData.config = res.config;
                var tieneNombre = res.config && res.config.Nombre_Tienda && res.config.Nombre_Tienda.trim() !== "";
                var tieneProductos = res.productos && res.productos.length > 0;
                
                console.log(">>> Tiene Nombre:", tieneNombre);
                console.log(">>> Tiene Productos:", tieneProductos);
                
                // La tienda existe si tiene productos O tiene nombre
                var tiendaExiste = tieneNombre || tieneProductos;
                
                if (!tiendaExiste) {
                    // No tiene nombre ni productos - mostrar wizard
                    document.getElementById("loginSection").style.display = "none";
                    toggleModal('modalWizard', true);
                    return;
                }

                // La tienda existe - pedir PIN
                currentPin = String(res.config.PIN_Acceso || "1234");
                
                var loginSubtitle = document.getElementById('loginSubtitle');
                if (loginSubtitle) loginSubtitle.innerText = "SISTEMA LISTO";
                
                var pinContainer = document.getElementById("pinContainer");
                if (pinContainer) {
                    pinContainer.style.display = "block";
                    pinContainer.classList.add("animate-scale-in");
                }
                var input = document.getElementById("pinInput");
                if (input) {
                    input.disabled = false;
                    input.classList.remove('opacity-50');
                    input.focus();
                }

                if (localStorage.getItem("nx_session") === "valid") {
                    initPreloaded();
                }
            } else {
                throw new Error(res.message || "ID Inválido");
            }
        } catch(e) {
            console.log(">>> Error de conexión:", e.message);
            NexusDialog.alert("Error de Conexión con el Servidor: " + e.message, "Error");
            var loginSubtitle = document.getElementById('loginSubtitle');
            if (loginSubtitle) loginSubtitle.innerText = "ERROR DE CONEXIÓN";
        }
    } else {
        NexusDialog.alert("No se encontró el ID. Agrega la tienda en SHOP_MAPPING de config.js", "Error");
    }
};

// ==========================================
// LOGIN Y SEGURIDAD
// ==========================================
const pinInput = document.getElementById("pinInput");
pinInput.addEventListener("input", () => {
    if (isPinBlocked()) {
        const mins = getBlockTimeRemaining();
        pinInput.disabled = true;
        const errorMsg = document.getElementById("loginError");
        const container = document.getElementById("loginErrorContainer");
        const supportBtn = document.getElementById("supportBtn");
        container.classList.remove("hidden");
        errorMsg.innerText = `Bloqueado. Intenta en ${mins} min.`;
        supportBtn.href = `https://wa.me/${telefonoSoporte}?text=Bloqueé mi panel.`;
        supportBtn.classList.remove("hidden");
        return;
    }
    if (pinInput.value.length === 4) {
        if (pinInput.value === currentPin) {
            resetPinAttempts();
            localStorage.setItem("nx_session", "valid");
            initPreloaded();
        } else {
            incrementPinAttempts();
            const container = document.getElementById("loginErrorContainer");
            const errorMsg = document.getElementById("loginError");
            const supportBtn = document.getElementById("supportBtn");
            container.classList.remove("hidden");

            if (getPinAttempts().count >= 5) {
                blockPin(30);
                pinInput.disabled = true;
                errorMsg.innerText = "Panel bloqueado por 30 min.";
                supportBtn.href = `https://wa.me/${telefonoSoporte}?text=Hola, bloqueé mi panel.`;
                supportBtn.classList.remove("hidden");
                document.getElementById("loginHint").classList.add("hidden");
            } else {
                errorMsg.innerText = `PIN Incorrecto (${getPinAttempts().count}/5)`;
                pinInput.value = "";
                setTimeout(() => {
                    if (getPinAttempts().count < 5) container.classList.add("hidden");
                }, 2500);
            }
        }
    }
});

function logout(msg = null) {
    clearInterval(pollingInterval);
    clearTimeout(inactivityTimer);
    localStorage.removeItem("nx_session");
    if (msg) {
        alert(msg);
    }
    location.reload();
}

// ==========================================
// INIT TRAS LOGIN EXITOSO
// ==========================================
function initPreloaded() {
    if (!appData || !appData.config) {
        console.log(">>> initPreloaded: No hay appData, solicitando...");
        NexusCore.ejecutar('getInitData').then(function(res) {
            if (res.success) {
                if (res.pedidos) appData.pedidos = res.pedidos;
                if (res.productos) appData.productos = res.productos;
                if (res.cupones) appData.cupones = res.cupones;
                if (res.config) appData.config = res.config;
                dbConfig = res.config || {};
                dbProductos = res.productos || [];
                dbCupones = res.cupones || [];
                cargarPanel();
            }
        });
        return;
    }
    cargarPanel();
}

function cargarPanel() {
    poblarDashboard();
    if (typeof calcularInventario === 'function') calcularInventario();
    if (typeof renderizarProductosAdmin === 'function') renderizarProductosAdmin();
    if (typeof renderizarCupones === 'function') renderizarCupones();
    
    var loginSection = document.getElementById('loginSection');
    var adminContent = document.getElementById('adminContent');
    if (loginSection) loginSection.style.display = 'none';
    if (adminContent) adminContent.style.display = 'block';
    
    // Cargar analytics automáticamente
    if (typeof loadAnalyticsData === 'function') {
        loadAnalyticsData('semana');
    }
    
    // Cargar pedidos solo después de tener datos
    if (typeof renderPedidos === 'function') {
        NexusCore.ejecutar('getInitData').then(function(res) {
            if (res && res.success) {
                if (res.pedidos) appData.pedidos = res.pedidos;
                if (res.productos) appData.productos = res.productos;
                if (res.cupones) appData.cupones = res.cupones;
                if (res.config) appData.config = res.config;
            }
            renderPedidos();
        });
    }
    
    // Mostrar analytics por defecto al iniciar
    if (typeof switchTab === 'function') {
        setTimeout(function() { switchTab('analytics'); }, 100);
    }
    
    // Iniciar polling para nuevos pedidos
    iniciarPollingPedidos();
}

function iniciarPollingPedidos() {
    if (pollingInterval) clearInterval(pollingInterval);
    
    var lastPedidoCount = appData.pedidos ? appData.pedidos.length : 0;
    
    // Verificación inmediata al iniciar (sin esperar el intervalo)
    (async function() {
        try {
            var res = await NexusCore.ejecutar('getInitData');
            if (res && res.success) {
                var pedidos = res.pedidos || [];
                var nuevoCount = pedidos.length;
                if (nuevoCount > lastPedidoCount) {
                    var nuevosPedidos = pedidos.slice(0, nuevoCount - lastPedidoCount);
                    appData.pedidos = pedidos;
                    if (nuevosPedidos.length > 0) {
                        showOrderNotification(nuevosPedidos[0]);
                        playNotificationSound();
                        vibrateDevice();
                    }
                    renderPedidos();
                }
            }
        } catch(e) {}
    })();
    
    pollingInterval = setInterval(async function() {
        // Reducir tiempo de espera de 15s a 5s para notificaciones más rápidas
        try {
            var res = await NexusCore.ejecutar('getInitData');
            if (res && res.success) {
                var pedidos = res.pedidos || [];
                var nuevoCount = pedidos.length;
                if (nuevoCount > lastPedidoCount) {
                    // Hay nuevos pedidos
                    var nuevosPedidos = pedidos.slice(0, nuevoCount - lastPedidoCount);
                    appData.pedidos = pedidos;
                    
                    // Mostrar notificación del nuevo pedido
                    if (nuevosPedidos.length > 0) {
                        var ultimo = nuevosPedidos[0];
                        showOrderNotification(ultimo);
                        playNotificationSound();
                        vibrateDevice();
                    }
                    
                    // Actualizar vista si está en pestaña pedidos
                    var pedidosView = document.getElementById('view-pedidos');
                    if (pedidosView && !pedidosView.classList.contains('hidden')) {
                        renderPedidos();
                    }
                    
                    lastPedidoCount = nuevoCount;
                }
            }
        } catch(e) {
            console.log("Polling pedidos:", e.message);
        }
    }, 5000); // Cada 5 segundos para notificaciones más rápidas
}

// ==========================================
// DASHBOARD
// ==========================================
function poblarDashboard() {
    const cfg = appData && appData.config ? appData.config : {};

    // Validar que los elementos existan antes de asignarles texto
    const displayTienda = document.getElementById("displayTienda");
    if (displayTienda) {
        displayTienda.innerText = cfg.Nombre_Tienda || "Mi Tienda";
    }

    document.title = `Panel - ${cfg.Nombre_Tienda || "Nexus Pro"}`;

    if (cfg.Color_Primario) {
        document.documentElement.style.setProperty('--primary', cfg.Color_Primario);
    }
}

// ==========================================
// INVENTARIO DINÁMICO
// ==========================================
function calcularInventario() {
    var productos = appData.productos || [];
    var totalProductos = productos.length;
    var stockTotal = 0;
    var inversion = 0;
    var gananciaPotencial = 0;
    var valorInventario = 0;
    var agotados = 0;
    
    for (var i = 0; i < productos.length; i++) {
        var p = productos[i];
        var stock = Number(p.stock) || 0;
        var costo = Number(p.costo) || 0;
        var precio = Number(p.precio) || 0;
        
        stockTotal += stock;
        inversion += costo * stock;
        valorInventario += precio * stock;
        gananciaPotencial += (precio - costo) * stock;
        if (stock <= 0) agotados++;
    }

    var publicados = 0;
    for (var i = 0; i < productos.length; i++) {
        if (productos[i].estado === 'Publicado') publicados++;
    }

    return {
        totalProductos: totalProductos,
        stockTotal: stockTotal,
        inversion: inversion,
        gananciaPotencial: gananciaPotencial,
        valorInventario: valorInventario,
        agotados: agotados
    };
}

// Helper: Dominican number format (1,234.56)
function formatRD(num) {
    var n = Number(num) || 0;
    var parts = n.toFixed(2).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function renderizarResumenInventario() {
    var data = calcularInventario();

    $text('invTotalProductos', data.totalProductos);
    $text('invStockTotal', data.stockTotal);
    $text('invInversion', "RD$ " + formatRD(data.inversion));
    $text('invGanancia', "RD$ " + formatRD(data.gananciaPotencial));
    $text('invValor', "RD$ " + formatRD(data.valorInventario));
    $text('invAgotados', data.agotados);
}

// ==========================================
// PRODUCTOS
// ==========================================
function isProductNew(fechaCreacion) {
    if (!fechaCreacion) return false;
    const creado = new Date(fechaCreacion);
    const ahora = new Date();
    const dias = (ahora - creado) / (1000 * 60 * 60 * 24);
    return dias < 7;
}

function getProductTags(p) {
    const tags = [];
    if (isProductNew(p.fecha_creacion)) tags.push({ label: 'Nuevo', class: 'bg-emerald-100 text-emerald-700' });
    if (Number(p.stock) <= 0) tags.push({ label: 'Agotado', class: 'bg-rose-100 text-rose-700' });
    else if (Number(p.stock) < 5) tags.push({ label: 'Stock Bajo', class: 'bg-amber-100 text-amber-700' });
    const cupon = appData.cupones?.find(c => c.producto_id == p.id && c.activo === 'Sí');
    if (cupon) {
        if (cupon.descuento_tipo === 'gratis') tags.push({ label: '🎁 Regalo', class: 'bg-purple-100 text-purple-700' });
        else if (cupon.descuento_tipo === 'porcentaje') tags.push({ label: 'Oferta', class: 'bg-rose-100 text-rose-700' });
    }
    return tags;
}
function renderProductos() {
    const container = document.getElementById("listaProductos");
    if (container) {
        container.innerHTML = '<div class="text-center p-10 text-slate-400"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div><p class="text-xs font-bold">Cargando productos...</p></div>';
    }
    
    renderizarResumenInventario();

    // ─── OBTENER CATEGORÍAS DE CONFIG + PRODUCTOS ───
    // 1. Categorías definidas en Configuración (onboarding / ajustes)
    let configCats = [];
    var catsConfigStr = appData.config ? appData.config.Categorias_Lista : "";
    console.log(">>> Categorías config:", catsConfigStr);
    
    if (catsConfigStr) {
        // Soportar tanto comas como pipes como separadores
        configCats = catsConfigStr.split(/[,\|]/)
            .map(c => c.trim())
            .filter(c => c.length > 0);
    }

    // 2. Categorías que ya usan los productos existentes
    const productCats = [...new Set((appData.productos || []).map(p => p.categoria || '').filter(c => c.trim().length > 0))];
    console.log(">>> Categorías productos:", productCats);

    // 3. Unir ambas listas sin duplicados, manteniendo el orden: config primero
    const cats = [...new Set([...configCats, ...productCats])];

    // Si no hay ninguna, fallback a General
    const allCats = cats.length > 0 ? cats : ['General'];

    // ─── LLENAR SELECTS ───
    const select = document.getElementById("categoryFilter");
    select.innerHTML = `<option value="Todas">📂 Todas las Categorías</option>` +
        allCats.map(c => `<option value="${c}">${c}</option>`).join("");

    const pSelect = document.getElementById("pCategoria");
    const editSelect = document.getElementById("editCategoria");
    const catOptions = allCats.map(c => `<option value="${c}">${c}</option>`).join("");
    pSelect.innerHTML = catOptions;
    editSelect.innerHTML = catOptions;

    applyFilters();
}

function applyFilters() {

    var lista = appData.productos || [];
    var container = document.getElementById("listaProductos");
    if (!container) return;

    if (lista.length === 0) {
        container.innerHTML = '<div class="text-center p-10 text-slate-400 font-bold text-xs uppercase border-2 border-dashed border-slate-200 rounded-3xl">Sin productos</div>';
        return;
    }

    var html = '';
    for (var i = 0; i < lista.length; i++) {
        var p = lista[i];
        var esPublicado = p.estado === "Publicado";
        var costo = Number(p.costo) || 0;
        var precio = Number(p.precio) || 0;
        var stock = Number(p.stock) || 0;
        var ganancia = precio - costo;
        var stockBajo = stock < 5 && stock > 0;

        html += '<div class="app-card p-4 flex gap-4 items-center" onclick="openEditModalInline(\'' + p.id + '\')">';
        html += '<img src="' + (p.imagen || 'https://cdn-icons-png.flaticon.com/512/685/685655.png') + '" class="w-16 h-16 rounded-2xl object-cover bg-slate-100 flex-shrink-0" onerror="this.src=\'https://cdn-icons-png.flaticon.com/512/685/685655.png\'">';
        html += '<div class="flex-1 min-w-0">';
        html += '<div class="flex justify-between items-start gap-2">';
        html += '<p class="font-black text-slate-800 text-sm truncate">' + p.nombre + '</p>';
        html += '<span class="status-pill flex-shrink-0 ' + (esPublicado ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500') + '">';
        html += esPublicado ? '✅ Pub' : '📁 Arch';
        html += '</span></div>';
        html += '<p class="text-[10px] text-slate-400 font-bold uppercase mt-0.5">' + (p.categoria || 'General') + '</p>';
        html += '<div class="flex gap-3 mt-2 flex-wrap">';
        html += '<span class="text-xs font-black text-emerald-600">RD$ ' + formatRD(precio) + '</span>';
        html += '<span class="text-[10px] ' + (stockBajo ? 'text-amber-600 font-bold' : 'text-slate-400 font-bold') + '">Stock: ' + stock + '</span>';
        html += '<span class="text-[10px] ' + (ganancia >= 0 ? 'text-emerald-500' : 'text-rose-500') + ' font-bold">Gan: RD$ ' + formatRD(ganancia) + '</span>';
        html += '</div></div>';
        html += '<div class="flex flex-col gap-2">';
        html += '<button onclick="event.stopPropagation(); duplicarProducto(\'' + p.id + '\')" class="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl text-[9px] font-black uppercase">📋 Dup</button>';
        html += '<button onclick="event.stopPropagation(); openEditModalInline(\'' + p.id + '\')" class="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl text-[9px] font-black uppercase">Editar</button>';
        html += '<button onclick="event.stopPropagation(); eliminarProducto(\'' + p.id + '\')" class="bg-rose-50 text-rose-500 px-3 py-2 rounded-xl text-[9px] font-black uppercase">Borrar</button>';
        html += '</div></div>';
}
    container.innerHTML = html;
    
    
}

// ==========================================
// MODAL EDITAR PRODUCTO (INLINE)
// ==========================================
function openEditModalInline(id) {
    var p = null;
    for (var i = 0; i < appData.productos.length; i++) {
        if (appData.productos[i].id == id) {
            p = appData.productos[i];
            break;
        }
    }
    if(!p) return;

    document.getElementById("editProductId").value = p.id || "";
    document.getElementById("editNombre").value = p.nombre || "";
    document.getElementById("editCategoria").value = p.categoria || "General";
    document.getElementById("editPrecio").value = p.precio || "";
    document.getElementById("editCosto").value = p.costo || "";
    document.getElementById("editStock").value = p.stock || 0;
    document.getElementById("editEstado").value = p.estado || "Publicado";
    document.getElementById("editDetalle").value = p.detalle || "";
    var editPreview = document.getElementById("editPreview");
    if (editPreview) editPreview.src = p.imagen || "https://cdn-icons-png.flaticon.com/512/685/685655.png";
    document.getElementById("editFileInput").value = "";

    // Buscar cupón asociado
    var cupon = null;
    if (appData.cupones) {
        for (var i = 0; i < appData.cupones.length; i++) {
            if (appData.cupones[i].producto_id == p.id && appData.cupones[i].activo === 'Sí') {
                cupon = appData.cupones[i];
                break;
            }
        }
    }
    var hasCouponCheck = document.getElementById("editHasCoupon");
    var couponFields = document.getElementById("editCouponFields");

    if(cupon) {
        hasCouponCheck.checked = true;
        couponFields.style.display = 'block';
        document.getElementById("editCouponId").value = cupon.id || '';
        document.getElementById("editCouponCode").value = cupon.codigo || '';
        document.getElementById("editCouponType").value = cupon.descuento_tipo || 'porcentaje';
        document.getElementById("editCouponValue").value = cupon.descuento_valor || '';
        document.getElementById("editCouponMessage").value = cupon.mensaje_sorpresa || '';
        document.getElementById("editCouponSection").classList.add('active');
    } else {
        hasCouponCheck.checked = false;
        couponFields.style.display = 'none';
        document.getElementById("editCouponId").value = '';
        document.getElementById("editCouponCode").value = '';
        document.getElementById("editCouponType").value = 'porcentaje';
        document.getElementById("editCouponValue").value = '';
        document.getElementById("editCouponMessage").value = '';
        document.getElementById("editCouponSection").classList.remove('active');
    }

    document.getElementById("modalEditProduct").classList.add("open");
}

function closeEditModal() {
    document.getElementById("modalEditProduct").classList.remove("open");
}

function toggleEditCouponSection() {
    const checked = document.getElementById("editHasCoupon").checked;
    document.getElementById("editCouponFields").style.display = checked ? 'block' : 'none';
    document.getElementById("editCouponSection").classList.toggle('active', checked);
}

function generateEditRandomCoupon() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for(let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById("editCouponCode").value = code;
}

function previewEditImg(e) {
    const f = e.target.files[0];
    if (f) document.getElementById("editPreview").src = URL.createObjectURL(f);
}

async function guardarEdicionProducto() {
    const id      = document.getElementById("editProductId").value;
    const nombre  = document.getElementById("editNombre").value.trim();
    const precio  = document.getElementById("editPrecio").value;
    const costo   = document.getElementById("editCosto").value;
    const stock   = document.getElementById("editStock").value;
    const estado  = document.getElementById("editEstado").value;
    const detalle = document.getElementById("editDetalle").value.trim();
    const cat     = document.getElementById("editCategoria").value;
    const file    = document.getElementById("editFileInput").files[0];

    // Datos del cupón
    const hasCoupon = document.getElementById("editHasCoupon").checked;
    const couponId = document.getElementById("editCouponId").value;
    const couponCode = document.getElementById("editCouponCode").value.trim().toUpperCase();
    const couponType = document.getElementById("editCouponType").value;
    const couponValue = document.getElementById("editCouponValue").value;
    const couponMessage = document.getElementById("editCouponMessage").value.trim();

    if (!nombre || !precio || stock === "") {
        return NexusDialog.alert("Nombre, precio y stock son obligatorios.", "Campos vacíos");
    }

    const btn = document.getElementById("btnSaveEditProduct");
    if (btn) { 
        btn.innerHTML = '<span class="animate-spin mr-2">⟳</span> Guardando...'; 
        btn.disabled = true; 
        btn.classList.add('opacity-75');
    }

    var editPreview = document.getElementById("editPreview");
    let imagen = editPreview ? editPreview.src : "https://cdn-icons-png.flaticon.com/512/685/685655.png";
    if (file) {
        imagen = await NexusCore.archivoABase64(file);
    }

    const datos  = { id, nombre, precio, costo, stock, estado, detalle, categoria: cat, imagen };

    // Agregar datos de cupón si aplica
    if(hasCoupon && couponCode) {
        datos.cupon = {
            id: couponId || null,
            codigo: couponCode,
            tipo: 'producto',
            descuento_tipo: couponType,
            descuento_valor: couponValue,
            mensaje_sorpresa: couponMessage,
            producto_id: id,
            activo: 'Sí'
        };
    }

    const res = await NexusCore.ejecutar('updateProduct', datos);

    if (res.success) {
        const refreshData = await NexusCore.ejecutar('getInitData');
        if (refreshData.success) {
            appData = refreshData;
            poblarDashboard();
            renderProductos();
        }
        closeEditModal();
        $text("successMessage", "Producto actualizado.");
        toggleModal("modalSuccess", true);
    } else {
        NexusDialog.alert(res.message || "Error al guardar.", "Error");
    }

    btn.innerText = "Guardar Cambios";
    btn.disabled = false;
}

// ==========================================
// GUARDAR PRODUCTO (AGREGAR)
// ==========================================
async function guardarProducto() {
    const id      = document.getElementById("editId").value;
    const nombre  = document.getElementById("pNombre").value.trim();
    const precio  = document.getElementById("pPrecio").value;
    const costo   = document.getElementById("pCosto").value;
    const stock   = document.getElementById("pStock").value;
    const estado  = document.getElementById("pEstado").value;
    const detalle = document.getElementById("pDetalle").value.trim();
    const cat     = document.getElementById("pCategoria").value;
    var fileInputEl = document.getElementById("fileInput");
    const file    = fileInputEl ? fileInputEl.files[0] : null;

    // Datos del cupón
    const hasCoupon = document.getElementById("hasCoupon").checked;
    const couponCode = document.getElementById("pCouponCode").value.trim().toUpperCase();
    const couponType = document.getElementById("pCouponType").value;
    const couponValue = document.getElementById("pCouponValue").value;
    const couponMessage = document.getElementById("pCouponMessage").value.trim();

    if (!nombre || !precio || stock === "") {
        return NexusDialog.alert("Nombre, precio y stock son obligatorios.", "Campos vacíos");
    }

    const btn = document.getElementById("btnSaveProduct");
    if (btn) {
        btn.innerHTML = '<span class="animate-spin mr-2">⟳</span> Guardando...';
        btn.disabled = true;
        btn.classList.add('opacity-75');
    }
    
    // Mostrar indicador visual en el modal
    var modalProduct = document.getElementById("modalProduct");
    if (modalProduct) {
        modalProduct.classList.add('relative');
        var loadingIndicator = document.getElementById('modalLoadingIndicator');
        if (!loadingIndicator) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'modalLoadingIndicator';
            loadingIndicator.className = 'absolute inset-0 bg-white/80 flex items-center justify-center z-50';
            loadingIndicator.innerHTML = '<div class="text-center"><div class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div><p class="mt-2 text-sm font-bold text-emerald-600">Guardando producto...</p></div>';
        }
        loadingIndicator.style.display = 'flex';
        modalProduct.appendChild(loadingIndicator);
    }

    var previewEl = document.getElementById("preview");
    let imagen = previewEl ? previewEl.src : "https://cdn-icons-png.flaticon.com/512/685/685655.png";
    if (file) {
        imagen = await NexusCore.archivoABase64(file);
    }
    
    // Asegurar que imagen tenga un valor válido
    if (!imagen || imagen === 'undefined' || imagen === 'null') {
        imagen = "https://cdn-icons-png.flaticon.com/512/685/685655.png";
    }

    const accion = id ? 'updateProduct' : 'addProduct';
    const datos  = { id: id || null, nombre, precio, costo, stock, estado, detalle, categoria: cat, imagen };
    
    console.log(">>> Guardando producto:", datos);

    // Agregar datos de cupón si aplica
    if(!id && hasCoupon && couponCode) {
        datos.cupon = {
            codigo: couponCode,
            tipo: 'producto',
            descuento_tipo: couponType,
            descuento_valor: couponValue,
            mensaje_sorpresa: couponMessage,
            activo: 'Sí'
        };
    }

    var res;
    try {
        res = await NexusCore.ejecutar(accion, datos);
        console.log(">>> Respuesta guardar:", res);
    } catch(e) {
        console.error(">>> Error guardar producto:", e);
        NexusDialog.alert("Error: " + e.message, "Error");
        if (btn) { btn.innerHTML = 'Guardar Producto'; btn.disabled = false; btn.classList.remove('opacity-75'); }
        var loadingIndicator = document.getElementById('modalLoadingIndicator');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        return;
    }

    if (res.success) {
        const refreshData = await NexusCore.ejecutar('getInitData');
        if (refreshData.success) {
            appData = refreshData;
            poblarDashboard();
            renderProductos();
        }
        toggleModal("modalProduct", false);
        $text("successMessage", id ? "Producto actualizado." : "Producto agregado.");
        toggleModal("modalSuccess", true);
    } else {
        NexusDialog.alert(res.message || "Error al guardar.", "Error");
    }

    if (btn) {
        btn.innerHTML = 'Guardar Producto';
        btn.disabled = false;
        btn.classList.remove('opacity-75');
    }
    
    // Ocultar indicador de carga
    var loadingIndicator = document.getElementById('modalLoadingIndicator');
    if (loadingIndicator) loadingIndicator.style.display = 'none';
}

// ==========================================
// ELIMINAR PRODUCTO
// ==========================================
async function eliminarProducto(id) {
    const confirmado = await NexusDialog.confirm("¿Estás seguro de que deseas eliminar este producto?", "Eliminar");
    if (!confirmado) return;

    const res = await NexusCore.ejecutar('deleteProduct', { id });
    if (res.success) {
        const refreshData = await NexusCore.ejecutar('getInitData');
        if (refreshData.success) {
            appData = refreshData;
            poblarDashboard();
            renderProductos();
        }
        $text("successMessage", "Producto eliminado.");
        toggleModal("modalSuccess", true);
    } else {
        NexusDialog.alert(res.message || "Error al eliminar.", "Error");
    }
}

// ==========================================
// DUPLICAR PRODUCTO
// ==========================================
async function duplicarProducto(id) {
    const original = appData.productos.find(p => p.id == id);
    if (!original) return;

    const btn = document.getElementById("btnSaveProduct");
    if (btn) { btn.innerText = "Duplicando..."; btn.disabled = true; }

    const datos = {
        nombre: original.nombre + " (Copia)",
        precio: original.precio,
        costo: original.costo,
        stock: original.stock,
        estado: "Archivado",
        detalle: original.detalle,
        categoria: original.categoria,
        imagen: original.imagen || "https://cdn-icons-png.flaticon.com/512/685/685655.png"
    };

    const res = await NexusCore.ejecutar('addProduct', datos);

    if (res.success) {
        const refreshData = await NexusCore.ejecutar('getInitData');
        if (refreshData.success) {
            appData = refreshData;
            renderProductos();
        }
        $text("successMessage", "Producto duplicado.");
        toggleModal("modalSuccess", true);
    }

    if (btn) { btn.innerText = "Guardar Producto"; btn.disabled = false; }
}

// ==========================================
// PREVIEW CATÁLOGO
// ==========================================
function openCatalogPreview() {
    const shopId = NEXUS_CONFIG.getShopId();
    if (shopId) {
        window.open('/?preview=' + shopId, '_blank');
    }
}

// ==========================================
// CUPONES
// ==========================================
function renderCupones() {
    const container = document.getElementById("listaCupones");
    if (!container) return;
    
    // Mostrar indicador de carga
    container.innerHTML = '<div class="text-center p-10 text-slate-400"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div><p class="text-xs font-bold">Cargando cupones...</p></div>';
    
    const cupones = appData.cupones || [];

    if(cupones.length === 0) {
        container.innerHTML = `<div class="text-center p-10 text-slate-400 font-bold text-xs uppercase border-2 border-dashed border-slate-200 rounded-3xl">Sin cupones creados</div>`;
        return;
    }

    container.innerHTML = cupones.map(c => {
        const tipoLabel = c.tipo === 'descuento' ? '📉 Descuento' : c.tipo === 'giftcard' ? '🎁 Gift Card' : c.tipo === 'producto' ? '🎟️ Producto' : c.tipo === 'regalo_unico' ? '🎁 Regalo Único' : 'Cupón';
        const descLabel = c.descuento_tipo === 'porcentaje' ? `${c.descuento_valor}%` : c.descuento_tipo === 'gratis' ? 'GRATIS' : `RD$ ${Number(c.descuento_valor).toLocaleString()}`;
        const activoClass = c.activo === 'Sí' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500';
        const activoText = c.activo === 'Sí' ? 'Activo' : 'Inactivo';
        const isRegaloUnico = c.tipo === 'regalo_unico';

        return `
        <div class="app-card p-4 flex gap-4 items-center">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-lg flex-shrink-0">
                ${isRegaloUnico ? '🎁' : '🎟️'}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start gap-2">
                    <p class="font-black text-slate-800 text-sm truncate">${c.nombre || c.codigo}</p>
                    <span class="status-pill flex-shrink-0 ${activoClass}">${activoText}</span>
                </div>
                <p class="text-[10px] text-slate-400 font-bold uppercase mt-0.5">${tipoLabel}</p>
                <div class="flex gap-3 mt-2 flex-wrap">
                    <span class="text-xs font-black text-emerald-600">${c.codigo}</span>
                    <span class="text-[10px] text-slate-400 font-bold">${descLabel}</span>
                    ${c.usos !== undefined ? `<span class="text-[10px] text-slate-400 font-bold">Usos: ${c.usos}</span>` : ''}
                    ${isRegaloUnico ? `<span class="text-[9px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-lg">🔒 Auto-dest.</span>` : ''}
                </div>
            </div>
            <div class="flex flex-col gap-2">
                <button onclick="toggleCuponEstado('${c.id}')" class="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl text-[9px] font-black uppercase">${c.activo === 'Sí' ? 'Desact.' : 'Activar'}</button>
                <button onclick="eliminarCupon('${c.id}')" class="bg-rose-50 text-rose-500 px-3 py-2 rounded-xl text-[9px] font-black uppercase">Borrar</button>
            </div>
        </div>`;
    }).join("");
}

function openCouponModal() {
    // Limpiar campos
    document.getElementById("couponCode").value = '';
    document.getElementById("couponNombre").value = '';
    document.getElementById("couponValue").value = '';
    document.getElementById("couponLimit").value = '';
    document.getElementById("couponMensaje").value = '';
    
    var prodSelect = document.getElementById("couponProducto");
    if (prodSelect) prodSelect.innerHTML = '<option value="">Seleccionar producto...</option>';
    
    var prodId = document.getElementById("couponProductoId");
    if (prodId) prodId.value = '';
    
    document.getElementById("couponType").value = 'descuento';
    
    var busq = document.getElementById("buscadorProducto");
    if (busq) busq.value = '';
    
    var divSel = document.getElementById("productoSeleccionado");
    if (divSel) divSel.style.display = 'none';
    
    // Ocultar campos de regalo único
    var fields = document.getElementById("regaloUnicoFields");
    if (fields) fields.style.display = 'none';
    
    // Establecer tipo por defecto
    setCouponType('descuento');
    
    // Mostrar modal
    document.getElementById("modalCoupon").classList.add('open');
}

function setCouponType(type) {
    
    
    // 1. Cambiar el valor oculto
    var couponTypeInput = document.getElementById("couponType");
    if (couponTypeInput) couponTypeInput.value = type;
    
    // 2. Actualizar estilos de botones
    var btnDesc = document.getElementById("btnCouponDescuento");
    var btnGift = document.getElementById("btnCouponGiftcard");
    var btnRegalo = document.getElementById("btnCouponRegaloUnico");
    
    if (btnDesc) btnDesc.className = type === 'descuento' ? 'flex-1 p-3 rounded-xl text-[10px] font-black uppercase border-2 border-emerald-500 bg-emerald-50 text-emerald-700' : 'flex-1 p-3 rounded-xl text-[10px] font-black uppercase border-2 border-slate-200 text-slate-500';
    if (btnGift) btnGift.className = type === 'giftcard' ? 'flex-1 p-3 rounded-xl text-[10px] font-black uppercase border-2 border-emerald-500 bg-emerald-50 text-emerald-700' : 'flex-1 p-3 rounded-xl text-[10px] font-black uppercase border-2 border-slate-200 text-slate-500';
    if (btnRegalo) btnRegalo.className = type === 'regalo_unico' ? 'flex-1 p-3 rounded-xl text-[10px] font-black uppercase border-2 border-purple-500 bg-purple-50 text-purple-700' : 'flex-1 p-3 rounded-xl text-[10px] font-black uppercase border-2 border-slate-200 text-slate-500';
    
    // 3. Campos de descuento - ocultar si es regalo
    var discountField = document.getElementById("couponDiscountType");
    var valueField = document.getElementById("couponValue");
    var limitField = document.getElementById("couponLimit");
    
    if (discountField) discountField.style.display = type === 'regalo_unico' ? 'none' : '';
    if (valueField) valueField.style.display = type === 'regalo_unico' ? 'none' : '';
    if (limitField) limitField.style.display = type === 'regalo_unico' ? 'none' : '';
    
    // 4. Campos de regalo único
    var fields = document.getElementById("regaloUnicoFields");
    if (fields) {
        if (type === "regalo_unico") {
            fields.style.display = "block";
        } else {
            fields.style.display = "none";
        }
    }
    
    // 5. Llenar productos si es regalo único
    if (type === "regalo_unico") {
        var select = document.getElementById("couponProducto");
        if (select && appData && appData.productos) {
            var publicados = appData.productos.filter(function(p) { 
                return p.estado && (p.estado.toLowerCase() === "publicado" || p.estado === "Publicado" || p.estado === "pub");
            });
            select.innerHTML = '<option value="">Seleccionar producto...</option>';
            if (publicados.length === 0) {
                // Si no hay publicados, mostrar todos los productos
                select.innerHTML = '<option value="">Todos los productos (sin publicados)</option>';
                appData.productos.forEach(function(p) {
                    select.innerHTML += '<option value="' + p.id + '">' + p.nombre + ' - RD$' + Number(p.precio).toLocaleString() + '</option>';
                });
            } else {
                publicados.forEach(function(p) {
                    select.innerHTML += '<option value="' + p.id + '">' + p.nombre + ' - RD$' + Number(p.precio).toLocaleString() + '</option>';
                });
            }
        } else {
            // Si no hay appData, mostrar mensaje
            var select = document.getElementById("couponProducto");
            if (select) {
                select.innerHTML = '<option value="">Cargando productos...</option>';
            }
        }
    }
}

function setCouponTypeEdit(type) {
    document.getElementById("editCouponType").value = type;
    var discountRow = document.getElementById("editCouponDiscountType")?.parentElement;
    var valueInput = document.getElementById("editCouponValue");
    
    if (discountRow) discountRow.style.display = type === 'regalo_unico' ? 'none' : 'block';
    if (valueInput) valueInput.style.display = type === 'regalo_unico' ? 'none' : 'block';
}

function llenarProductosRegalo() {
    var select = document.getElementById("couponProducto");
    if (!select) return;
    
    var prods = appData.productos?.filter(p => p.estado === "Publicado") || [];
    select.innerHTML = '<option value="">🔍 Busca un producto arriba...</option>';
    
    prods.forEach(function(p) {
        select.innerHTML += '<option value="' + p.id + '">' + p.nombre + ' - RD$' + Number(p.precio).toLocaleString() + '</option>';
    });
}

function filtrarProductosRegalo() {
    var input = document.getElementById("buscadorProducto");
    var select = document.getElementById("couponProducto");
    if (!input || !select) return;
    
    var term = input.value.toLowerCase();
    var prods = appData.productos?.filter(p => p.estado === "Publicado" && (p.nombre || '').toLowerCase().includes(term)) || [];
    
    select.innerHTML = '<option value="">🔍 Selecciona un producto...</option>';
    prods.forEach(function(p) {
        select.innerHTML += '<option value="' + p.id + '">' + p.nombre + ' - RD$' + Number(p.precio).toLocaleString() + '</option>';
    });
}

function seleccionarProductoRegalo() {
    var select = document.getElementById("couponProducto");
    var hiddenId = document.getElementById("couponProductoId");
    var nombreSel = document.getElementById("nombreProductoSeleccionado");
    var divSel = document.getElementById("productoSeleccionado");
    if (!select) return;
    
    var prodId = select.value;
    if (prodId) {
        var prod = appData.productos?.find(p => p.id === prodId);
        if (prod && hiddenId) hiddenId.value = prodId;
        if (prod && nombreSel) nombreSel.innerText = prod.nombre + ' - RD$' + Number(prod.precio).toLocaleString();
        if (divSel) divSel.classList.remove("hidden");
    } else {
        if (hiddenId) hiddenId.value = '';
        if (divSel) divSel.classList.add("hidden");
    }
}

function generateCouponCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for(let i = 0; i < 10; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById("couponCode").value = code;
}

async function guardarCupón() {
    const tipo = document.getElementById("couponType").value;
    const codigo = document.getElementById("couponCode").value.trim().toUpperCase();
    const nombre = document.getElementById("couponNombre").value.trim();
    const descuento_tipo = document.getElementById("couponDiscountType")?.value || 'porcentaje';
    const descuento_valor = document.getElementById("couponValue")?.value || 0;
    const limite = document.getElementById("couponLimit")?.value || 0;

    // Regalo Único validation
    if (tipo === 'regalo_unico') {
        const productoId = document.getElementById("couponProductoId")?.value;
        const mensaje = document.getElementById("couponMensaje")?.value.trim();
        
        if (!codigo) {
            return NexusDialog.alert("El código del cupón es obligatorio.", "Campos vacíos");
        }
        
        if (!productoId) {
            return NexusDialog.alert("Debes seleccionar un producto para el Regalo Único.", "Producto requerido");
        }

        const btn = document.getElementById("btnSaveCoupon");
        btn.innerText = "Creando...";
        btn.disabled = true;

        const datos = {
            codigo,
            nombre: nombre || codigo,
            tipo: 'regalo_unico',
            descuento_tipo: 'gratis',
            descuento_valor: 0,
            producto_id: productoId,
            mensaje_sorpresa: mensaje || '',
            limite_usos: 1,
            activo: 'Si'
        };

        const res = await NexusCore.ejecutar('addCoupon', datos);

        if(res.success) {
            const refreshData = await NexusCore.ejecutar('getInitData');
            if(refreshData.success) {
                appData = refreshData;
                renderCupones();
            }
            toggleModal("modalCoupon", false);
            $text("successMessage", "Cupón Regalo Único creado.");
            toggleModal("modalSuccess", true);
        } else {
            NexusDialog.alert(res.message || "Error al crear cupón.", "Error");
        }

        btn.innerText = "Crear Cupón";
        btn.disabled = false;
        return;
    }

    if(!codigo || !descuento_valor) {
        return NexusDialog.alert("Código y valor de descuento son obligatorios.", "Campos vacíos");
    }

    const btn = document.getElementById("btnSaveCoupon");
    btn.innerText = "Creando...";
    btn.disabled = true;

    const datos = {
        codigo,
        nombre: nombre || codigo,
        tipo,
        descuento_tipo,
        descuento_valor,
        limite_usos: limite || 0,
        activo: 'Sí'
    };

    const res = await NexusCore.ejecutar('addCoupon', datos);

    if(res.success) {
        const refreshData = await NexusCore.ejecutar('getInitData');
        if(refreshData.success) {
            appData = refreshData;
            renderCupones();
        }
        toggleModal("modalCoupon", false);
        $text("successMessage", "Cupón creado exitosamente.");
        toggleModal("modalSuccess", true);
    } else {
        NexusDialog.alert(res.message || "Error al crear cupón.", "Error");
    }

    btn.innerText = "Crear Cupón";
    btn.disabled = false;
}

async function toggleCuponEstado(id) {
    const cupon = appData.cupones.find(c => c.id == id);
    if(!cupon) return;

    const nuevoEstado = cupon.activo === 'Sí' ? 'No' : 'Sí';
    const res = await NexusCore.ejecutar('updateCoupon', { id, activo: nuevoEstado });

    if(res.success) {
        const refreshData = await NexusCore.ejecutar('getInitData');
        if(refreshData.success) {
            appData = refreshData;
            renderCupones();
        }
    }
}

async function eliminarCupon(id) {
    const confirmado = await NexusDialog.confirm("¿Eliminar este cupón?", "Confirmar");
    if(!confirmado) return;

    const res = await NexusCore.ejecutar('deleteCoupon', { id });
    if(res.success) {
        const refreshData = await NexusCore.ejecutar('getInitData');
        if(refreshData.success) {
            appData = refreshData;
            renderCupones();
        }
        $text("successMessage", "Cupón eliminado.");
        toggleModal("modalSuccess", true);
    }
}

// ==========================================
// PEDIDOS
// ==========================================
function setOrderFilter(filtro) {
    currentOrderFilter = filtro;
    document.querySelectorAll('#orderFilters button').forEach(b => {
        b.className = "whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-500";
    });
    document.getElementById(`filter-${filtro}`).className =
        "whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase bg-slate-800 text-white shadow-md";
    if (appData && appData.pedidos && appData.pedidos.length > 0) {
        renderPedidos();
    } else {
        NexusCore.ejecutar('getInitData').then(function(res) {
            if (res && res.success) {
                if (res.pedidos) appData.pedidos = res.pedidos;
                if (res.productos) appData.productos = res.productos;
                if (res.cupones) appData.cupones = res.cupones;
                if (res.config) appData.config = res.config;
            }
            renderPedidos();
        });
    }
}

function renderPedidos() {
    console.log(">>> renderPedidos llamado, appData:", appData);
    const container = document.getElementById("listaPedidos");
    
    if (!container) {
        console.log(">>> Contenedor listaPedidos no encontrado");
        return;
    }
    
    // Mostrar indicador de carga
    container.innerHTML = '<div class="text-center p-10 text-slate-400"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div><p class="text-xs font-bold">Cargando pedidos...</p></div>';
    
    if (!appData) {
        console.log(">>> appData no existe");
        container.innerHTML = '<div class="text-center p-10 text-slate-400">No hay datos</div>';
        return;
    }
    
    console.log(">>> Pedidos:", appData.pedidos);
    
    const counts = {
        'Todos':      appData.pedidos?.length || 0,
        'Pendiente':  appData.pedidos?.filter(p => p.estado === 'Pendiente').length  || 0,
        'Confirmado': appData.pedidos?.filter(p => p.estado === 'Confirmado').length || 0,
        'Cancelado':  appData.pedidos?.filter(p => p.estado === 'Cancelado').length  || 0,
    };

    $text('filter-Todos', `Todos (${counts['Todos']})`);
    $text('filter-Pendiente', `Pendientes (${counts['Pendiente']})`);
    $text('filter-Confirmado', `Cobrados (${counts['Confirmado']})`);
    $text('filter-Cancelado', `Rechazados (${counts['Cancelado']})`);

    if (!appData.pedidos || appData.pedidos.length === 0) {
        container.innerHTML = `<div class="text-center p-10 text-slate-400 font-bold text-xs uppercase border-2 border-dashed border-slate-200 rounded-3xl">Sin pedidos</div>`;
        return;
    }

    const filtrados = currentOrderFilter === 'Todos'
        ? appData.pedidos
        : appData.pedidos.filter(p => p.estado === currentOrderFilter);

    if (filtrados.length === 0) {
        container.innerHTML = `<div class="text-center p-10 text-slate-400 font-bold text-xs border-2 border-dashed border-slate-200 rounded-3xl">Categoría vacía</div>`;
        return;
    }

    container.innerHTML = filtrados.map((p) => {
        let statusClass  = "bg-yellow-50 text-yellow-600";
        let borderClass  = "border-l-yellow-400";
        if (p.estado === 'Confirmado') { statusClass = "bg-emerald-50 text-emerald-600"; borderClass = "border-l-emerald-400"; }
        if (p.estado === 'Cancelado')  { statusClass = "bg-rose-50 text-rose-600";       borderClass = "border-l-rose-400"; }
        if (p.estado === 'Expirado')   { statusClass = "bg-slate-100 text-slate-500";    borderClass = "border-l-slate-300"; }

        const detalles = p.detalles.split('\n').filter(l => l.trim() !== '')
            .map(l => `<div class="border-b border-slate-100 pb-2 mb-2 last:border-0 text-slate-600">▪️ ${l}</div>`)
            .join('');

        return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-l-[6px] ${borderClass} flex flex-col gap-3">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-[13px] font-black text-slate-800">ORDEN ${p.id}</p>
                    <p class="text-[9px] font-bold text-slate-400 uppercase mt-1">${p.fecha}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase ${statusClass}">${p.estado}</span>
            </div>
            <div class="text-[11px] font-semibold bg-slate-50/50 p-3 rounded-xl">${detalles}</div>
            <div class="flex justify-between items-center pt-2">
                <div>
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Total</p>
                    <p class="text-lg font-black text-slate-800">RD$ ${Number(p.total).toLocaleString()}</p>
                </div>
                ${p.estado === 'Pendiente' ? `
                    <div class="flex gap-2">
                        <button onclick="updateStatus('${p.id}', 'Cancelado')"  class="bg-white border border-slate-200 text-slate-500 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-sm">Rechazar</button>
                        <button onclick="updateStatus('${p.id}', 'Confirmado')" class="bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-md shadow-emerald-200">Cobrar</button>
                    </div>` : ''}
                ${p.estado === 'Expirado'   ? `<span class="text-[9px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg">⏳ Devuelto autom.</span>` : ''}
                ${p.estado === 'Cancelado'  ? `<span class="text-[9px] text-rose-400 font-bold bg-rose-50 px-2 py-1 rounded-lg">❌ Devuelto manual</span>` : ''}
                ${p.estado === 'Confirmado' ? `<span class="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">✓ Cerrado</span>` : ''}
            </div>
        </div>`;
    }).join("");
}

async function updateStatus(orderId, nuevoEstado) {
    const accion = nuevoEstado === 'Confirmado' ? 'CONFIRMAR pago' : 'RECHAZAR y DEVOLVER stock';
    const confirmado = await NexusDialog.confirm(`¿Deseas ${accion} para la orden #${orderId}?`, "Gestión");
    if (!confirmado) return;

    showLoading(nuevoEstado === 'Confirmado' ? 'Confirmando pago...' : 'Rechazando pedido...');

    const res = await NexusCore.ejecutar('updateOrderStatus', { orderId, nuevoEstado });

    hideLoading();

    if (res.success) {
        $text("successMessage", `Orden ${nuevoEstado}.`);
        toggleModal("modalSuccess", true);

        // 🔄 REFRESCAR TODOS LOS DATOS: pedidos + productos (stock actualizado)
        const refreshData = await NexusCore.ejecutar('getInitData');
        console.log(">>> Refresh después de actualizar pedido:", refreshData);
        
        if (refreshData.success) { 
            appData = refreshData; 
            console.log(">>> appData actualizado:", appData);
            
            // Renderizar vista actual
            renderPedidos();
            
            if (typeof renderProductos === 'function') renderProductos();
            if (typeof poblarDashboard === 'function') poblarDashboard();
        } else {
            console.log(">>> Error al refresh:", refreshData.message);
        }
    } else {
        NexusDialog.alert(res.message || "Error al actualizar.", "Error");
    }
}

// ==========================================
// SINCRONIZACIÓN DE PEDIDOS EN TIEMPO REAL
// ==========================================
let lastOrderId = null;
let currentNotifId = null;

async function syncOrdersSilently() {
    try {
        const res = await NexusCore.ejecutar('getOrdersOnly');
        if (res.success && res.pedidos && res.pedidos.length > 0) {
            const newestOrder = res.pedidos[0]; // El primero es el más reciente

            // Si es la primera vez que carga, solo guarda el ID
            if (lastOrderId === null) {
                lastOrderId = newestOrder.id;
                return;
            }

            // Si el ID es diferente al anterior, ¡hay un nuevo pedido!
            if (newestOrder.id !== lastOrderId) {
                lastOrderId = newestOrder.id;
                showOrderNotification(newestOrder);

                // Actualizar badge visual
                const badge = document.getElementById('badge-pedidos');
                if (badge) badge.classList.remove('hidden');

                // Sonido opcional (si el navegador lo permite)
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                audio.play().catch(() => {});
            }

            // Actualizar datos internos
            appData.pedidos = res.pedidos;
            if (currentTab === 'pedidos') renderPedidos();
        }
    } catch (e) { }
}

function showOrderNotification(order) {
    currentNotifId = order.id;
    const notif = document.getElementById('orderNotification');
    const summary = document.getElementById('notifSummary');
    const totalEl = document.getElementById('notifTotal');

    // Construir resumen: "Cliente: 2x Rosas, 1x Chocolates..."
    const lines = order.detalles.split('\n').filter(l => l.trim() !== '');
    const items = lines.slice(0, 2).join(', ');
    const more = lines.length > 2 ? ` (+${lines.length - 2})` : '';

    summary.innerText = `${order.cliente || 'Cliente'}: ${items}${more}`;
    totalEl.innerText = `Total: RD$ ${Number(order.total).toLocaleString()} | Orden #${order.id}`;

    notif.classList.remove('hidden');
    setTimeout(() => {
        notif.style.transform = "translateY(0)";
    }, 100);

    // Auto-ocultar después de 15 segundos si no se interactúa
    setTimeout(() => {
        if (currentNotifId === order.id) {
            hideOrderNotification();
        }
    }, 15000);
}

function hideOrderNotification() {
    const notif = document.getElementById('orderNotification');
    notif.style.transform = "translateY(-150%)";
    setTimeout(() => {
        notif.classList.add('hidden');
        currentNotifId = null;
    }, 500);
}

async function handleNotifAction(nuevoEstado) {
    if (!currentNotifId) return;

    hideOrderNotification();

    showLoading(nuevoEstado === 'Confirmado' ? 'Aprobando pedido...' : 'Rechazando pedido...');

    // Ejecutar cambio en base de datos
    const res = await NexusCore.ejecutar('updateOrderStatus', {
        orderId: currentNotifId,
        nuevoEstado: nuevoEstado
    });

    hideLoading();

    if (res.success) {
        $text("successMessage", `Orden #${currentNotifId} ${nuevoEstado === 'Confirmado' ? 'APROBADA' : 'RECHAZADA'}.`);
        toggleModal("modalSuccess", true);

        // 🔄 REFRESCAR TODOS LOS DATOS: pedidos + productos (stock actualizado)
        const refreshData = await NexusCore.ejecutar('getInitData');
        if (refreshData.success) {
            appData = refreshData;
            renderPedidos();
            renderProductos();        // ← Actualiza stock en inventario
            poblarDashboard();        // ← Actualiza resumen si aplica
        }
    } else {
        NexusDialog.alert(res.message || "Error al procesar.", "Error");
    }

    currentNotifId = null;
}

// ==========================================
// NAVEGACIÓN Y TABS
// ==========================================
function switchTab(tab) {
    try {
        currentTab = tab;
        

        document.getElementById("view-productos").classList.add("hidden");
        document.getElementById("view-pedidos").classList.add("hidden");
        document.getElementById("view-analytics").classList.add("hidden");
        document.getElementById("view-cupones").classList.add("hidden");

        // Reset all sidebar buttons
        var tabs = ["productos", "pedidos", "analytics", "cupones"];
        for (var i = 0; i < tabs.length; i++) {
            var t = tabs[i];
            var sb = document.getElementById("tab-" + t);
            var mb = document.getElementById("tab-" + t + "-mobile");
            if (sb) {
                sb.classList.remove("tab-active");
                sb.classList.remove("sidebar-active");
                sb.classList.add("text-slate-400");
            }
            if (mb) {
                mb.classList.remove("tab-active");
                mb.classList.add("text-slate-400");
            }
        }

        // Show selected view
        var viewEl = document.getElementById("view-" + tab);
        if (viewEl) {
            viewEl.classList.remove("hidden");
        } else {
            
        }
        
        // Activate selected button (sidebar)
        var activeBtn = document.getElementById("tab-" + tab);
        if (activeBtn) {
            activeBtn.classList.add("tab-active");
            activeBtn.classList.add("sidebar-active");
            activeBtn.classList.remove("text-slate-400");
        }
        
        // Activate mobile button
        var mobileBtn = document.getElementById("tab-" + tab + "-mobile");
        if (mobileBtn) {
            mobileBtn.classList.add("tab-active");
            mobileBtn.classList.remove("text-slate-400");
        }

        var btnAdd = document.getElementById("btnAddFloat");
        if (btnAdd) {
            btnAdd.style.display = (tab === 'productos' || tab === 'analytics') ? 'flex' : 'none';
        }

        // Especial handling per tab
        if (tab === 'pedidos') {
            syncOrdersSilently().then(function() {
                renderPedidos();
            });
        }

        if (tab === 'analytics') {
            // Force mostrar analytics
            document.getElementById('view-analytics').classList.remove('hidden');
            
            loadAnalyticsData('semana');
        }

        if (tab === 'productos') {
            renderProductos();
        }

        if (tab === 'cupones') {
            renderCupones();
        }
        
        
    } catch(e) {
        
        alert("Error: " + e.message);
    }
}

// ==========================================
// MODO FERIA
// ==========================================
function toggleModoFeria() {
    const enabled = document.getElementById('modoFeriaToggle').checked;
    localStorage.setItem('nx_modo_feria', enabled ? 'true' : 'false');
    document.getElementById('feriaInfo').classList.toggle('hidden', !enabled);
    NexusCore.ejecutar('updateConfig', { modo_feria: enabled ? 'true' : 'false' });
}

function loadModoFeria() {
    const enabled = localStorage.getItem('nx_modo_feria') === 'true';
    document.getElementById('modoFeriaToggle').checked = enabled;
    document.getElementById('feriaInfo').classList.toggle('hidden', !enabled);
    renderCuponesFeria();
}

function renderCuponesFeria() {
    const container = document.getElementById("listaCuponesFeria");
    const cupones = appData.cupones || [];
    if(cupones.length === 0) {
        container.innerHTML = `<div class="text-center p-10 text-slate-400 font-bold text-xs uppercase border-2 border-dashed border-slate-200 rounded-3xl">Sin cupones</div>`;
        return;
    }
    container.innerHTML = cupones.map(c => {
        const tipoLabel = c.tipo === 'descuento' ? '📉 Descuento' : c.tipo === 'giftcard' ? '🎁 Gift Card' : c.tipo === 'producto' ? '🎟️ Producto' : 'Cupón';
        const descLabel = c.descuento_tipo === 'porcentaje' ? `${c.descuento_valor}%` : c.descuento_tipo === 'gratis' ? 'GRATIS' : `RD$ ${Number(c.descuento_valor).toLocaleString()}`;
        return `<div class="app-card p-4"><div class="flex justify-between"><div><p class="font-black text-sm">${c.codigo}</p><p class="text-[10px] text-slate-500">${tipoLabel} - ${descLabel}</p></div><button onclick="eliminarCupon('${c.id}')" class="text-rose-500 text-[10px] font-bold">Eliminar</button></div></div>`;
    }).join("");
}

// ==========================================
// ANALYTICS / GRÁFICA DE VENTAS
// ==========================================
var analyticsFilter = 'semana';

function loadAnalyticsData(filter) {
    analyticsFilter = filter;
    var btnSemana = document.getElementById('filter-semana');
    var btnMes = document.getElementById('filter-mes');
    var btnAnio = document.getElementById('filter-anio');
    if (btnSemana) btnSemana.className = filter === 'semana' ? 'flex-1 bg-slate-900 text-white py-2 px-3 rounded-xl text-[10px] font-black uppercase' : 'flex-1 bg-slate-200 text-slate-600 py-2 px-3 rounded-xl text-[10px] font-black uppercase';
    if (btnMes) btnMes.className = filter === 'mes' ? 'flex-1 bg-slate-900 text-white py-2 px-3 rounded-xl text-[10px] font-black uppercase' : 'flex-1 bg-slate-200 text-slate-600 py-2 px-3 rounded-xl text-[10px] font-black uppercase';
    if (btnAnio) btnAnio.className = filter === 'anio' ? 'flex-1 bg-slate-900 text-white py-2 px-3 rounded-xl text-[10px] font-black uppercase' : 'flex-1 bg-slate-200 text-slate-600 py-2 px-3 rounded-xl text-[10px] font-black uppercase';
    
    // Llamar API de analytics con período
    
    NexusCore.ejecutar('getAnalytics', { periodo: filter }).then(function(res) {
        
        if (res && res.success && res.analytics) {
            renderAnalyticsData(res.analytics);
        } else {
            
            renderAnalytics();
        }
    })["catch"](function(e) {
        
        renderAnalytics();
    });
}

function renderAnalyticsData(data) {
    var ventas = data.ventas || 0;
    var ventasAgrupado = data.ventasAgrupado || [];
    
    
    
    var chartEl = document.getElementById('salesChart');
    if (chartEl) {
        if (ventasAgrupado.length > 0) {
            var maxVenta = 0;
            for (var i = 0; i < ventasAgrupado.length; i++) {
                if (ventasAgrupado[i].total > maxVenta) maxVenta = ventasAgrupado[i].total;
            }
            
            var html = '<div style="display:table;width:100%;height:160px;border-spacing:2px;">';
            var numItems = ventasAgrupado.length;
            var anchoCelda = Math.floor(100 / numItems) - 1;
            
            for (var i = 0; i < numItems; i++) {
                var item = ventasAgrupado[i];
                var h = maxVenta > 0 ? Math.max(20, Math.round((item.total / maxVenta) * 130)) : 40;
                html += '<div style="display:table-cell;width:' + anchoCelda + '%;vertical-align:bottom;text-align:center;">';
                html += '<div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;">';
                if (item.total > 0) {
                    html += '<span style="font-size:10px;color:#10b981;font-weight:700;">' + formatRD(item.total) + '</span>';
                }
                html += '<div style="width:100%;max-width:40px;height:' + h + 'px;background:#10b981;border-radius:4px 4px 0 0;"></div>';
                html += '<span style="font-size:10px;color:#64748b;margin-top:4px;font-weight:600;">' + item.label + '</span>';
                html += '</div>';
                html += '</div>';
            }
            html += '</div>';
            chartEl.innerHTML = html;
        } else {
            chartEl.innerHTML = '<div class="text-center text-slate-400 p-8">📊 Sin ventas en ' + (data.periodo || 'semana') + '</div>';
        }
    }
    
    // Totales
    var salesEl = document.getElementById('analyticsTotalSales');
    var ordersEl = document.getElementById('analyticsTotalOrders');
    var gananciaEl = document.getElementById('analyticsTotalGanancia');
    
    if (salesEl) salesEl.innerText = "RD$ " + formatRD(ventas);
    if (ordersEl) ordersEl.innerText = data.pedidos || 0;
    
    var gananciaEst = Math.round(ventas * 0.3);
    if (gananciaEl) gananciaEl.innerText = "RD$ " + formatRD(gananciaEst) + " *";
    
    // Top productos
    var topEl = document.getElementById('topProductsList');
    if (topEl) {
        var top = data.topProductos || [];
        if (top.length > 0) {
            var html = '';
            for (var i = 0; i < top.length; i++) {
                html += '<div class="flex justify-between items-center py-2 border-b border-slate-100">';
                html += '<span class="text-[11px] font-medium text-slate-700">' + (i+1) + '. ' + top[i].nombre + '</span>';
                html += '<span class="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">' + top[i].qty + '</span>';
                html += '</div>';
            }
            topEl.innerHTML = html;
        } else {
            topEl.innerHTML = '<div class="text-center text-slate-400 text-xs py-4">Sin datos</div>';
        }
    }
}

function renderAnalytics() {
    
    
    var viewAnalytics = document.getElementById('view-analytics');
    if (viewAnalytics) {
        viewAnalytics.classList.remove('hidden');
        
    }
    
    var ventas = 0;
    var pedidos = 0;
    var ganancia = 0;
    
    if (appData && appData.pedidos) {
        
        
        for (var i = 0; i < appData.pedidos.length; i++) {
            var p = appData.pedidos[i];
            if (p.estado === "Confirmado") {
                ventas += Number(p.total) || 0;
                pedidos++;
            }
        }
    }
    
    
    
    // Mostrar valores
    var salesEl = document.getElementById('analyticsTotalSales');
    var ordersEl = document.getElementById('analyticsTotalOrders');
    var gananciaEl = document.getElementById('analyticsTotalGanancia');
    var chartEl = document.getElementById('salesChart');
    
    if (salesEl) salesEl.innerText = "RD$ " + formatRD(ventas);
    if (ordersEl) ordersEl.innerText = pedidos;
    
    // Calcular ganancia estimada (30% de ventas)
    var gananciaEstimada = Math.round(ventas * 0.3);
    if (gananciaEl) {
        gananciaEl.innerText = "RD$ " + formatRD(gananciaEstimada) + " *";
    }
    
// Gráfico simple con barra
    if (chartEl) {
        var html = '';
        if (ventas > 0) {
            // Barra proporcional basada en ventas
            var height = Math.min(150, Math.max(40, ventas / 10));
            html = '<div class="flex flex-col items-center justify-end h-44">';
            html += '<div class="w-20 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl shadow-lg" style="height: ' + height + 'px;"></div>';
            html += '<div class="text-xs font-bold text-slate-500 mt-2">RD$ ' + formatRD(ventas) + '</div>';
            html += '<div class="text-[10px] text-slate-400">' + pedidos + ' pedidos</div>';
            html += '</div>';
        } else {
            html = '<div class="text-center text-slate-400 p-8">📊 Sin ventas en este período</div>';
        }
        chartEl.innerHTML = html;
    }
    
    // Mostrar ganancia calculada (30% estimado de ventas)
    var gananciaEstimada = Math.round(ventas * 0.3);
if (gananciaEl) {
        gananciaEl.innerText = "RD$ " + formatRD(gananciaEstimada) + " *";
    }
    
    // Top productos (simulado - basado en productos publicados)
    var topEl = document.getElementById('topProductsList');
    if (topEl && appData.productos && appData.productos.length > 0) {
        // Ordenar productos por stock (mayor primero)
        var prods = appData.productos.slice(0);
        prods.sort(function(a, b) { return Number(b.stock || 0) - Number(a.stock || 0); });
        var top3 = prods.slice(0, 3);
        
        var topHtml = '';
        for (var i = 0; i < top3.length; i++) {
            topHtml += '<div class="flex justify-between items-center py-2 border-b border-slate-100">';
            topHtml += '<span class="text-[11px] font-medium text-slate-700">' + (i+1) + '. ' + (top3[i].nombre || 'Sin nombre') + '</span>';
            topHtml += '<span class="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">' + (top3[i].stock || 0) + '</span>';
            topHtml += '</div>';
        }
        topEl.innerHTML = topHtml;
    } else if (topEl) {
        topEl.innerHTML = '<div class="text-center text-slate-400 text-xs py-4">Sin productos</div>';
    }
}

// ==========================================
// MODALES DE PRODUCTO
// ==========================================
function openAddModal() {
    $text("modalProductTitle", "Nuevo Producto");
    document.getElementById("editId").value = "";
    document.getElementById("pNombre").value = "";
    document.getElementById("pPrecio").value = "";
    document.getElementById("pCosto").value = "";
    document.getElementById("pStock").value = "";
    document.getElementById("pDetalle").value = "";
    document.getElementById("pEstado").value = "Publicado";
    var previewReset = document.getElementById("preview");
    if (previewReset) previewReset.src = "https://cdn-icons-png.flaticon.com/512/685/685655.png";
    document.getElementById("fileInput").value = "";
    
    // Reset cupón
    var hasCouponEl = document.getElementById("hasCoupon");
    if (hasCouponEl) hasCouponEl.checked = false;
    var couponFields = document.getElementById("couponFields");
    if (couponFields) couponFields.style.display = "none";
    
    var pCouponCode = document.getElementById("pCouponCode");
    if (pCouponCode) pCouponCode.value = "";
    var pCouponType = document.getElementById("pCouponType");
    if (pCouponType) pCouponType.value = "porcentaje";
    var pCouponValue = document.getElementById("pCouponValue");
    if (pCouponValue) pCouponValue.value = "";
    
    // Abrir modal
    toggleModal('modalProduct', true);
}

// FIN DEL ARCHIVO

function previewImg(e) {
    const f = e.target.files[0];
    if (f) {
        var previewFile = document.getElementById("preview");
        if (previewFile) previewFile.src = URL.createObjectURL(f);
    }
}

function toggleCouponSection() {
    const checked = document.getElementById("hasCoupon").checked;
    document.getElementById("couponFields").style.display = checked ? 'block' : 'none';
    document.getElementById("couponSectionModal").classList.toggle('active', checked);
}

function generateRandomCoupon() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for(let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById("pCouponCode").value = code;
}

// ==========================================
// CONFIGURACIÓN DE LA TIENDA
// ==========================================
function selectTheme(color) {
    document.documentElement.style.setProperty('--primary', color);
    document.querySelectorAll('.theme-card').forEach(c => {
        c.classList.toggle('active', c.dataset.color === color);
    });
}

async function vincularYGuardar() {
    const pin        = document.getElementById("cfgPin").value;
    const pinConfirm = document.getElementById("cfgPinConfirm").value;
    const nombre     = document.getElementById("cfgNombre").value.trim();
    const eslogan    = document.getElementById("cfgEslogan").value.trim();
    const categorias = document.getElementById("cfgCategorias").value.trim();
    const wa         = document.getElementById("cfgWA").value.trim();
    const sobre      = document.getElementById("cfgSobre").value.trim();
    const color      = document.documentElement.style.getPropertyValue('--primary') || '#00a884';
    const sonido     = document.getElementById("cfgSound").checked;
    const vibrate    = document.getElementById("cfgVibrate").checked;
    const modoFeria  = document.getElementById("cfgModoFeria").checked;
    const mantenimiento = document.getElementById("cfgMaintenance").checked;

    if (pin && pin !== pinConfirm) {
        return NexusDialog.alert("Los PINs no coinciden.", "Error");
    }
    if (pin && pin.length !== 4) {
        return NexusDialog.alert("El PIN debe tener exactamente 4 dígitos.", "Error");
    }

    const btn = document.getElementById("btnConfigSave");
    btn.innerText = "Guardando...";
    btn.disabled = true;

    const datos = { nombre, eslogan, categorias, wa, sobre, color, modo_feria: modoFeria, mantenimiento: mantenimiento };
    if (pin) datos.pin = pin;

    

    const res = await NexusCore.ejecutar('updateConfig', datos);
    

    if (res.success) {
        if (pin) currentPin = pin;
        localStorage.setItem('nx_shop_name', nombre);
        localStorage.setItem('nx_shop_eslogan', eslogan);
        localStorage.setItem('nx_shop_categorias', categorias);
        localStorage.setItem('nx_shop_wa', wa);
        localStorage.setItem('nx_shop_sobre', sobre);
        localStorage.setItem('nx_primary_color', color);
        localStorage.setItem('nx_sound_enabled', sonido ? 'true' : 'false');
        localStorage.setItem('nx_vibrate_enabled', vibrate ? 'true' : 'false');
        localStorage.setItem('nx_modo_feria', modoFeria ? 'true' : 'false');
        localStorage.setItem('nx_maintenance', mantenimiento ? 'true' : 'false');
        localStorage.setItem('nx_config_timestamp', Date.now());
        selectTheme(color);
        toggleModal("modalConfig", false);
        $text("successMessage", "Configuración guardada.");
        toggleModal("modalSuccess", true);
    } else {
        NexusDialog.alert(res.message || "Error al guardar en el servidor.", "Error");
    }

    btn.innerText = "Guardar Cambios";
    btn.disabled = false;
}

// Llenar el modal de config con los datos actuales
function abrirConfig() {
    var cfg = appData.config || {};
    document.getElementById("cfgNombre").value    = cfg.Nombre_Tienda || localStorage.getItem('nx_shop_name') || "";
    document.getElementById("cfgEslogan").value   = cfg.Eslogan || localStorage.getItem('nx_shop_eslogan') || "";
    document.getElementById("cfgCategorias").value = cfg.Categorias_Lista || localStorage.getItem('nx_shop_categorias') || "";
    document.getElementById("cfgWA").value        = cfg.WhatsApp || localStorage.getItem('nx_shop_wa') || "";
    document.getElementById("cfgSobre").value     = cfg.Sobre_Nosotros || localStorage.getItem('nx_shop_sobre') || "";
    document.getElementById("cfgModoFeria").checked = cfg.modo_feria === 'true' || cfg.modo_feria === true;
    document.getElementById("cfgMaintenance").checked = cfg.Modo_Mantenimiento === 'true' || cfg.Modo_Mantenimiento === true;
    document.getElementById("cfgSound").checked   = localStorage.getItem('nx_sound_enabled') !== 'false';
    document.getElementById("cfgVibrate").checked = localStorage.getItem('nx_vibrate_enabled') !== 'false';
    var color = cfg.Color_Primario || localStorage.getItem('nx_primary_color');
    if (color) selectTheme(color);
    toggleModal("modalConfig", true);
}

// ==========================================
// WIZARD DE CONFIGURACIÓN INICIAL
// ==========================================
async function saveWizard() {
    const pin        = document.getElementById("wizPin").value;
    const pinConfirm = document.getElementById("wizPinConfirm").value;
    const nombre     = document.getElementById("wizNombre").value.trim();
    const wa         = document.getElementById("wizWA").value.trim();
    const categorias = document.getElementById("wizCategorias").value.trim();
    const eslogan    = document.getElementById("wizEslogan").value.trim();
    const sobre      = document.getElementById("wizSobre").value.trim();

    if (!pin || pin.length !== 4) return NexusDialog.alert("El PIN debe tener 4 dígitos.", "Error");
    if (pin !== pinConfirm)       return NexusDialog.alert("Los PINs no coinciden.", "Error");
    if (!nombre)                  return NexusDialog.alert("El nombre de la tienda es obligatorio.", "Error");
    if (!wa)                      return NexusDialog.alert("El número de WhatsApp es obligatorio.", "Error");

    const btn = document.getElementById("btnWizSave");
    if (btn) {
        btn.innerText = "Creando Tienda...";
        btn.disabled = true;
    }
    
    var url = NEXUS_CONFIG.API_URL;
    var payload = { shopId: NEXUS_CONFIG.shopId, action: 'updateConfig', data: { pin: pin, nombre: nombre, eslogan: eslogan, categorias: categorias, wa: wa, sobre: sobre } };
    
    try {
        var response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(payload),
            redirect: "manual"
        });
        
        if (response.type === 'opaqueredirect') {
            var redirectUrl = response.url;
            var newResponse = await fetch(redirectUrl);
            var text = await newResponse.text();
            var res = JSON.parse(text);
        } else {
            var text = await response.text();
            var res = JSON.parse(text);
        }
        
        if (res.success) {
            currentPin = pin;
            localStorage.setItem("nx_session", "valid");
            
            // Recargar datos frescos del servidor
            var refreshRes = await NexusCore.ejecutar('getInitData');
            if (refreshRes.success) {
                appData = refreshRes;
                dbConfig = refreshRes.config;
                dbProductos = refreshRes.productos || [];
                dbCupones = refreshRes.cupones || [];
            }
            
            toggleModal("modalWizard", false);
            initPreloaded();
        } else {
            NexusDialog.alert(res.message || "Error al crear la tienda.", "Error");
            if (btn) {
                btn.innerText = "Crear Tienda";
if (btn) { btn.disabled = false; }
        }
        }
    } catch(e) {
        console.error("Error saveWizard:", e);
        NexusDialog.alert("Error: " + e.message, "Error");
        btn.innerText = "Crear Tienda";
        btn.disabled = false;
    }
}

// ==========================================
// RESET / BORRAR TODO
// ==========================================
async function triggerReset() {
    const confirmado = await NexusDialog.confirm(
        "Esto borrará toda la configuración de la tienda. ¿Estás seguro?",
        "⚠️ Resetear Todo"
    );
    if (!confirmado) return;

    // Solicitar PIN para confirmar
    const pinConfirm = await NexusDialog.prompt("Introduce tu PIN de seguridad para confirmar:", "Verificación");
    if(pinConfirm !== currentPin) {
        return NexusDialog.alert("PIN incorrecto. Operación cancelada.", "Error");
    }

    showLoading("Borrando datos...");

    const res = await NexusCore.ejecutar('resetConfig');

    hideLoading();

    if (res.success) {
        localStorage.removeItem("nx_session");
        localStorage.removeItem("nexus_cart");
        localStorage.removeItem("nexus_coupon");
        toggleModal("modalConfig", false);
        toggleModal("modalWizard", true);
        document.getElementById("loginSection").style.display = "none";
    } else {
        NexusDialog.alert(res.message || "Error al resetear.", "Error");
    }
}

// ==========================================
// HELPER PARA MODALES
// ==========================================
function toggleModal(id, s) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("hidden", !s);
    if (s) el.classList.add("flex");
    else el.classList.remove("flex");
}