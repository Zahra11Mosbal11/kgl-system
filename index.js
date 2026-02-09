const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./backend/config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files (HTML, CSS, JS from root)
// Note: In a production app, we would move these to a 'public' folder
app.use(express.static(path.join(__dirname, '.')));

// Routes (Placeholder)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
