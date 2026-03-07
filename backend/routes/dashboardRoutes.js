const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const CashSale = require('../models/Sale');
const CreditSale = require('../models/CreditSale');
const { requireAuth, requireRoles } = require('../middleware/auth');

/**
 * @swagger
 * /dashboard/director:
 *   get:
 *     summary: get dashboard data for director
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: dashboard statistics and charts data
 */
router.get('/director', requireAuth, requireRoles(['director']), async (req, res) => {
  try {
    // 1. Metrics
    const [inventory, cashSales, creditSales] = await Promise.all([
      Inventory.find(),
      CashSale.find(),
      CreditSale.find()
    ]);

    // Global Revenue
    const globalRevenue = cashSales.reduce((sum, s) => sum + s.amountPaid, 0);

    // Stock Value
    let totalStockValue = 0;
    inventory.forEach(item => {
      totalStockValue += (item.quantity * item.latestCost);
    });

    // Credit Summary
    const totalCredit = creditSales.reduce((sum, s) => sum + s.amountDue, 0);

    // 2. Branch Performance (Revenue)
    const branchPerformance = {
      Maganjo: cashSales.filter(s => s.branch === 'Maganjo').reduce((sum, s) => sum + s.amountPaid, 0),
      Matugga: cashSales.filter(s => s.branch === 'Matugga').reduce((sum, s) => sum + s.amountPaid, 0)
    };

    // 3. Cereal Distribution
    const cerealDistribution = {};
    inventory.forEach(item => {
      cerealDistribution[item.produceName] = (cerealDistribution[item.produceName] || 0) + item.quantity;
    });

    // 4. Recent Large Transactions (Mix of cash and credit, sorted by amount)
    const recentCash = cashSales.map(s => ({
      type: 'Cash',
      branch: s.branch,
      amount: s.amountPaid,
      client: s.buyerName,
      produce: s.produceName,
      date: s.date
    }));

    const recentCredit = creditSales.map(s => ({
      type: 'Credit',
      branch: s.branch,
      amount: s.amountDue,
      client: s.buyerName,
      produce: s.produceName,
      date: s.dispatchDate
    }));

    const recentTransactions = [...recentCash, ...recentCredit]
      .sort((a, b) => b.amount - a.amount || new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    // 5. Stock Status (Low stock items)
    const stockStatus = inventory
      .map(i => ({
        produceName: i.produceName,
        branch: i.branch,
        quantity: i.quantity,
        status: i.quantity <= 500 ? 'Low' : 'Healthy'
      }))
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);

    res.json({
      success: true,
      metrics: {
        globalRevenue,
        totalStockValue,
        totalCredit
      },
      branchPerformance,
      cerealDistribution,
      recentTransactions,
      stockStatus
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
