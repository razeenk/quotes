const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
mongoose
  .connect('mongodb+srv://razeem:Razeen9645@cluster0.lvtwo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Models
const QuoteSchema = new mongoose.Schema({
  text: { type: String, unique: true, required: true },
  author: { type: String, required: true },
  authorLink: String,
});

const ApiKeySchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ApiUsageSchema = new mongoose.Schema({
  key: { type: String, required: true },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  count: { type: Number, default: 1 },
});

const Quote = mongoose.model('Quote', QuoteSchema);
const ApiKey = mongoose.model('ApiKey', ApiKeySchema);
const ApiUsage = mongoose.model('ApiUsage', ApiUsageSchema);

// Utility: Generate random API key
const generateRandomApiKey = () => {
  return [...Array(32)]
    .map(() => (Math.random() * 36).toString(36).charAt(2))
    .join('');
};

// Middleware: Authenticate API key
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API key required' });

  const keyExists = await ApiKey.findOne({ key: apiKey });
  if (!keyExists) return res.status(403).json({ error: 'Invalid API key' });

  next();
};

// Middleware: Track API usage
const trackApiUsage = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
      await ApiUsage.findOneAndUpdate(
        { key: apiKey, endpoint: req.path, method: req.method },
        { $inc: { count: 1 } },
        { new: true, upsert: true }
      );
    }
    next();
  } catch (error) {
    console.error('Error tracking API usage:', error.message);
    next();
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => res.status(200).send('API is up and running'));

// Generate API key
app.post('/api/generate-key', async (req, res) => {
  try {
    const newKey = generateRandomApiKey();
    const apiKey = new ApiKey({ key: newKey });
    await apiKey.save();
    res.status(201).json({ success: true, key: newKey });
  } catch (error) {
    console.error('Error generating API key:', error.message);
    res.status(500).json({ success: false, error: 'Failed to generate API key' });
  }
});

// Get all API keys
app.get('/api/keys', async (req, res) => {
  try {
    const keys = await ApiKey.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, keys });
  } catch (error) {
    console.error('Error fetching API keys:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch API keys' });
  }
});

// Delete API key
app.delete('/api/delete-key/:id', async (req, res) => {
  try {
    const keyId = req.params.id;
    const deletedKey = await ApiKey.findByIdAndDelete(keyId);

    if (!deletedKey) {
      return res.status(404).json({ success: false, error: 'API key not found' });
    }

    res.status(200).json({ success: true, message: 'API key deleted' });
  } catch (error) {
    console.error('Error deleting API key:', error.message);
    res.status(500).json({ success: false, error: 'Failed to delete API key' });
  }
});

// Get API usage stats
app.get('/api/usage', async (req, res) => {
  try {
    const usageStats = await ApiUsage.find({});
    res.status(200).json({ success: true, data: usageStats });
  } catch (error) {
    console.error('Error fetching API usage stats:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch API usage stats' });
  }
});

// Add a quote
app.post('/api/quotes', authenticateApiKey, async (req, res) => {
  try {
    const { text, author, authorLink } = req.body;

    const newQuote = new Quote({ text, author, authorLink });
    await newQuote.save();

    res.status(201).json({ success: true, message: 'Quote added', quote: newQuote });
  } catch (error) {
    console.error('Error adding quote:', error.message);

    if (error.code === 11000) {
      res.status(400).json({ success: false, error: 'Duplicate quote' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to add quote' });
    }
  }
});

// Get a random quote
app.get('/api/quotes/random', authenticateApiKey, async (req, res) => {
  try {
    const quotes = await Quote.aggregate([{ $sample: { size: 1 } }]);
    if (quotes.length === 0) return res.status(404).json({ error: 'No quotes available' });

    res.status(200).json({ success: true, quote: quotes[0] });
  } catch (error) {
    console.error('Error fetching random quote:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch random quote' });
  }
});

// Delete a quote
app.delete('/api/quotes/:id', authenticateApiKey, async (req, res) => {
  try {
    const quoteId = req.params.id;
    const deletedQuote = await Quote.findByIdAndDelete(quoteId);

    if (!deletedQuote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    res.status(200).json({ success: true, message: 'Quote deleted' });
  } catch (error) {
    console.error('Error deleting quote:', error.message);
    res.status(500).json({ success: false, error: 'Failed to delete quote' });
  }
});

//api access through url
// Middleware to check API key from query params or headers
app.use((req, res, next) => {
  const apiKey = req.query.apiKey || req.header('x-api-key');
  if (!apiKey || apiKey !== 'your-predefined-api-key') {
    return res.status(403).json({ error: 'Invalid or missing API key' });
  }
  next();
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));