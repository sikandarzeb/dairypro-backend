// ============================================================
// controllers/sales.controller.js
// ============================================================
const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { type, status, from, to, buyer } = req.query;
    let sql = 'SELECT * FROM sales WHERE user_id = ?';
    const p = [req.user.id];

    if (type)   { sql += ' AND sale_type = ?';          p.push(type); }
    if (status) { sql += ' AND payment_status = ?';     p.push(status); }
    if (from)   { sql += ' AND sale_date >= ?';         p.push(from); }
    if (to)     { sql += ' AND sale_date <= ?';         p.push(to); }
    if (buyer)  { sql += ' AND buyer_name LIKE ?';      p.push(`%${buyer}%`); }

    sql += ' ORDER BY sale_date DESC, created_at DESC';
    const [rows] = await db.execute(sql, p);
    const totalRevenue = rows.reduce((s, r) => s + parseFloat(r.total_amount), 0);
    const milkSales    = rows.filter(r => r.sale_type === 'Milk').length;
    const cattleSales  = rows.filter(r => r.sale_type === 'Cattle').length;
    return res.json({ success: true, count: rows.length, total_revenue: totalRevenue.toFixed(2), milk_sales: milkSales, cattle_sales: cattleSales, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch sales.' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM sales WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Sale not found.' });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { sale_type, item_desc, cattle_id, quantity, rate, buyer_name, payment_status, sale_date, notes } = req.body;
    if (!sale_type || !quantity || !rate || !buyer_name || !sale_date)
      return res.status(400).json({ success: false, message: 'sale_type, quantity, rate, buyer_name, sale_date are required.' });

    const total_amount = parseFloat(quantity) * parseFloat(rate);
    const [result] = await db.execute(
      `INSERT INTO sales (user_id, sale_type, item_desc, cattle_id, quantity, rate, total_amount, buyer_name, payment_status, sale_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, sale_type, item_desc || null, cattle_id || null, quantity, rate, total_amount,
       buyer_name, payment_status || 'Paid', sale_date, notes || null]
    );

    // Mark cattle as sold if cattle sale
    if (sale_type === 'Cattle' && cattle_id) {
      await db.execute('UPDATE cattle SET is_sold = TRUE WHERE id = ? AND user_id = ?', [cattle_id, req.user.id]);
    }

    const [rows] = await db.execute('SELECT * FROM sales WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, message: 'Sale recorded.', data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to record sale.' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { payment_status } = req.body;
    const valid = ['Paid','Pending','Partial'];
    if (!valid.includes(payment_status))
      return res.status(400).json({ success: false, message: 'Invalid payment_status.' });
    await db.execute(
      'UPDATE sales SET payment_status = ? WHERE id = ? AND user_id = ?',
      [payment_status, req.params.id, req.user.id]
    );
    return res.json({ success: true, message: 'Payment status updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.remove = async (req, res) => {
  try {
    const [check] = await db.execute(
      'SELECT id FROM sales WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    );
    if (!check.length) return res.status(404).json({ success: false, message: 'Sale not found.' });
    await db.execute('DELETE FROM sales WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Sale deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
