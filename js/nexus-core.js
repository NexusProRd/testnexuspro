/**
 * NEXUS CORE V4.2 - El Cerebro Lógico
 * ARQUITECTURA: PCC (Panel de Control Central)
 */

const NexusCore = {

    async ejecutar(accion, datos = {}) {
        try {
            const resultado = await NEXUS_CONFIG.call(accion, datos);

            if (resultado.message === 'ACCESO_DENEGADO') {
                this.bloquearTienda();
                return { success: false, message: 'ACCESO_DENEGADO' };
            }

            if (!resultado.success) {
                console.error("Error en Motor Satelite:", resultado.message);
                return { success: false, message: resultado.message };
            }

            return resultado;

        } catch (error) {
            console.error("Error crítico de conexión:", error);
            return { success: false, message: "No se pudo conectar con el Motor Satelite." };
        }
    },

    bloquearTienda() {
        const htmlBloqueo = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Acceso Denegado - Nexus Pro</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #fff;
                    }
                    .bloqueo-container {
                        text-align: center;
                        padding: 40px;
                        max-width: 500px;
                    }
                    .bloqueo-icono {
                        width: 120px;
                        height: 120px;
                        margin: 0 auto 30px;
                        background: rgba(239, 68, 68, 0.15);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .bloqueo-icono svg {
                        width: 60px;
                        height: 60px;
                        fill: #ef4444;
                    }
                    .bloqueo-titulo {
                        font-size: 28px;
                        font-weight: 700;
                        margin-bottom: 16px;
                        color: #fca5a5;
                    }
                    .bloqueo-mensaje {
                        font-size: 16px;
                        line-height: 1.6;
                        color: #9ca3af;
                        margin-bottom: 30px;
                    }
                    .bloqueo-footer {
                        font-size: 14px;
                        color: #6b7280;
                    }
                </style>
            </head>
            <body>
                <div class="bloqueo-container">
                    <div class="bloqueo-icono">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
                        </svg>
                    </div>
                    <h1 class="bloqueo-titulo">Acceso Denegado</h1>
                    <p class="bloqueo-mensaje">
                        Esta tienda se encuentra suspendida o el dominio no está autorizado.<br>
                        Contacte al administrador.
                    </p>
                    <p class="bloqueo-footer">Nexus Pro © 2026</p>
                </div>
            </body>
            </html>
        `;

        document.body.innerHTML = htmlBloqueo;
        document.body.style.overflow = 'hidden';
    },

    archivoABase64: (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    }),

    formatearRD: (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
        }).format(monto);
    },

    generarCodigoCupón: (longitud = 8) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for(let i = 0; i < longitud; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
};