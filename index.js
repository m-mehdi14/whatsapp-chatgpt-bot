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

// Initialize variables
let client;
let isClientInitialized = false;
let isAuthenticated = false;
let qrCodeData = null;
let qrCodeGeneratedAt = null;

// Conversation history map
const conversationHistory = {};

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
app.get("/qr", async (req, res) => {
  console.log(`[${new Date().toISOString()}] /qr endpoint was accessed`);

  if (isAuthenticated) {
    console.log(
      `[${new Date().toISOString()}] Client is already authenticated`
    );
    res.send(`
      <html>
        <body>
          <h1>WhatsApp Client is Already Authenticated</h1>
          <p>Your WhatsApp client is already connected and ready to receive messages.</p>
        </body>
      </html>
    `);
    return;
  }

  if (!isClientInitialized) {
    console.log(
      `[${new Date().toISOString()}] Initializing WhatsApp client...`
    );
    initializeWhatsAppClient();
  }

  // Wait for QR code to be generated
  const startTime = Date.now();
  while (!qrCodeData && Date.now() - startTime < 30000) {
    // Wait up to 30 seconds
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (qrCodeData) {
    const qrCodeImageUrl = await qrcode.toDataURL(qrCodeData);
    console.log(`[${new Date().toISOString()}] Serving QR code to client`);
    res.send(`
      <html>
        <body>
          <h1>Scan the QR Code with your WhatsApp</h1>
          <img src="${qrCodeImageUrl}" alt="QR Code" />
          <p>QR code generated at: ${qrCodeGeneratedAt}</p>
        </body>
      </html>
    `);
  } else {
    console.error(
      `[${new Date().toISOString()}] QR code was not generated in time`
    );
    res.send(`
      <html>
        <body>
          <h1>QR Code Not Available</h1>
          <p>Sorry, the QR code could not be generated at this time. Please try again later.</p>
        </body>
      </html>
    `);
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(
    `[${new Date().toISOString()}] Express server is running on port ${port}`
  );
});

// Function to initialize WhatsApp client
function initializeWhatsAppClient() {
  client = new Client();
  isClientInitialized = true;

  client.on("qr", (qr) => {
    qrCodeData = qr;
    qrCodeGeneratedAt = new Date().toISOString();
    console.log(`[${qrCodeGeneratedAt}] QR code generated`);
  });

  client.on("authenticated", () => {
    isAuthenticated = true;
    qrCodeData = null;
    console.log(`[${new Date().toISOString()}] Authenticated successfully`);
  });

  client.on("auth_failure", (msg) => {
    isAuthenticated = false;
    console.error(
      `[${new Date().toISOString()}] Authentication failure: ${msg}`
    );
  });

  client.on("ready", () => {
    console.log(`[${new Date().toISOString()}] WhatsApp client is ready`);
  });

  client.on("disconnected", (reason) => {
    isAuthenticated = false;
    isClientInitialized = false;
    qrCodeData = null;
    console.log(
      `[${new Date().toISOString()}] Client was logged out: ${reason}`
    );
  });

  // Message handler
  client.on("message", async (message) => {
    console.log(
      `[${new Date().toISOString()}] Received message from ${message.from}: ${
        message.body
      }`
    );

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
          `[${new Date().toISOString()}] Error with OpenAI API:`,
          error.response ? error.response.data : error.message
        );
        await message.reply(
          "Sorry, I encountered an error while processing your request."
        );
      }
    }
  });

  client.initialize();
}

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
    console.log(`[${new Date().toISOString()}] OpenAI API response received`);
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
    console.log(`[${new Date().toISOString()}] Joke fetched successfully`);
    const joke = `${response.data.setup}\n${response.data.punchline}`;
    return joke;
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error fetching joke:`,
      error.message
    );
    return "Sorry, I couldn't fetch a joke at this time.";
  }
}

// Function to get a quote
async function getQuote() {
  try {
    const response = await axios.get("https://zenquotes.io/api/random");
    console.log(`[${new Date().toISOString()}] Quote fetched successfully`);
    const data = response.data[0];
    const quote = `"${data.q}"\n- ${data.a}`;
    return quote;
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error fetching quote:`,
      error.message
    );
    return "Sorry, I couldn't fetch a quote at this time.";
  }
}
