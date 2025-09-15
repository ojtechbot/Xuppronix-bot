🤖 Xuppronix Telegram Bot

A feature-rich Telegram bot with dashboard for Xuppronix services, built with Node.js and Express.

https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white

✨ Features

🤖 Bot Features

· 💼 Service Catalog - Showcase Xuppronix services
· 💰 Quote Requests - Lead generation with scoring system
· 📞 Support System - Direct contact with support team
· 🔥 Promotional Offers - Manage and display current offers
· 📰 News Updates - Share latest company news
· ⏰ Reminders - Set personal reminders
· ⭐ Feedback System - Collect user ratings and comments
· 📊 Admin Tools - Comprehensive management tools

🌐 Dashboard Features

· 📱 Mobile-Friendly - Responsive design with bottom navigation
· 📊 Analytics - Visual statistics and charts
· 👥 User Management - View all bot users
· 📝 Lead Management - Track and manage leads with scoring
· 📤 Data Export - Export data to CSV format
· 🔥 Offer Management - Create and manage promotional offers

🚀 Quick Start

Prerequisites

· Node.js 18+
· Telegram Bot Token from @BotFather
· Render.com account (for deployment)

Environment Variables

Create a .env file or set these in your deployment platform:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
ADMIN_CHAT_ID=your_admin_chat_id_here
PORT=3000
NODE_ENV=production
WEBSITE_URL=https://xuppronix.free.nf
PORTFOLIO_URL=https://xuppronix.free.nf
```

Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/xuppronix-bot.git
   cd xuppronix-bot
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Set up environment variables
   ```bash
   # Copy the example env file
   cp .env.example .env
   # Edit with your actual values
   nano .env
   ```
4. Run the bot locally
   ```bash
   npm start
   ```

📦 Deployment

Deploy to Render.com

1. Fork this repository to your GitHub account
2. Connect to Render:
   · Go to Render Dashboard
   · Click "New +" → "Web Service"
   · Connect your GitHub repository
3. Configure settings:
   · Name: xuppronix-bot
   · Environment: Node
   · Build Command: npm install
   · Start Command: npm start
4. Set environment variables in Render dashboard
5. Deploy 🚀

Get Bot Token

1. Message @BotFather on Telegram
2. Use /newbot command
3. Follow instructions to create your bot
4. Copy the API token provided

Get Your Chat ID

1. Message @userinfobot on Telegram
2. It will reply with your Chat ID
3. Use this as ADMIN_CHAT_ID

🎯 Usage

For Users

· Start chat with /start
· Browse services with menu buttons
· Request quotes for services
· Contact support
· Check current offers
· Subscribe to updates

For Admins

· View statistics with /stats
· Broadcast messages with /broadcast <message>
· Manage offers with /addoffer and /clearoffers
· Monitor leads through dashboard
· Export data to CSV

📁 Project Structure

```
xuppronix-bot/
├── index.js          # Main application file
├── package.json      # Dependencies and scripts
├── *.json           # Data storage files
├── README.md        # This file
└── .env.example     # Environment variables template
```

🛠️ Technologies Used

· 🤖 Telegram Bot API: node-telegram-bot-api
· 🌐 Web Framework: Express.js
· 📊 CSV Processing: json2csv
· ⏰ Scheduling: node-cron
· 🎨 Styling: Tailwind CSS (CDN)
· 📱 Icons: Font Awesome
· 🚀 Deployment: Render.com

📊 Data Storage

The bot uses JSON files for data persistence:

· leads.json - Customer inquiries and quotes
· users.json - Bot users information
· offers.json - Current promotions
· news.json - Company updates
· feedback.json - User ratings and comments

🔧 Admin Commands

Command Description
/stats View bot statistics
/broadcast <message> Send message to all users
/addoffer <text> Add new promotion
/clearoffers Remove all offers
/news <text> Add news update

🌐 Dashboard Routes

Route Description
/ Home dashboard with statistics
/leads View and manage leads
/users View all bot users
/offers Manage promotional offers
/stats Detailed statistics
/export/* Export data as CSV

🤝 Contributing

1. Fork the project
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

⚠️ Troubleshooting

Common Issues

1. Bot not responding:
   · Check if bot token is correct
   · Verify environment variables are set
2. Build fails on Render:
   · Ensure package.json has correct dependencies
   · Check Render logs for specific errors
3. Dashboard not loading:
   · Verify PORT environment variable is set
   · Check if Express server is running

Getting Help

· Check Render deployment logs
· Verify all environment variables are set
· Test locally before deploying

📞 Support

For support regarding this bot, please contact the Xuppronix development team.

---

⭐ Star this repo if you found it helpful!

---

Built with ❤️ by Xuppronix Team
