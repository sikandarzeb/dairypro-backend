// ============================================================
// controllers/cattle.controller.js — Full CRUD for Cattle
// ============================================================
const db = require('../config/db');

// GET /api/cattle — list all cattle for this farm
exports.getAll = async (req, res) => {
  try {
    const { health, breed, search } = req.query;
    let sql = 'SELECT * FROM cattle WHERE user_id = ?';
    const params = [req.user.id];

    if (health)  { sql += ' AND health_status = ?';          params.push(health); }
    if (breed)   { sql += ' AND breed = ?';                  params.push(breed); }
    if (search)  { sql += ' AND (name LIKE ? OR tag_id LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.execute(sql, params);
    const healthy = rows.filter(c => c.health_status === 'Healthy').length;
    const sick    = rows.filter(c => c.health_status === 'Under Treatment').length;
    return res.json({ success: true, total: rows.length, healthy, sick, data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to fetch cattle.' });
  }
};

// GET /api/cattle/:id — single cattle record
exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM cattle WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Cattle not found.' });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/cattle — add new cattle
exports.create = async (req, res) => {
  try {
    const { tag_id, name, breed, age_years, health_status, avg_daily_yield, purchase_price, notes } = req.body;
    if (!tag_id || !name) return res.status(400).json({ success: false, message: 'tag_id and name are required.' });

    const [result] = await db.execute(
      `INSERT INTO cattle (user_id, tag_id, name, breed, age_years, health_status, avg_daily_yield, purchase_price, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, tag_id, name, breed, age_years || 0, health_status || 'Healthy',
       avg_daily_yield || 0, purchase_price || 0, notes || null]
    );
    const [rows] = await db.execute('SELECT * FROM cattle WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, message: 'Cattle added.', data: rows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ success: false, message: 'Tag ID already exists.' });
    return res.status(500).json({ success: false, message: 'Failed to add cattle.' });
  }
};

// PUT /api/cattle/:id — update cattle
exports.update = async (req, res) => {
  try {
    const { name, breed, age_years, health_status, avg_daily_yield, purchase_price, notes } = req.body;
    const [check] = await db.execute(
      'SELECT id FROM cattle WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    );
    if (!check.length) return res.status(404).json({ success: false, message: 'Cattle not found.' });

    await db.execute(
      `UPDATE cattle SET name=?, breed=?, age_years=?, health_status=?, avg_daily_yield=?, purchase_price=?, notes=?
       WHERE id = ? AND user_id = ?`,
      [name, breed, age_years, health_status, avg_daily_yield, purchase_price, notes,
       req.params.id, req.user.id]
    );
    const [rows] = await db.execute('SELECT * FROM cattle WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Cattle updated.', data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update cattle.' });
  }
};

// DELETE /api/cattle/:id — remove cattle
exports.remove = async (req, res) => {
  try {
    const [check] = await db.execute(
      'SELECT id FROM cattle WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    );
    if (!check.length) return res.status(404).json({ success: false, message: 'Cattle not found.' });
    await db.execute('DELETE FROM cattle WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ success: true, message: 'Cattle removed.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete cattle.' });
  }
};
