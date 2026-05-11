(function () {
    // 1. COMPROBAR SI YA EXISTE CONSENTIMIENTO (PERSISTENCIA)
    const consentSaved = localStorage.getItem('mi_cookie_consent');

    // 2. INICIALIZACIÓN DE GTAG Y SEÑAL G100
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    // Si no hay consentimiento, lanzamos el default (G100)
    if (!consentSaved) {
        gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'personalization_storage': 'denied',
            'functionality_storage': 'granted',
            'security_storage': 'granted'
        });
        gtag('js', new Date());
        gtag('config', 'G-B67TFXZRE7', { 'debug_mode': true });
    }

    // 3. FUNCIÓN PARA CREAR LA UI (Banner, Modal y Galleta)
    const initUI = () => {
        ['cm-container', 'cm-style', 'cookie-float-btn', 'cm-modal-div'].forEach(id => {
            const el = document.getElementById(id); if (el) el.remove();
        });

        // Inyectar Estilos
        const style = document.createElement('style');
        style.id = 'cm-style';
        style.innerHTML = `
            #cm-container { position: fixed !important; bottom: 0 !important; left: 0 !important; width: 100% !important; z-index: 999999999 !important; font-family: sans-serif !important; }
            #cm-banner { background: #fff !important; padding: 20px !important; box-shadow: 0 -5px 15px rgba(0,0,0,0.1) !important; display: ${consentSaved ? 'none' : 'flex'} !important; align-items: center !important; justify-content: space-between !important; border-top: 3px solid #0056b3 !important; }
            #cm-modal-div { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: rgba(0,0,0,0.7) !important; display: none; align-items: center; justify-content: center; z-index: 9999999999 !important; }
            .cm-card { background: #fff !important; padding: 30px !important; border-radius: 16px !important; width: 90% !important; max-width: 400px !important; text-align: center !important; }
            .btn { padding: 12px 20px !important; border-radius: 8px !important; border: none !important; cursor: pointer !important; font-weight: 600 !important; margin: 5px !important; }
            .cookie-row { display: flex; justify-content: space-between; align-items: center; margin: 15px 0; padding-bottom: 8px; border-bottom: 1px solid #eee; }
            #cookie-float-btn { position: fixed !important; top: 50% !important; left: 0 !important; transform: translateY(-50%) !important; z-index: 99999998 !important; width: 45px !important; height: 50px !important; border-radius: 0 10px 10px 0 !important; background: #333 !important; display: ${consentSaved ? 'block' : 'none'}; cursor: pointer !important; border: none !important; font-size: 22px !important; }
        `;
        document.head.appendChild(style);

        // Crear Modal
        const modal = document.createElement('div');
        modal.id = 'cm-modal-div';
        modal.innerHTML = `<div class="cm-card">
            <h3>Ajustes de Cookies</h3>
            <div style="text-align:left; margin: 20px 0;">
                <div class="cookie-row"><span><strong>Necesarias</strong></span> <input type="checkbox" checked disabled></div>
                <div class="cookie-row"><span>Analíticas</span> <input type="checkbox" id="c-ana" checked></div>
                <div class="cookie-row"><span>Rendimiento</span> <input type="checkbox" id="c-rend" checked></div>
                <div class="cookie-row"><span>Marketing</span> <input type="checkbox" id="c-ads" checked></div>
            </div>
            <button id="btn-save" class="btn" style="width:100%; background:#0056b3; color:white;">Guardar Selección</button>
        </div>`;
        document.body.appendChild(modal);

        // Crear Banner
        const container = document.createElement('div');
        container.id = 'cm-container';
        container.innerHTML = `<div id="cm-banner">
            <div style="max-width: 60%;"><strong>Privacidad</strong><p style="font-size:12px; margin:5px 0 0 0;">Configura tus cookies.</p></div>
            <div style="display:flex;">
                <button id="btn-ajustes" class="btn" style="background:#eee;">Ajustes</button>
                <button id="btn-rechazar" class="btn" style="background:#f8f9fa;">Solo Necesarias</button>
                <button id="btn-aceptar" class="btn" style="background:#0056b3; color:white;">Aceptar Todo</button>
            </div>
        </div>`;
        document.body.appendChild(container);

        // Crear Galleta
        const floatBtn = document.createElement('button');
        floatBtn.id = 'cookie-float-btn';
        floatBtn.innerHTML = '🍪';
        document.body.appendChild(floatBtn);

        // 4. Lógica de Consentimiento (G111)
        const handleConsent = (tipo) => {
            const ana = (tipo === 'rechazo') ? false : (tipo === 'todo' ? true : document.getElementById('c-ana').checked);
            const ads = (tipo === 'rechazo') ? false : (tipo === 'todo' ? true : document.getElementById('c-ads').checked);
            const rend = (tipo === 'rechazo') ? false : (tipo === 'todo' ? true : document.getElementById('c-rend').checked);

            const data = {
                'analytics_storage': ana ? 'granted' : 'denied',
                'ad_storage': ads ? 'granted' : 'denied',
                'ad_user_data': ads ? 'granted' : 'denied',
                'ad_personalization': ads ? 'granted' : 'denied',
                'personalization_storage': rend ? 'granted' : 'denied',
                'functionality_storage': 'granted',
                'security_storage': 'granted'
            };

            gtag('consent', 'update', data);
            localStorage.setItem('mi_cookie_consent', JSON.stringify(data));

            // Ocultamos el contenedor del banner blanco para siempre
            const bannerContainer = document.getElementById('cm-container');
            if (bannerContainer) bannerContainer.style.setProperty('display', 'none', 'important');

            modal.style.display = 'none';
            floatBtn.style.display = 'block';
        };

        // Eventos
        document.getElementById('btn-ajustes').onclick = () => modal.style.display = 'flex';
        document.getElementById('btn-aceptar').onclick = () => handleConsent('todo');
        document.getElementById('btn-rechazar').onclick = () => handleConsent('rechazo');
        document.getElementById('btn-save').onclick = () => handleConsent('custom');

        // Al pulsar la galleta, SOLO abrimos el modal de ajustes
        floatBtn.onclick = () => {
            modal.style.display = 'flex';
        };
    };

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }
})();