// ============================================================
// controllers/auth.controller.js
// ============================================================
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// ── POST /api/auth/register ─────────────────────────────────
exports.register = async (req, res) => {
  try {
    const farm_name = req.body.farm_name || null;
    const email     = req.body.email     || null;
    const password  = req.body.password  || null;
    const role      = req.body.role      || 'admin';

    if (!farm_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'farm_name, email and password are required.' });
    }

    // Check duplicate email
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 12);

    // Insert user
    const [result] = await db.execute(
      'INSERT INTO users (farm_name, email, password, role) VALUES (?, ?, ?, ?)',
      [farm_name, email, hashed, role]
    );

    // Generate token
    // const token = jwt.sign(
    //   { id: result.insertId, email, farm_name, role },
    //   process.env.JWT_SECRET,
    //   { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    // );
    const token = jwt.sign(
  { id: result.insertId, email, farm_name, role },
  (process.env.JWT_SECRET || 'dairypro_fallback_secret_key_2026'),
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: { id: result.insertId, farm_name, email, role }
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/login ────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?', [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];

    // Verify password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate token
    // const token = jwt.sign(
    //   { id: user.id, email: user.email, farm_name: user.farm_name, role: user.role },
    //   process.env.JWT_SECRET,
    //   { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    // );
   const token = jwt.sign(
  { id: user.id, email: user.email, farm_name: user.farm_name, role: user.role },
  (process.env.JWT_SECRET || 'dairypro_fallback_secret_key_2026'),
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: { id: user.id, farm_name: user.farm_name, email: user.email, role: user.role }
    });
  // } catch (err) {
  //   console.error(err);
  //   return res.status(500).json({ success: false, message: 'Server error during login.' });
  // }
  } catch (err) {
    console.error('LOGIN ERROR:', err.message);
    return res.status(500).json({ success: false, message: err.message });
}
};

// ── GET /api/auth/me ─────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, farm_name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PUT /api/auth/change-password ───────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(current_password, rows[0].password);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    const hashed = await bcrypt.hash(new_password, 12);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
