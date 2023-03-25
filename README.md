# ChatGPT Slack Bot

This practice project was created to gain insights and foundational knowledge of the OpenAI API while fulfilling a long-standing desire to create a bot. The bot can be used with a slash command or by mentioning the bot in a message. This setup is not hosted, so you will need to expose your local server using a tool like ngrok.

## How it works:

![Screenshot 2023-03-22 at 1 15 38 PM](https://user-images.githubusercontent.com/58315812/227711706-64f7192f-beb3-4772-9197-33e8509b9ea9.png)
![Screenshot 2023-03-22 at 1 15 49 PM](https://user-images.githubusercontent.com/58315812/227711764-28bc482d-4fd9-4ebd-9c62-d9ccf79c9d9d.png)

![Screenshot 2023-03-22 at 1 15 13 PM](https://user-images.githubusercontent.com/58315812/227711708-bdbd6db1-24a9-4c8f-8ed8-200d90ca6944.png)

## Requirements

- You'll need to create your own slack app/bot and replace `askchatgpt` with `<your-slack-app-name>`
- Follow [this post](https://tausani.super.site/i-built-a-slack-chatgpt-bot) here to get you started with slack

## Features

- Slash command integration: `/askchatgpt`
- App mention integration: `@askchatgpt`
- Maintains conversation history within Slack threads
- Customizable conversation model configurations

## Setup

1. Clone the repository to your local machine.
2. Run `npm install` to install the required dependencies.
3. Set up your environment variables in a `.env` file:

```
   SLACK_BOT_TOKEN=<your-slack-bot-token>
   SLACK_SIGNING_SECRET=<your-slack-signing-secret>
   OPENAI_API_KEY=<your-openai-api-key>
```

4. Start the server by running `node index.js` or `npm start`.

## Expose Your Local Server Using ngrok

1. Download and install [ngrok](https://ngrok.com/download).
2. Run `ngrok http 3000` in a new terminal window to expose your local server on port 3000.
3. Note the HTTPS forwarding URL provided by ngrok (e.g., `https://<your-random-subdomain>.ngrok.io`).

## Update URLs in the Slack API Website

1. Go to the [Slack API website](https://api.slack.com/) and navigate to your app's management dashboard.
2. Under "Features", click on "Slash Commands".
3. Click on the `/askchatgpt` command and update the "Request URL" with your ngrok HTTPS forwarding URL followed by `/slack/events`. Example:

```
    https://<your-random-subdomain>.ngrok.io/slack/events
```

4. Save your changes.
5. Under "Features", click on "Event Subscriptions".
6. Update the "Request URL" with your ngrok HTTPS forwarding URL followed by `/slack/events`. Same as above example
7. Save your changes.

## Usage

1. In Slack, use the slash command `/askchatgpt <question>` to ask the bot a question. Example:

```
    /askchatgpt What is the capital of France?
```

2. Mention the bot in a message to initiate a conversation. Example:

```
    @ChatGPT How many planets are there in the solar system?
```

3. The bot will maintain the conversation history within a thread if you reply to its messages.

## Customization

You can customize the ChatGPT model configuration by editing the constants in `index.js`. Available options include:

- `MAX_TOKENS`: Maximum number of tokens in a response
- `TEMPERATURE`: Controls randomness of the generated responses (higher values = more random)
- `INITIAL_MESSAGES`: Default initial messages for chat model
- `COMPLETION_MODEL_CONFIG`: Configuration for the completion model (used in the slash command)
- `CHAT_COMPLETION_MODEL_CONFIG`: Configuration for the chat model (used in the app mention)
