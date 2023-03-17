require('dotenv').config();
const { App, ExpressReceiver } = require('@slack/bolt');
const axios = require('axios');

// For express type http methods
const receiver = new ExpressReceiver({ signingSecret: process.env.SLACK_SIGNING_SECRET });

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

// Config for ChatGPT
const MODEL_TYPE = 'text-davinci-003';
const MAX_TOKENS = 2048;
const TEMPERATURE = 0.8
const COMPLETIONS_ENDPOINT = 'https://api.openai.com/v1/completions';
const CHATGPT_API_KEY = process.env.OPENAI_API_KEY;

const MODEL_CONFIG = {
  model: MODEL_TYPE,
  prompt: question,
  max_tokens: MAX_TOKENS,
  n: 1,
  stop: null,
  temperature: TEMPERATURE,
}

const HEADERS = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CHATGPT_API_KEY}`,
  }
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

receiver.router.get('/', (req, res) => {
  res.status(200).send('Welcome to the ChatGPT Slack Bot!');
});

// Slash command
app.command('/askchatgpt', async ({ command, ack, respond }) => {
  ack();

  const question = command.text.toString();

  console.log('Question:', question);

  try {
    const response = await axios.post(
      COMPLETIONS_ENDPOINT,
      MODEL_CONFIG,
      {
        HEADERS,
      }
    );

    const answer = response.data.choices[0].text.trim();
    
    console.log('Answer:', answer);

    await respond(`${answer}`);
  } catch (error) {
    console.error('Error fetching ChatGPT response:', error);
    await respond(ERROR_MESSAGE);
  }
});

// App mention
app.event('app_mention', async ({ event, say }) => {
  const question = event.text;

  console.log('Question:', question);

  try {
    const response = await axios.post(
      COMPLETIONS_ENDPOINT,
      MODEL_CONFIG,
      {
        HEADERS,
      }
    );

    const answer = response.data.choices[0].text.trim();

    console.log('Answer:', answer);

    await say(`${answer}`);
  } catch (error) {
    console.error('Error fetching ChatGPT response:', error);
    await say(ERROR_MESSAGE);
  }
});

(async () => {
  await app.start(3000);
  console.log('⚡️ Server started');
})();

