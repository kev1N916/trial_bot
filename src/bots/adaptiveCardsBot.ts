import { ActivityHandler, CardFactory } from 'botbuilder';

// Import AdaptiveCard content.
const FlightItineraryCard = require('../resources/1.json');
const ImageGalleryCard = require('../resources/2.json');
const LargeWeatherCard = require('../resources/3.json');
const RestaurantCard = require('../resources/4.json');
const SolitaireCard = require('../resources/5.json');

// Create array of AdaptiveCard content, this will be used to send a random card to the user.
const CARDS = [
    FlightItineraryCard,
    ImageGalleryCard,
    LargeWeatherCard,
    RestaurantCard,
    SolitaireCard
];

const WELCOME_TEXT = 'This bot will introduce you to Adaptive Cards. Type anything to see an Adaptive Card.';

class AdaptiveCardsBot extends ActivityHandler {
    constructor() {
        super();
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded ?? [];
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(`Welcome to Adaptive Cards Bot  ${ membersAdded[cnt].name }. ${ WELCOME_TEXT }`);
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMessage(async (context, next) => {
            const randomlySelectedCard = CARDS[Math.floor((Math.random() * CARDS.length - 1) + 1)];
            await context.sendActivity({
                text: 'Here is an Adaptive Card:',
                attachments: [CardFactory.adaptiveCard(randomlySelectedCard)]
            });

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}


export {AdaptiveCardsBot}