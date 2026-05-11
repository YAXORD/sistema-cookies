// backend/src/routes.js — Todas las rutas API
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto  = require('crypto');
const { getDb } = require('./database');

// ── Helpers ──────────────────────────────────────────────
function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip + (process.env.ADMIN_SECRET || 'secret')).digest('hex').slice(0, 16);
}

function calcSignals(prefs) {
  return {
    ad_storage:            prefs.marketing  ? 'granted' : 'denied',
    analytics_storage:     prefs.analytics  ? 'granted' : 'denied',
    ad_personalization:    prefs.marketing  ? 'granted' : 'denied',
    ad_user_data:          prefs.marketing  ? 'granted' : 'denied',
    functionality_storage: prefs.functional ? 'granted' : 'denied',
  };
}

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

// ═══════════════════════════════════════════
// RUTAS PÚBLICAS
// ═══════════════════════════════════════════

// POST /api/consent — Guardar consentimiento
router.post('/consent', (req, res) => {
  try {
    const { visitor_id, domain, prefs = {}, action, lang = 'es' } = req.body;
    if (!domain || !action) return res.status(400).json({ error: 'domain y action son obligatorios' });

    const db       = getDb();
    const id       = uuidv4();
    const vid      = visitor_id || uuidv4();
    const signals  = calcSignals(prefs);
    const expires  = new Date(Date.now() + 365 * 86400000).toISOString();
    const ip       = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

    db.prepare(`
      INSERT INTO consents
        (id, visitor_id, domain, ip_hash, user_agent, lang,
         necessary, functional, analytics, marketing,
         ad_storage, analytics_storage, ad_personalization, ad_user_data,
         functionality_storage, action, expires_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id, vid, domain, hashIp(ip),
      (req.headers['user-agent'] || '').slice(0, 200), lang,
      1,
      prefs.functional ? 1 : 0,
      prefs.analytics  ? 1 : 0,
      prefs.marketing  ? 1 : 0,
      signals.ad_storage, signals.analytics_storage,
      signals.ad_personalization, signals.ad_user_data,
      signals.functionality_storage,
      action, expires
    );

    res.json({ ok: true, consent_id: id, visitor_id: vid, signals, expires_at: expires });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error guardando consentimiento' });
  }
});

// GET /api/consent/:vid — Consultar consentimiento activo
router.get('/consent/:vid', (req, res) => {
  try {
    const db = getDb();
    const { domain } = req.query;
    const row = db.prepare(`
      SELECT * FROM consents
      WHERE visitor_id = ? ${domain ? 'AND domain = ?' : ''}
      AND action != 'withdraw'
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY created_at DESC LIMIT 1
    `).get(domain ? [req.params.vid, domain] : [req.params.vid]);

    if (!row) return res.json({ found: false });
    res.json({
      found: true,
      consent_id: row.id,
      prefs: { necessary: true, functional: !!row.functional, analytics: !!row.analytics, marketing: !!row.marketing },
      signals: { ad_storage: row.ad_storage, analytics_storage: row.analytics_storage, ad_personalization: row.ad_personalization, ad_user_data: row.ad_user_data, functionality_storage: row.functionality_storage },
      action: row.action, created_at: row.created_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Error consultando consentimiento' });
  }
});

// DELETE /api/consent/:vid — Retirar consentimiento (GDPR)
router.delete('/consent/:vid', (req, res) => {
  try {
    const db = getDb();
    db.prepare(`INSERT INTO consents (id, visitor_id, domain, action, necessary) VALUES (?,?,?,?,1)`)
      .run(uuidv4(), req.params.vid, req.body.domain || 'unknown', 'withdraw');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// GET /api/config/:domain — Config pública del banner
router.get('/config/:domain', (req, res) => {
  try {
    const db  = getDb();
    const dom = db.prepare(`SELECT * FROM domains WHERE domain=?`).get(req.params.domain);
    const cookies = db.prepare(`SELECT name, provider, category, description, duration FROM cookie_registry WHERE domain=? ORDER BY category, name`).all(req.params.domain);
    res.json({ domain: dom || null, cookies });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// ═══════════════════════════════════════════
// RUTAS DE ADMINISTRACIÓN (requieren token)
// ═══════════════════════════════════════════

// GET /api/admin/stats
router.get('/admin/stats', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { domain, days = 30 } = req.query;
    const df = domain ? 'AND domain=?' : '';
    const p  = domain ? [days, domain] : [days];

    const summary = db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN action='accept_all' THEN 1 ELSE 0 END) AS accept_all,
        SUM(CASE WHEN action='reject_all' THEN 1 ELSE 0 END) AS reject_all,
        SUM(CASE WHEN action='custom'     THEN 1 ELSE 0 END) AS custom_count,
        SUM(CASE WHEN action='withdraw'   THEN 1 ELSE 0 END) AS withdraw_count,
        ROUND(AVG(CASE WHEN action!='withdraw' THEN analytics ELSE NULL END)*100,1) AS analytics_pct,
        ROUND(AVG(CASE WHEN action!='withdraw' THEN marketing ELSE NULL END)*100,1) AS marketing_pct,
        ROUND(AVG(CASE WHEN action!='withdraw' THEN functional ELSE NULL END)*100,1) AS functional_pct,
        COUNT(DISTINCT visitor_id) AS unique_visitors
      FROM consents
      WHERE created_at >= datetime('now', '-' || ? || ' days') ${df}
    `).get(...p);

    const trend = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as total,
        SUM(CASE WHEN action='accept_all' THEN 1 ELSE 0 END) as accept_all,
        SUM(CASE WHEN action='reject_all' THEN 1 ELSE 0 END) as reject_all,
        SUM(CASE WHEN action='custom' THEN 1 ELSE 0 END) as custom_count
      FROM consents
      WHERE created_at >= datetime('now', '-' || ? || ' days') ${df}
      GROUP BY date(created_at) ORDER BY date ASC
    `).all(...p);

    const byDomain = db.prepare(`
      SELECT domain, COUNT(*) as total,
        ROUND(AVG(analytics)*100,1) as analytics_pct,
        ROUND(AVG(marketing)*100,1) as marketing_pct
      FROM consents WHERE action!='withdraw'
      GROUP BY domain ORDER BY total DESC LIMIT 10
    `).all();

    res.json({ summary, trend, byDomain });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// GET /api/admin/consents — Lista paginada
router.get('/admin/consents', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { domain, action, page = 1, limit = 25 } = req.query;
    const where = ['1=1']; const params = [];
    if (domain) { where.push('domain=?'); params.push(domain); }
    if (action) { where.push('action=?'); params.push(action); }

    const total = db.prepare(`SELECT COUNT(*) as n FROM consents WHERE ${where.join(' AND ')}`).get(...params).n;
    const rows  = db.prepare(`
      SELECT id, visitor_id, domain, action, necessary, functional, analytics, marketing, lang, created_at
      FROM consents WHERE ${where.join(' AND ')}
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), (page - 1) * parseInt(limit));

    res.json({ total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), rows });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// GET/POST /api/admin/domains
router.get('/admin/domains', requireAdmin, (req, res) => {
  res.json(getDb().prepare(`SELECT * FROM domains ORDER BY created_at DESC`).all());
});

router.post('/admin/domains', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { domain, name, gtm_id, accent_color, position, theme, privacy_url, cookies_url, title, description, btn_accept, btn_reject, btn_adjust } = req.body;
    if (!domain) return res.status(400).json({ error: 'domain es obligatorio' });
    db.prepare(`
      INSERT INTO domains (domain,name,gtm_id,accent_color,position,theme,privacy_url,cookies_url,title,description,btn_accept,btn_reject,btn_adjust)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(domain) DO UPDATE SET
        name=excluded.name, gtm_id=excluded.gtm_id, accent_color=excluded.accent_color,
        position=excluded.position, theme=excluded.theme, privacy_url=excluded.privacy_url,
        cookies_url=excluded.cookies_url, title=excluded.title, description=excluded.description,
        btn_accept=excluded.btn_accept, btn_reject=excluded.btn_reject, btn_adjust=excluded.btn_adjust,
        updated_at=datetime('now')
    `).run(domain, name||domain, gtm_id||null, accent_color||'#4f46e5', position||'bottom', theme||'dark',
           privacy_url||'/privacidad', cookies_url||'/cookies',
           title||'Usamos cookies', description||'Utilizamos cookies para mejorar tu experiencia.',
           btn_accept||'Aceptar todo', btn_reject||'Rechazar todo', btn_adjust||'Ajustar cookies');
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

router.delete('/admin/domains/:domain', requireAdmin, (req, res) => {
  getDb().prepare(`DELETE FROM domains WHERE domain=?`).run(req.params.domain);
  res.json({ ok: true });
});

// GET/POST/DELETE /api/admin/cookies
router.get('/admin/cookies', requireAdmin, (req, res) => {
  const { domain } = req.query;
  const rows = domain
    ? getDb().prepare(`SELECT * FROM cookie_registry WHERE domain=? ORDER BY category,name`).all(domain)
    : getDb().prepare(`SELECT * FROM cookie_registry ORDER BY domain,category,name`).all();
  res.json(rows);
});

router.post('/admin/cookies', requireAdmin, (req, res) => {
  try {
    const { domain, name, provider, category, description, duration } = req.body;
    if (!domain || !name) return res.status(400).json({ error: 'domain y name son obligatorios' });
    getDb().prepare(`
      INSERT INTO cookie_registry (domain,name,provider,category,description,duration)
      VALUES (?,?,?,?,?,?)
      ON CONFLICT(domain,name) DO UPDATE SET
        provider=excluded.provider, category=excluded.category,
        description=excluded.description, duration=excluded.duration
    `).run(domain, name, provider||null, category||'unknown', description||null, duration||null);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

router.delete('/admin/cookies/:id', requireAdmin, (req, res) => {
  getDb().prepare(`DELETE FROM cookie_registry WHERE id=?`).run(req.params.id);
  res.json({ ok: true });
});

// GET /api/admin/export — CSV para auditoría GDPR
router.get('/admin/export', requireAdmin, (req, res) => {
  const { domain, from, to } = req.query;
  const where = []; const params = [];
  if (domain) { where.push('domain=?'); params.push(domain); }
  if (from)   { where.push('created_at>=?'); params.push(from); }
  if (to)     { where.push('created_at<=?'); params.push(to + 'T23:59:59'); }

  const rows = getDb().prepare(`
    SELECT id,visitor_id,domain,action,necessary,functional,analytics,marketing,
           ad_storage,analytics_storage,lang,created_at,expires_at
    FROM consents ${where.length ? 'WHERE '+where.join(' AND ') : ''}
    ORDER BY created_at DESC LIMIT 100000
  `).all(...params);

  const keys = ['id','visitor_id','domain','action','necessary','functional','analytics','marketing','ad_storage','analytics_storage','lang','created_at','expires_at'];
  const csv  = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k]??'')).join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=consents_${new Date().toISOString().slice(0,10)}.csv`);
  res.send(csv);
});

// GET /api/health
router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

module.exports = router;
