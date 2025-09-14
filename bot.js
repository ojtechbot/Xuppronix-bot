require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('config');
const webhookRoutes = require('./routes/webhook');
const TimeTracker = require('./utils/timeTracker');

const app = express();
const PORT = process.env.PORT || config.get('port');
const timeTracker = new TimeTracker();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public')); // Serve static files

// Database connection
mongoose.connect(config.get('db.uri'), {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Routes
app.use('/', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Initialize services
const TelegramService = require('./services/telegramService');
const WhatsAppService = require('./services/whatsappService');
const CurrencyService = require('./services/currencyService');
const WhatsAppController = require('./controllers/whatsappController');

const telegramService = new TelegramService();
const whatsappService = new WhatsAppService();
const currencyService = new CurrencyService();
const whatsappController = new WhatsAppController();

// Set up WhatsApp message handling
whatsappService.setOnMessageCallback(async (msg) => {
  await whatsappController.handleIncomingMessage(msg);
});

// Initialize currency rates
currencyService.updateRates().then(() => {
  console.log('Currency rates initialized');
});

// Set Telegram webhook
if (process.env.NODE_ENV === 'production') {
  telegramService.bot.setWebHook(config.get('bot.webhookUrl'))
    .then(() => {
      console.log('Webhook set successfully');
    })
    .catch((error) => {
      console.error('Error setting webhook:', error);
    });
} else {
  // Use polling in development
  telegramService.bot.startPolling();
  console.log('Bot started in polling mode');
}

// Admin dashboard route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Xuppronix bot server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  
  if (process.env.NODE_ENV === 'production') {
    await telegramService.bot.deleteWebHook();
    console.log('Webhook deleted');
  }
  
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  
  // Close WhatsApp client
  if (whatsappService) {
    await whatsappService.destroy();
    console.log('WhatsApp client destroyed');
  }
  
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process for uncaught exceptions in production
  if (process.env.NODE_ENV === 'production') {
    // Log the error and continue
    console.log('Continuing after uncaught exception');
  }
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;