// index.js

const { Client } = require("whatsapp-web.js");
const express = require("express");
const axios = require("axios");
require("dotenv").config();
const qrcode = require("qrcode");

const app = express();
const port = process.env.PORT || 3000;

// Base URL for constructing full URLs
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

// Initialize WhatsApp client without session persistence
const client = new Client();

let qrCodeImageUrl = null;

// Root endpoint to show basic info
app.get("/", (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Welcome to the WhatsApp ChatGPT Bot</h1>
        <p>This bot integrates WhatsApp with OpenAI's GPT-3.5-turbo model.</p>
        <p>To authenticate, please navigate to <a href="/qr">${baseUrl}/qr</a> to scan the QR code with your WhatsApp app.</p>
      </body>
    </html>
  `);
});

// Endpoint to get QR code
app.get("/qr", (req, res) => {
  if (qrCodeImageUrl) {
    res.send(`
      <html>
        <body>
          <h1>Scan the QR Code with your WhatsApp</h1>
          <img src="${qrCodeImageUrl}" alt="QR Code" />
        </body>
      </html>
    `);
  } else {
    res.send("QR Code not available. Please wait...");
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Express server is running on port ${port}`);
});

// Conversation history map
const conversationHistory = {};

// Command handling and message processing
client.on("qr", async (qr) => {
  try {
    // Generate QR code image URL
    qrCodeImageUrl = await qrcode.toDataURL(qr);

    console.log(`QR code generated. Please scan it from ${baseUrl}/qr`);
  } catch (err) {
    console.error("Error generating QR code:", err);
  }
});

client.on("authenticated", () => {
  console.log("Authenticated successfully!");
  // Clear the QR code after authentication
  qrCodeImageUrl = null;
});

client.on("auth_failure", (msg) => {
  console.error("Authentication failure:", msg);
});

client.on("ready", () => {
  console.log("WhatsApp client is ready!");
});

client.on("disconnected", (reason) => {
  console.log("Client was logged out:", reason);
});

client.initialize();

// Message handler
client.on("message", async (message) => {
  console.log(`Received message from ${message.from}: ${message.body}`);

  const userId = message.from;

  if (message.body.startsWith("!")) {
    const userInput = message.body.slice(1).trim();
    const [command, ...args] = userInput.split(" ");
    const argString = args.join(" ");

    switch (command.toLowerCase()) {
      case "help":
        await message.reply(
          "List of commands:\n" +
            "!help - Show this help message\n" +
            "!joke - Tell a joke\n" +
            "!quote - Get an inspirational quote\n" +
            "!reset - Reset the conversation history"
        );
        break;

      case "joke":
        const joke = await getJoke();
        await message.reply(joke);
        break;

      case "quote":
        const quote = await getQuote();
        await message.reply(quote);
        break;

      case "reset":
        // Reset conversation history
        conversationHistory[userId] = [];
        await message.reply("Conversation history has been reset.");
        break;

      default:
        await message.reply(
          "Unknown command. Type !help for a list of commands."
        );
    }
  } else {
    // Handle conversation messages
    const userInput = message.body;

    // Initialize conversation history for new users
    if (!conversationHistory[userId]) {
      conversationHistory[userId] = [];
    }

    // Add user's message to conversation history
    conversationHistory[userId].push({ role: "user", content: userInput });

    try {
      const reply = await getChatGPTReply(conversationHistory[userId]);
      await message.reply(reply);

      // Add assistant's reply to conversation history
      conversationHistory[userId].push({ role: "assistant", content: reply });
    } catch (error) {
      console.error(
        "Error with OpenAI API:",
        error.response ? error.response.data : error.message
      );
      await message.reply(
        "Sorry, I encountered an error while processing your request."
      );
    }
  }
});

// Function to call OpenAI Chat Completion API
async function getChatGPTReply(conversation) {
  const apiKey = process.env.OPENAI_API_KEY;
  const apiUrl = "https://api.openai.com/v1/chat/completions";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const data = {
    model: "gpt-3.5-turbo",
    messages: conversation,
  };

  try {
    const response = await axios.post(apiUrl, data, { headers });
    const reply = response.data.choices[0].message.content.trim();
    return reply;
  } catch (error) {
    throw error;
  }
}

// Function to get a joke
async function getJoke() {
  try {
    const response = await axios.get(
      "https://official-joke-api.appspot.com/random_joke"
    );
    const joke = `${response.data.setup}\n${response.data.punchline}`;
    return joke;
  } catch (error) {
    console.error("Error fetching joke:", error.message);
    return "Sorry, I couldn't fetch a joke at this time.";
  }
}

// Function to get a quote
async function getQuote() {
  try {
    const response = await axios.get("https://zenquotes.io/api/random");
    const data = response.data[0];
    const quote = `"${data.q}"\n- ${data.a}`;
    return quote;
  } catch (error) {
    console.error("Error fetching quote:", error.message);
    return "Sorry, I couldn't fetch a quote at this time.";
  }
}
