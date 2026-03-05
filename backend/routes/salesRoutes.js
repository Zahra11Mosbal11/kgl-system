const express = require("express");
const router = express.Router();
const CashSale = require("../models/Sale");
const CreditSale = require("../models/CreditSale");
const Inventory = require("../models/Inventory");
const Client = require("../models/Client");
const { requireAuth, requireSalesAgent } = require("../middleware/auth");

/**
 * @swagger
 * /sales/cash:
 *   post:
 *     summary: register a new cash sale
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - produceName
 *               - tonnage
 *               - amountPaid
 *               - buyerName
 *               - salesAgentName
 *             properties:
 *               produceName:
 *                 type: string
 *               tonnage:
 *                 type: number
 *               amountPaid:
 *                 type: number
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Cash sale registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 sale:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/cash", requireAuth, async (req, res) => {
  try {
    // check required fields
    const { produceName, buyerName, salesAgentName, tonnage, amountPaid } =
      req.body;

    if (!produceName || produceName.length < 2) {
      return res
        .status(400)
        .json({
          error:
            "name of produce is required and should be at least 2 characters",
        });
    }

    if (!buyerName || buyerName.length < 2) {
      return res
        .status(400)
        .json({
          error:
            "name of buyer is required and should be at least 2 characters",
        });
    }

    if (!salesAgentName || salesAgentName.length < 2) {
      return res
        .status(400)
        .json({
          error:
            "name of sales agent is required and should be at least 2 characters",
        });
    }

    if (amountPaid < 10000) {
      return res
        .status(400)
        .json({ error: "amount paid should be at least 10,000 shillings" });
    }

    // Check stock
    const inventory = await Inventory.findOne({ produceName, branch: req.user.branch });
    if (!inventory || inventory.quantity < tonnage) {
      return res.status(400).json({ error: `Insufficient stock. Available: ${inventory ? inventory.quantity : 0} tonnes` });
    }

    // get current time and date
    const now = new Date();
    const timeString = now.toTimeString().split(" ")[0];

    const sale = new CashSale({
      ...req.body,
      date: now,
      time: timeString,
      branch: req.user.branch,
      recordedBy: req.user.id,
    });

    await sale.save();

    // Update Client Profile (Create or update existing client)
    // We use contact (phone) as a secondary unique identifier if nationalId isn't provided
    await Client.findOneAndUpdate(
      { contact: sale.contact },
      { 
        $set: { 
          name: sale.buyerName, 
          contact: sale.contact,
          branch: req.user.branch
        },
        $inc: { totalPurchases: 1 },
        $setOnInsert: {
          totalDebt: 0,
          recordedBy: req.user.id
        }
      },
      { upsert: true, new: true }
    );

    // Decrement stock
    inventory.quantity -= tonnage;
    inventory.lastUpdated = Date.now();
    await inventory.save();

    res.status(201).json({
      success: true,
      message: "cash sale registered successfully",
      sale,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /sales/credit:
 *   post:
 *     summary: register a new credit sale
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buyerName
 *               - nationalId
 *               - location
 *               - contact
 *               - amountDue
 *               - salesAgentName
 *               - dueDate
 *               - produceName
 *               - produceType
 *               - tonnage
 *             properties:
 *               nationalId:
 *                 type: string
 *                 example: "CM12345678ABCD9E"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Credit sale registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 creditSale:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/credit", requireAuth, async (req, res) => {
  try {
    // check required fields
    const { nationalId, contact, amountDue, tonnage } = req.body;

    // validate NIN format (14 characters)
    const ninRegex = /^[A-Z]{2}[0-9A-Z]{12}$/;
    if (!ninRegex.test(nationalId)) {
      return res.status(400).json({ error: "national ID number is not valid" });
    }

    if (!/^[0-9]{10}$/.test(contact)) {
      return res
        .status(400)
        .json({ error: "contact number must be 10 digits" });
    }

    if (amountDue < 10000) {
      return res
        .status(400)
        .json({ error: "amount due should be at least 10,000 shillings" });
    }

    // Check stock
    const inventory = await Inventory.findOne({ produceName: req.body.produceName, branch: req.user.branch });
    if (!inventory || inventory.quantity < tonnage) {
      return res.status(400).json({ error: `Insufficient stock. Available: ${inventory ? inventory.quantity : 0} tonnes` });
    }

    const creditSale = new CreditSale({
      ...req.body,
      branch: req.user.branch,
      recordedBy: req.user.id,
    });

    await creditSale.save();

    // Update Client Debt
    await Client.findOneAndUpdate(
      { nationalId: creditSale.nationalId },
      { 
        $inc: { 
          totalDebt: creditSale.amountDue,
          totalPurchases: 1
        },
        $setOnInsert: { 
          name: creditSale.buyerName, 
          contact: creditSale.contact,
          location: creditSale.location,
          branch: req.user.branch,
          recordedBy: req.user.id
        }
      },
      { upsert: true, new: true }
    );

    // Decrement stock
    inventory.quantity -= tonnage;
    inventory.lastUpdated = Date.now();
    await inventory.save();

    res.status(201).json({
      success: true,
      message: "credit sale registered successfully",
      creditSale,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Get all sales for the current user's branch
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved sales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cashSales:
 *                   type: array
 *                   items:
 *                     type: object
 *                 creditSales:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'sales_agent') {
      query.recordedBy = req.user.id;
    } else if (req.user.role === 'manager') {
      query.branch = req.user.branch;
    }
    // Director sees all, so query remains {}

    const cashSales = await CashSale.find(query).sort({ date: -1 });
    const creditSales = await CreditSale.find(query).sort({ date: -1 });

    res.status(200).json({
      success: true,
      cashSales,
      creditSales,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
