// ============================================================
// database/seed.js — Insert sample data for testing
// Run with: npm run seed
// ============================================================
require('dotenv').config();
const mysql    = require('mysql2/promise');
const bcrypt   = require('bcryptjs');

async function seed() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('🌱  Seeding database...\n');

  // Admin user
  const hash = await bcrypt.hash('admin123', 12);
  const [userRes] = await conn.execute(`
    INSERT IGNORE INTO users (farm_name, email, password, role)
    VALUES ('GreenMeadow Farm', 'admin@dairypro.com', ?, 'admin')
  `, [hash]);
  const userId = userRes.insertId || 1;
  console.log('✅  Seeded: users  (email: admin@dairypro.com  password: admin123)');

  // Cattle
  const cattleData = [
    [userId,'COW-001','Bessie','Holstein Friesian',4,'Healthy',22.5,180000],
    [userId,'COW-002','Daisy','Jersey',3,'Healthy',18.0,150000],
    [userId,'COW-003','Lila','Sahiwal',5,'Pregnant',15.5,130000],
    [userId,'COW-004','Rosie','Nili-Ravi Buffalo',4,'Healthy',20.0,200000],
    [userId,'COW-005','Dolly','Crossbred',2,'Under Treatment',10.0,90000],
  ];
  for (const c of cattleData) {
    await conn.execute(`
      INSERT IGNORE INTO cattle (user_id,tag_id,name,breed,age_years,health_status,avg_daily_yield,purchase_price)
      VALUES (?,?,?,?,?,?,?,?)
    `, c);
  }
  console.log('✅  Seeded: cattle (5 cows)');

  // Milk logs (last 7 days)
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    await conn.execute(`
      INSERT INTO milk_production (user_id,cattle_tag,log_date,session,quantity_l,quality)
      VALUES (?,?,?,?,?,?)
    `, [userId, 'COW-001', dateStr, 'Morning', (20 + Math.random()*4).toFixed(1), 'Grade A']);
    await conn.execute(`
      INSERT INTO milk_production (user_id,cattle_tag,log_date,session,quantity_l,quality)
      VALUES (?,?,?,?,?,?)
    `, [userId, 'COW-002', dateStr, 'Morning', (16 + Math.random()*3).toFixed(1), 'Grade A']);
  }
  console.log('✅  Seeded: milk_production (7 days × 2 cows)');

  // Sample sales
  await conn.execute(`
    INSERT INTO sales (user_id,sale_type,item_desc,quantity,rate,total_amount,buyer_name,payment_status,sale_date)
    VALUES (?,?,?,?,?,?,?,?,?)
  `, [userId,'Milk','Fresh Whole Milk',200,120,24000,'Ahmad Dairy Co.','Paid', today.toISOString().split('T')[0]]);
  await conn.execute(`
    INSERT INTO sales (user_id,sale_type,item_desc,quantity,rate,total_amount,buyer_name,payment_status,sale_date)
    VALUES (?,?,?,?,?,?,?,?,?)
  `, [userId,'Cattle','Holstein Cow',1,180000,180000,'Khan Livestock','Paid', today.toISOString().split('T')[0]]);
  console.log('✅  Seeded: sales (2 sample sales)');

  // Inventory
  await conn.execute(`
    INSERT IGNORE INTO inventory (user_id,item_name,category,quantity,unit,capacity,reorder_level)
    VALUES
      (?, 'Raw Milk Storage', 'Milk Storage', 1200, 'L', 5000, 500),
      (?, 'Cattle Feed',      'Feed',         320,  'kg', 760,  200),
      (?, 'Milk Packaging',   'Packaging',    1200, 'units', 1600, 300)
  `, [userId, userId, userId]);
  console.log('✅  Seeded: inventory (3 items)');

  console.log('\n🎉  Seed completed! Login: admin@dairypro.com / admin123');
  await conn.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
