// config.js - NEXUS PRO V6.0 - DINÁMICO CON PCC
const NEXUS_CONFIG = {
    // ==========================================
    // URL DEL MASTER CONTROLLER (PCC)
    // ==========================================
    PCC_URL: "https://script.google.com/macros/s/AKfycbxikMAM8onAKt8mDPS-VXfw5M3myiHMFfUbz3t_QaMWrU9V_qvO2ZoP-RD19N6qplnMwQ/exec",
    
    // URL del Motor Satelite (fallback si PCC no responde)
    MOTOR_FALLBACK: "https://script.google.com/macros/s/AKfycbwr3K5qcSQvmEb1qhoeM0L9E26k1nSHTjmBdoehu3vRcssLltMInwM4AaWw34ZOuKEF/exec",

    // Variables dinámicas
    API_URL: null,
    shopId: null,
    isReady: false,
    isSuspended: false,

    // ==========================================
    // INICIALIZACIÓN ASÍNCRONA
    // ==========================================
init: async function() {
        const params = new URLSearchParams(window.location.search);
        const identifier = params.get('s');

        if (!identifier) {
            this.mostrarError("Tienda no encontrada", "No se especificó el parámetro 's' en la URL.");
            return false;
        }

        try {
            // Intentar obtener datos del cliente desde PCC
            const response = await fetch(this.PCC_URL, {
                method: "POST",
                body: JSON.stringify({ action: 'obtenerClientes' }),
                redirect: "follow"
            });

            const text = await response.text();
            const data = JSON.parse(text);

            if (data.clients) {
                const cliente = data.clients.find(c => 
                    c.nombre && c.nombre.toLowerCase().trim() === identifier.toLowerCase().trim()
                );

                if (cliente) {
                    this.shopId = cliente.sheetId;
                    this.pccShopId = cliente.id;
                    
                    // Obtener URL del motor
                    const motorResponse = await fetch(this.PCC_URL, {
                        method: "POST",
                        body: JSON.stringify({ action: 'obtenerMotorPorNombre', nombre: cliente.motor }),
                        redirect: "follow"
                    });
                    const motorData = JSON.parse(await motorResponse.text());
                    
                    this.API_URL = motorData.success ? motorData.url : this.MOTOR_FALLBACK;
                    this.isReady = true;
                    return true;
                }
            }
        } catch (e) {
            // Si falla, usar fallback
        }

        // Fallback: usar motor directo
        this.shopId = identifier;
        this.pccShopId = identifier;
        this.API_URL = this.MOTOR_FALLBACK;
        this.isReady = true;
        return true;
    },

    // ==========================================
    // OBTENER DATOS DEL CLIENTE DESDE PCC
    // ==========================================
    obtenerDatosCliente: async function(identifier) {
        try {
            // Intentar obtener todos los clientes y buscar por nombre/slug
            const response = await fetch(this.PCC_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: 'obtenerClientes'
                }),
                redirect: "follow"
            });

            const text = await response.text();
            let data;

            try {
                data = JSON.parse(text);
            } catch (e) {
                return { success: false, error: 'Error parseando respuesta' };
            }

            if (!data.clients || !Array.isArray(data.clients)) {
                return { success: false, error: 'No se pudieron obtener los clientes' };
            }

            // Buscar cliente por nombre (slug)
            const normalizedId = identifier.toString().toLowerCase().trim();
            const cliente = data.clients.find(c => {
                const nombreNorm = c.nombre ? c.nombre.toString().toLowerCase().trim() : '';
                return nombreNorm === normalizedId || 
                       nombreNorm.replace(/[^a-z0-9]/g, '-') === normalizedId ||
                       c.id === identifier || 
                       c.sheetId === identifier;
            });

            if (!cliente) {
                return { success: false, error: 'Cliente no encontrado' };
            }

            return {
                success: true,
                shopId: cliente.id,
                sheetId: cliente.sheetId,
                nombre: cliente.nombre,
                estado: cliente.estado,
                motor: cliente.motor,
                motorUrl: ''
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==========================================
    // OBTENER URL DEL MOTOR
    // ==========================================
    obtenerUrlMotor: async function(motorNombre) {
        try {
            const response = await fetch(this.PCC_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: 'obtenerMotorPorNombre',
                    nombre: motorNombre
                }),
                redirect: "follow"
            });

            const text = await response.text();
            let data = JSON.parse(text);

            if (data.success && data.url) {
                return data.url;
            }

            return null;

        } catch (error) {
            return null;
        }
    },

    // ==========================================
    // MOSTRAR PANTALLA DE ERROR
    // ==========================================
    mostrarError: function(titulo, mensaje) {
        document.body.innerHTML = `
            <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:20px">
                <div>
                    <h1 style="font-size:2.5rem;margin-bottom:1rem">⚠️ ${titulo}</h1>
                    <p style="opacity:0.7;font-size:1.1rem">${mensaje}</p>
                    <p style="margin-top:2rem;opacity:0.5;font-size:0.9rem">Nexus Pro V6.0</p>
                </div>
            </div>
        `;
    },

    // ==========================================
    // BLOQUEAR TIENDA SUSPENDIDA
    // ==========================================
    bloquearTienda: function() {
        document.body.innerHTML = `
            <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:20px">
                <div>
                    <h1 style="font-size:2.5rem;margin-bottom:1rem">🚫 Tienda Inactiva</h1>
                    <p style="opacity:0.7;font-size:1.1rem">Esta tienda se encuentra temporalmente inactiva.</p>
                    <p style="margin-top:2rem;opacity:0.5;font-size:0.9rem">Contacta al administrador para más información.</p>
                </div>
            </div>
        `;
    },

    // ==========================================
    // GETTERS
    // ==========================================
    getShopId: function() {
        if (!this.isReady) {
            return "PENDIENTE";
        }
        return this.shopId;
    },

    getPin: function() {
        return localStorage.getItem('nexus_pin') || "1234";
    },

    // ==========================================
    // MÉTODO CALL
    // ==========================================
    call: function(action, data) {
        var self = this;

        if (!self.isReady) {
            return Promise.resolve({ success: false, message: "Tienda no inicializada" });
        }

        var payload = {
            action: action,
            shopId: self.getShopId(),
            pccShopId: self.pccShopId || self.getShopId(),
            pin: self.getPin(),
            domain: window.location.host,
            data: data || {}
        };

        return fetch(self.API_URL, {
            method: "POST",
            body: JSON.stringify(payload),
            redirect: "follow"
        }).then(function(response) {
            return response.text();
        }).then(function(text) {
            try {
                return JSON.parse(text);
            } catch(e) {
                if (text.indexOf("Nexus") > -1 && text.indexOf("activo") > -1) {
                    return { success: false, message: "Motor no procesó la solicitud" };
                }
                return { success: false, message: "Error: " + text.substring(0, 100) };
            }
        })["catch"](function(error) {
            return { success: false, message: "Error de conexión" };
        });
    }
};

// ==========================================
// INICIALIZACIÓN AL CARGAR
// ==========================================
(async function() {
    const inicializado = await NEXUS_CONFIG.init();
    
    if (inicializado && typeof window.onNexusReady === 'function') {
        window.onNexusReady();
    }
})();