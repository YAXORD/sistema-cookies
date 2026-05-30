# 🍪 Cookie Consent Manager — Guía de inicio rápido

## ✅ Requisitos previos

1. **Node.js** instalado → [nodejs.org](https://nodejs.org) (descarga la versión LTS)
2. **VS Code** instalado → [code.visualstudio.com](https://code.visualstudio.com)

---

## 🚀 Cómo abrirlo en VS Code

### Paso 1 — Abrir la carpeta
- Abre VS Code
- Ve a **Archivo → Abrir carpeta**
- Selecciona la carpeta `cookie-consent-manager`

### Paso 2 — Abrir la terminal integrada
- En VS Code: menú **Terminal → Nueva terminal**
- O pulsa **Ctrl + `** (acento grave)

### Paso 3 — Instalar dependencias (solo la primera vez)
```
npm install
```
Espera a que termine (1-2 minutos la primera vez)

### Paso 4 — Arrancar el servidor
```
npm start
```

### Paso 5 — Abrir en el navegador
Abre: **http://localhost:3000**

---

## 🔑 Contraseña del panel

La contraseña está en el archivo `.env`:
```
ADMIN_SECRET=mipassword123
```
**Cámbiala** antes de subir a internet.

---

## 📁 Estructura del proyecto

```
cookie-consent-manager/
│
├── backend/
│   └── src/
│       ├── server.js      ← Servidor principal
│       ├── database.js    ← Base de datos SQLite
│       └── routes.js      ← Todas las rutas API
│
├── frontend/
│   ├── index.html         ← Panel de administración
│   ├── css/
│   │   └── style.css      ← Estilos
│   └── js/
│       └── app.js         ← Lógica del panel
│
├── .env                   ← ⚠️ CONFIGURACIÓN (no subir a GitHub)
├── package.json           ← Dependencias
└── README.md              ← Esta guía
```

---

## 📤 Cómo compartirlo con otra persona

### Para probarlo en local (ZIP)
1. Comprime la carpeta `cookie-consent-manager` en un ZIP
2. Envíaselo
3. La otra persona: descomprime → abre VS Code → `npm install` → `npm start`

### Para usarlo en internet (Railway — GRATIS)
1. Crea una cuenta en [github.com](https://github.com) y sube la carpeta
2. Ve a [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Selecciona tu repositorio
4. En Variables de entorno añade: `ADMIN_SECRET`, `NODE_ENV=production`
5. Railway te da una URL como `https://tu-app.up.railway.app`

### Para demo rápida (ngrok)
Con el servidor corriendo:
1. Descarga ngrok de [ngrok.com](https://ngrok.com)
2. Ejecuta: `ngrok http 3000`
3. Te da una URL temporal pública

---

## ⚙️ Variables de entorno (.env)

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor | `3000` |
| `ADMIN_SECRET` | Contraseña del panel | `mipassword123` |
| `ALLOWED_ORIGINS` | Dominios permitidos | `http://localhost:3000` |
| `LOG_RETENTION_DAYS` | Días retención GDPR | `395` |
| `NODE_ENV` | Entorno | `development` |

---

## 🛡️ Cumplimiento normativo incluido

- ✅ GDPR — Consentimiento explícito previo al procesamiento
- ✅ ePrivacy — Rechazar tan fácil como aceptar
- ✅ Google Consent Mode V2 — Las 4 señales requeridas
- ✅ IPs anonimizadas (hash SHA256)
- ✅ Eliminación automática de datos tras 395 días
- ✅ Registro de retirada de consentimiento (Art.7 GDPR)
- ✅ Exportación CSV para auditorías

---

## ❓ Problemas comunes

**"node no se reconoce"**
→ Instala Node.js desde nodejs.org y reinicia VS Code

**"npm no se reconoce"**
→ Reinstala Node.js marcando la opción "Add to PATH"

**Error de permisos en PowerShell**
→ Ejecuta en PowerShell como administrador:
```
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

**Puerto 3000 ocupado**
→ Cambia el puerto en `.env`: `PORT=3001`
