// ============================================================
// controllers/milk.controller.js
// ============================================================
const db = require('../config/db');

// GET /api/milk — all logs (with optional filters)
exports.getAll = async (req, res) => {
  try {
    const { date, cattle_tag, session, quality, from, to } = req.query;
    let sql = 'SELECT * FROM milk_production WHERE user_id = ?';
    const p = [req.user.id];

    if (date)        { sql += ' AND log_date = ?';          p.push(date); }
    if (cattle_tag)  { sql += ' AND cattle_tag = ?';        p.push(cattle_tag); }
    if (session)     { sql += ' AND session = ?';           p.push(session); }
    if (quality)     { sql += ' AND quality = ?';           p.push(quality); }
    if (from)        { sql += ' AND log_date >= ?';         p.push(from); }
    if (to)          { sql += ' AND log_date <= ?';         p.push(to); }

    sql += ' ORDER BY log_date DESC, created_at DESC';
    const [rows] = await db.execute(sql, p);
    const totalLitres = rows.reduce((s, r) => s + parseFloat(r.quantity_l), 0);
    return res.json({ success: true, count: rows.length, total_litres: totalLitres.toFixed(2), data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch milk logs.' });
  }
};

// GET /api/milk/today — today's summary
exports.getToday = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await db.execute(
      'SELECT * FROM milk_production WHERE user_id = ? AND log_date = ?',
      [req.user.id, today]
    );
    const total = rows.reduce((s, r) => s + parseFloat(r.quantity_l), 0);
    const cows  = [...new Set(rows.map(r => r.cattle_tag))].length;
    return res.json({ success: true, date: today, total_litres: total.toFixed(2), cows_milked: cows, entries: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/milk/weekly — last 7 days chart data
exports.getWeekly = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT log_date, SUM(quantity_l) AS total_litres, COUNT(DISTINCT cattle_tag) AS cows
       FROM milk_production
       WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY log_date ORDER BY log_date ASC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/milk — log new milk entry
exports.create = async (req, res) => {
  try {
    const { cattle_tag, log_date, session, quantity_l, quality, notes } = req.body;
    if (!cattle_tag || !log_date || !quantity_l)
      return res.status(400).json({ success: false, message: 'cattle_tag, log_date, quantity_l are required.' });

    // Resolve cattle_id if possible
    const [crows] = await db.execute(
      'SELECT id FROM cattle WHERE user_id = ? AND tag_id = ?', [req.user.id, cattle_tag]
    );
    const cattle_id = crows.length ? crows[0].id : null;

    const [result] = await db.execute(
      `INSERT INTO milk_production (user_id, cattle_id, cattle_tag, log_date, session, quantity_l, quality, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, cattle_id, cattle_tag, log_date, session || 'Morning', quantity_l, quality || 'Grade A', notes || null]
    );
    const [rows] = await db.execute('SELECT * FROM milk_production WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, message: 'Milk entry logged.', data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to log milk.' });
  }
};

// DELETE /api/milk/:id
exports.remove = async (req, res) => {
  try {
    const [check] = await db.execute(
      'SELECT id FROM milk_production WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    );
    if (!check.length) return res.status(404).json({ success: false, message: 'Entry not found.' });
    await db.execute('DELETE FROM milk_production WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Entry deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
