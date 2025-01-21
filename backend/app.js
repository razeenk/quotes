const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Quote schema
const quoteSchema = new mongoose.Schema({
  text: { type: String, required: true, unique: true },
  author: { type: String, required: true },
  authorLink: { type: String },
});

const Quote = mongoose.model("Quote", quoteSchema);

// API routes
// 1. Fetch all quotes
app.get("/api/quotes", async (req, res) => {
  try {
    const quotes = await Quote.find();
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
});

// 2. Fetch a random quote
app.get("/api/quotes/random", async (req, res) => {
  try {
    const count = await Quote.countDocuments();
    const randomIndex = Math.floor(Math.random() * count);
    const randomQuote = await Quote.findOne().skip(randomIndex);
    res.json(randomQuote);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch random quote" });
  }
});

// 3. Add a new quote (prevent duplicates)
app.post("/api/quotes", async (req, res) => {
  try {
    const { text, author, authorLink } = req.body;

    // Check for duplicate quotes
    const existingQuote = await Quote.findOne({ text });
    if (existingQuote) {
      return res.status(400).json({ error: "Duplicate quote. This quote already exists." });
    }

    const newQuote = new Quote({ text, author, authorLink });
    await newQuote.save();
    res.status(201).json({ message: "Quote added successfully", quote: newQuote });
  } catch (error) {
    res.status(500).json({ error: "Failed to add quote" });
  }
});

// 4. Delete a quote by ID
app.delete("/api/quotes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Quote.findByIdAndDelete(id);
    res.status(200).json({ message: "Quote deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete quote" });
  }
});

// 5. Fetch stats for total quotes and unique authors
app.get("/api/stats", async (req, res) => {
  try {
    const totalQuotes = await Quote.countDocuments();
    const uniqueAuthors = await Quote.distinct("author");
    res.json({ totalQuotes, uniqueAuthors: uniqueAuthors.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});