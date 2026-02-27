const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { requireAuth, requireRoles } = require('../middleware/auth');

/**
 * @swagger
 * /suppliers:
 *   post:
 *     summary: register a new supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', requireAuth, requireRoles(['manager', 'director']), async (req, res) => {
  try {
    const supplier = new Supplier({
      ...req.body,
      branch: req.user.branch
    });
    await supplier.save();
    res.status(201).json({ success: true, supplier });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: get all suppliers
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json({ success: true, suppliers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
