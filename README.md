# WhatsApp ChatGPT Bot

## Overview

This project is a WhatsApp bot that integrates with OpenAI's GPT-3.5-turbo model to provide intelligent conversational responses. The bot listens for messages on WhatsApp and responds using the OpenAI API via direct HTTP requests.

Users can chat directly with the bot without any command prefixes, and the bot maintains conversation history for context-aware interactions. Additionally, the bot includes commands to fetch jokes and inspirational quotes.

## Features

- **Direct Conversation**: Chat with the bot directly without any command prefixes.
- **Contextual Responses**: Maintains conversation history for each user to provide context-aware replies.
- **Commands**:
  - !help: Display available commands.
  - !joke: Receive a random joke.
  - !quote: Get an inspirational quote.
  - !reset: Reset the conversation history.
- **Multi-User Support**: Handles multiple users simultaneously, maintaining separate conversation histories.
- **Extensible**: Easily add new features or commands.

## Requirements

- Node.js (version 14 or higher)
- WhatsApp Account (preferably WhatsApp Business)
- OpenAI API Key

## Installation

1. **Clone the Repository**:  
   `git clone https://github.com/m-mehdi14/whatsapp-chatgpt-bot.git`
2. **Navigate to Project Directory**:  
   `cd whatsapp-chatgpt-bot`
3. **Install Dependencies**:  
   `npm install`
4. **Configure Environment Variables**:
   - Create a `.env` file in the root directory.
   - Add your OpenAI API Key:  
     `OPENAI_API_KEY=your_openai_api_key_here`

## Configuration

- **OpenAI API Key**: Obtain your API key from OpenAI and add it to the `.env` file.
- **WhatsApp Authentication**: The bot uses QR code scanning for authentication. You'll need to scan the QR code each time you start the bot, as session persistence is disabled.

## Usage

1. **Run the Bot**:  
   `node index.js`
2. **Authenticate WhatsApp**:
   - A QR code will be displayed in the terminal.
   - Open the WhatsApp Business app on your phone.
   - Navigate to Linked Devices and scan the QR code.
   - The bot will now be connected to your WhatsApp account.
3. **Interact with the Bot**:
   - **Chat Directly**: Send any message to the bot, and it will respond using ChatGPT.
     - Example: `Hello, how are you?`
   - **Use Commands**:
     - **Get Help**: `!help`
     - **Tell a Joke**: `!joke`
     - **Get a Quote**: `!quote`
   - **Reset Conversation History**:
     - `!reset`

## Commands

- !help: Show the list of available commands.
- !joke: Receive a random joke.
- !quote: Get an inspirational quote.
- !reset: Reset your conversation history with the bot.

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Repository**
2. **Create a New Branch**:  
   `git checkout -b feature/your-feature-name`
3. **Make Changes and Commit**:  
   `git commit -m "Add your feature"`
4. **Push to Your Fork**:  
   `git push origin feature/your-feature-name`
5. **Submit a Pull Request**

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- OpenAI for the GPT-3.5-turbo model.
- whatsapp-web.js for the WhatsApp API.
- Axios for HTTP requests.
- Official Joke API for jokes.
- ZenQuotes API for inspirational quotes.

## Disclaimer

- **WhatsApp Terms of Service**: Please be aware that using unofficial libraries like whatsapp-web.js may violate WhatsApp's terms of service. Use this bot responsibly and at your own risk.
- **Privacy and Security**: Ensure that you handle authentication tokens and API keys securely. Do not share them publicly or commit them to version control systems.

## Contact

- GitHub: m-mehdi14
