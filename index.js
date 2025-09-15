// === IMPORTS ===
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const cron = require("node-cron");
const express = require("express");
const bodyParser = require("body-parser");
const { Parser } = require("@json2csv/plainjs");
const path = require("path");

// === CONFIG ===
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8496384399:AAFzJs-ZDLY5C5lUAvXWuLP4M7B46BvYy4Q";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "7663776747";
const WEBSITE_URL = "https://xuppronix.free.nf";
const PORTFOLIO_URL = "https://xuppronix.free.nf";

// === INIT BOT ===
const bot = new TelegramBot(TOKEN, { polling: true });

// === STORAGE FILES ===
const leadsFile = "leads.json";
const usersFile = "users.json";
const rejectedFile = "rejected.json";
const offersFile = "offers.json";
const newsFile = "news.json";
const feedbackFile = "feedback.json";
const subsFile = "subs.json";
const projectsFile = "projects.json";

// Load/Save JSON
function load(file) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]");
  return JSON.parse(fs.readFileSync(file));
}
function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// === STORAGE DATA ===
let leads = load(leadsFile);
let users = load(usersFile);
let rejected = load(rejectedFile);
let offers = load(offersFile);
let news = load(newsFile);
let feedbacks = load(feedbackFile);
let subs = load(subsFile);
let projects = load(projectsFile);

// === SERVICES ===
const services = {
  "💻 Website Development": "$500+",
  "📱 Mobile App Development": "$1000+",
  "☁️ Cloud Solutions": "$300+",
  "🤖 Bots": "$200+",
  "🎨 Graphic Design": "$50+",
  "🔍 SEO Optimization": "$150+",
};

// === FAQs ===
const faqs = [
  { q: "seo", a: "We provide SEO packages from $150/month." },
  { q: "apps", a: "Yes, we build iOS and Android apps." },
  { q: "payments", a: "We accept PayPal, Stripe, Crypto." },
  { q: "support", a: "24/7 support is available." },
  { q: "timeline", a: "Projects typically take 2-6 weeks depending on complexity." },
  { q: "revisions", a: "We offer 3 free revisions for design projects." },
];

// === STATES ===
let quoteRequests = {};
let contactRequests = {};
let reminderRequests = {};
let feedbackRequests = {};

// === UTILS ===
function sendTyping(chatId) {
  bot.sendChatAction(chatId, "typing");
}
function scoreLead(lead) {
  let score = 0;
  if (lead.budget.includes("1000") || lead.budget.includes("$1000")) score += 50;
  if (lead.deadline.toLowerCase().includes("week")) score += 30;
  if (lead.description.toLowerCase().includes("urgent")) score += 20;
  return score >= 70 ? "🔥 Hot" : score >= 40 ? "🟡 Warm" : "❄️ Cold";
}

// === START COMMAND ===
bot.onText(/\/start/, (msg) => {
  const name = msg.from.first_name || "there";
  const userId = msg.chat.id;

  if (!users.find((u) => u.id === userId)) {
    users.push({ id: userId, name, lang: "en", lastSeen: new Date(), joined: new Date() });
    save(usersFile, users);
    bot.sendMessage(ADMIN_CHAT_ID, `👤 New user: ${name} (${userId})`);
  }

  sendTyping(userId);
  bot.sendMessage(
    userId,
    `👋 Welcome *${name}* to *Xuppronix* 🚀\nWe provide modern tech services.`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "💻 Services", callback_data: "services" }],
          [{ text: "📂 Portfolio", callback_data: "portfolio" }],
          [{ text: "❓ FAQs", callback_data: "faqs" }],
          [{ text: "📲 Social Media", callback_data: "social" }],
          [{ text: "🔥 Offers", callback_data: "offers" }],
          [{ text: "💬 Contact Support", callback_data: "support" }],
          [{ text: "ℹ️ About", callback_data: "about" }],
          [{ text: "⭐ Feedback", callback_data: "feedback" }],
        ],
      },
    }
  );
});

// === CALLBACK HANDLERS ===
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === "services") {
    const buttons = Object.keys(services).map((s) => [
      { text: s, callback_data: `service_${s}` },
    ]);
    bot.sendMessage(chatId, "📌 Choose a service:", {
      reply_markup: { inline_keyboard: buttons },
    });
  }

  if (data.startsWith("service_")) {
    const service = data.replace("service_", "");
    bot.sendMessage(chatId, `📌 *${service}* starts at ${services[service]}`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "💰 Request Quote", callback_data: `quote_${service}` }]],
      },
    });
  }

  if (data.startsWith("quote_")) {
    const service = data.replace("quote_", "");
    quoteRequests[chatId] = { step: 1, service, name: query.from.first_name };
    bot.sendMessage(chatId, `💰 Let's start a quote for *${service}*.\n👉 What is your budget range?`, { parse_mode: "Markdown" });
  }

  if (data === "portfolio") {
    bot.sendMessage(chatId, `📂 View portfolio: ${PORTFOLIO_URL}`);
  }

  if (data === "faqs") {
    const faqList = faqs.map(f => `• ${f.q}: ${f.a}`).join("\n");
    bot.sendMessage(chatId, `❓ Frequently Asked Questions:\n${faqList}\n\nType a keyword to search for more details.`);
  }

  if (data === "social") {
    bot.sendMessage(chatId, `📲 Social Media:\n🌐 Website: ${WEBSITE_URL}\n📸 Instagram: https://instagram.com/xuppronix\n🐦 Twitter: https://twitter.com/xuppronix\n💼 LinkedIn: https://linkedin.com/company/xuppronix`);
  }

  if (data === "offers") {
    let current = offers.length ? offers.map((o) => `- ${o.text} (Valid until: ${o.validUntil})`).join("\n") : "No offers right now.";
    bot.sendMessage(chatId, `🔥 Current Offers:\n${current}`);
  }

  if (data === "support") {
    contactRequests[chatId] = { step: 1, name: query.from.first_name };
    bot.sendMessage(chatId, "📞 Please type your message for support:");
  }

  if (data === "about") {
    bot.sendMessage(chatId, "ℹ️ Xuppronix builds websites, apps, bots, and provides cloud + design solutions.\n\nFounded in 2023, we've delivered 150+ projects with 98% client satisfaction.");
  }

  if (data === "feedback") {
    feedbackRequests[chatId] = { step: 1, name: query.from.first_name };
    bot.sendMessage(chatId, "⭐ We'd love your feedback! Please rate your experience from 1-5 stars:");
  }

  // Admin callbacks for lead management
  if (query.data.startsWith("accept_")) {
    const userId = query.data.replace("accept_", "");
    leads = leads.map((l) => (l.chatId == userId ? { ...l, status: "Accepted" } : l));
    save(leadsFile, leads);
    bot.sendMessage(userId, "✅ Your request has been accepted! Our team will contact you within 24 hours.");
    bot.sendMessage(chatId, "👍 Lead marked Accepted.");
  }

  if (query.data.startsWith("reject_")) {
    const userId = query.data.replace("reject_", "");
    const lead = leads.find((l) => l.chatId == userId);
    if (lead) rejected.push(lead);
    save(rejectedFile, rejected);
    leads = leads.filter((l) => l.chatId != userId);
    save(leadsFile, leads);
    bot.sendMessage(userId, "❌ Sorry, your request was not accepted at this time. Feel free to contact us for more information.");
    bot.sendMessage(chatId, "⚠️ Lead marked Rejected.");
  }
});

// === MESSAGE HANDLER ===
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  // Contact support
  if (contactRequests[chatId]) {
    bot.sendMessage(chatId, "✅ Thanks! Our team will reach out within 24 hours.");
    bot.sendMessage(ADMIN_CHAT_ID, `📩 Support request from ${contactRequests[chatId].name} (${chatId}):\n${msg.text}`);
    delete contactRequests[chatId];
    return;
  }

  // Feedback handling
  if (feedbackRequests[chatId]) {
    const req = feedbackRequests[chatId];
    if (req.step === 1) {
      const rating = parseInt(text);
      if (!isNaN(rating) && rating >= 1 && rating <= 5) {
        req.rating = rating;
        req.step = 2;
        bot.sendMessage(chatId, "📝 Thanks! Please share any additional comments:");
      } else {
        bot.sendMessage(chatId, "⚠️ Please enter a number between 1 and 5:");
      }
    } else if (req.step === 2) {
      req.comment = text;
      feedbacks.push({
        user: req.name,
        userId: chatId,
        rating: req.rating,
        comment: req.comment,
        date: new Date()
      });
      save(feedbackFile, feedbacks);
      bot.sendMessage(chatId, "⭐ Thank you for your valuable feedback!");
      bot.sendMessage(ADMIN_CHAT_ID, `📝 New feedback from ${req.name} (${chatId}):\nRating: ${req.rating}/5\nComment: ${req.comment}`);
      delete feedbackRequests[chatId];
    }
    return;
  }

  // FAQ
  if (!text.startsWith("/") && !quoteRequests[chatId]) {
    const found = faqs.find((f) => text.toLowerCase().includes(f.q));
    if (found) bot.sendMessage(chatId, `📌 ${found.a}`);
  }

  // Quote flow
  if (quoteRequests[chatId]) {
    const req = quoteRequests[chatId];
    if (req.step === 1) {
      req.budget = text;
      req.step = 2;
      bot.sendMessage(chatId, "⏳ What is your project deadline?");
    } else if (req.step === 2) {
      req.deadline = text;
      req.step = 3;
      bot.sendMessage(chatId, "📝 Please describe your project in detail:");
    } else if (req.step === 3) {
      req.description = text;
      req.step = 4;
      bot.sendMessage(chatId, "📧 What's your email address for us to contact you?");
    } else if (req.step === 4) {
      req.email = text;

      let lead = {
        id: leads.length + 1,
        chatId,
        name: req.name,
        service: req.service,
        budget: req.budget,
        deadline: req.deadline,
        description: req.description,
        email: req.email,
        status: "Pending",
        createdAt: new Date(),
        score: scoreLead(req),
      };

      leads.push(lead);
      save(leadsFile, leads);

      bot.sendMessage(chatId, "✅ Thanks! Our team will reach out within 24 hours.");
      bot.sendMessage(
        ADMIN_CHAT_ID,
        `📩 New Quote Request:\nService: ${req.service}\nBudget: ${req.budget}\nDeadline: ${req.deadline}\nDescription: ${req.description}\nEmail: ${req.email}\nFrom: ${req.name} (${chatId})\nScore: ${lead.score}`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "✅ Accept", callback_data: `accept_${chatId}` }, { text: "❌ Reject", callback_data: `reject_${chatId}` }],
            ],
          },
        }
      );

      delete quoteRequests[chatId];
    }
  }
});

// === ADMIN COMMANDS ===
bot.onText(/\/stats/, (msg) => {
  if (msg.chat.id.toString() !== ADMIN_CHAT_ID) return;
  const pendingLeads = leads.filter(l => l.status === "Pending").length;
  const acceptedLeads = leads.filter(l => l.status === "Accepted").length;
  
  bot.sendMessage(
    msg.chat.id,
    `📊 Stats:\n👥 Users: ${users.length}\n📝 Leads: ${leads.length} (${pendingLeads} pending, ${acceptedLeads} accepted)\n❌ Rejected: ${rejected.length}\n🔥 Offers: ${offers.length}\n⭐ Feedback: ${feedbacks.length}`
  );
});

// === BROADCAST ===
bot.onText(/\/broadcast (.+)/, (msg, match) => {
  if (msg.chat.id.toString() !== ADMIN_CHAT_ID) return;
  const text = match[1];
  let sent = 0;
  let failed = 0;
  
  users.forEach((u) => {
    try {
      bot.sendMessage(u.id, `📢 Announcement:\n${text}`);
      sent++;
    } catch (e) {
      failed++;
    }
  });
  
  bot.sendMessage(ADMIN_CHAT_ID, `✅ Broadcast completed:\nSent: ${sent}\nFailed: ${failed}`);
});

// === NEWS ===
bot.onText(/\/news/, (msg) => {
  const latest = news.length ? news[news.length - 1] : "No news available.";
  bot.sendMessage(msg.chat.id, `📰 Latest News:\n${latest}`);
});

// === REMINDERS ===
bot.onText(/\/remindme (.+)/, (msg, match) => {
  const text = match[1];
  bot.sendMessage(msg.chat.id, "⏰ Reminder set! I'll remind you in 1 minute.");
  setTimeout(() => {
    bot.sendMessage(msg.chat.id, `⏰ Reminder: ${text}`);
  }, 60000);
});

// === SUBSCRIBE/UNSUBSCRIBE ===
bot.onText(/\/subscribe/, (msg) => {
  if (!subs.includes(msg.chat.id)) {
    subs.push(msg.chat.id);
    save(subsFile, subs);
  }
  bot.sendMessage(msg.chat.id, "📰 You're subscribed to daily tips and updates.");
});
bot.onText(/\/unsubscribe/, (msg) => {
  subs = subs.filter((id) => id !== msg.chat.id);
  save(subsFile, subs);
  bot.sendMessage(msg.chat.id, "❌ You unsubscribed from daily tips.");
});

// === PROJECT STATUS ===
bot.onText(/\/mystatus/, (msg) => {
  const userProjects = projects.filter(p => p.chatId === msg.chat.id);
  if (userProjects.length === 0) {
    bot.sendMessage(msg.chat.id, "You don't have any active projects.");
    return;
  }
  
  let statusMessage = "📋 Your Projects:\n\n";
  userProjects.forEach((p, i) => {
    statusMessage += `Project: ${p.name}\nStatus: ${p.status}\nProgress: ${p.progress}%\nLast Update: ${p.lastUpdated}\n\n`;
  });
  
  bot.sendMessage(msg.chat.id, statusMessage);
});

// === DAILY AUTO TIP ===
cron.schedule("0 10 * * *", () => {
  const tips = [
    "💡 Daily Tip: Always keep your software updated!",
    "💡 Daily Tip: Regular backups can save you from disasters.",
    "💡 Daily Tip: Mobile-friendly websites rank better in search engines.",
    "💡 Daily Tip: User experience is key to conversion rates.",
    "💡 Daily Tip: Security should be a priority from day one."
  ];
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  
  subs.forEach((id) => {
    try {
      bot.sendMessage(id, randomTip);
    } catch (e) {
      console.log(`Failed to send to ${id}`);
    }
  });
});

// === CLEAR OFFERS (ADMIN) ===
bot.onText(/\/clearoffers/, (msg) => {
  if (msg.chat.id.toString() !== ADMIN_CHAT_ID) return;
  offers = [];
  save(offersFile, offers);
  bot.sendMessage(ADMIN_CHAT_ID, "🔥 Offers cleared.");
});

// === ADD OFFER (ADMIN) ===
bot.onText(/\/addoffer (.+)/, (msg, match) => {
  if (msg.chat.id.toString() !== ADMIN_CHAT_ID) return;
  const offerText = match[1];
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30); // 30 days from now
  
  offers.push({
    text: offerText,
    created: new Date(),
    validUntil: validUntil.toDateString()
  });
  save(offersFile, offers);
  bot.sendMessage(ADMIN_CHAT_ID, "✅ New offer added!");
});

// === PING ===
bot.onText(/\/ping/, (msg) => {
  bot.sendMessage(msg.chat.id, "🏓 Pong! Bot is alive and responsive.");
});

// === HELP ===
bot.onText(/\/help/, (msg) => {
  const commands = [
    "/start – Start the bot",
    "/services – View services",
    "/portfolio – View portfolio",
    "/faqs – FAQs",
    "/offers – Current offers",
    "/support – Contact support",
    "/about – About Xuppronix",
    "/news – Latest news",
    "/remindme <text> – Set a reminder",
    "/subscribe – Subscribe to tips",
    "/unsubscribe – Unsubscribe",
    "/mystatus – Check project status",
    "/ping – Uptime check",
    "/help – Show commands",
  ];
  bot.sendMessage(msg.chat.id, `🆘 Help Menu:\n${commands.join("\n")}`);
});

// === SCHEDULED FOLLOW-UPS ===
cron.schedule("0 9 * * *", () => {
  const pendingLeads = leads.filter(lead => lead.status === "Pending");
  pendingLeads.forEach((lead) => {
    bot.sendMessage(lead.chatId, "⏰ Friendly reminder: Your project request is still pending. Our team will contact you soon!");
  });
  bot.sendMessage(ADMIN_CHAT_ID, `📅 Daily summary: ${pendingLeads.length} pending leads reminded.`);
});

// === EXPRESS DASHBOARD ===
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Mobile-friendly page template with bottom nav
function pageTemplate(title, content, activeTab = 'home') {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Xuppronix Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
      .bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 50;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      }
      .nav-item {
        transition: all 0.3s;
      }
      .nav-item.active {
        color: #3b82f6;
      }
      .nav-item:not(.active):hover {
        color: #93c5fd;
      }
      @media (min-width: 768px) {
        .bottom-nav {
          position: static;
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body class="bg-gray-100 font-sans min-h-screen pb-16 md:pb-0">
    <!-- Top Navigation (Desktop) -->
    <nav class="bg-blue-600 p-4 text-white hidden md:block">
      <div class="container mx-auto flex justify-between items-center">
        <span class="font-bold text-xl">Xuppronix Dashboard</span>
        <div class="flex space-x-4">
          <a href="/" class="px-3 py-2 rounded ${activeTab === 'home' ? 'bg-blue-700' : 'hover:bg-blue-700'}"><i class="fas fa-home mr-1"></i> Home</a>
          <a href="/leads" class="px-3 py-2 rounded ${activeTab === 'leads' ? 'bg-blue-700' : 'hover:bg-blue-700'}"><i class="fas fa-list mr-1"></i> Leads</a>
          <a href="/users" class="px-3 py-2 rounded ${activeTab === 'users' ? 'bg-blue-700' : 'hover:bg-blue-700'}"><i class="fas fa-users mr-1"></i> Users</a>
          <a href="/rejected" class="px-3 py-2 rounded ${activeTab === 'rejected' ? 'bg-blue-700' : 'hover:bg-blue-700'}"><i class="fas fa-times-circle mr-1"></i> Rejected</a>
          <a href="/offers" class="px-3 py-2 rounded ${activeTab === 'offers' ? 'bg-blue-700' : 'hover:bg-blue-700'}"><i class="fas fa-fire mr-1"></i> Offers</a>
          <a href="/stats" class="px-3 py-2 rounded ${activeTab === 'stats' ? 'bg-blue-700' : 'hover:bg-blue-700'}"><i class="fas fa-chart-bar mr-1"></i> Stats</a>
          <a href="/feedback" class="px-3 py-2 rounded ${activeTab === 'feedback' ? 'bg-blue-700' : 'hover:bg-blue-700'}"><i class="fas fa-star mr-1"></i> Feedback</a>
        </div>
      </div>
    </nav>

    <main class="container mx-auto p-4 md:p-6 mb-16 md:mb-0">
      ${content}
    </main>

    <!-- Bottom Navigation (Mobile) -->
    <nav class="bottom-nav bg-white text-gray-600 md:hidden">
      <div class="grid grid-cols-5 py-2">
        <a href="/" class="nav-item flex flex-col items-center ${activeTab === 'home' ? 'active' : ''}">
          <i class="fas fa-home text-lg"></i>
          <span class="text-xs mt-1">Home</span>
        </a>
        <a href="/leads" class="nav-item flex flex-col items-center ${activeTab === 'leads' ? 'active' : ''}">
          <i class="fas fa-list text-lg"></i>
          <span class="text-xs mt-1">Leads</span>
        </a>
        <a href="/users" class="nav-item flex flex-col items-center ${activeTab === 'users' ? 'active' : ''}">
          <i class="fas fa-users text-lg"></i>
          <span class="text-xs mt-1">Users</span>
        </a>
        <a href="/offers" class="nav-item flex flex-col items-center ${activeTab === 'offers' ? 'active' : ''}">
          <i class="fas fa-fire text-lg"></i>
          <span class="text-xs mt-1">Offers</span>
        </a>
        <a href="/stats" class="nav-item flex flex-col items-center ${activeTab === 'stats' ? 'active' : ''}">
          <i class="fas fa-chart-bar text-lg"></i>
          <span class="text-xs mt-1">Stats</span>
        </a>
      </div>
    </nav>
  </body>
  </html>
  `;
}

// === DASHBOARD ROUTES ===
app.get("/", (req, res) => {
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.score === "🔥 Hot").length;
  const warmLeads = leads.filter(l => l.score === "🟡 Warm").length;
  const coldLeads = leads.filter(l => l.score === "❄️ Cold").length;
  
  const content = `
    <h1 class="text-2xl font-bold mb-6">📊 Xuppronix Dashboard</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Total Users</h3>
          <i class="fas fa-users text-blue-500 text-xl"></i>
        </div>
        <p class="text-3xl font-bold mt-2">${users.length}</p>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Total Leads</h3>
          <i class="fas fa-list text-green-500 text-xl"></i>
        </div>
        <p class="text-3xl font-bold mt-2">${totalLeads}</p>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Hot Leads</h3>
          <i class="fas fa-fire text-red-500 text-xl"></i>
        </div>
        <p class="text-3xl font-bold mt-2">${hotLeads}</p>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Feedback</h3>
          <i class="fas fa-star text-yellow-500 text-xl"></i>
        </div>
        <p class="text-3xl font-bold mt-2">${feedbacks.length}</p>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Lead Quality</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span>🔥 Hot Leads</span>
            <span>${hotLeads} (${totalLeads ? Math.round((hotLeads/totalLeads)*100) : 0}%)</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-red-600 h-2.5 rounded-full" style="width: ${totalLeads ? (hotLeads/totalLeads)*100 : 0}%"></div>
          </div>
          
          <div class="flex justify-between">
            <span>🟡 Warm Leads</span>
            <span>${warmLeads} (${totalLeads ? Math.round((warmLeads/totalLeads)*100) : 0}%)</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-yellow-400 h-2.5 rounded-full" style="width: ${totalLeads ? (warmLeads/totalLeads)*100 : 0}%"></div>
          </div>
          
          <div class="flex justify-between">
            <span>❄️ Cold Leads</span>
            <span>${coldLeads} (${totalLeads ? Math.round((coldLeads/totalLeads)*100) : 0}%)</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-blue-400 h-2.5 rounded-full" style="width: ${totalLeads ? (coldLeads/totalLeads)*100 : 0}%"></div>
          </div>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
        <div class="grid grid-cols-2 gap-3">
          <a href="/leads" class="bg-blue-100 text-blue-700 p-3 rounded-lg text-center hover:bg-blue-200 transition">
            <i class="fas fa-list block text-2xl mb-1"></i>
            <span>View Leads</span>
          </a>
          <a href="/users" class="bg-green-100 text-green-700 p-3 rounded-lg text-center hover:bg-green-200 transition">
            <i class="fas fa-users block text-2xl mb-1"></i>
            <span>View Users</span>
          </a>
          <a href="/offers" class="bg-yellow-100 text-yellow-700 p-3 rounded-lg text-center hover:bg-yellow-200 transition">
            <i class="fas fa-fire block text-2xl mb-1"></i>
            <span>Manage Offers</span>
          </a>
          <a href="/stats" class="bg-purple-100 text-purple-700 p-3 rounded-lg text-center hover:bg-purple-200 transition">
            <i class="fas fa-chart-bar block text-2xl mb-1"></i>
            <span>View Stats</span>
          </a>
        </div>
      </div>
    </div>
  `;
  
  res.send(pageTemplate("Home", content, 'home'));
});

app.get("/leads", (req, res) => {
  let rows = leads.map(l => `
    <tr class="border-b hover:bg-gray-50">
      <td class="p-2">${l.id}</td>
      <td class="p-2">${l.name}</td>
      <td class="p-2">${l.service}</td>
      <td class="p-2">${l.budget}</td>
      <td class="p-2">${l.deadline}</td>
      <td class="p-2"><span class="px-2 py-1 rounded-full text-xs ${l.status === 'Accepted' ? 'bg-green-100 text-green-800' : l.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">${l.status}</span></td>
      <td class="p-2"><span class="px-2 py-1 rounded-full text-xs ${l.score === '🔥 Hot' ? 'bg-red-100 text-red-800' : l.score === '🟡 Warm' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}">${l.score}</span></td>
      <td class="p-2">${new Date(l.createdAt).toLocaleDateString()}</td>
    </tr>`).join("");
    
  const content = `
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">📝 Leads</h1>
      <a href="/export/leads" class="bg-green-600 text-white px-4 py-2 rounded flex items-center">
        <i class="fas fa-download mr-2"></i> Export CSV
      </a>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full bg-white shadow rounded">
        <thead>
          <tr class="bg-gray-200">
            <th class="p-2 text-left">ID</th>
            <th class="p-2 text-left">Name</th>
            <th class="p-2 text-left">Service</th>
            <th class="p-2 text-left">Budget</th>
            <th class="p-2 text-left">Deadline</th>
            <th class="p-2 text-left">Status</th>
            <th class="p-2 text-left">Score</th>
            <th class="p-2 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
    ${leads.length === 0 ? '<p class="text-center py-4 text-gray-500">No leads yet.</p>' : ''}
  `;
  
  res.send(pageTemplate("Leads", content, 'leads'));
});

app.get("/users", (req, res) => {
  let rows = users.map(u => `
    <tr class="border-b hover:bg-gray-50">
      <td class="p-2">${u.id}</td>
      <td class="p-2">${u.name}</td>
      <td class="p-2">${u.lang}</td>
      <td class="p-2">${new Date(u.lastSeen).toLocaleDateString()}</td>
      <td class="p-2">${new Date(u.joined).toLocaleDateString()}</td>
    </tr>`).join("");
    
  const content = `
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">👥 Users</h1>
      <a href="/export/users" class="bg-green-600 text-white px-4 py-2 rounded flex items-center">
        <i class="fas fa-download mr-2"></i> Export CSV
      </a>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full bg-white shadow rounded">
        <thead>
          <tr class="bg-gray-200">
            <th class="p-2 text-left">ID</th>
            <th class="p-2 text-left">Name</th>
            <th class="p-2 text-left">Lang</th>
            <th class="p-2 text-left">Last Seen</th>
            <th class="p-2 text-left">Joined</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
    ${users.length === 0 ? '<p class="text-center py-4 text-gray-500">No users yet.</p>' : ''}
  `;
  
  res.send(pageTemplate("Users", content, 'users'));
});

app.get("/rejected", (req, res) => {
  let rows = rejected.map(r => `
    <tr class="border-b hover:bg-gray-50">
      <td class="p-2">${r.id}</td>
      <td class="p-2">${r.name}</td>
      <td class="p-2">${r.service}</td>
      <td class="p-2">${r.budget}</td>
      <td class="p-2">${r.deadline}</td>
      <td class="p-2">${r.description.substring(0, 50)}${r.description.length > 50 ? '...' : ''}</td>
    </tr>`).join("");
    
  const content = `
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">❌ Rejected Leads</h1>
      <a href="/export/rejected" class="bg-green-600 text-white px-4 py-2 rounded flex items-center">
        <i class="fas fa-download mr-2"></i> Export CSV
      </a>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full bg-white shadow rounded">
        <thead>
          <tr class="bg-gray-200">
            <th class="p-2 text-left">ID</th>
            <th class="p-2 text-left">Name</th>
            <th class="p-2 text-left">Service</th>
            <th class="p-2 text-left">Budget</th>
            <th class="p-2 text-left">Deadline</th>
            <th class="p-2 text-left">Description</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
    ${rejected.length === 0 ? '<p class="text-center py-4 text-gray-500">No rejected leads yet.</p>' : ''}
  `;
  
  res.send(pageTemplate("Rejected Leads", content, 'rejected'));
});

app.get("/offers", (req, res) => {
  let list = offers.map(o => `
    <li class="p-4 border-b flex justify-between items-center">
      <div>
        <p class="font-medium">${o.text}</p>
        <p class="text-sm text-gray-500">Valid until: ${o.validUntil}</p>
      </div>
      <span class="text-xs text-gray-400">Created: ${new Date(o.created).toLocaleDateString()}</span>
    </li>`).join("");
    
  const content = `
    <h1 class="text-xl font-bold mb-4">🔥 Offers</h1>
    
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <h2 class="text-lg font-semibold mb-3">Add New Offer</h2>
      <form action="/offers" method="post" class="flex flex-col md:flex-row gap-2">
        <input type="text" name="offer" placeholder="Offer description..." class="border p-2 rounded flex-grow" required>
        <input type="number" name="days" placeholder="Valid for (days)" class="border p-2 rounded w-32" value="30" required>
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Add Offer</button>
      </form>
    </div>
    
    <div class="bg-white rounded-lg shadow">
      <div class="p-4 border-b flex justify-between items-center">
        <h2 class="text-lg font-semibold">Current Offers</h2>
        <form action="/clearoffers" method="post">
          <button type="submit" class="bg-red-600 text-white px-3 py-1 rounded text-sm">Clear All</button>
        </form>
      </div>
      <ul>${list}</ul>
      ${offers.length === 0 ? '<p class="text-center py-4 text-gray-500">No offers yet.</p>' : ''}
    </div>
  `;
  
  res.send(pageTemplate("Offers", content, 'offers'));
});

app.post("/offers", (req, res) => {
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + parseInt(req.body.days || 30));
  
  offers.push({
    text: req.body.offer,
    created: new Date(),
    validUntil: validUntil.toDateString()
  });
  save(offersFile, offers);
  res.redirect("/offers");
});

app.post("/clearoffers", (req, res) => {
  offers = [];
  save(offersFile, offers);
  res.redirect("/offers");
});

app.get("/stats", (req, res) => {
  const pendingLeads = leads.filter(l => l.status === "Pending").length;
  const acceptedLeads = leads.filter(l => l.status === "Accepted").length;
  const hotLeads = leads.filter(l => l.score === "🔥 Hot").length;
  const warmLeads = leads.filter(l => l.score === "🟡 Warm").length;
  const coldLeads = leads.filter(l => l.score === "❄️ Cold").length;
  
  // Calculate average feedback rating
  const avgRating = feedbacks.length > 0 
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : "No ratings yet";
  
  const content = `
    <h1 class="text-xl font-bold mb-6">📊 Statistics</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Total Users</h3>
          <i class="fas fa-users text-blue-500 text-xl"></i>
        </div>
        <p class="text-3xl font-bold mt-2">${users.length}</p>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Total Leads</h3>
          <i class="fas fa-list text-green-500 text-xl"></i>
        </div>
        <p class="text-3xl font-bold mt-2">${leads.length}</p>
        <div class="text-sm text-gray-600 mt-1">
          <span class="mr-2">Pending: ${pendingLeads}</span>
          <span>Accepted: ${acceptedLeads}</span>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Avg. Feedback</h3>
          <i class="fas fa-star text-yellow-500 text-xl"></i>
        </div>
        <p class="text-3xl font-bold mt-2">${avgRating}/5</p>
        <div class="text-sm text-gray-600 mt-1">Based on ${feedbacks.length} reviews</div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Hot Leads</h3>
          <i class="fas fa-fire text-red-500 text-xl"></i>
        </div>
        <p class="text-3xl font-bold mt-2">${hotLeads}</p>
        <div class="text-sm text-gray-600 mt-1">${leads.length ? Math.round((hotLeads/leads.length)*100) : 0}% of all leads</div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Warm Leads</h3>
          <i class="fas fa-temperature-low text-yellow-500 text-xl"></i>
        </div>
        <p class="text-3xl font-bold mt-2">${warmLeads}</p>
        <div class="text-sm text-gray-600 mt-1">${leads.length ? Math.round((warmLeads/leads.length)*100) : 0}% of all leads</div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Cold Leads</h3>
          <i class="fas fa-snowflake text-blue-500 text-xl"></i>
        </div>
        <p class="text-3xl font-bold mt-2">${coldLeads}</p>
        <div class="text-sm text-gray-600 mt-1">${leads.length ? Math.round((coldLeads/leads.length)*100) : 0}% of all leads</div>
      </div>
    </div>
    
    <div class="bg-white p-4 rounded-lg shadow">
      <h3 class="text-lg font-semibold mb-4">Lead Status Distribution</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div class="flex justify-between mb-1">
            <span>Pending</span>
            <span>${pendingLeads} (${leads.length ? Math.round((pendingLeads/leads.length)*100) : 0}%)</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-yellow-400 h-2.5 rounded-full" style="width: ${leads.length ? (pendingLeads/leads.length)*100 : 0}%"></div>
          </div>
        </div>
        
        <div>
          <div class="flex justify-between mb-1">
            <span>Accepted</span>
            <span>${acceptedLeads} (${leads.length ? Math.round((acceptedLeads/leads.length)*100) : 0}%)</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-green-600 h-2.5 rounded-full" style="width: ${leads.length ? (acceptedLeads/leads.length)*100 : 0}%"></div>
          </div>
        </div>
        
        <div>
          <div class="flex justify-between mb-1">
            <span>Rejected</span>
            <span>${rejected.length} (${leads.length + rejected.length ? Math.round((rejected.length/(leads.length + rejected.length))*100) : 0}%)</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-red-600 h-2.5 rounded-full" style="width: ${leads.length + rejected.length ? (rejected.length/(leads.length + rejected.length))*100 : 0}%"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  res.send(pageTemplate("Stats", content, 'stats'));
});

app.get("/feedback", (req, res) => {
  let rows = feedbacks.map(f => `
    <tr class="border-b hover:bg-gray-50">
      <td class="p-2">${f.user}</td>
      <td class="p-2">
        <div class="flex items-center">
          ${Array(5).fill(0).map((_, i) => 
            `<i class="fas fa-star ${i < f.rating ? 'text-yellow-400' : 'text-gray-300'}"></i>`
          ).join('')}
          <span class="ml-2">${f.rating}/5</span>
        </div>
      </td>
      <td class="p-2">${f.comment.substring(0, 60)}${f.comment.length > 60 ? '...' : ''}</td>
      <td class="p-2">${new Date(f.date).toLocaleDateString()}</td>
    </tr>`).join("");
    
  const content = `
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">⭐ User Feedback</h1>
      <a href="/export/feedback" class="bg-green-600 text-white px-4 py-2 rounded flex items-center">
        <i class="fas fa-download mr-2"></i> Export CSV
      </a>
    </div>
    
    <div class="overflow-x-auto">
      <table class="w-full bg-white shadow rounded">
        <thead>
          <tr class="bg-gray-200">
            <th class="p-2 text-left">User</th>
            <th class="p-2 text-left">Rating</th>
            <th class="p-2 text-left">Comment</th>
            <th class="p-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
    ${feedbacks.length === 0 ? '<p class="text-center py-4 text-gray-500">No feedback yet.</p>' : ''}
  `;
  
  res.send(pageTemplate("Feedback", content, 'feedback'));
});

// === EXPORT ROUTES ===
app.get("/export/leads", (req, res) => {
  const parser = new Parser();
  res.header("Content-Type", "text/csv");
  res.attachment("leads.csv");
  res.send(parser.parse(leads));
});

app.get("/export/users", (req, res) => {
  const parser = new Parser();
  res.header("Content-Type", "text/csv");
  res.attachment("users.csv");
  res.send(parser.parse(users));
});

app.get("/export/rejected", (req, res) => {
  const parser = new Parser();
  res.header("Content-Type", "text/csv");
  res.attachment("rejected.csv");
  res.send(parser.parse(rejected));
});

app.get("/export/feedback", (req, res) => {
  const parser = new Parser();
  res.header("Content-Type", "text/csv");
  res.attachment("feedback.csv");
  res.send(parser.parse(feedbacks));
});

// === START EXPRESS SERVER ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Dashboard running at http://localhost:${PORT}`);
});

// === AUTO SET COMMANDS ===
bot.setMyCommands([
  { command: "start", description: "🚀 Start the bot" },
  { command: "services", description: "💻 View services" },
  { command: "portfolio", description: "📂 View portfolio" },
  { command: "faqs", description: "❓ FAQs" },
  { command: "offers", description: "🔥 Current offers" },
  { command: "support", description: "💬 Contact support" },
  { command: "about", description: "ℹ️ About Xuppronix" },
  { command: "news", description: "📰 Latest news" },
  { command: "remindme", description: "⏰ Set reminder" },
  { command: "subscribe", description: "📰 Subscribe to tips" },
  { command: "unsubscribe", description: "❌ Unsubscribe tips" },
  { command: "mystatus", description: "📋 Check project status" },
  { command: "ping", description: "🏓 Check uptime" },
  { command: "help", description: "🆘 Help menu" },
  { command: "stats", description: "📊 Admin stats" },
  { command: "broadcast", description: "📢 Admin broadcast" },
  { command: "addoffer", description: "🔥 Admin add offer" }
]).then(() => console.log("✅ Commands set successfully"));

// === BOT READY ===
console.log("🚀 Xuppronix Bot running with enhanced features and mobile-friendly dashboard...");
