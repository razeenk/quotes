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
const crypto = require('crypto');

// Model for API keys
const apiKeySchema = new mongoose.Schema({
  key: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
});
const ApiKey = mongoose.model('ApiKey', apiKeySchema);

// Route to generate API key
app.post('/api/generate-key', async (req, res) => {
  try {
    // Generate a unique API key
    const apiKey = crypto.randomBytes(16).toString('hex');

    // Save the key to the database
    const newKey = new ApiKey({ key: apiKey });
    await newKey.save();

    res.status(201).json({ success: true, key: apiKey });
  } catch (error) {
    console.error('Error generating API key:', error.message);
    res.status(500).json({ success: false, error: 'Failed to generate API key' });
  }
});

// Route to get all API keys
app.get('/api/keys', async (req, res) => {
  try {
    const keys = await ApiKey.find().sort({ createdAt: -1 });
    res.json({ success: true, keys });
  } catch (error) {
    console.error('Error fetching API keys:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch API keys' });
  }
});
// Import necessary modules
const mongoose = require('mongoose');

// Define API usage schema and model
const apiUsageSchema = new mongoose.Schema({
  key: { type: String, required: true },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  count: { type: Number, default: 1 },
});

const ApiUsage = mongoose.model('ApiUsage', apiUsageSchema);

// Middleware to track API usage
const trackApiUsage = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
      const usage = await ApiUsage.findOneAndUpdate(
        { key: apiKey, endpoint: req.path, method: req.method },
        { $inc: { count: 1 } },
        { new: true, upsert: true }
      );
    }
    next();
  } catch (error) {
    console.error('Error tracking API usage:', error.message);
    next(); // Do not block the request even if tracking fails
  }
};

// Apply the usage tracker to all `/api/quotes` routes
app.use('/api/quotes', trackApiUsage);

// Route to retrieve API usage stats
app.get('/api/usage', async (req, res) => {
  try {
    const usageStats = await ApiUsage.find({});
    res.status(200).json({ success: true, data: usageStats });
  } catch (error) {
    console.error('Error fetching API usage stats:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch API usage stats' });
  }
});
// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});
