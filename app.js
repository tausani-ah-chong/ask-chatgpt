require('dotenv').config();
const { App, ExpressReceiver } = require('@slack/bolt');
const { Configuration, OpenAIApi } = require("openai");
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig);

const analytics = getAnalytics(firebaseApp);

const openAiConfiguration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(openAiConfiguration);

// For express type http methods
const receiver = new ExpressReceiver({ signingSecret: process.env.SLACK_SIGNING_SECRET });

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

// Config for ChatGPT
const MAX_TOKENS = 2048;
const TEMPERATURE = 0.8
const INITIAL_MESSAGES = [
  {
    role: 'user',
    content: 'Hello, who are you?'
  },
  {
    role: 'assistant',
    content: 'I am an AI created by OpenAI. How can I help you today?'
  }
]

const COMPLETION_MODEL_CONFIG = {
  model: 'text-davinci-003',
  prompt: '',
  max_tokens: MAX_TOKENS,
  top_p: 1,
  temperature: TEMPERATURE,
  frequency_penalty: 0.0,
  presence_penalty: 0.6,
}

const CHAT_COMPLETION_MODEL_CONFIG = {
  model: 'gpt-3.5-turbo',
  messages: INITIAL_MESSAGES,
  max_tokens: MAX_TOKENS,
  top_p: 1,
  temperature: TEMPERATURE,
  frequency_penalty: 0.0,
  presence_penalty: 0.6,
}

const ERROR_MESSAGE = 'Unluggy uce, there was an error processing your question. Please try again later.'

// Needed for slack URL verification
receiver.router.post('/slack/events', (req, res) => {
  if (req.body.type === 'url_verification') {
    res.status(200).send(req.body.challenge);
  } else {
    res.status(200).send();
  }
});

receiver.router.get('/', (_, res) => {
  res.status(200).send('Welcome to the ChatGPT Slack Bot!');
});

// Slash command
app.command('/askchatgpt', async ({ command, ack, respond }) => {
  ack();

  const question = command.text.toString();

  console.log('Question:', question);

  try {
    const response = await openai.createCompletion({
      ...COMPLETION_MODEL_CONFIG,
      prompt: `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n\nHuman: Hello, who are you?\nAI: I am an AI created by OpenAI. How can I help you today?\nHuman: ${question}\nAI:`,
      stop: ["Human:", "AI:"],
    })

    const answer = response.data.choices[0].text.trim();
    
    console.log('Answer:', answer);

    await respond(`${answer}`);
  } catch (error) {
    console.error('Error fetching ChatGPT response:', error);
    await respond(ERROR_MESSAGE);
  }
});

// History in memory (Resets when server restarts)
const messageHistoryByThreadTS = new Map()
let currentMessageHistory = []

// App mention
app.event('app_mention', async ({ event, say }) => {
  const { text: question, thread_ts: threadTimeStamp, ts: eventTimeStamp } = event;

  const newMessage = {
    role: 'user',
    content: question
  }

  let messagesForEndpoint;
  
  // Handle thread history & messages to send to openAI
  if (threadTimeStamp != null) {
    const previousHistory = messageHistoryByThreadTS.get(threadTimeStamp)

    currentMessageHistory = previousHistory

    messagesForEndpoint = [...currentMessageHistory, newMessage]
  } else {
    messagesForEndpoint = [...CHAT_COMPLETION_MODEL_CONFIG.messages, newMessage]

    currentMessageHistory = []
  }
  
  currentMessageHistory.push(newMessage);

  try {
    const response = await openai.createChatCompletion({
      ...CHAT_COMPLETION_MODEL_CONFIG,
      messages: messagesForEndpoint,
    })

    const answer = response.data.choices[0].message.content.trim();

    const messageToSave = {
      role: 'assistant',
      content: answer
    }
    
    currentMessageHistory.push(messageToSave)

    // Set thread history
    if (threadTimeStamp != null) {
      const previousHistory = messageHistoryByThreadTS.get(threadTimeStamp)

      messageHistoryByThreadTS.set(threadTimeStamp, [...previousHistory, messageToSave])
    } else {
      messageHistoryByThreadTS.set(eventTimeStamp, currentMessageHistory)
    }

    await say({ text: `${answer}`, thread_ts: threadTimeStamp ?? eventTimeStamp });
  } catch (error) {
    console.error('Error fetching ChatGPT response:', error);
    await say({ text: ERROR_MESSAGE, thread_ts: threadTimeStamp ?? eventTimeStamp });
  }
});

(async () => {
  await app.start(3000);
  console.log('⚡️ Server started');
})();

