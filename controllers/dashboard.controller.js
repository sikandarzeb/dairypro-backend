// ============================================================
// controllers/dashboard.controller.js — All stats in one call
// ============================================================
const db = require('../config/db');

exports.getSummary = async (req, res) => {
  try {
    const uid = req.user.id;

    // Cattle stats
    const [cattle] = await db.execute(
      `SELECT COUNT(*) AS total,
         SUM(health_status='Healthy') AS healthy,
         SUM(health_status='Under Treatment') AS sick
       FROM cattle WHERE user_id = ? AND is_sold = FALSE`, [uid]
    );

    // Today's milk
    const today = new Date().toISOString().split('T')[0];
    const [milk] = await db.execute(
      `SELECT COALESCE(SUM(quantity_l),0) AS today_total,
              COUNT(DISTINCT cattle_tag)  AS cows_milked
       FROM milk_production WHERE user_id = ? AND log_date = ?`, [uid, today]
    );

    // Monthly milk
    const [milkMonth] = await db.execute(
      `SELECT COALESCE(SUM(quantity_l),0) AS month_total
       FROM milk_production WHERE user_id = ? AND MONTH(log_date)=MONTH(CURDATE())`, [uid]
    );

    // Revenue
    const [revenue] = await db.execute(
      `SELECT COALESCE(SUM(total_amount),0) AS total_revenue,
              COALESCE(SUM(CASE WHEN MONTH(sale_date)=MONTH(CURDATE()) THEN total_amount END),0) AS month_revenue
       FROM sales WHERE user_id = ?`, [uid]
    );

    // Sales count
    const [salesCount] = await db.execute(
      'SELECT COUNT(*) AS total FROM sales WHERE user_id = ?', [uid]
    );

    // Weekly milk chart
    const [weeklyMilk] = await db.execute(
      `SELECT log_date, SUM(quantity_l) AS total FROM milk_production
       WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY log_date ORDER BY log_date ASC`, [uid]
    );

    // Recent sales
    const [recentSales] = await db.execute(
      'SELECT * FROM sales WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [uid]
    );

    return res.json({
      success: true,
      data: {
        cattle: {
          total:   cattle[0].total   || 0,
          healthy: cattle[0].healthy || 0,
          sick:    cattle[0].sick    || 0
        },
        milk: {
          today:      parseFloat(milk[0].today_total).toFixed(1),
          cows_milked: milk[0].cows_milked || 0,
          this_month: parseFloat(milkMonth[0].month_total).toFixed(1)
        },
        revenue: {
          total:      parseFloat(revenue[0].total_revenue).toFixed(2),
          this_month: parseFloat(revenue[0].month_revenue).toFixed(2)
        },
        sales_count:   salesCount[0].total || 0,
        weekly_milk:   weeklyMilk,
        recent_sales:  recentSales
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Dashboard query failed.' });
  }
};
