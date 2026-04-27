(function() {
    // 1. Inicialización de Consentimiento (Google Consent Mode v2)
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ dataLayer.push(arguments); };

    gtag('consent', 'default', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'functionality_storage': 'denied',
        'security_storage': 'granted'
    });

    // 2. Estilos (Modernos, estilo SaaS)
    const style = document.createElement('style');
    style.innerHTML = `
        #cm-overlay { position: fixed !important; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5) !important; z-index: 9999999 !important; display: none; align-items: center; justify-content: center; font-family: sans-serif; }
        #cm-modal { background: #fff !important; width: 90%; max-width: 500px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); overflow: hidden; }
        .cm-header { padding: 20px; border-bottom: 1px solid #eee; text-align: center; }
        .cm-body { padding: 20px; max-height: 300px; overflow-y: auto; }
        .cm-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f9f9f9; }
        .cm-footer { padding: 20px; background: #fdfdfd; text-align: center; }
        .btn-main { width: 100%; padding: 12px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; margin-bottom: 8px; }
        .btn-blue { background: #0056b3; color: white; }
        .btn-grey { background: #e0e0e0; color: #333; }
        #cookie-float-btn { position: fixed; bottom: 20px; right: 20px; z-index: 9999998; width: 50px; height: 50px; border-radius: 50%; background: #0056b3; color: white; border: none; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 20px; }
    `;
    document.head.appendChild(style);

    // 3. Estructura HTML
    const overlay = document.createElement('div');
    overlay.id = 'cm-overlay';
    overlay.innerHTML = `
        <div id="cm-modal">
            <div class="cm-header"><h3>Configuración de privacidad</h3></div>
            <div class="cm-body">
                <p style="font-size: 13px; color: #666;">Gestiona tus permisos de datos.</p>
                <div class="cm-row"><span>Necesarias</span> <input type="checkbox" checked disabled></div>
                <div class="cm-row"><span>Rendimiento</span> <input type="checkbox" id="c-ana"></div>
                <div class="cm-row"><span>Funcionales</span> <input type="checkbox" id="c-fun"></div>
                <div class="cm-row"><span>Publicidad</span> <input type="checkbox" id="c-ads"></div>
                <p style="font-size: 11px; margin-top: 15px;"><u>Política de cookies</u></p>
            </div>
            <div class="cm-footer">
                <button class="btn-main btn-blue" onclick="guardarConsentimiento('todo')">Aceptar todo</button>
                <button class="btn-main btn-grey" onclick="guardarConsentimiento('custom')">Guardar ajustes</button>
                <button class="btn-main" style="background:none;" onclick="guardarConsentimiento('rechazo')">Rechazar</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // 4. Botón flotante
    const floatBtn = document.createElement('button');
    floatBtn.id = 'cookie-float-btn';
    floatBtn.innerHTML = '🍪';
    floatBtn.onclick = () => { overlay.style.display = 'flex'; };
    document.body.appendChild(floatBtn);

    // 5. Lógica de guardado
    window.guardarConsentimiento = (tipo) => {
        const ana = document.getElementById('c-ana').checked;
        const fun = document.getElementById('c-fun').checked;
        const ads = document.getElementById('c-ads').checked;

        const consentimiento = {
            'analytics_storage': (tipo === 'todo' || (tipo === 'custom' && ana)) ? 'granted' : 'denied',
            'functionality_storage': (tipo === 'todo' || (tipo === 'custom' && fun)) ? 'granted' : 'denied',
            'ad_storage': (tipo === 'todo' || (tipo === 'custom' && ads)) ? 'granted' : 'denied',
            'ad_user_data': (tipo === 'todo' || (tipo === 'custom' && ads)) ? 'granted' : 'denied',
            'ad_personalization': (tipo === 'todo' || (tipo === 'custom' && ads)) ? 'granted' : 'denied'
        };

        gtag('consent', 'update', consentimiento);
        overlay.style.display = 'none';
        localStorage.setItem('cookie_set', 'true');
        console.log("Consentimiento actualizado:", consentimiento);
    };

    // Auto-abrir si es la primera vez
    if (!localStorage.getItem('cookie_set')) {
        overlay.style.display = 'flex';
    }
})();