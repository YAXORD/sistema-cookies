(function() {
    // 1. Configuración de Gtag (Google Consent Mode)
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ dataLayer.push(arguments); };

    // 2. Inyección de Estilos Profesionales
    const style = document.createElement('style');
    style.innerHTML = `
        #mi-banner-cookies { position: fixed !important; bottom: 0 !important; left: 0 !important; width: 100% !important; background: #fff !important; z-index: 99999999 !important; padding: 20px !important; box-shadow: 0 -5px 15px rgba(0,0,0,0.2) !important; font-family: sans-serif !important; border-top: 4px solid #007bff !important; }
        .btn-cookie { padding: 12px 24px !important; border-radius: 6px !important; border: none !important; cursor: pointer !important; margin: 5px !important; font-weight: 600 !important; font-size: 14px !important; }
        .btn-blue { background: #007bff !important; color: white !important; }
        .btn-red { background: #dc3545 !important; color: white !important; }
        .btn-grey { background: #6c757d !important; color: white !important; }
        .settings-row { margin: 10px 0; text-align: left; }
    `;
    document.head.appendChild(style);

    // 3. Crear Estructura del Banner
    function crearBanner() {
        if (document.getElementById('mi-banner-cookies')) return;
        const div = document.createElement('div');
        div.id = 'mi-banner-cookies';
        div.innerHTML = `
            <div style="max-width: 600px; margin: auto; text-align: center;">
                <h2 style="margin-top:0;">Configuración de Cookies</h2>
                <p style="font-size: 14px; color: #555;">Utilizamos cookies propias y de terceros para mejorar tu experiencia. Tú decides qué compartes.</p>
                
                <div id="main-btns">
                    <button class="btn-cookie btn-red" onclick="aplicarConsentimiento('rechazo')">Rechazar Todo</button>
                    <button class="btn-cookie btn-blue" onclick="aplicarConsentimiento('todo')">Aceptar Todo</button>
                    <button class="btn-cookie btn-grey" onclick="toggleAjustes()">Ajustes</button>
                </div>

                <div id="ajustes-panel" style="display:none; margin-top:15px; padding-top:15px; border-top:1px solid #ddd;">
                    <div class="settings-row"><input type="checkbox" checked disabled> <strong>Necesarias</strong> (Siempre activas)</div>
                    <div class="settings-row"><input type="checkbox" id="check-ana" checked> Analítica (Rendimiento)</div>
                    <div class="settings-row"><input type="checkbox" id="check-ads" checked> Marketing y Publicidad</div>
                    <button class="btn-cookie btn-blue" onclick="guardarAjustes()">Guardar Cambios</button>
                </div>
                
                <div style="margin-top:15px; font-size: 12px;">
                    <a href="#" style="color: #666; text-decoration: underline;">Política de Cookies</a>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    }

    // 4. Funciones de Lógica
    window.toggleAjustes = () => {
        const panel = document.getElementById('ajustes-panel');
        panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
    };

    window.aplicarConsentimiento = (tipo) => {
        const isGranted = (tipo === 'todo');
        gtag('consent', 'update', {
            'analytics_storage': isGranted ? 'granted' : 'denied',
            'ad_storage': isGranted ? 'granted' : 'denied',
            'ad_user_data': isGranted ? 'granted' : 'denied',
            'ad_personalization': isGranted ? 'granted' : 'denied'
        });
        document.getElementById('mi-banner-cookies').style.display = 'none';
        localStorage.setItem('cookies_decision', 'ok');
    };

    window.guardarAjustes = () => {
        gtag('consent', 'update', {
            'analytics_storage': document.getElementById('check-ana').checked ? 'granted' : 'denied',
            'ad_storage': document.getElementById('check-ads').checked ? 'granted' : 'denied',
            'ad_user_data': document.getElementById('check-ads').checked ? 'granted' : 'denied',
            'ad_personalization': document.getElementById('check-ads').checked ? 'granted' : 'denied'
        });
        document.getElementById('mi-banner-cookies').style.display = 'none';
        localStorage.setItem('cookies_decision', 'ok');
    };

    // 5. Carga Segura
    if (document.body) { crearBanner(); } else { window.addEventListener('load', crearBanner); }
})();