const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { requireAuth, requireRoles } = require('../middleware/auth');

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: get all inventory items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: a list of inventory items
 *       401:
 *         description: unauthorized
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    // Managers and Directors see all, Sales Agents might see only their branch
    let query = {};
    if (req.user.role === 'sales_agent') {
      query.branch = req.user.branch;
    }
    
    const inventory = await Inventory.find(query).sort({ branch: 1, produceName: 1 });
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /inventory/branch/{branchName}:
 *   get:
 *     summary: get inventory for a specific branch
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: branchName
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: inventory list for the branch
 */
router.get('/branch/:branchName', requireAuth, async (req, res) => {
  try {
    const { branchName } = req.params;
    
    // Authorization check
    if (req.user.role === 'sales_agent' && req.user.branch !== branchName) {
      return res.status(403).json({ error: 'You do not have permission to view other branch inventory' });
    }
    
    const inventory = await Inventory.find({ branch: branchName });
    res.json({ success: true, branch: branchName, inventory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /inventory/valuation:
 *   get:
 *     summary: get total value of current inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: total valuation data
 */
router.get('/valuation', requireRoles(['manager', 'director']), async (req, res) => {
  try {
    const inventory = await Inventory.find();
    
    let totalCostValue = 0;
    let totalPotentialSales = 0;
    
    const branchBreakdown = {
      Maganjo: { costValue: 0, salesValue: 0 },
      Matugga: { costValue: 0, salesValue: 0 }
    };

    const inventoryWithValues = inventory.map(item => {
      const itemCost = item.quantity * item.latestCost;
      const itemSales = item.quantity * item.latestSellingPrice;
      
      totalCostValue += itemCost;
      totalPotentialSales += itemSales;
      
      if (branchBreakdown[item.branch]) {
        branchBreakdown[item.branch].costValue += itemCost;
        branchBreakdown[item.branch].salesValue += itemSales;
      }

      return {
        ...item._doc,
        stockValue: itemCost,
        potentialSalesValue: itemSales
      };
    });

    res.json({
      success: true,
      totalValuation: {
        totalCostValue,
        totalPotentialSales,
        potentialProfit: totalPotentialSales - totalCostValue
      },
      branchBreakdown,
      inventory: inventoryWithValues
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
