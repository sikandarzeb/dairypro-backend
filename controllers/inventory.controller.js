// ============================================================
// controllers/inventory.controller.js
// ============================================================
const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM inventory WHERE user_id = ? ORDER BY category', [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.upsert = async (req, res) => {
  try {
    const { item_name, category, quantity, unit, capacity, reorder_level, notes } = req.body;
    if (!item_name) return res.status(400).json({ success: false, message: 'item_name required.' });

    // Check if exists
    const [existing] = await db.execute(
      'SELECT id FROM inventory WHERE user_id = ? AND item_name = ?', [req.user.id, item_name]
    );
    if (existing.length) {
      await db.execute(
        'UPDATE inventory SET quantity=?, unit=?, capacity=?, reorder_level=?, notes=? WHERE id=?',
        [quantity, unit, capacity, reorder_level, notes, existing[0].id]
      );
      return res.json({ success: true, message: 'Inventory updated.' });
    } else {
      await db.execute(
        'INSERT INTO inventory (user_id, item_name, category, quantity, unit, capacity, reorder_level, notes) VALUES (?,?,?,?,?,?,?,?)',
        [req.user.id, item_name, category || 'Other', quantity, unit, capacity, reorder_level, notes]
      );
      return res.status(201).json({ success: true, message: 'Inventory item added.' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
