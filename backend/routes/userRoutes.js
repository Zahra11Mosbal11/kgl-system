const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireManager, requireRoles } = require('../middleware/auth');
const jwt = require("jsonwebtoken");

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: login a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: logged in successfully
 *       401:
 *         description: invalid username or password
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // search for active user with the given username
    const user = await User.findOne({ username, isActive: true });
    
    // check if user exists
    if (!user) {
      return res.status(401).json({ error: 'username or password is incorrect' });
    }
    
    // check if password matches
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'username or password is incorrect' });
    }
    
    // use token for authentication instead of session
    if (user) {
      const _user = {
        id: user._id,
        username: user.username,
        role: user.role,
        branch: user.branch
      };

      // Update online status
      user.isOnline = true;
      user.lastLogin = Date.now();
      await user.save();

      const token = jwt.sign(_user, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({
        success: true,
        message: "logged in successfully",
        token,
        user: {
          username: user.username,
          role: user.role,
          fullName: user.fullName,
          branch: user.branch
        }
      });
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: logout the current user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: logged out successfully
 */
router.post('/logout', async (req, res) => {
  try {
    // If the client sends the username or we have middleware to identify them
    const { username } = req.body;
    if (username) {
      await User.findOneAndUpdate({ username }, { isOnline: false });
    }
    res.json({ success: true, message: 'logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: create a new user (for manager only)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - role
 *               - fullName
 *               - branch
 *               - phone
 *             properties:
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [manager, sales_agent, director]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: created successfully
 *       400:
 *         description: bad request
 *       403:
 *         description: unauthorized
 */
router.post('/', requireRoles(['manager', 'director']), async (req, res) => {
  try {
    const { username, password, role, fullName, branch, phone } = req.body;
    
    // check required fields
    if (!username || !password || !role || !fullName || !branch || !phone) {
      return res.status(400).json({ error: 'all fields are required' });
    }
    
    // check conntact number 
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ error: 'contact number should be 10 digits' });
    }
    
    // check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'username already exists' });
    }
    
    const user = new User(req.body);
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'user created successfully',
      user: {
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        branch: user.branch
      }
    });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: get all users (for manager and director only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: a list of users
 *       401:
 *         description: unauthorized
 */
router.get('/', requireRoles(['manager', 'director']), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;