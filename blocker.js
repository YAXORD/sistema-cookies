(function() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ dataLayer.push(arguments); };

    // Estilos modernos
    const styles = `
        #mi-banner-cookies { position: fixed; bottom: 0; left: 0; width: 100%; background: #ffffff; padding: 25px; box-shadow: 0 -5px 20px rgba(0,0,0,0.15); z-index: 999999; font-family: sans-serif; box-sizing: border-box; }
        .btn { padding: 12px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; margin: 5px; }
        .btn-primary { background: #007bff; color: white; }
        .btn-secondary { background: #e9ecef; color: #333; }
        .btn-outline { background: transparent; border: 1px solid #ced4da; }
        #settings-panel { margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; display: none; }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    function crearBanner() {
        if (document.getElementById('mi-banner-cookies')) return;
        
        const banner = document.createElement('div');
        banner.id = 'mi-banner-cookies';
        banner.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <h3 style="margin:0 0 10px 0;">Configuración de Privacidad</h3>
                <p style="margin-bottom: 15px; color: #666; font-size: 14px;">Usamos cookies para mejorar tu experiencia. Tú tienes el control total.</p>
                <div id="main-actions">
                    <button class="btn btn-secondary" onclick="toggleSettings()">Ajustes</button>
                    <button class="btn btn-outline" onclick="actualizarConsentimiento('rechazo')">Rechazar Todo</button>
                    <button class="btn btn-primary" onclick="actualizarConsentimiento('todo')">Aceptar Todo</button>
                </div>
                <div id="settings-panel">
                    <label><input type="checkbox" checked disabled> Necesarias (Siempre activo)</label><br>
                    <label><input type="checkbox" id="check-analytics" checked> Analítica y Rendimiento</label><br>
                    <label><input type="checkbox" id="check-marketing" checked> Marketing y Publicidad</label><br>
                    <button class="btn btn-primary" onclick="guardarAjustes()" style="margin-top:10px;">Guardar cambios</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);
    }

    window.toggleSettings = () => {
        const panel = document.getElementById('settings-panel');
        panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
    };

    window.guardarAjustes = () => {
        const analitica = document.getElementById('check-analytics').checked;
        const marketing = document.getElementById('check-marketing').checked;
        
        gtag('consent', 'update', {
            'analytics_storage': analitica ? 'granted' : 'denied',
            'ad_storage': marketing ? 'granted' : 'denied',
            'ad_user_data': marketing ? 'granted' : 'denied',
            'ad_personalization': marketing ? 'granted' : 'denied'
        });
        document.getElementById('mi-banner-cookies').style.display = 'none';
        localStorage.setItem('cookies_decision', 'configurado');
    };

    window.actualizarConsentimiento = (opcion) => {
        const granted = (opcion === 'todo') ? 'granted' : 'denied';
        gtag('consent', 'update', {
            'analytics_storage': granted,
            'ad_storage': granted,
            'ad_user_data': granted,
            'ad_personalization': granted
        });
        document.getElementById('mi-banner-cookies').style.display = 'none';
        localStorage.setItem('cookies_decision', 'decidido');
    };

    if (!localStorage.getItem('cookies_decision')) {
        document.addEventListener('DOMContentLoaded', crearBanner);
    }
})();