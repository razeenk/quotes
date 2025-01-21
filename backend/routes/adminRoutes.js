const express = require("express");
const Quote = require("../models/Quote");
const router = express.Router();

// Add a new quote
router.post("/add", async (req, res) => {
  const { text, author, authorLink } = req.body;
  try {
    const quote = new Quote({ text, author, authorLink });
    await quote.save();
    res.status(201).json({ message: "Quote added successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all quotes for admin
router.get("/", async (req, res) => {
  try {
    const quotes = await Quote.find();
    res.status(200).json(quotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a quote
router.delete("/:id", async (req, res) => {
  try {
    await Quote.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Quote deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;