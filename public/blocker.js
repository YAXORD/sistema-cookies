(function () {
    const consentSaved = localStorage.getItem('mi_cookie_consent');
    let savedData = consentSaved ? JSON.parse(consentSaved) : null;

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    if (!savedData) {
        gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'personalization_storage': 'denied',
            'functionality_storage': 'granted',
            'security_storage': 'granted'
        });
    } else {
        gtag('consent', 'default', savedData);
    }
    gtag('js', new Date());
    gtag('config', 'G-B67TFXZRE7');

    // 1. BIBLIOTECA BASE
    const cookieLibrary = {
        '_ga': { prov: 'Google Analytics', dur: '2 años', cat: 'Análisis', desc: 'ID utilizado para identificar usuarios.' },
        '_gid': { prov: 'Google Analytics', dur: '24 horas', cat: 'Análisis', desc: 'ID para agrupar el comportamiento del usuario.' },
        '_fbp': { prov: 'Meta / Facebook', dur: '3 meses', cat: 'Publicidad', desc: 'Seguimiento de conversiones publicitarias.' },
        'mi_cookie_consent': { prov: 'Propia (Demo)', dur: '1 año', cat: 'Necesaria', desc: 'Almacena tus preferencias de cookies.' }
    };

    // 2. MOTOR DE IA HÍBRIDA (Escáner dinámico)
    const askGeminiIA = async (cookieName) => {
        try {
            // Capa 1: Intento de escaneo con IA en la nube (Tu backend con Node.js)
            const response = await fetch('http://localhost:3000/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cookie: cookieName }),
                signal: AbortSignal.timeout(2000)
            });
            const data = await response.json();
            cookieLibrary[cookieName] = data;
            return data;
        } catch (e) {
            // Capa 2: IA Local Heurística (Back-up para Demo y Fallos)
            const name = cookieName.toLowerCase();
            let fallback = { prov: 'Escáner Local', dur: 'Sesión', cat: 'Sin clasificar', desc: 'Detectado por el motor de inteligencia híbrida.' };

            if (name.includes('ga') || name.includes('gid') || name.includes('metrics')) {
                fallback = { prov: 'Google', dur: '2 años', cat: 'Análisis', desc: 'Análisis estadístico identificado por patrón.' };
            } else if (name.includes('ads') || name.includes('fbp') || name.includes('pixel') || name.includes('tags')) {
                fallback = { prov: 'Marketing', dur: '3 meses', cat: 'Publicidad', desc: 'Rastreador publicitario identificado por patrón.' };
            } else if (name.includes('sess') || name.includes('token') || name.includes('auth')) {
                fallback = { prov: 'Propia', dur: 'Sesión', cat: 'Necesaria', desc: 'Cookie técnica de sesión identificada por patrón.' };
            }

            cookieLibrary[cookieName] = fallback;
            return fallback;
        }
    };

    const getCookieInfo = (name) => {
        if (cookieLibrary[name]) return cookieLibrary[name];
        // Activa el escáner de IA si la cookie es desconocida
        askGeminiIA(name);
        return { prov: 'IA Escaneando...', dur: 'Pendiente', cat: 'Sin clasificar', desc: 'Categorizando mediante IA...' };
    };

    const initUI = () => {
        ['cm-container', 'cm-style', 'cm-modal-div', 'cookie-float-btn'].forEach(id => {
            const el = document.getElementById(id); if (el) el.remove();
        });

        const style = document.createElement('style');
        style.id = 'cm-style';
        style.innerHTML = `
            #cm-container { position: fixed !important; bottom: 0; left: 0; width: 100%; z-index: 999999999; font-family: 'Segoe UI', sans-serif; }
            #cm-banner { background: #fff; padding: 15px 25px; box-shadow: 0 -2px 20px rgba(0,0,0,0.1); display: ${savedData ? 'none' : 'flex'} !important; align-items: center; justify-content: space-between; border-top: 1px solid #eee; }
            #cm-modal-div { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 9999999999; }
            .cm-card { background: #fff; padding: 25px; border-radius: 8px; width: 95%; max-width: 650px; max-height: 85vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2); text-align: left; }
            .cm-tabs { display: flex; gap: 20px; border-bottom: 1px solid #eee; margin-bottom: 15px; }
            .cm-tab { padding-bottom: 10px; cursor: pointer; font-size: 14px; font-weight: 600; color: #999; border-bottom: 2px solid transparent; }
            .cm-tab.active { color: #0033a0 !important; border-bottom-color: #0033a0 !important; }
            .acc-row { border: 1px solid #eee; border-radius: 6px; margin-bottom: 10px; transition: all 0.3s ease; }
            .acc-header { padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: #fafafa; position: relative; }
            .acc-arrow { border: solid #0033a0; border-width: 0 2px 2px 0; display: inline-block; padding: 3px; transform: rotate(-45deg); transition: transform 0.3s ease; margin-right: 15px; }
            .acc-row.active .acc-arrow { transform: rotate(45deg); }
            .acc-content { display: none; padding: 15px; border-top: 1px solid #eee; background: #fff; }
            .acc-row.active .acc-content { display: block; }
            .cookie-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; border: 1px solid #eee; }
            .cookie-table th { text-align: left; color: #0033a0; padding: 10px; background: #f9fbff; border-bottom: 1px solid #eee; }
            .cookie-table td { padding: 10px; border-bottom: 1px solid #eee; }
            .btn { padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; border: 1px solid transparent; }
            .btn-primary { background: #0033a0; color: white; }
            .btn-outline { background: #fff; color: #0033a0; border: 1px solid #0033a0; }
            .switch { position: relative; display: inline-block; width: 34px; height: 18px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px; }
            .slider:before { position: absolute; content: ""; height: 12px; width: 12px; left: 3px; bottom: 3px; background: white; transition: .4s; border-radius: 50%; }
            input:checked + .slider { background-color: #0033a0; }
            input.switch-grey:checked + .slider { background-color: #999 !important; }
            input:checked + .slider:before { transform: translateX(16px); }
            #cookie-float-btn { position: fixed; bottom: 20px; left: 20px; z-index: 99999998; width: 45px; height: 45px; border-radius: 50%; background: #0033a0; color: white; display: ${savedData ? 'flex' : 'none'}; align-items: center; justify-content: center; cursor: pointer; border: none; font-size: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
            .always-active-tag { color: #0033a0; font-size: 12px; font-weight: bold; margin-left: 5px; }
            .policy-content h4 { color: #0033a0; margin: 15px 0 5px 0; font-size: 15px; }
            .policy-content p { margin-bottom: 10px; color: #444; }
        `;
        document.head.appendChild(style);

        const modal = document.createElement('div');
        modal.id = 'cm-modal-div';
        modal.innerHTML = `
        <div class="cm-card">
            <div class="cm-tabs">
                <div class="cm-tab active" id="tab-ajustes">Ajustes</div>
                <div class="cm-tab" id="tab-cookies">Cookies</div>
                <div class="cm-tab" id="tab-politica">Política de cookies</div>
            </div>

            <div id="content-ajustes">
                <p style="font-size:13px; color:#666; margin-bottom:20px;">Personaliza tus preferencias de consentimiento a continuación.</p>
                <div id="accordion-container"></div>
            </div>

            <div id="content-politica" class="policy-content" style="display:none; font-size:13px; line-height:1.6;">
                <h4>¿Qué son las cookies?</h4>
                <p>Las cookies y tecnologías similares son documentos de texto muy pequeños o fragmentos de código que a menudo contienen un código de identificación único. Cuando visitas un sitio web o utilizas una aplicación móvil, un ordenador le pide permiso a tu ordenador o dispositivo móvil para guardar este archivo en tu ordenador o dispositivo móvil y obtener acceso a la información.</p>
                
                <h4>Por qué utilizamos cookies?</h4>
                <p>Las cookies aseguran que durante tu visita a nuestra tienda en línea permanezcas conectado, que todos los artículos permanezcan almacenados en tu carrito de compras, que puedas comprar de forma segura y que el sitio web siga funcionando sin problemas.</p>
                
                <h4>¿Qué tipo de cookies utilizamos?</h4>
                <p><strong>Cookies necesarias:</strong> Estas cookies son necesarias para que el sitio web funcione correctamente. Por ejemplo, para almacenar artículos en un carrito o guardar tus preferencias de idioma.</p>
                <p><strong>Cookies de rendimiento:</strong> Se utilizan para recopilar información estadística sobre el uso de nuestro sitio web (cookies analíticas) para optimizar el rendimiento.</p>
                <p><strong>Cookies funcionales:</strong> Permiten una mayor funcionalidad como servicios de chat en vivo, ver videos o botones de redes sociales.</p>
                <p><strong>Publicidad / cookies de seguimiento:</strong> Establecidas por socios externos para crear perfiles y realizar un seguimiento de los datos en varios sitios web. Si aceptas estas cookies, podemos mostrar nuestros anuncios en otros sitios web en función de tu perfil de usuario y preferencias.</p>
                <p><strong>Sin clasificar:</strong> Cookies en proceso de clasificación que aparecerán en una de las categorías anteriores próximamente.</p>
                
                <h4>¿Cómo puedo desactivar o eliminar las cookies?</h4>
                <p>Puedes optar por no utilizar todas las cookies, excepto las necesarias, en la configuración de tu navegador. Ten en cuenta que bloquearlas puede afectar negativamente a tu experiencia de usuario.</p>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">
                <button id="m-aceptar-todo" class="btn btn-primary">Aceptar todo</button>
                <div style="display:flex; gap:10px;">
                    <button id="m-save" class="btn btn-outline" style="flex:1;">Guardar selección</button>
                    <button id="m-rechazar" class="btn btn-outline" style="flex:1;">Solo necesarias</button>
                </div>
            </div>
        </div>`;
        document.body.appendChild(modal);

        const floatBtn = document.createElement('button');
        floatBtn.id = 'cookie-float-btn';
        floatBtn.innerHTML = '🍪';
        document.body.appendChild(floatBtn);

        const banner = document.createElement('div');
        banner.id = 'cm-container';
        banner.innerHTML = `<div id="cm-banner">
            <div style="font-size:13px; text-align: left;"><strong>Cookies</strong>: Controla tu privacidad.</div>
            <div style="display:flex; gap:10px;">
                <button id="b-ajustes" class="btn btn-outline">Ajustes</button>
                <button id="b-rechazar" class="btn btn-outline">Rechazar</button>
                <button id="b-aceptar" class="btn btn-primary">Aceptar todo</button>
            </div>
        </div>`;
        document.body.appendChild(banner);

        const renderAccordions = (showTable = false) => {
            const categories = [
                { id: 'Necesaria', label: 'Necesarias', checkId: 'c-nec', fixed: true, desc: 'Cruciales para las funciones básicas del sitio.', storageKey: 'functionality_storage' },
                { id: 'Análisis', label: 'Análisis', checkId: 'c-ana', fixed: false, desc: 'Nos ayudan a entender cómo interactúan los visitantes.', storageKey: 'analytics_storage' },
                { id: 'Publicidad', label: 'Publicidad', checkId: 'c-ads', fixed: false, desc: 'Para mostrar anuncios relevantes.', storageKey: 'ad_storage' },
                { id: 'Rendimiento', label: 'Rendimiento', checkId: 'c-rend', fixed: false, desc: 'Mejoran la velocidad de navegación.', storageKey: 'personalization_storage' }
            ];

            const currentCookies = document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(c => c !== "");
            const container = document.getElementById('accordion-container');
            container.innerHTML = '';

            categories.forEach(cat => {
                const cookiesInCat = currentCookies.filter(c => getCookieInfo(c).cat === cat.id);
                let tableHtml = `<table class="cookie-table"><thead><tr><th>NOMBRE</th><th>PROVEEDOR</th><th>DURACIÓN</th></tr></thead><tbody>
                    ${cookiesInCat.map(c => {
                    const info = getCookieInfo(c);
                    return `<tr><td><b>${c}</b></td><td>${info.prov}</td><td>${info.dur}</td></tr>`;
                }).join('')}</tbody></table>`;

                const isChecked = savedData ? (savedData[cat.storageKey] === 'granted') : true;

                const row = document.createElement('div');
                row.className = 'acc-row' + (showTable ? ' active' : '');
                row.innerHTML = `
                    <div class="acc-header">
                        <div style="display:flex; align-items:center;">
                            <span class="acc-arrow"></span>
                            <div>
                                <strong>${cat.label}</strong> ${cat.fixed ? '<span class="always-active-tag">(Siempre activas)</span>' : ''}
                                <br><small style="color:#888">${cat.desc}</small>
                            </div>
                        </div>
                        <label class="switch" onclick="event.stopPropagation()">
                            <input type="checkbox" id="${cat.checkId}" ${cat.fixed ? 'checked disabled class="switch-grey"' : (isChecked ? 'checked' : '')}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="acc-content">${cookiesInCat.length > 0 ? tableHtml : '<p style="font-size:11px">No se detectan cookies activas.</p>'}</div>
                `;
                row.querySelector('.acc-header').onclick = () => row.classList.toggle('active');
                container.appendChild(row);
            });
        };

        const tAjustes = document.getElementById('tab-ajustes');
        const tCookies = document.getElementById('tab-cookies');
        const tPolitica = document.getElementById('tab-politica');
        const cAjustes = document.getElementById('content-ajustes');
        const cPolitica = document.getElementById('content-politica');

        tAjustes.onclick = () => {
            cAjustes.style.display = 'block'; cPolitica.style.display = 'none';
            tAjustes.className = 'cm-tab active'; tCookies.className = 'cm-tab'; tPolitica.className = 'cm-tab';
            renderAccordions(false);
        };
        tCookies.onclick = () => {
            cAjustes.style.display = 'block'; cPolitica.style.display = 'none';
            tCookies.className = 'cm-tab active'; tAjustes.className = 'cm-tab'; tPolitica.className = 'cm-tab';
            renderAccordions(true);
        };
        tPolitica.onclick = () => {
            cAjustes.style.display = 'none'; cPolitica.style.display = 'block';
            tPolitica.className = 'cm-tab active'; tAjustes.className = 'cm-tab'; tCookies.className = 'cm-tab';
        };

        const finalizeConsent = (mode) => {
            let ana = 'denied', ads = 'denied', rend = 'denied';
            if (mode === 'todo') { ana = 'granted'; ads = 'granted'; rend = 'granted'; }
            else if (mode === 'custom') {
                ana = document.getElementById('c-ana').checked ? 'granted' : 'denied';
                ads = document.getElementById('c-ads').checked ? 'granted' : 'denied';
                rend = document.getElementById('c-rend').checked ? 'granted' : 'denied';
            }
            const data = { 'analytics_storage': ana, 'ad_storage': ads, 'ad_user_data': ads, 'ad_personalization': ads, 'personalization_storage': rend, 'functionality_storage': 'granted', 'security_storage': 'granted' };
            localStorage.setItem('mi_cookie_consent', JSON.stringify(data));
            savedData = data;
            gtag('consent', 'update', data);
            document.getElementById('cm-banner').style.setProperty('display', 'none', 'important');
            modal.style.display = 'none';
            floatBtn.style.display = 'flex';
        };

        document.getElementById('b-ajustes').onclick = () => { tAjustes.click(); modal.style.display = 'flex'; };
        document.getElementById('b-aceptar').onclick = () => finalizeConsent('todo');
        document.getElementById('b-rechazar').onclick = () => finalizeConsent('nada');
        document.getElementById('m-aceptar-todo').onclick = () => finalizeConsent('todo');
        document.getElementById('m-rechazar').onclick = () => finalizeConsent('nada');
        document.getElementById('m-save').onclick = () => finalizeConsent('custom');
        floatBtn.onclick = () => { tAjustes.click(); modal.style.display = 'flex'; };
    };

    initUI();
})();