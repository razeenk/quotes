const express = require("express");
const Quote = require("../models/Quote");
const router = express.Router();

// Get all quotes
router.get("/quotes", async (req, res) => {
  try {
    const quotes = await Quote.find();
    res.status(200).json(quotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;