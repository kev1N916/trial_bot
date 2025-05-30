// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { CardFactory, MessageFactory, StatePropertyAccessor, TurnContext } from 'botbuilder';
import {
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
const TEXT_PROMPT = 'textPrompt';

export class InputCardDialog extends ComponentDialog {
    constructor() {
        super('InputCardDialog');

        // Define the main dialog and its related components.
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
            this.processUserInputStep.bind(this)
        ]));

        // The initial child Dialog to run.
        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {TurnContext} turnContext
     * @param {StatePropertyAccessor} accessor
     */
    public async run(turnContext: TurnContext, accessor: StatePropertyAccessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * Process user input and handle card submissions or commands
     * @param {WaterfallStepContext} stepContext
     */
    public async processUserInputStep(stepContext: WaterfallStepContext) {
        const context = stepContext.context;
        const userMessage = context.activity.text?.toLowerCase().trim();

        // Handle card submissions
        if (context.activity.value) {
            await this.handleCardSubmission(context);
        }
        // Handle different commands
        else if (userMessage === 'help') {
            await this.sendCommandList(context);
        }
        else if (userMessage === 'configure') {
            await this.sendJiraInformationCard(context);
        }
        else if (userMessage === 'prompt') {
            await this.sendPromptToAgentCard(context);
        }
        else if (userMessage === 'cancel') {
            await this.sendCancelNotificationCard(context);
        }
        else {
            await this.sendCommandList(context);
        }

        return await stepContext.endDialog();
    }

    // User Profile Form Card
    async sendJiraInformationCard(context: TurnContext) {
        const card = {
            type: "AdaptiveCard",
            version: "1.3",
            body: [
                {
                    type: "TextBlock",
                    text: "Configure Jira Notification Form",
                    weight: "Bolder",
                    size: "Medium",
                    color: "Accent"
                },
                {
                    type: "TextBlock",
                    text: "Please fill out the JIRA Information:",
                    wrap: true,
                    spacing: "Medium"
                },
                {
                    type: "Input.Text",
                    id: "sprintId",
                    label: "Sprint ID",
                    placeholder: "Enter the ID of your Sprint",
                    isRequired: true,
                    errorMessage: "Sprint ID is required"
                },
                {
                    type: "Input.Text",
                    id: "boardId",
                    label: "Board Id",
                    placeholder: "Enter the ID of your Board",
                    isRequired: true,
                    errorMessage: "Board ID is required"
                },
                {
                    type: "Input.Text",
                    id: "sprintKey",
                    label: "Sprint Key",
                    placeholder: "Enter the Key of your Sprint",
                    isRequired: false,
                    style: "Tel"
                },
                {
                    type: "Input.Text",
                    id: "sprintName",
                    label: "Sprint Name",
                    placeholder: "Enter the Name of your Sprint",
                    isRequired: false,
                    style: "Tel"
                },
            ],
            actions: [
                {
                    type: "Action.Submit",
                    title: "Schedule Notification",
                    data: {
                        type: "jiraInformation"
                    }
                }
            ]
        };

        const cardAttachment = CardFactory.adaptiveCard(card);
        await context.sendActivity(MessageFactory.attachment(cardAttachment));
    }

    // Cancel Notification Form Card
    async sendCancelNotificationCard(context: TurnContext) {
        const card = {
            type: "AdaptiveCard",
            version: "1.3",
            body: [
                {
                    type: "TextBlock",
                    text: "Cancel Jira Notification",
                    weight: "Bolder",
                    size: "Medium",
                    color: "Accent"
                },
                {
                    type: "Input.ChoiceSet",
                    id: "choice",
                    label: "Are you sure you want to cancel the notification?",
                    isRequired: true,
                    style: "compact",
                    isMultiSelect: false,
                    errorMessage: "Your choice is necessary.",
                    choices: [
                        { title: "Yes", value: "yes" },
                        { title: "No", value: "no" },
                    ]
                },
            ],
            actions: [
                {
                    type: "Action.Submit",
                    title: "Submit Choice",
                    data: {
                        type: "cancelNotification"
                    }
                }
            ]
        };

        const cardAttachment = CardFactory.adaptiveCard(card);
        await context.sendActivity(MessageFactory.attachment(cardAttachment));
    }

    // Prompt To Agent Form Card
    async sendPromptToAgentCard(context: TurnContext) {
        const card = {
            type: "AdaptiveCard",
            version: "1.3",
            body: [
                {
                    type: "TextBlock",
                    text: "Send Prompt To the Agent",
                    weight: "Bolder",
                    size: "Medium",
                    color: "Accent"
                },
                {
                    type: "Input.Text",
                    id: "prompt",
                    label: "Prompt",
                    placeholder: "Enter the prompt you want to forward to the Agent",
                    isRequired: true,
                    style: "Tel"
                },
            ],
            actions: [
                {
                    type: "Action.Submit",
                    title: "Submit Prompt",
                    data: {
                        type: "prompt"
                    }
                }
            ]
        };

        const cardAttachment = CardFactory.adaptiveCard(card);
        await context.sendActivity(MessageFactory.attachment(cardAttachment));
    }

    // Handle Card Submissions
    async handleCardSubmission(context: TurnContext) {
        const submissionData = context.activity.value;
        const submissionType = submissionData.type;

        switch (submissionType) {
            case 'jiraInformation':
                await this.handleJiraInformationSubmission(context, submissionData);
                break;
            case 'cancelNotification':
                await this.handleCancelNotificationSubmission(context, submissionData);
                break;
            case 'prompt':
                await this.handlePromptSubmission(context, submissionData);
                break;
            default:
                await context.sendActivity('Thank you for your submission!');
        }
    }

    async handleJiraInformationSubmission(context: TurnContext, data: any) {
        const { sprintId, boardId, sprintName, sprintKey } = data;

        // Validate required fields
        if (!sprintId || !boardId) {
            await context.sendActivity('❌ Please fill in all required fields (Sprint ID and Board ID).');
            return;
        }

        const response = `✅ **Notification Created Successfully!**\n\n` +
            `**Sprint ID:** ${sprintId}\n` +
            `**Board ID:** ${boardId}\n`;
        await context.sendActivity(response);
    }

    async handlePromptSubmission(context: TurnContext, data: any) {
        const prompt = data.prompt;

        const response = `✅ **Prompt Sent To Agent Successfully!**\n\n`;
        await context.sendActivity(response);
    }

    async handleCancelNotificationSubmission(context: TurnContext, data: any) {
        let response: string = "";

        if (data.choice === 'yes') {
            response = "✅ Notification successfully cancelled.";
        } else if (data.choice === 'no') {
            response = "Notification has not been cancelled.";
        }
        await context.sendActivity(response);
    }

    async sendCommandList(context: TurnContext) {
        const helpMessage = `🤖 **Available Commands:**\n\n` +
            `• **Configure** - To setup a notification schedule.\n\n` +
            `• **Prompt** - To make the agent execute a prompt of your choice.\n\n` +
            `• **Cancel** - To cancel a notification schedule.\n\n` +
            `Type any command to see the interactive card!`;

        await context.sendActivity(helpMessage);
    }
}