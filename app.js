// frontend/js/app.js — Lógica completa del panel admin
'use strict';

// ── Estado global ──────────────────────────────────────
let TOKEN = '';
let currentPage = 'dashboard';
let accentColor = '#4f46e5';

// ── API helper ─────────────────────────────────────────
async function api(path, opts = {}) {
  try {
    const res = await fetch('/api' + path, {
      headers: { 'Content-Type': 'application/json', 'x-admin-token': TOKEN },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (res.status === 401) { logout(); return null; }
    return await res.json();
  } catch (err) {
    console.error('API error:', err);
    return null;
  }
}

// ── LOGIN ──────────────────────────────────────────────
async function login() {
  const input = document.getElementById('login-input');
  TOKEN = input.value.trim();
  if (!TOKEN) return;

  const data = await fetch('/api/health');
  const health = await api('/health');

  // Verificar token con una llamada admin
  const test = await fetch('/api/admin/stats?days=1', {
    headers: { 'x-admin-token': TOKEN }
  });

  if (test.status === 401) {
    document.getElementById('login-error').style.display = 'block';
    TOKEN = '';
    return;
  }

  document.getElementById('login-error').style.display = 'none';
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('main-app').style.display = 'grid';
  initApp();
}

function logout() {
  TOKEN = '';
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('main-app').style.display = 'none';
}

// ── INIT ───────────────────────────────────────────────
async function initApp() {
  await loadDomainsFilter();
  await loadStats();
  buildInstallScript();
  setDefaultDates();
  checkServerStatus();
  setInterval(checkServerStatus, 30000);
}

async function checkServerStatus() {
  try {
    const r = await fetch('/api/health');
    const dot  = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (r.ok) {
      dot.className = 'dot dot-green';
      text.textContent = 'Conectado';
    } else {
      dot.className = 'dot dot-red';
      text.textContent = 'Error';
    }
  } catch {
    document.getElementById('status-dot').className = 'dot dot-red';
    document.getElementById('status-text').textContent = 'Sin conexión';
  }
}

// ── NAVEGACIÓN ─────────────────────────────────────────
function showPage(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (el) el.classList.add('active');
  currentPage = id;

  const titles = {
    dashboard: 'Dashboard', consents: 'Consentimientos', domains: 'Dominios',
    cookies: 'Registro de cookies', banner: 'Diseño del banner',
    signals: 'Consent Mode V2', export: 'Exportar GDPR', install: 'Instalar en web'
  };
  document.getElementById('page-title').textContent = titles[id] || id;

  if (id === 'dashboard') loadStats();
  if (id === 'consents')  loadConsents(1);
  if (id === 'domains')   loadDomains();
  if (id === 'cookies')   loadCookies();
  if (id === 'install')   buildInstallScript();
}

function refreshCurrentPage() {
  if (currentPage === 'dashboard') loadStats();
  if (currentPage === 'consents')  loadConsents(1);
  if (currentPage === 'cookies')   loadCookies();
}

// ── DOMAINS FILTER ─────────────────────────────────────
async function loadDomainsFilter() {
  const data = await api('/admin/domains');
  if (!data) return;
  const sel = document.getElementById('domain-filter');
  const current = sel.value;
  sel.innerHTML = '<option value="">Todos los dominios</option>' +
    data.map(d => `<option value="${d.domain}">${d.domain}</option>`).join('');
  if (current) sel.value = current;
}

function getDomain() { return document.getElementById('domain-filter').value; }
function getDays()   { return document.getElementById('days-filter').value; }

// ── DASHBOARD ──────────────────────────────────────────
async function loadStats() {
  const qs = `?days=${getDays()}${getDomain() ? '&domain=' + getDomain() : ''}`;
  const data = await api('/admin/stats' + qs);
  if (!data) return;

  const s = data.summary || {};
  setText('s-total',  s.total || 0);
  setText('s-accept', s.accept_all || 0);
  setText('s-reject', s.reject_all || 0);
  setText('s-custom', s.custom_count || 0);

  const ap = s.analytics_pct || 0;
  const mp = s.marketing_pct || 0;
  const fp = s.functional_pct || 0;

  setText('pct-analytics', ap + '%');
  setText('pct-marketing', mp + '%');
  setText('pct-functional', fp + '%');
  setWidth('bar-analytics', ap);
  setWidth('bar-marketing', mp);
  setWidth('bar-functional', fp);

  // Mini chart de tendencia
  const trend = data.trend || [];
  const chart = document.getElementById('trend-chart');
  if (trend.length === 0) {
    chart.innerHTML = '<div class="empty-chart">Sin datos aún. Añade tu web y empieza a recibir consentimientos.</div>';
  } else {
    const max = Math.max(...trend.map(t => t.total), 1);
    chart.innerHTML = trend.slice(-14).map(t => {
      const h = Math.max(Math.round((t.total / max) * 70), 4);
      const pct_a = t.total > 0 ? (t.accept_all / t.total) : 0;
      const pct_r = t.total > 0 ? (t.reject_all / t.total) : 0;
      const pct_c = t.total > 0 ? (t.custom_count / t.total) : 0;
      const color = pct_a >= pct_r ? '#10b981' : '#ef4444';
      return `<div class="mini-bar" title="${t.date}: ${t.total} total\n✅ ${t.accept_all} aceptaron\n❌ ${t.reject_all} rechazaron" style="background:${color};height:${h}px;opacity:.85"></div>`;
    }).join('');
  }

  // Tabla por dominio
  const tbody = document.getElementById('domain-stats-table');
  if (!data.byDomain || data.byDomain.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty">Sin datos. Registra tu dominio y empieza a usar el banner.</td></tr>';
  } else {
    tbody.innerHTML = data.byDomain.map(d => `
      <tr>
        <td><strong>${d.domain}</strong></td>
        <td>${d.total}</td>
        <td class="green">${d.analytics_pct || 0}%</td>
        <td class="yellow">${d.marketing_pct || 0}%</td>
      </tr>`).join('');
  }
}

// ── CONSENTIMIENTOS ────────────────────────────────────
async function loadConsents(page = 1) {
  const domain = getDomain();
  const action = document.getElementById('action-filter').value;
  let qs = `?page=${page}&limit=25`;
  if (domain) qs += '&domain=' + domain;
  if (action) qs += '&action=' + action;

  const data = await api('/admin/consents' + qs);
  if (!data) return;

  const badges = {
    accept_all: 'badge-accept', reject_all: 'badge-reject',
    custom: 'badge-custom', withdraw: 'badge-withdraw'
  };
  const labels = {
    accept_all: '✅ Aceptó todo', reject_all: '❌ Rechazó todo',
    custom: '⚙️ Personalizado', withdraw: '↩ Retirado'
  };

  const tbody = document.getElementById('consents-tbody');
  if (!data.rows || data.rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">Sin registros con estos filtros</td></tr>';
  } else {
    tbody.innerHTML = data.rows.map(r => `
      <tr>
        <td><code>${r.id.slice(0, 8)}…</code></td>
        <td><code>${r.visitor_id.slice(0, 8)}…</code></td>
        <td>${r.domain}</td>
        <td><span class="badge ${badges[r.action] || ''}">${labels[r.action] || r.action}</span></td>
        <td>${r.analytics ? '<span class="green">✓</span>' : '<span class="red">✗</span>'}</td>
        <td>${r.marketing ? '<span class="green">✓</span>' : '<span class="red">✗</span>'}</td>
        <td>${r.lang || '—'}</td>
        <td style="font-size:11px;color:var(--text2)">${(r.created_at || '').slice(0, 16)}</td>
      </tr>`).join('');
  }

  // Paginación
  const pag = document.getElementById('consents-pag');
  pag.innerHTML = `<span>${data.total} registros · Página ${data.page} de ${Math.max(data.pages, 1)}</span>`;
  if (data.page > 1)
    pag.innerHTML += `<button class="page-btn" onclick="loadConsents(${data.page - 1})">← Anterior</button>`;
  if (data.page < data.pages)
    pag.innerHTML += `<button class="page-btn" onclick="loadConsents(${data.page + 1})">Siguiente →</button>`;
}

// ── DOMINIOS ───────────────────────────────────────────
async function loadDomains() {
  const data = await api('/admin/domains');
  if (!data) return;

  const tbody = document.getElementById('domains-tbody');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Sin dominios registrados</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(d => `
    <tr>
      <td><strong>${d.domain}</strong></td>
      <td>${d.name || '—'}</td>
      <td><code>${d.gtm_id || '—'}</code></td>
      <td>${d.position || '—'}</td>
      <td>${d.theme || '—'}</td>
      <td>
        <button class="btn btn-sm" onclick="editDomain(${JSON.stringify(d).replace(/"/g,'&quot;')})">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteDomain('${d.domain}')">✕</button>
      </td>
    </tr>`).join('');
}

async function saveDomain() {
  const body = {
    domain:      document.getElementById('d-domain').value.trim(),
    name:        document.getElementById('d-name').value.trim(),
    gtm_id:      document.getElementById('d-gtm').value.trim(),
    accent_color:document.getElementById('d-color').value,
    position:    document.getElementById('d-pos').value,
    theme:       document.getElementById('d-theme').value,
    privacy_url: document.getElementById('d-privacy').value.trim(),
    cookies_url: document.getElementById('d-cookies-url').value.trim(),
    title:       document.getElementById('d-title').value.trim(),
    description: document.getElementById('d-desc').value.trim(),
    btn_accept:  document.getElementById('d-accept').value.trim(),
    btn_reject:  document.getElementById('d-reject').value.trim(),
    btn_adjust:  document.getElementById('d-adjust').value.trim(),
  };
  if (!body.domain) return showMsg('domain-msg', '❌ El dominio es obligatorio', false);

  const res = await api('/admin/domains', { method: 'POST', body });
  if (res && res.ok) {
    showMsg('domain-msg', '✅ Dominio guardado', true);
    await loadDomains();
    await loadDomainsFilter();
  } else {
    showMsg('domain-msg', '❌ Error guardando dominio', false);
  }
}

function editDomain(d) {
  document.getElementById('d-domain').value      = d.domain || '';
  document.getElementById('d-name').value        = d.name || '';
  document.getElementById('d-gtm').value         = d.gtm_id || '';
  document.getElementById('d-color').value       = d.accent_color || '#4f46e5';
  document.getElementById('d-pos').value         = d.position || 'bottom';
  document.getElementById('d-theme').value       = d.theme || 'dark';
  document.getElementById('d-privacy').value     = d.privacy_url || '';
  document.getElementById('d-cookies-url').value = d.cookies_url || '';
  document.getElementById('d-title').value       = d.title || '';
  document.getElementById('d-desc').value        = d.description || '';
  document.getElementById('d-accept').value      = d.btn_accept || '';
  document.getElementById('d-reject').value      = d.btn_reject || '';
  document.getElementById('d-adjust').value      = d.btn_adjust || '';
  document.querySelector('.app .pages').scrollTop = 0;
}

async function deleteDomain(domain) {
  if (!confirm(`¿Eliminar el dominio "${domain}"? Se eliminarán sus cookies del registro.`)) return;
  await api('/admin/domains/' + encodeURIComponent(domain), { method: 'DELETE' });
  await loadDomains();
  await loadDomainsFilter();
}

// ── COOKIES ────────────────────────────────────────────
async function loadCookies() {
  const domain = getDomain();
  const data = await api('/admin/cookies' + (domain ? '?domain=' + domain : ''));
  if (!data) return;

  const catLabels = {
    necessary: '🔒 Necesaria', functional: '⚙️ Funcional',
    analytics: '📊 Analítica', marketing: '📣 Marketing', unknown: '❓ Sin categorizar'
  };
  const catBadges = {
    necessary: 'badge-necessary', functional: 'badge-functional',
    analytics: 'badge-analytics', marketing: 'badge-marketing', unknown: 'badge-unknown'
  };

  const tbody = document.getElementById('cookies-tbody');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Sin cookies en el registro</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.domain}</td>
      <td>${c.provider || '—'}</td>
      <td><span class="badge ${catBadges[c.category] || 'badge-unknown'}">${catLabels[c.category] || c.category}</span></td>
      <td>${c.duration || '—'}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteCookie(${c.id})">✕</button></td>
    </tr>`).join('');
}

async function saveCookie() {
  const body = {
    domain:      document.getElementById('ck-domain').value.trim(),
    name:        document.getElementById('ck-name').value.trim(),
    provider:    document.getElementById('ck-prov').value.trim(),
    category:    document.getElementById('ck-cat').value,
    duration:    document.getElementById('ck-dur').value.trim(),
    description: document.getElementById('ck-desc').value.trim(),
  };
  if (!body.domain || !body.name) return showMsg('cookie-msg', '❌ Dominio y nombre son obligatorios', false);

  const res = await api('/admin/cookies', { method: 'POST', body });
  if (res && res.ok) {
    showMsg('cookie-msg', '✅ Cookie añadida', true);
    ['ck-name','ck-prov','ck-dur','ck-desc'].forEach(id => document.getElementById(id).value = '');
    await loadCookies();
  } else {
    showMsg('cookie-msg', '❌ Error añadiendo cookie', false);
  }
}

async function deleteCookie(id) {
  if (!confirm('¿Eliminar esta cookie del registro?')) return;
  await api('/admin/cookies/' + id, { method: 'DELETE' });
  await loadCookies();
}

// ── BANNER PREVIEW ─────────────────────────────────────
function setAccent(color, el) {
  accentColor = color;
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('sel'));
  if (el) el.classList.add('sel');
  document.getElementById('prev-accept-btn').style.background = color;
  updateBannerPreview();
}

function updateBannerPreview() {
  const theme = document.getElementById('prev-theme').value;
  const banner = document.getElementById('preview-banner');
  banner.className = 'preview-banner ' + theme;
}

function updateBannerText() {
  const t = document.getElementById('prev-title-input').value;
  const d = document.getElementById('prev-desc-input').value;
  const a = document.getElementById('prev-accept-text').value;
  document.getElementById('prev-title').textContent = t;
  document.getElementById('prev-desc').textContent = d;
  document.getElementById('prev-accept-btn').textContent = a;
}

function openPreviewSettings()  { document.getElementById('preview-modal').style.display = 'block'; }
function closePreviewSettings() { document.getElementById('preview-modal').style.display = 'none'; }

// ── EXPORT ─────────────────────────────────────────────
function exportCSV() {
  const domain = document.getElementById('exp-domain').value;
  const from   = document.getElementById('exp-from').value;
  const to     = document.getElementById('exp-to').value;
  let qs = '?token=' + encodeURIComponent(TOKEN);
  if (domain) qs += '&domain=' + encodeURIComponent(domain);
  if (from)   qs += '&from=' + from;
  if (to)     qs += '&to=' + to;
  window.open('/api/admin/export' + qs);
}

function setDefaultDates() {
  const today = new Date().toISOString().slice(0, 10);
  const month = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const ef = document.getElementById('exp-from');
  const et = document.getElementById('exp-to');
  if (ef) ef.value = month;
  if (et) et.value = today;
}

// ── INSTALL SCRIPT ─────────────────────────────────────
function buildInstallScript() {
  const domain = getDomain() || 'tudominio.com';
  const code = `<!-- ════════════════════════════════════════════
  Cookie Consent Manager — GDPR + Consent Mode V2
  Pegar justo antes de </head>
════════════════════════════════════════════ -->
<script>
(function() {
  var BACKEND = window.location.origin; // Si usas dominio propio: 'https://tu-backend.com'
  var DOMAIN  = '${domain}';

  // Visitor ID persistente (anónimo)
  var vid = localStorage.getItem('ccm_vid');
  if (!vid) { vid = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)); localStorage.setItem('ccm_vid', vid); }

  // ── Consent Mode V2 — DEFAULT DENIED ──────────────
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  gtag('consent', 'default', {
    ad_storage: 'denied', analytics_storage: 'denied',
    ad_personalization: 'denied', ad_user_data: 'denied',
    functionality_storage: 'denied', security_storage: 'granted',
    wait_for_update: 500
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);

  // ── Comprobar si ya hay consentimiento guardado ────
  fetch(BACKEND + '/api/consent/' + vid + '?domain=' + DOMAIN)
    .then(function(r){ return r.json(); })
    .then(function(data) {
      if (data.found && data.signals) {
        gtag('consent', 'update', data.signals);
      } else {
        showBanner();
      }
    })
    .catch(function(){ showBanner(); });

  // ── Guardar consentimiento ─────────────────────────
  function saveConsent(prefs, action) {
    fetch(BACKEND + '/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor_id: vid, domain: DOMAIN, prefs: prefs, action: action })
    })
    .then(function(r){ return r.json(); })
    .then(function(data) {
      if (data.signals) gtag('consent', 'update', data.signals);
      var b = document.getElementById('ccm-banner');
      if (b) b.style.animation = 'ccm-out .3s forwards';
      setTimeout(function(){ if (b) b.remove(); }, 300);
    });
  }

  // ── API pública ────────────────────────────────────
  window.CCM = {
    acceptAll: function() {
      saveConsent({ necessary:true, functional:true, analytics:true, marketing:true }, 'accept_all');
    },
    rejectAll: function() {
      saveConsent({ necessary:true, functional:false, analytics:false, marketing:false }, 'reject_all');
    },
    openSettings: function() { showSettingsModal(); },
    saveCustom: function() {
      var prefs = {
        necessary: true,
        functional: !!document.getElementById('ccm-functional') && document.getElementById('ccm-functional').checked,
        analytics:  !!document.getElementById('ccm-analytics')  && document.getElementById('ccm-analytics').checked,
        marketing:  !!document.getElementById('ccm-marketing')  && document.getElementById('ccm-marketing').checked,
      };
      saveConsent(prefs, 'custom');
      var m = document.getElementById('ccm-modal');
      if (m) m.remove();
    },
    withdraw: function() {
      fetch(BACKEND + '/api/consent/' + vid, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: DOMAIN })
      }).then(function(){ location.reload(); });
    }
  };

  // ── Mostrar banner ─────────────────────────────────
  function showBanner() {
    if (document.getElementById('ccm-banner')) return;
    var s = document.createElement('style');
    s.textContent = '#ccm-banner{position:fixed;bottom:0;left:0;right:0;z-index:999999;background:rgba(15,15,35,.97);color:#fff;padding:18px 24px;font-family:-apple-system,sans-serif;animation:ccm-in .4s ease}@keyframes ccm-in{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes ccm-out{to{transform:translateY(100%)}}#ccm-banner h3{font-size:15px;font-weight:600;margin:0 0 6px}#ccm-banner p{font-size:13px;color:rgba(255,255,255,.65);margin:0 0 14px;max-width:820px;line-height:1.6}.ccm-btns{display:flex;gap:8px;flex-wrap:wrap}.ccm-btn{padding:9px 20px;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;border:none;transition:.2s}.ccm-a{background:#4f46e5;color:#fff}.ccm-r{background:rgba(255,255,255,.12);color:#fff}.ccm-s{background:transparent;color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.25)!important;border-radius:6px}.ccm-links{margin-top:10px;font-size:11px}.ccm-links a{color:rgba(255,255,255,.35);text-decoration:none;margin-right:12px}#ccm-modal{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000000;display:flex;align-items:center;justify-content:center}.ccm-mbox{background:#fff;color:#1e293b;border-radius:14px;padding:24px;max-width:480px;width:90%;max-height:80vh;overflow-y:auto}.ccm-mbox h2{font-size:16px;font-weight:700;margin:0 0 8px}.ccm-mbox p{font-size:13px;color:#64748b;margin:0 0 16px}.ccm-cat{background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}.ccm-cname{font-size:13px;font-weight:600;color:#1e293b}.ccm-cdesc{font-size:11px;color:#64748b;margin-top:2px}.ccm-tog{position:relative;display:inline-block;width:40px;height:22px}.ccm-tog input{opacity:0;width:0;height:0}.ccm-sl{position:absolute;cursor:pointer;inset:0;background:#e2e8f0;border-radius:11px;transition:.3s}.ccm-sl:before{position:absolute;content:"";width:16px;height:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.3s}.ccm-tog input:checked+.ccm-sl{background:#4f46e5}.ccm-tog input:checked+.ccm-sl:before{transform:translateX(18px)}.ccm-always{font-size:11px;background:#dcfce7;color:#166534;padding:3px 8px;border-radius:10px;font-weight:500}.ccm-mf{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap}.ccm-mb{padding:8px 16px;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;border:none}.ccm-mp{background:#4f46e5;color:#fff}.ccm-mn{background:#f1f5f9;color:#475569}';
    document.head.appendChild(s);

    var b = document.createElement('div');
    b.id = 'ccm-banner';
    b.innerHTML = '<h3>Usamos cookies 🍪</h3><p>Utilizamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y personalizar el contenido.</p><div class="ccm-btns"><button class="ccm-btn ccm-a" onclick="CCM.acceptAll()">Aceptar todo</button><button class="ccm-btn ccm-r" onclick="CCM.rejectAll()">Rechazar todo</button><button class="ccm-btn ccm-s" onclick="CCM.openSettings()">Ajustar cookies</button></div><div class="ccm-links"><a href="/privacidad">Privacidad</a><a href="/cookies">Política de cookies</a></div>';
    document.body.appendChild(b);
  }

  // ── Panel de ajuste de categorías ─────────────────
  function showSettingsModal() {
    if (document.getElementById('ccm-modal')) return;
    var m = document.createElement('div');
    m.id = 'ccm-modal';
    m.innerHTML = '<div class="ccm-mbox"><h2>Gestionar preferencias</h2><p>Elige qué cookies permites. Puedes cambiar tus preferencias en cualquier momento.</p><div class="ccm-cat"><div><div class="ccm-cname">🔒 Necesarias</div><div class="ccm-cdesc">Imprescindibles para el funcionamiento del sitio.</div></div><span class="ccm-always">Siempre activas</span></div><div class="ccm-cat"><div><div class="ccm-cname">⚙️ Funcionales</div><div class="ccm-cdesc">Chat, preferencias de idioma, reproductor de vídeo.</div></div><label class="ccm-tog"><input type="checkbox" id="ccm-functional"><span class="ccm-sl"></span></label></div><div class="ccm-cat"><div><div class="ccm-cname">📊 Analíticas</div><div class="ccm-cdesc">Miden el rendimiento y uso del sitio (Google Analytics).</div></div><label class="ccm-tog"><input type="checkbox" id="ccm-analytics"><span class="ccm-sl"></span></label></div><div class="ccm-cat"><div><div class="ccm-cname">📣 Marketing</div><div class="ccm-cdesc">Publicidad personalizada y conversiones (Google Ads, Meta).</div></div><label class="ccm-tog"><input type="checkbox" id="ccm-marketing"><span class="ccm-sl"></span></label></div><div class="ccm-mf"><button class="ccm-mb ccm-mn" onclick="CCM.rejectAll();document.getElementById(\'ccm-modal\').remove()">Rechazar todo</button><button class="ccm-mb ccm-mp" onclick="CCM.saveCustom()">Guardar preferencias</button><button class="ccm-mb ccm-mp" onclick="CCM.acceptAll();document.getElementById(\'ccm-modal\').remove()">Aceptar todo</button></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function(e){ if(e.target===m) m.remove(); });
  }

})();
<\/script>`;

  const el = document.getElementById('install-code');
  if (el) el.textContent = code;
}

function copyScript() {
  const code = document.getElementById('install-code').textContent;
  navigator.clipboard.writeText(code).then(() => {
    const btn = event.target;
    btn.textContent = '✅ Copiado';
    setTimeout(() => btn.textContent = '📋 Copiar', 2000);
  });
}

// ── UTILS ──────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setWidth(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = Math.min(100, Math.max(0, pct)) + '%';
}

function showMsg(id, text, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'msg ' + (ok ? 'msg-ok' : 'msg-err');
  el.style.display = 'inline';
  setTimeout(() => el.style.display = 'none', 3000);
}

// Enter en login
document.addEventListener('DOMContentLoaded', () => {
  const li = document.getElementById('login-input');
  if (li) li.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
});
