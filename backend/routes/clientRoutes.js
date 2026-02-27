const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const { requireAuth, requireRoles } = require('../middleware/auth');

/**
 * @swagger
 * /clients:
 *   post:
 *     summary: register a new client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, contact, location, branch]
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const client = new Client({
      ...req.body,
      branch: req.user.branch // Auto-assign branch from agent
    });
    await client.save();
    res.status(201).json({ success: true, client });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: get all clients (filtered by branch for agents)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'sales_agent') {
      query.branch = req.user.branch;
    }
    const clients = await Client.find(query).sort({ name: 1 });
    res.json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
