(function() {
    // 0. Limpieza previa (por si lo ejecutas varias veces)
    const elementsToRemove = ['cookie-banner-bar', 'cookie-modal-overlay', 'cookie-float-btn', 'cookie-styles'];
    elementsToRemove.forEach(id => { const el = document.getElementById(id); if(el) el.remove(); });

    // 1. Inicialización de Consentimiento (Google Consent Mode v2 - G100 por defecto)
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ dataLayer.push(arguments); };
    gtag('consent', 'default', {
        'analytics_storage': 'denied', 'ad_storage': 'denied', 'ad_user_data': 'denied', 'ad_personalization': 'denied'
    });

    // 2. Inyectar Estilos Avanzados (Modern Flow + Switches)
    const style = document.createElement('style');
    style.id = 'cookie-styles';
    style.innerHTML = `
        /* Estilos base */
        .cookie-btn { padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-family: sans-serif; transition: 0.2s; font-size: 14px; }
        .cookie-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .cookie-btn-primary { background-color: #007bff; color: white; }
        .cookie-btn-secondary { background-color: #e9ecef; color: #333; margin-right: 8px; }
        .cookie-btn-danger { background: none; color: #dc3545; font-size: 12px; padding: 0; }

        /* 1. BANNER INFERIOR (Flujo inicial) */
        #cookie-banner-bar { position: fixed; bottom: 0; left: 0; width: 100%; background: #fff; box-shadow: 0 -4px 15px rgba(0,0,0,0.1); z-index: 99999999; padding: 15px 25px; display: none; align-items: center; justify-content: space-between; font-family: sans-serif; box-sizing: border-box; }
        #cookie-banner-bar p { margin: 0; color: #333; font-size: 14px; }

        /* 2. MODAL DE AJUSTES (Centrado con Toggles) */
        #cookie-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 999999999; display: none; align-items: center; justify-content: center; font-family: sans-serif; }
        #cookie-modal-card { background: #fff; padding: 30px; border-radius: 16px; width: 90%; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .cookie-modal-header h3 { margin: 0 0 10px 0; font-size: 18px; }
        .cookie-modal-body p { color: #666; font-size: 13px; margin: 0 0 20px 0; }
        
        /* Estilos del Switch (Toggle) estilo iOS */
        .switch-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-size: 14px; color: #333; }
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #007bff; }
        input:checked + .slider:before { transform: translateX(20px); }

        /* 3. BOTÓN FLOTANTE (Reapertura) */
        #cookie-float-btn { position: fixed; bottom: 20px; right: 20px; z-index: 9999998; width: 50px; height: 50px; border-radius: 50%; background: #333; color: white; border: none; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 22px; display: none; }
    `;
    document.head.appendChild(style);

    // 3. Crear Estructura HTML (Banner, Modal y Botón Galleta)
    
    // a. Banner Inferior (Inicial)
    const banner = document.createElement('div');
    banner.id = 'cookie-banner-bar';
    banner.innerHTML = `
        <p>Usamos cookies para mejorar tu experiencia. ¿Nos das permiso?</p>
        <div style="display:flex; align-items:center;">
            <button class="cookie-btn cookie-btn-secondary" onclick="window.abrirAjustes()" style="font-size:12px;">Ajustes</button>
            <button class="cookie-btn cookie-btn-primary" onclick="window.gestionarConsentimiento('todo')">Aceptar Todo</button>
        </div>
    `;
    document.body.appendChild(banner);

    // b. Modal de Ajustes (Switches)
    const overlay = document.createElement('div');
    overlay.id = 'cookie-modal-overlay';
    overlay.innerHTML = `
        <div id="cookie-modal-card">
            <div class="cookie-modal-header"><h3>Configuración de privacidad</h3></div>
            <div class="cookie-modal-body">
                <p>Elige qué datos nos permites usar.</p>
                <div class="switch-container"><span>Necesarias</span> <input type="checkbox" checked disabled style="width:20px;height:20px;"></div>
                <div class="switch-container"><span>Analítica</span> <label class="switch"><input type="checkbox" id="cook-ana" checked><span class="slider"></span></label></div>
                <div class="switch-container"><span>Marketing</span> <label class="switch"><input type="checkbox" id="cook-ads" checked><span class="slider"></span></label></div>
                <p style="font-size:11px; margin-top:15px; color:#999; text-align:center;"><u>Política de cookies</u></p>
            </div>
            <div class="cookie-modal-footer" style="text-align:center; margin-top:20px;">
                <button class="cookie-btn cookie-btn-secondary" onclick="window.gestionarConsentimiento('rechazo')" style="width:100%; margin-bottom:10px;">Rechazar</button>
                <button class="cookie-btn cookie-btn-primary" onclick="window.gestionarConsentimiento('custom')" style="width:100%;">Guardar ajustes</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // c. Botón flotante
    const floatBtn = document.createElement('button');
    floatBtn.id = 'cookie-float-btn';
    floatBtn.innerHTML = '🍪';
    floatBtn.onclick = () => { overlay.style.display = 'flex'; };
    document.body.appendChild(floatBtn);

    // 4. Lógica de Flujo y Consentimiento
    
    // Función para abrir el modal desde el banner o la galleta
    window.abrirAjustes = function() {
        banner.style.display = 'none'; // Ocultamos el banner
        overlay.style.display = 'flex'; // Mostramos el modal
    }

    // Función maestra de guardado (G111)
    window.gestionarConsentimiento = (tipo) => {
        const ana = document.getElementById('cook-ana').checked;
        const ads = document.getElementById('cook-ads').checked;

        // Si es 'rechazo', ana y ads se fuerzan a 'false'
        const ana_final = (tipo === 'rechazo') ? false : ((tipo === 'todo') ? true : ana);
        const ads_final = (tipo === 'rechazo') ? false : ((tipo === 'todo') ? true : ads);

        const consentimiento = {
            'analytics_storage': ana_final ? 'granted' : 'denied',
            'ad_storage': ads_final ? 'granted' : 'denied',
            'ad_user_data': ads_final ? 'granted' : 'denied',
            'ad_personalization': ads_final ? 'granted' : 'denied'
        };

        // Enviar señal a Google
        gtag('consent', 'update', consentimiento);
        
        // Cerrar todo y mostrar galleta
        banner.style.display = 'none';
        overlay.style.display = 'none';
        floatBtn.style.display = 'block';
        
        // Guardar decisión
        localStorage.setItem('cookie_decision_made', 'true');
        console.log("Consentimiento actualizado (G111):", consentimiento);
        alert('Tus preferencias han sido guardadas. InfoTrust detectará G111.');
    };

    // 5. Inicialización
    if (!localStorage.getItem('cookie_decision_made')) {
        // Primera vez: Mostrar banner inferior
        banner.style.display = 'flex';
    } else {
        // Decision ya tomada: Solo mostrar galleta
        floatBtn.style.display = 'block';
    }
})();