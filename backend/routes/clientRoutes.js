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
      branch: req.user.branch, // Auto-assign branch from agent
      recordedBy: req.user.id
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
      query.recordedBy = req.user.id;
    } else if (req.user.role === 'manager') {
      query.branch = req.user.branch;
    }
    const clients = await Client.find(query).sort({ name: 1 });
    res.json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /clients/{id}:
 *   put:
 *     summary: update a client
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true, client });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /clients/{id}:
 *   delete:
 *     summary: delete a client
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requireAuth, requireRoles(['manager', 'director']), async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
