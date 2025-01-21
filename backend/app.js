const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Quote Schema and Model
const QuoteSchema = new mongoose.Schema({
  text: String,
  author: String,
  authorLink: String,
});

const Quote = mongoose.model("Quote", QuoteSchema);

// API Routes

// 1. Get all quotes
app.get("/api/quotes", async (req, res) => {
  try {
    const quotes = await Quote.find();
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
});

// 2. Get a random quote
app.get("/api/quotes/random", async (req, res) => {
  try {
    const count = await Quote.countDocuments(); // Get the total number of quotes
    const randomIndex = Math.floor(Math.random() * count); // Generate a random index
    const randomQuote = await Quote.findOne().skip(randomIndex); // Fetch the random quote
    res.json(randomQuote);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch random quote" });
  }
});

// 3. Add a new quote (Admin API)
app.post("/api/quotes", async (req, res) => {
  try {
    const { text, author, authorLink } = req.body;
    const newQuote = new Quote({ text, author, authorLink });
    await newQuote.save();
    res.status(201).json({ message: "Quote added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add quote" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});