// ==========================================
// NEXUS PRO V6.0 - SHOP.JS
// OPTIMIZADO Y MODERNO
// ==========================================

// Inicialización forzada para tienda
(function() {
    var PCC_URL = "https://script.google.com/macros/s/AKfycbxikMAM8onAKt8mDPS-VXfw5M3myiHMFfUbz3t_QaMWrU9V_qvO2ZoP-RD19N6qplnMwQ/exec";
    var MOTOR_FALLBACK = "https://script.google.com/macros/s/AKfycbwr3K5qcSQvmEb1qhoeM0L9E26k1nSHTjmBdoehu3vRcssLltMInwM4AaWw34ZOuKEF/exec";
    
    var params = new URLSearchParams(window.location.search);
    var identifier = params.get('s') || "";
    
    if (typeof NEXUS_CONFIG === 'undefined') {
        window.NEXUS_CONFIG = {};
    }
    
    // Resolver el Sheet ID
    var key = identifier.toLowerCase().trim();
    var resolvedShopId = null;
    
    // 1. Buscar en mapeo local
    if (identifier && identifier.length < 30) {
        if (typeof SHOP_MAPPING !== 'undefined' && SHOP_MAPPING[key]) {
            console.log(">>> Shop: Encontrado en mapeo local:", key);
            resolvedShopId = SHOP_MAPPING[key];
        }
    }
    // 2. Si es Sheet ID directo
    else if (identifier.length > 30) {
        console.log(">>> Shop: Usando como Sheet ID directo");
        resolvedShopId = identifier;
    }
    
    // Si no está en mapeo local ni es ID directo, intentar PCC
    if (!resolvedShopId && identifier.length < 30) {
        console.log(">>> Shop: Consultando PCC para:", key);
        // No podemos hacer fetch async aquí, así que usamos el nombre directamente
        // y dejamos que cargarTienda maneje el error
    }
    
    // Usar lo que tengamos
    if (!resolvedShopId) resolvedShopId = identifier;
    
    NEXUS_CONFIG.shopId = resolvedShopId;
    NEXUS_CONFIG.pccShopId = identifier;
    NEXUS_CONFIG.API_URL = MOTOR_FALLBACK;
    NEXUS_CONFIG.isReady = true;
    
    if (!NEXUS_CONFIG.getShopId) {
        NEXUS_CONFIG.getShopId = function() { return this.shopId; };
    }
    
    if (!NEXUS_CONFIG.call) {
        NEXUS_CONFIG.call = async function(action, data = {}) {
            var url = this.API_URL || MOTOR_FALLBACK;
            var payload = { shopId: this.shopId, action: action, ...data };
            
            var response = await fetch(url, {
                method: "POST",
                body: JSON.stringify(payload),
                redirect: "follow"
            });
            return JSON.parse(await response.text());
        };
    }
})();

// PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.getElementById('pwaBanner');
    if (banner) banner.classList.add('show');
});

async function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') dismissPWA();
    }
}

function dismissPWA() {
    const banner = document.getElementById('pwaBanner');
    if (banner) banner.classList.remove('show');
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

// Diálogos Nativos
const NexusDialog = {
    alert: (msg, title = "Atención") => {
        document.getElementById('nDialogTitle').innerText = title;
        document.getElementById('nDialogMsg').innerText = msg;
        document.getElementById('nativeDialog').classList.add('open');
    },
    close: () => document.getElementById('nativeDialog').classList.remove('open')
};

// Variables Globales
let dbProductos = [], dbConfig = {}, dbCupones = [];
let carrito = JSON.parse(localStorage.getItem('nexus_cart')) || [];
let cuponAplicado = null, currentBuyProduct = null;
let catActiva = 'Todos', currentSort = 'default';

// Dark Mode
let isDarkMode = localStorage.getItem('nexus_darkmode') === 'true';

function initDarkMode() {
    if (!isDarkMode) document.body.classList.add('light-mode');
    updateThemeIcon();
}

function updateThemeIcon() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const moon = btn.querySelector('.icon-moon');
    const sun = btn.querySelector('.icon-sun');
    if (isDarkMode) {
        moon.style.display = 'none';
        sun.style.display = 'block';
    } else {
        moon.style.display = 'block';
        sun.style.display = 'none';
    }
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('light-mode', !isDarkMode);
    localStorage.setItem('nexus_darkmode', isDarkMode);
    updateThemeIcon();
}

// Cache Local (15 min)
const CACHE_DURATION = 15 * 60 * 1000;
function getCacheData(key) {
    const cached = localStorage.getItem(key + '_cache');
    if (!cached) return null;
    const data = JSON.parse(cached);
    return Date.now() - data.timestamp > CACHE_DURATION ? null : data.value;
}

function setCacheData(key, value) {
    localStorage.setItem(key + '_cache', JSON.stringify({ timestamp: Date.now(), value }));
}

// Cargar Tienda
async function cargarTienda() {
    // Verificar si el sistema está bloqueado
    if (NEXUS_CONFIG.isSuspended) {
        return;
    }
    
    // Esperar a que NEXUS_CONFIG esté listo
    let intentos = 0;
    while (!NEXUS_CONFIG.isReady && intentos < 50) {
        await new Promise(r => setTimeout(r, 100));
        intentos++;
    }
    
    if (!NEXUS_CONFIG.isReady) {
        var maintenanceEl = document.getElementById("maintenanceScreen");
        if (maintenanceEl) maintenanceEl.style.display = 'flex';
        return;
    }
    
    var gridEl = document.getElementById("mainGrid");
    if (gridEl) {
        gridEl.innerHTML = Array(6).fill().map(function() {
            return '<div class="skeleton-card"><div class="skeleton skeleton-img"></div><div class="skeleton-body"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-price"></div></div></div>';
        }).join('');
    }
    
    try {
        const res = await NexusCore.ejecutar('getInitData');
        console.log(">>> Respuesta del Motor:", res);
        
        if (res.message === 'ACCESO_DENEGADO' || res.message === 'Tienda inactiva') {
            return;
        }
        
        // Validar que la tienda existe
        if (!res.success) {
            var maintenanceEl = document.getElementById("maintenanceScreen");
            if (maintenanceEl) maintenanceEl.style.display = 'flex';
            return;
        }
        
        var tieneNombre = res.config && res.config.Nombre_Tienda && res.config.Nombre_Tienda.trim() !== "";
        var tieneProductos = res.productos && Array.isArray(res.productos) && res.productos.length > 0;
        
        // Si no hay productos pero hay configuración, usar cache local
        if (!tieneProductos && res.config && res.config.Nombre_Tienda) {
            var cachedProds = getCacheData('nx_productos');
            if (cachedProds && cachedProds.length > 0) {
                console.log(">>> Usando productos desde cache local");
                res.productos = cachedProds;
                tieneProductos = true;
            }
        }
        console.log(">>> Tiene Nombre:", tieneNombre, "Tiene Productos:", tieneProductos);
        
        // Solo mostrar mantenimiento si está explícitamente configurado
        var modoMantenimiento = res.config && (res.config.Modo_Mantenimiento === 'true' || res.config.Modo_Mantenimiento === true);
        
        if (!tieneNombre && !tieneProductos && !modoMantenimiento) {
            // No tiene datos pero tampoco está en mantenimiento - iniciar wizard
            console.log(">>> Tienda sin configurar, esperando...");
        }
        
        if (modoMantenimiento) {
            var maintenanceEl = document.getElementById("maintenanceScreen");
            if (maintenanceEl) maintenanceEl.style.display = 'flex';
            return;
        }
        
        // La tienda existe - cargar datos
        dbConfig = res.config;
        dbProductos = res.productos.filter(function(p) { return p.estado === "Publicado"; });
        dbCupones = res.cupones || [];
        setCacheData('nx_config', dbConfig);
        setCacheData('nx_productos', dbProductos);
        setCacheData('nx_cupones', dbCupones);
        aplicarConfigTienda();
        if (localStorage.getItem('nexus_coupon')) {
            cuponAplicado = JSON.parse(localStorage.getItem('nexus_coupon'));
        }
        renderizarCategorias();
        filtrarBusqueda();
        actualizarCarritoUI();
        initDarkMode();
    } catch (e) { 
        console.log(">>> Error cargarTienda:", e);
    }

    const cachedConfig = getCacheData('nx_config');
    const cachedProds = getCacheData('nx_productos');
    if (cachedConfig && cachedProds) {
        dbConfig = cachedConfig;
        dbProductos = cachedProds;
        dbCupones = getCacheData('nx_cupones') || [];
        aplicarConfigTienda();
        if (localStorage.getItem('nexus_coupon')) {
            cuponAplicado = JSON.parse(localStorage.getItem('nexus_coupon'));
        }
        renderizarCategorias();
        filtrarBusqueda();
        actualizarCarritoUI();
    } else {
        var maintenanceEl = document.getElementById("maintenanceScreen");
        if (maintenanceEl) maintenanceEl.style.display = 'flex';
    }
}

function aplicarConfigTienda() {
    var nombre = localStorage.getItem('nx_shop_name') || (dbConfig && dbConfig.Nombre_Tienda) || "Nexus Pro";
    var eslogan = localStorage.getItem('nx_shop_eslogan') || (dbConfig && dbConfig.Eslogan) || "Bienvenido";
    var color = localStorage.getItem('nx_primary_color') || (dbConfig && dbConfig.Color_Primario) || "#10b981";
    var sobre = localStorage.getItem('nx_shop_sobre') || (dbConfig && dbConfig.Sobre_Nosotros) || "";

    var headerLogo = document.getElementById("headerLogo");
    var headerSlogan = document.getElementById("headerSlogan");
    if (headerLogo) headerLogo.innerText = nombre;
    if (headerSlogan) headerSlogan.innerText = eslogan;
    if (document.title) document.title = nombre + " - Catálogo";
    
    if (sobre) {
        var aboutText = document.getElementById("aboutText");
        var aboutContainer = document.getElementById("aboutContainer");
        if (aboutText) aboutText.innerText = sobre;
        if (aboutContainer) aboutContainer.style.display = 'block';
    }
    if (color) {
        document.documentElement.style.setProperty('--primary', color);
    }
    if (dbConfig) {
        dbConfig.WhatsApp = localStorage.getItem('nx_shop_wa') || dbConfig.WhatsApp || "";
        dbConfig.Categorias_Lista = localStorage.getItem('nx_shop_categorias') || dbConfig.Categorias_Lista || "";
    }
}

// Skeleton
function showSkeletonLoader() {
    const grid = document.getElementById("mainGrid");
    if (!grid) return;
    grid.innerHTML = Array(6).fill().map(() => `
        <div class="skeleton-card">
            <div class="skeleton skeleton-img"></div>
            <div class="skeleton-body">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-price"></div>
            </div>
        </div>`).join('');
}

// Producto Nuevo (< 7 días)
function isProductNew(p) {
    if (!p.fecha_creacion) return false;
    return (new Date() - new Date(p.fecha_creacion)) / (1000 * 60 * 60 * 24) < 7;
}

// Categorías
function renderizarCategorias() {
    let cats = ["Todos"];
    if (dbConfig.Categorias_Lista) {
        cats = ["Todos", ...dbConfig.Categorias_Lista.split(",").map(c => c.trim()).filter(Boolean)];
    }
    const bar = document.getElementById("categoryBar");
    if (bar) bar.innerHTML = cats.map(c => 
        `<button class="cat-btn ${c === 'Todos' ? 'active' : ''}" onclick="filtrarCat('${c}', this)">${c}</button>`
    ).join("");
}

function filtrarCat(cat, btn) {
    catActiva = cat;
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filtrarBusqueda();
}

// Filtrado y Orden
function getFilteredProducts() {
    const term = document.getElementById("searchInput")?.value.toLowerCase() || '';
    let lista = catActiva === 'Todos' ? dbProductos : dbProductos.filter(p => (p.categoria || '').trim() === catActiva);
    if (term) lista = lista.filter(p => (p.nombre || '').toLowerCase().includes(term));
    return lista;
}

function aplicarOrden() {
    currentSort = document.getElementById("sortSelect").value;
    renderizarProductos(getFilteredProducts());
}

function ordenarProductos(lista) {
    const sorted = [...lista];
    switch (currentSort) {
        case 'price-asc': return sorted.sort((a, b) => Number(a.precio) - Number(b.precio));
        case 'price-desc': return sorted.sort((a, b) => Number(b.precio) - Number(a.precio));
        case 'name-asc': return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre));
        default: return sorted;
    }
}

// Productos
function renderizarProductos(lista) {
    const grid = document.getElementById("mainGrid");
    if (!grid) return;
    lista = ordenarProductos(lista);
    
    if (lista.length === 0) {
        grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><h3 class="empty-title">Sin resultados</h3></div>`;
        return;
    }
    
    grid.innerHTML = lista.map(p => {
        const agotado = Number(p.stock) <= 0;
        const esNuevo = isProductNew(p);
        const stockBajo = Number(p.stock) < 5 && Number(p.stock) > 0;
        const cupon = getCuponProducto(p.id);
        const precioFinal = calcularPrecioFinal(p.precio, cupon);
        const precioOrig = Number(p.precio);
        const descuento = cupon && precioFinal !== precioOrig ? `<span class="old-price">RD$ ${precioOrig.toLocaleString()}</span>` : '';
        const badge = cupon ? `<div class="coupon-badge ${cupon.descuento_tipo === 'gratis' ? 'gift' : ''}">${cupon.descuento_tipo === 'gratis' ? '🎁' : '🎟️'}</div>` : '';
        const nuevoBadge = esNuevo ? '<div class="nuevo-badge">NUEVO</div>' : '';
        const stockBadge = stockBajo ? '<div class="stock-badge">Stock bajo</div>' : '';
        
        return `<div class="card ${cupon ? 'coupon-product-card' : ''} ${agotado ? 'agotado' : ''}">
            ${agotado ? '<div class="agotado-tag">AGOTADO</div>' : ''} ${badge} ${nuevoBadge} ${stockBadge}
            <img src="${p.imagen || 'https://cdn-icons-png.flaticon.com/512/685/685655.png'}" class="card-img" onclick="verDetalle('${p.id}')" onerror="this.src='https://cdn-icons-png.flaticon.com/512/685/685655.png'">
            <div class="card-body">
                <div class="card-title" onclick="verDetalle('${p.id}')">${p.nombre}</div>
                <div class="card-price">${descuento}RD$ ${Number(precioFinal).toLocaleString()}</div>
                <div class="qty-mini">
                    <button onclick="updateQty('${p.id}', -1)">-</button>
                    <span id="qty-${p.id}">1</span>
                    <button onclick="updateQty('${p.id}', 1)">+</button>
                </div>
                <div class="btn-mini-group">
                    <button class="btn-mini-add" ${agotado ? 'disabled style="opacity:0.5"' : ''} onclick="addCart('${p.id}')">CARRITO</button>
                    <button class="btn-mini-buy" ${agotado ? 'disabled style="opacity:0.5"' : ''} onclick="openWhatsAppModal('${p.id}')">COMPRAR</button>
                </div>
            </div>
        </div>`;
    }).join("");
}

// Detalle
function verDetalle(id) {
    const p = dbProductos.find(x => x.id == id);
    if (!p) return;
    currentBuyProduct = p;
    const cupon = getCuponProducto(id);
    const precioFinal = calcularPrecioFinal(p.precio, cupon);
    
    var detImg = document.getElementById("detImg");
    if (detImg) detImg.src = p.imagen || "https://cdn-icons-png.flaticon.com/512/685/685655.png";
    document.getElementById("detCat").innerText = p.categoria || 'General';
    document.getElementById("detName").innerText = p.nombre;
    
    const precioHtml = cupon && precioFinal !== Number(p.precio) 
        ? `<span style="text-decoration:line-through;color:#5a5a64">RD$ ${Number(p.precio).toLocaleString()}</span> RD$ ${Number(precioFinal).toLocaleString()}`
        : `RD$ ${Number(precioFinal).toLocaleString()}`;
    document.getElementById("detPrice").innerHTML = precioHtml;
    document.getElementById("detDesc").innerText = p.detalle || "Sin descripción.";
    
    const stock = Number(p.stock);
    document.getElementById("detStock").innerHTML = stock <= 0 
        ? '<span style="color:#ff4d6a">❌ Agotado</span>' 
        : `<span style="color:#00d9a5">📦 Stock: ${stock}</span>`;
    
    document.getElementById("qty-det").innerText = "1";
    
    const agotado = stock <= 0;
    document.getElementById("detActionGroup").innerHTML = agotado 
        ? '<button class="btn-mini-add" style="width:100%;opacity:0.5" disabled>AGOTADO</button>'
        : `<button class="btn-mini-add" style="padding:14px" onclick="addCart('${p.id}', true)">AÑADIR</button>
           <button class="btn-mini-buy" style="padding:14px" onclick="openWhatsAppModal('${p.id}', true)">COMPRAR</button>`;
    
    toggleDetail(true);
}

// Cupones
function getCuponProducto(id) {
    return cuponAplicado && 
           (cuponAplicado.tipo === 'producto' || cuponAplicado.tipo === 'regalo_unico') && 
           cuponAplicado.producto_id == id && 
           cuponAplicado.activo === 'Sí' ? cuponAplicado : null;
}

function calcularPrecioFinal(precio, cupon) {
    if (!cupon) return Number(precio);
    const orig = Number(precio);
    if (cupon.descuento_tipo === 'porcentaje') return orig * (1 - Number(cupon.descuento_valor) / 100);
    if (cupon.descuento_tipo === 'monto') return Math.max(0, orig - Number(cupon.descuento_valor));
    if (cupon.descuento_tipo === 'gratis') return 0;
    return orig;
}

// Cantidad
function updateQty(id, delta) {
    const el = document.getElementById(id === 'det' ? 'qty-det' : `qty-${id}`);
    if (!el) return;
    let v = parseInt(el.innerText) + delta;
    if (v < 1) v = 1;
    el.innerText = v;
    if (navigator.vibrate) navigator.vibrate(10);
}

// WhatsApp Modal
function openWhatsAppModal(id, fromDetail = false) {
    const p = dbProductos.find(x => x.id == id);
    if (!p) return;
    const qty = parseInt(document.getElementById(fromDetail ? 'qty-det' : `qty-${id}`)?.innerText || '1');
    const cupon = getCuponProducto(id);
    const precioUnitario = calcularPrecioFinal(p.precio, cupon);
    currentBuyProduct = { ...p, qty, precioFinal: precioUnitario };
    
    document.getElementById('whatsappProductInfo').innerHTML = `
        <div style="display:flex;gap:12px;align-items:center;">
            <img src="${p.imagen || 'https://cdn-icons-png.flaticon.com/512/685/685655.png'}" style="width:60px;height:60px;object-fit:cover;border-radius:12px" onerror="this.src='https://cdn-icons-png.flaticon.com/512/685/685655.png'">
            <div>
                <p style="font-weight:700;font-size:13px">${p.nombre}</p>
                <p style="font-size:11px;color:#8b8b94">Cantidad: ${qty}</p>
                <p style="font-size:14px;font-weight:800;color:var(--primary)">Total: RD$ ${(precioUnitario * qty).toLocaleString()}</p>
            </div>
        </div>`;
    toggleWhatsAppModal(true);
}

function toggleWhatsAppModal(s) {
    document.getElementById("whatsappModal")?.classList.toggle("open", s);
    document.getElementById("globalOverlay")?.classList.toggle("open", s);
}

async function confirmWhatsAppBuy() {
    if (!currentBuyProduct) return;
    const btn = document.querySelector('#whatsappModal .btn-whatsapp');
    if (btn) { btn.innerHTML = '⏳ Procesando...'; btn.disabled = true; }
    
    const p = currentBuyProduct;
    const carritoDirecto = [{ id: p.id, nombre: p.nombre, precio: p.precioFinal, precioOriginal: Number(p.precio), qty: p.qty }];
    const tempId = "NX-" + Date.now().toString(36).toUpperCase();
    const msg = generarMensajePedido(tempId, carritoDirecto);
    
    window.open(`https://wa.me/${dbConfig.WhatsApp}?text=${encodeURIComponent(msg)}`, "_blank");
    await NexusCore.ejecutar('procesarPedido', { carrito: carritoDirecto, cliente: "Cliente Web", cupon: cuponAplicado?.codigo });
    
    if (btn) { btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"></svg> Enviar Pedido'; btn.disabled = false; }
    toggleWhatsAppModal(false);
}

// Carrito
function addCart(id, fromDetail = false) {
    const p = dbProductos.find(x => x.id == id);
    const q = parseInt(document.getElementById(fromDetail ? 'qty-det' : `qty-${id}`)?.innerText || '1');
    if (Number(p.stock) < q) return NexusDialog.alert("Stock insuficiente", "Stock");
    
    const exist = carrito.find(x => x.id == id);
    if (exist) exist.qty += q;
    else carrito.push({ ...p, precio: Number(p.precio), precioOriginal: Number(p.precio), qty: q });
    
    localStorage.setItem('nexus_cart', JSON.stringify(carrito));
    actualizarCarritoUI();
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    if (fromDetail) closeAllModals();
    mostrarToast('Agregado al carrito');
}

function mostrarToast(msg) {
    const existente = document.querySelector('.toast-notification');
    if (existente) existente.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<span>✅</span><span>${msg}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 2500);
}

function actualizarCarritoUI() {
    let subtotal = 0, descuento = 0;
    const cartList = document.getElementById("cartList");
    
    if (cartList) {
        if (carrito.length === 0) {
            cartList.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">🛒</div><p class="cart-empty-text">Tu carrito está vacío</p></div>';
        } else {
            cartList.innerHTML = carrito.map(i => {
                const orig = i.precioOriginal || i.precio;
                let final = orig;
                if ((cuponAplicado?.tipo === 'producto' || cuponAplicado?.tipo === 'regalo_unico') && cuponAplicado.producto_id == i.id) {
                    final = calcularPrecioFinal(orig, cuponAplicado);
                    descuento += (orig - final) * i.qty;
                }
                subtotal += orig * i.qty;
                const precioMostrar = descuento > 0 ? `<span style="text-decoration:line-through;font-size:11px;color:#5a5a64">RD$ ${orig}</span> RD$ ${final}` : `RD$ ${final}`;
                return `<div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${i.nombre}</div>
                        <div class="cart-item-price">${i.qty} x ${precioMostrar}</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="cart-qty-btn" onclick="changeQty('${i.id}',-1)">-</button>
                        <button class="cart-remove-btn" onclick="remover('${i.id}')">✕</button>
                    </div>
                </div>`;
            }).join("");
        }
    }
    
    if (cuponAplicado?.tipo === 'descuento') {
        descuento = cuponAplicado.descuento_tipo === 'porcentaje' ? subtotal * (Number(cuponAplicado.descuento_valor) / 100) : Math.min(subtotal, Number(cuponAplicado.descuento_valor));
    } else if (cuponAplicado?.tipo === 'giftcard') {
        descuento = Math.min(subtotal, Number(cuponAplicado.descuento_valor));
    }
    
    const total = Math.max(0, subtotal - descuento);
    document.getElementById("cartSubtotal").innerText = "RD$ " + subtotal.toLocaleString();
    document.getElementById("cartDiscount").innerText = "-RD$ " + descuento.toLocaleString();
    document.getElementById("couponDiscountRow").classList.toggle('show', descuento > 0);
    document.getElementById("cartTotal").innerText = "RD$ " + total.toLocaleString();
    document.getElementById("cartCount").innerText = carrito.reduce((a, b) => a + b.qty, 0);
}

function changeQty(id, delta) {
    const item = carrito.find(x => x.id == id);
    if (item) { item.qty = Math.max(1, item.qty + delta); localStorage.setItem('nexus_cart', JSON.stringify(carrito)); actualizarCarritoUI(); }
}

function remover(id) {
    carrito = carrito.filter(x => x.id != id);
    localStorage.setItem('nexus_cart', JSON.stringify(carrito));
    actualizarCarritoUI();
}

function toggleCart(s) {
    document.getElementById("cartModal")?.classList.toggle("open", s);
    document.getElementById("globalOverlay")?.classList.toggle("open", s);
}

function toggleDetail(s) {
    document.getElementById("detailModal")?.classList.toggle("open", s);
    document.getElementById("globalOverlay")?.classList.toggle("open", s);
}

function closeAllModals() {
    toggleCart(false); toggleDetail(false); toggleWhatsAppModal(false);
    document.getElementById("surpriseModal")?.classList.remove("open");
}

function filtrarBusqueda() {
    renderizarProductos(getFilteredProducts());
}

// Sistema de Cupones
async function applyCoupon() {
    const inputEl = document.getElementById('couponInput');
    const msgEl = document.getElementById('couponMessage');
    if (!inputEl || !msgEl) return;
    
    const code = inputEl.value.trim().toUpperCase();
    if (!code) {
        cuponAplicado = null;
        localStorage.removeItem('nexus_coupon');
        actualizarCarritoUI();
        renderizarProductos(getFilteredProducts());
        return;
    }
    
    const cupon = dbCupones.find(c => (c.activo === 'Si' || c.activo === 'Sí') && c.codigo.toUpperCase() === code);
    if (!cupon) {
        msgEl.innerText = '❌ Cupón inválido';
        msgEl.className = 'coupon-message error';
        return;
    }
    
    if (cupon.tipo === 'regalo_unico' && cupon.descuento_tipo === 'gratis') {
        msgEl.innerHTML = '🎁 Aplicando regalo...';
        msgEl.className = 'coupon-message success';
        
        const p = dbProductos.find(x => x.id == cupon.producto_id);
        if (p) {
            const nuevos = carrito.filter(i => i.precio !== 0);
            carrito = [...nuevos, { id: p.id, nombre: p.nombre, precio: 0, precioOriginal: p.precio, qty: 1 }];
            localStorage.setItem('nexus_cart', JSON.stringify(carrito));
            
            try {
                await NexusCore.ejecutar('deleteCoupon', { id: cupon.id });
            } catch (e) { }
            
            if (cupon.mensaje_sorpresa) {
                document.getElementById("surpriseTitle").innerText = "💌 ¡TIENES UN MENSAJE!";
                document.getElementById("surpriseMsg").innerText = '"' + cupon.mensaje_sorpresa + '"';
            }
            
            document.getElementById("surpriseModal").classList.add("open");
            document.getElementById("globalOverlay").classList.add("open");
            
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
            
            cuponAplicado = cupon;
            msgEl.innerHTML = '✅ ' + (cupon.nombre || '¡REGALO!');
            actualizarCarritoUI();
            renderizarProductos(getFilteredProducts());
        }
        return;
    }
    
    cuponAplicado = cupon;
    localStorage.setItem('nexus_coupon', JSON.stringify(cupon));
    msgEl.innerHTML = '✅ ' + (cupon.nombre || 'Descuento');
    msgEl.className = 'coupon-message success';
    inputEl.style.borderColor = 'var(--primary)';
    actualizarCarritoUI();
    renderizarProductos(getFilteredProducts());
}

// Mensaje Pedido
function generarMensajePedido(idPedido, items) {
    let subtotal = 0, descuento = 0;
    let msg = `🛍️ *PEDIDO - #${idPedido}*\n\n`;
    
    items.forEach(i => {
        const orig = i.precioOriginal || i.precio;
        
        // Calcular precio final con cupón si aplica
        let finalPrice = orig;
        let tieneDescuento = false;
        
        if (cuponAplicado) {
            // Cupón de producto específico
            if ((cuponAplicado.tipo === 'producto' || cuponAplicado.tipo === 'regalo_unico') && cuponAplicado.producto_id == i.id) {
                finalPrice = calcularPrecioFinal(orig, cuponAplicado);
                descuento += (orig - finalPrice) * i.qty;
                tieneDescuento = true;
            }
        }
        
        subtotal += orig * i.qty;
        
        // Mostrar precio original y precio con descuento
        if (tieneDescuento && finalPrice === 0) {
            msg += `▪️ ${i.nombre}\n   ${i.qty} x RD$ ${Number(orig).toLocaleString()} 🎁 REGALO\n\n`;
        } else if (tieneDescuento && finalPrice < orig) {
            msg += `▪️ ${i.nombre}\n   ${i.qty} x RD$ ${Number(orig).toLocaleString()} → RD$ ${Number(finalPrice).toLocaleString()}\n\n`;
        } else {
            msg += `▪️ ${i.nombre}\n   ${i.qty} x RD$ ${Number(orig).toLocaleString()}\n\n`;
        }
    });
    
    // Cupones globales (descuento general, giftcard)
    if (cuponAplicado && !descuento) {
        if (cuponAplicado.tipo === 'descuento') {
            descuento = cuponAplicado.descuento_tipo === 'porcentaje' 
                ? subtotal * (Number(cuponAplicado.descuento_valor) / 100) 
                : Math.min(subtotal, Number(cuponAplicado.descuento_valor));
        } else if (cuponAplicado.tipo === 'giftcard') {
            descuento = Math.min(subtotal, Number(cuponAplicado.descuento_valor));
        }
    }
    
    if (descuento > 0 || (cuponAplicado && cuponAplicado.tipo === 'regalo_unico')) {
        msg += `🎟️ Cupón: ${cuponAplicado.codigo}\n💰 Descuento: RD$ ${Number(descuento).toLocaleString()}\n\n`;
    }
    
    msg += `💰 *TOTAL: RD$ ${Math.max(0, subtotal - descuento).toLocaleString()}*\n\n📍 *Ubicación para cotizar envío*`;
    return msg;
}

// Enviar Carrito
async function enviarWhatsApp() {
    if (!carrito.length) return;
    const btn = document.getElementById('btnCheckout');
    if (btn) { btn.innerHTML = '⏳ Procesando...'; btn.disabled = true; }
    
    const tempId = "NX-" + Date.now().toString(36).toUpperCase();
    const msg = generarMensajePedido(tempId, carrito);
    const cuponCode = cuponAplicado ? cuponAplicado.codigo : null;
    
    window.open("https://wa.me/" + dbConfig.WhatsApp + "?text=" + encodeURIComponent(msg), "_blank");
    await NexusCore.ejecutar('procesarPedido', { carrito, cliente: "Cliente Web", cupon: cuponCode });
    
    cuponAplicado = null;
    localStorage.removeItem('nexus_coupon');
    carrito = [];
    localStorage.removeItem('nexus_cart');
    
    setTimeout(() => window.location.reload(), 1500);
    if (btn) { btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"></svg> Confirmar Pedido'; btn.disabled = false; }
}

// Init
window.onload = cargarTienda;