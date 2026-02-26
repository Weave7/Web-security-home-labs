
const Database = require('better-sqlite3');
const path = require('path');


const dbPath = path.join(__dirname, 'progress.db');
const db = new Database(dbPath);


db.exec(`
  CREATE TABLE IF NOT EXISTS solved_labs (
    lab_id TEXT PRIMARY KEY,
    solved_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;