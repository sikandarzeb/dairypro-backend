// ============================================================
// database/migrate.js — Fixed for older MySQL versions
// Run with: npm run migrate
// ============================================================
require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  console.log('🔧  Running migrations...\n');

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  await conn.query(`USE \`${process.env.DB_NAME}\``);

  // ── 1. USERS ─────────────────────────────────────────────
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      farm_name    VARCHAR(100) NOT NULL,
      email        VARCHAR(150) NOT NULL UNIQUE,
      password     VARCHAR(255) NOT NULL,
      role         ENUM('admin','manager','worker') DEFAULT 'admin',
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅  Table: users');

  // ── 2. CATTLE ────────────────────────────────────────────
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS cattle (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      user_id         INT NOT NULL,
      tag_id          VARCHAR(50) NOT NULL,
      name            VARCHAR(100) NOT NULL,
      breed           VARCHAR(100),
      age_years       DECIMAL(4,1) DEFAULT 0,
      health_status   ENUM('Healthy','Under Treatment','Pregnant','Dry Period') DEFAULT 'Healthy',
      avg_daily_yield DECIMAL(6,2) DEFAULT 0,
      purchase_price  DECIMAL(12,2) DEFAULT 0,
      is_sold         BOOLEAN DEFAULT FALSE,
      notes           TEXT,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_tag (user_id, tag_id)
    )
  `);
  console.log('✅  Table: cattle');

  // ── 3. MILK PRODUCTION ───────────────────────────────────
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS milk_production (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NOT NULL,
      cattle_id   INT,
      cattle_tag  VARCHAR(50),
      log_date    DATE NOT NULL,
      session     ENUM('Morning','Evening','Both') DEFAULT 'Morning',
      quantity_l  DECIMAL(8,2) NOT NULL,
      quality     ENUM('Grade A','Grade B','Rejected') DEFAULT 'Grade A',
      notes       TEXT,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (cattle_id) REFERENCES cattle(id) ON DELETE SET NULL
    )
  `);
  console.log('✅  Table: milk_production');

  // ── 4. SALES ─────────────────────────────────────────────
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS sales (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      user_id        INT NOT NULL,
      sale_type      ENUM('Milk','Cattle') NOT NULL,
      item_desc      VARCHAR(200),
      cattle_id      INT,
      quantity       DECIMAL(10,2) NOT NULL,
      rate           DECIMAL(10,2) NOT NULL,
      total_amount   DECIMAL(12,2) NOT NULL,
      buyer_name     VARCHAR(150) NOT NULL,
      payment_status ENUM('Paid','Pending','Partial') DEFAULT 'Paid',
      sale_date      DATE NOT NULL,
      notes          TEXT,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (cattle_id) REFERENCES cattle(id) ON DELETE SET NULL
    )
  `);
  console.log('✅  Table: sales');

  // ── 5. INVENTORY ─────────────────────────────────────────
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS inventory (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      user_id       INT NOT NULL,
      item_name     VARCHAR(100) NOT NULL,
      category      ENUM('Milk Storage','Feed','Packaging','Medicine','Equipment','Other') DEFAULT 'Other',
      quantity      DECIMAL(10,2) DEFAULT 0,
      unit          VARCHAR(30),
      capacity      DECIMAL(10,2),
      reorder_level DECIMAL(10,2),
      notes         TEXT,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅  Table: inventory');

  // ── 6. ALERTS ────────────────────────────────────────────
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS alerts (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NOT NULL,
      type        ENUM('warning','error','success','info') DEFAULT 'info',
      title       VARCHAR(200) NOT NULL,
      message     TEXT,
      is_read     BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅  Table: alerts');

  console.log('\n🎉  All migrations completed successfully!');
  await conn.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});