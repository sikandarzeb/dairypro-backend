// ============================================================
// controllers/revenue.controller.js — Revenue analytics
// ============================================================
const db = require('../config/db');

// GET /api/revenue/summary — overall totals
exports.getSummary = async (req, res) => {
  try {
    const [totals] = await db.execute(
      `SELECT
         SUM(total_amount)                                      AS total_revenue,
         SUM(CASE WHEN sale_type='Milk'   THEN total_amount END) AS milk_revenue,
         SUM(CASE WHEN sale_type='Cattle' THEN total_amount END) AS cattle_revenue,
         COUNT(*)                                               AS total_sales,
         SUM(CASE WHEN payment_status='Pending' THEN total_amount END) AS pending_amount
       FROM sales WHERE user_id = ?`,
      [req.user.id]
    );

    // This month
    const [monthly] = await db.execute(
      `SELECT SUM(total_amount) AS month_revenue
       FROM sales WHERE user_id = ? AND MONTH(sale_date)=MONTH(CURDATE()) AND YEAR(sale_date)=YEAR(CURDATE())`,
      [req.user.id]
    );

    return res.json({
      success: true,
      data: {
        total_revenue:   parseFloat(totals[0].total_revenue  || 0).toFixed(2),
        milk_revenue:    parseFloat(totals[0].milk_revenue   || 0).toFixed(2),
        cattle_revenue:  parseFloat(totals[0].cattle_revenue || 0).toFixed(2),
        total_sales:     totals[0].total_sales || 0,
        pending_amount:  parseFloat(totals[0].pending_amount || 0).toFixed(2),
        month_revenue:   parseFloat(monthly[0].month_revenue || 0).toFixed(2)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load revenue summary.' });
  }
};

// GET /api/revenue/monthly — revenue per month (last 12 months)
exports.getMonthly = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
         DATE_FORMAT(sale_date, '%Y-%m') AS month,
         SUM(total_amount)               AS revenue,
         SUM(CASE WHEN sale_type='Milk'   THEN total_amount END) AS milk_rev,
         SUM(CASE WHEN sale_type='Cattle' THEN total_amount END) AS cattle_rev,
         COUNT(*)                        AS sales_count
       FROM sales
       WHERE user_id = ? AND sale_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY month ORDER BY month ASC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/revenue/top-buyers — top customers by purchase amount
exports.getTopBuyers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT buyer_name, SUM(total_amount) AS total, COUNT(*) AS orders
       FROM sales WHERE user_id = ?
       GROUP BY buyer_name ORDER BY total DESC LIMIT 10`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
