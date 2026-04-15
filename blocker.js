// --- 1. ESTILOS ---
const style = document.createElement('style');
style.innerHTML = `
    #cookie-modal-pro { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; justify-content: center; align-items: center; z-index: 1000001; font-family: sans-serif; }
    .modal-content { background: white; padding: 25px; border-radius: 15px; width: 95%; max-width: 450px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    .cookie-row { display: flex; justify-content: space-between; align-items: center; margin: 15px 0; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 20px; }
    input:checked + .slider { background-color: #1a73e8; }
    .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider:before { transform: translateX(20px); }
    #cookie-banner-pro { position: fixed; bottom: 20px; left: 20px; right: 20px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); display: flex; justify-content: space-between; align-items: center; z-index: 1000000; border: 1px solid #ddd; }
    .btn-pro { padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; }
    .btn-acc { background: #1a73e8; color: white; }
    .btn-rej { background: #f8f9fa; color: #d93025; border: 1px solid #d93025; }
    .btn-alt { background: #f1f3f4; color: #3c4043; border: 1px solid #ccc; }
    .politica-box { background: #f9f9f9; padding: 12px; border-radius: 8px; margin-top: 15px; font-size: 0.8em; color: #555; border-left: 4px solid #1a73e8; }
`;
document.head.appendChild(style);

const d = JSON.parse(localStorage.getItem('cookies_decision') || '{"ana":false,"mark":false,"rend":false}');

// --- 2. MODAL ---
const modal = document.createElement('div');
modal.id = 'cookie-modal-pro';
modal.innerHTML = `
    <div class="modal-content">
        <h3 style="margin-top:0;">Ajustes de Privacidad</h3>
        <div class="cookie-row"><span><strong>Necesarias</strong></span><label class="switch"><input type="checkbox" checked disabled><span class="slider"></span></label></div>
        <div class="cookie-row"><span>Analíticas</span><label class="switch"><input type="checkbox" id="chk-ana" ${d.ana ? 'checked' : ''}><span class="slider"></span></label></div>
        <div class="cookie-row"><span>Marketing</span><label class="switch"><input type="checkbox" id="chk-mark" ${d.mark ? 'checked' : ''}><span class="slider"></span></label></div>
        <div class="cookie-row"><span>Rendimiento</span><label class="switch"><input type="checkbox" id="chk-rend" ${d.rend ? 'checked' : ''}><span class="slider"></span></label></div>
        
        <div class="politica-box">
            <strong>Política de Cookies:</strong><br>
            Este sitio utiliza cookies para garantizar el cumplimiento del RGPD y Consent Mode v2.
        </div>
        <button class="btn-pro btn-acc" style="width:100%; margin-top:15px;" onclick="guardarAjustes()">Guardar Selección</button>
    </div>
`;
document.body.appendChild(modal);

// --- 3. FUNCIONES (CON ESCUDO ANTI-ERRORES) ---
window.abrirModal = () => modal.style.display = 'flex';

window.guardarAjustes = () => {
    const ana = document.getElementById('chk-ana').checked;
    const mark = document.getElementById('chk-mark').checked;
    const rend = document.getElementById('chk-rend').checked;
    aplicarTodo(ana, mark, rend);
};

window.finalizarConsentimiento = (todo) => aplicarTodo(todo, todo, todo);

function aplicarTodo(ana, mark, rend) {
    // Guardamos la decisión localmente
    localStorage.setItem('cookies_decision', JSON.stringify({ana, mark, rend}));
    
    // Verificamos si Google Analytics existe antes de enviar la señal
    if (typeof gtag === 'function') {
        gtag('consent', 'update', {
            'analytics_storage': ana ? 'granted' : 'denied',
            'ad_storage': mark ? 'granted' : 'denied',
            'ad_user_data': mark ? 'granted' : 'denied',
            'ad_personalization': mark ? 'granted' : 'denied',
            'personalization_storage': rend ? 'granted' : 'denied'
        });
        console.log("Señal enviada a Google correctamente.");
    } else {
        console.log("gtag no definido en esta web, pero la decisión se guardó localmente.");
    }

    // Cerramos el modal visualmente para que la demo no se quede bloqueada
    modal.style.display = 'none';
    
    // Recargamos para demostrar que el flujo termina
    alert("Preferencias guardadas. Recargando página...");
    setTimeout(() => { location.reload(); }, 500);
}

// Banner inicial
const banner = document.createElement('div');
banner.id = 'cookie-banner-pro';
banner.innerHTML = `
    <div><strong>Control de Privacidad</strong></div>
    <div style="display:flex; gap:10px;">
        <button class="btn-pro btn-rej" onclick="finalizarConsentimiento(false)">Rechazar</button>
        <button class="btn-pro btn-alt" onclick="abrirModal()">Ajustar</button>
        <button class="btn-pro btn-acc" onclick="finalizarConsentimiento(true)">Aceptar Todo</button>
    </div>
`;

if (!localStorage.getItem('cookies_decision')) {
    document.body.appendChild(banner);
}