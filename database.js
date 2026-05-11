const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function getDb() {
    return open({
        filename: path.join(__dirname, 'database.db'),
        driver: sqlite3.Database
    });
}

async function initDb() {
    const db = await getDb();
    // Tabla de consentimientos
    await db.exec(`CREATE TABLE IF NOT EXISTS consents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        categories TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    // Tabla de Cookies Detectadas (Lo que pide tu jefe)
    await db.exec(`CREATE TABLE IF NOT EXISTS detected_cookies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        category TEXT DEFAULT 'desconocido',
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
}

module.exports = { getDb, initDb };
