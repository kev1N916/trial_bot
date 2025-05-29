import * as path from 'path';
import * as restify from 'restify';
import {
    CloudAdapter,
    ConfigurationBotFrameworkAuthentication,
    ConfigurationBotFrameworkAuthenticationOptions,
    MemoryStorage,
    UserState,
    ConversationState
} from 'botbuilder';
import { MainDialog } from './dialogs/mainDialog';
import { DialogBot } from './bots/dialogBot';
import { TeamsBot } from './bots/userState_bot';
import { config } from 'dotenv';
import { AdaptiveCardsBot } from './bots/adaptiveCardsBot';
import { ProActiveBot } from './bots/proActiveBot';
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});


const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(process.env as ConfigurationBotFrameworkAuthenticationOptions);

// Create adapter.
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // application insights.
    console.error(`\n [onTurnError] unhandled error: ${error}`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error}`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;

// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
// const memoryStorage = new MemoryStorage();

// // Create conversation state with in-memory storage provider.
// const conversationState = new ConversationState(memoryStorage);
// const userState = new UserState(memoryStorage);

// // Create the main dialog.
// const dialog = new MainDialog();
// const myBot = new DialogBot(conversationState, userState, dialog);

// Create the main dialog.
const conversationReferences = {};
const myBot = new ProActiveBot(conversationReferences);

// Listen for incoming requests.
server.post('/api/messages', (req, res, next) => {
    console.log(`\nReceived request: ${req}`);
    // Route received a request to adapter for processing
    adapter.process(req, res, async (context) => await myBot.run(context));
});

server.get('/', (req, res, next) => {
    console.log(`\nReceived request: ${req}`);
    res.send({ message: 'Hello from your Restify API!' });
  return next();
})

// Listen for incoming notifications and send proactive messages to users.
server.get('/api/notify', (req, res, next) => {
    for (const conversationReference of Object.values(conversationReferences)) {
        adapter.continueConversationAsync(process.env.MicrosoftAppId, conversationReference, async (context) => {
            await context.sendActivity('proactive hello');
        });
    }
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.write('<html><body><h1>Proactive messages have been sent.</h1></body></html>');
    res.end();
});

// Listen for incoming custom notifications and send proactive messages to users.
server.post('/api/notify', (req, res, next) => {
    for (const msg of req.body) {
        for (const conversationReference of Object.values(conversationReferences)) {
            adapter.continueConversationAsync(process.env.MicrosoftAppId, conversationReference, async (turnContext) => {
                await turnContext.sendActivity(msg);
            });
        }
    }
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.write('Proactive messages have been sent.');
    res.end();
});

// Handle undefined routes
server.get('*', (req, res,next) => {
    res.json({ error: 'Route not found' });
    return next();
});