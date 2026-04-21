(function() {
    // 1. Inicialización Universal de Google
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ dataLayer.push(arguments); };

    // 2. Estado inicial por defecto
    gtag('consent', 'default', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
    });

    // 3. Lógica para crear el Banner
    function crearBanner() {
        if (document.getElementById('mi-banner-cookies')) return;
        
        const banner = document.createElement('div');
        banner.id = 'mi-banner-cookies';
        banner.style = "position:fixed; bottom:0; width:100%; background:#fff; padding:20px; box-shadow:0 -2px 10px rgba(0,0,0,0.1); z-index:9999;";
        banner.innerHTML = `
            <div style="text-align:center;">
                <p>Este sitio utiliza cookies para garantizar el cumplimiento del RGPD y Consent Mode v2.</p>
                <button onclick="actualizarConsentimiento('rechazo')" style="padding:10px 20px; margin:5px;">Rechazar</button>
                <button onclick="actualizarConsentimiento('todo')" style="padding:10px 20px; margin:5px; background:blue; color:white;">Aceptar Todo</button>
            </div>
        `;
        document.body.appendChild(banner);
    }

    // 4. Función Maestra
    window.actualizarConsentimiento = function(opcion) {
        if (opcion === 'todo') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted',
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted'
            });
            localStorage.setItem('cookies_decision', 'acepto_todo');
        } else {
            localStorage.setItem('cookies_decision', 'rechazo');
        }
        
        gtag('event', 'consent_update');
        
        // Ocultar banner
        const banner = document.getElementById('mi-banner-cookies');
        if(banner) banner.style.display = 'none';
    };

    // --- ¡ESTO ES LO QUE TE FALTABA! ---
    // Ejecutar el banner si no hay decisión previa
    if (!localStorage.getItem('cookies_decision')) {
        // Esperamos a que la web cargue para que el body exista
        if (document.body) {
            crearBanner();
        } else {
            document.addEventListener('DOMContentLoaded', crearBanner);
        }
    }
})();