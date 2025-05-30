import { DialogTestClient, DialogTestLogger } from 'botbuilder-testing';
import { InputCardDialog } from '../dialogs/inputCardDialog';
import { Activity, Attachment } from 'botbuilder';
import { assert } from 'console';
// Type definitions for card structures
interface AdaptiveCard {
    type: string;
    version: string;
    body: CardElement[];
    actions: CardAction[];
}

interface CardElement {
    type: string;
    text?: string;
    id?: string;
    isRequired?: boolean;
    choices?: Choice[];
}

interface Choice {
    title: string;
    value: string;
}

interface CardAction {
    type: string;
    title?: string;
    data: SubmissionData;
}

interface SubmissionData {
    type: string;
    [key: string]: any;
}

interface JiraInformationData extends SubmissionData {
    type: 'jiraInformation';
    sprintId?: string | null;
    boardId?: string | null;
    sprintName?: string;
    sprintKey?: string;
}

interface PromptData extends SubmissionData {
    type: 'prompt';
    prompt?: string;
}

interface CancelNotificationData extends SubmissionData {
    type: 'cancelNotification';
    choice?: string;
}

describe('InputCardDialog', function (): void {
    let dialog: InputCardDialog;
    let client: DialogTestClient;

    beforeEach(function (): void {
        dialog = new InputCardDialog();
        client = new DialogTestClient('test', dialog, null, [new DialogTestLogger()]);
    });

    describe('Help Command Tests', function (): void {

        it('should display help message when user sends "help"', async function (): Promise<void> {
            const reply: Partial<Activity> = await client.sendActivity('help');

            expect(reply.text?.includes('🤖 **Available Commands:**')).toBe(true);
            expect(reply.text?.includes('Configure')).toBe(true);
            expect(reply.text?.includes('Prompt')).toBe(true)
            expect(reply.text?.includes('Cancel')).toBe(true);
        });

        it('should display help message when user sends any unrecognized command', async function (): Promise<void> {
            const reply: Partial<Activity> = await client.sendActivity('random text');

            expect(reply.text?.includes('🤖 **Available Commands:**')).toBe(true);
        });

        it('should display help message with case insensitive commands', async function (): Promise<void> {
            const reply: Partial<Activity> = await client.sendActivity('HELP');

            expect(reply.text?.includes('🤖 **Available Commands:**')).toBe(true);
        });

        it('should handle commands with extra whitespace', async function (): Promise<void> {
            const reply: Partial<Activity> = await client.sendActivity('  help  ');

            expect(reply.text?.includes('🤖 **Available Commands:**')).toBe(true);
        });
    });

    describe('Configure Command Tests', function (): void {

        it('should send Jira Information card when user sends "configure"', async function (): Promise<void> {
            const reply: Partial<Activity> = await client.sendActivity('configure');

            expect(reply.attachments).toBeTruthy;
            expect(reply.attachments?.length).toBe(1);

            const attachment: Attachment = reply.attachments![0];
            const card: AdaptiveCard = attachment.content as AdaptiveCard;

            expect(card.type).toBe('AdaptiveCard')
            expect(card.version).toBe('1.3')

            // Check card content
            const titleBlock: CardElement | undefined = card.body.find(
                (block: CardElement) => block.type === 'TextBlock' && block.text === 'Configure Jira Notification Form'
            );
            assert(titleBlock, 'Card should contain configuration title');

            // Check required inputs
            const sprintIdInput: CardElement | undefined = card.body.find(
                (block: CardElement) => block.type === 'Input.Text' && block.id === 'sprintId'
            );
            const boardIdInput: CardElement | undefined = card.body.find(
                (block: CardElement) => block.type === 'Input.Text' && block.id === 'boardId'
            );

            assert(sprintIdInput, 'Card should contain Sprint ID input');
            assert(boardIdInput, 'Card should contain Board ID input');
            assert(sprintIdInput.isRequired, 'Sprint ID should be required');
            assert(boardIdInput.isRequired, 'Board ID should be required');

            // Check submit action
            const submitAction: CardAction | undefined = card.actions.find(
                (action: CardAction) => action.type === 'Action.Submit'
            );
            assert(submitAction, 'Card should contain submit action');
            expect(submitAction.data.type).toBe('jiraInformation'),

                expect(client.dialogTurnResult.status).toBe('complete');
        });
    });

    describe('Prompt Command Flow', function (): void {

        it('should send Prompt to Agent card when user sends "prompt"', async function (): Promise<void> {
            const reply: Partial<Activity> = await client.sendActivity('prompt');

            assert(reply.attachments, 'Response should contain attachments');
            expect(reply.attachments?.length).toBe(1)

            const attachment: Attachment = reply.attachments![0];
            const card: AdaptiveCard = attachment.content as AdaptiveCard;
            expect(card.type).toBe('AdaptiveCard')

            // Check card content
            const titleBlock: CardElement | undefined = card.body.find(
                (block: CardElement) => block.type === 'TextBlock' && block.text === 'Send Prompt To the Agent'
            );
            assert(titleBlock, 'Card should contain prompt title');

            // Check prompt input
            const promptInput: CardElement | undefined = card.body.find(
                (block: CardElement) => block.type === 'Input.Text' && block.id === 'prompt'
            );
            assert(promptInput, 'Card should contain prompt input');
            assert(promptInput.isRequired, 'Prompt should be required');

            // Check submit action
            const submitAction: CardAction | undefined = card.actions.find(
                (action: CardAction) => action.type === 'Action.Submit'
            );
            assert(submitAction, 'Card should contain submit action');
            expect(submitAction.data.type).toBe('prompt');
            expect(client.dialogTurnResult.status).toBe('complete');
        });
    });

    describe('Cancel Command Flow', function (): void {

        it('should send Cancel Notification card when user sends "cancel"', async function (): Promise<void> {
            const reply: Partial<Activity> = await client.sendActivity('cancel');

            assert(reply.attachments, 'Response should contain attachments');
            // assert.strictEqual(reply.attachments?.length, 1, 'Should contain exactly one attachment');

            const attachment: Attachment = reply.attachments![0];
            const card: AdaptiveCard = attachment.content as AdaptiveCard;
            // assert.strictEqual(card.type, 'AdaptiveCard', 'Should be an AdaptiveCard');

            // Check card content
            const titleBlock: CardElement | undefined = card.body.find(
                (block: CardElement) => block.type === 'TextBlock' && block.text === 'Cancel Jira Notification'
            );
            assert(titleBlock, 'Card should contain cancel title');

            // Check choice input
            const choiceInput: CardElement | undefined = card.body.find(
                (block: CardElement) => block.type === 'Input.ChoiceSet' && block.id === 'choice'
            );
            assert(choiceInput, 'Card should contain choice input');
            assert(choiceInput.isRequired, 'Choice should be required');
            // assert.strictEqual(choiceInput.choices?.length, 2, 'Should have 2 choices');

            const yesChoice: Choice | undefined = choiceInput.choices?.find(
                (choice: Choice) => choice.value === 'yes'
            );
            const noChoice: Choice | undefined = choiceInput.choices?.find(
                (choice: Choice) => choice.value === 'no'
            );
            assert(yesChoice, 'Should have Yes choice');
            assert(noChoice, 'Should have No choice');

            // Check submit action
            const submitAction: CardAction | undefined = card.actions.find(
                (action: CardAction) => action.type === 'Action.Submit'
            );
            assert(submitAction, 'Card should contain submit action')

            expect(reply.attachments?.length).toBe(1);
            expect(card.type).toBe('AdaptiveCard');
            expect(choiceInput.choices?.length).toBe(2);
            expect(submitAction.data.type).toBe('cancelNotification');
            expect(client.dialogTurnResult.status).toBe('complete');
        });
    });

    describe('Card Submission Flow Tests', function (): void {

        it('should handle valid Jira Information submission', async function (): Promise<void> {
            const submissionData: JiraInformationData = {
                type: 'jiraInformation',
                sprintId: 'SPRINT-123',
                boardId: 'BOARD-456',
                sprintName: 'Test Sprint',
                sprintKey: 'TS'
            };

            const reply: Partial<Activity> = await client.sendActivity({ value: submissionData });

            assert(reply.text?.includes('✅ **Notification Created Successfully!**'), 'Should show success message');
            assert(reply.text?.includes('SPRINT-123'), 'Should display Sprint ID');
            assert(reply.text?.includes('BOARD-456'), 'Should display Board ID');
            expect(client.dialogTurnResult.status).toBe('complete');
        });

        it('should handle Jira Information submission with missing required fields', async function (): Promise<void> {
            const submissionData: JiraInformationData = {
                type: 'jiraInformation',
                sprintName: 'Test Sprint',
                sprintKey: 'TS'
                // Missing sprintId and boardId
            };

            const reply: Partial<Activity> = await client.sendActivity({ value: submissionData });

            assert(reply.text?.includes('❌ Please fill in all required fields'), 'Should show validation error');
            assert(reply.text?.includes('Sprint ID and Board ID'), 'Should mention required fields');
            expect(client.dialogTurnResult.status).toBe('complete');
        });

        it('should handle Jira Information submission with only one missing required field', async function (): Promise<void> {
            const submissionData: Partial<JiraInformationData> = {
                type: 'jiraInformation',
                sprintId: 'SPRINT-123'
                // Missing boardId
            };

            const reply: Partial<Activity> = await client.sendActivity({ value: submissionData });

            assert(reply.text?.includes('❌ Please fill in all required fields'), 'Should show validation error for missing boardId');
            expect(client.dialogTurnResult.status).toBe('complete');
        });

        it('should handle prompt submission', async function (): Promise<void> {
            const submissionData: PromptData = {
                type: 'prompt',
                prompt: 'Test prompt for the agent'
            };

            const reply: Partial<Activity> = await client.sendActivity({ value: submissionData });

            assert(reply.text?.includes('✅ **Prompt Sent To Agent Successfully!**'), 'Should show success message');
            expect(client.dialogTurnResult.status).toBe('complete');
        });

        it('should handle cancel notification submission with "yes" choice', async function (): Promise<void> {
            const submissionData: CancelNotificationData = {
                type: 'cancelNotification',
                choice: 'yes'
            };

            const reply: Partial<Activity> = await client.sendActivity({ value: submissionData });

            assert(reply.text?.includes('✅ Notification successfully cancelled'), 'Should show cancellation success');
            expect(client.dialogTurnResult.status).toBe('complete');
        });

        it('should handle cancel notification submission with "no" choice', async function (): Promise<void> {
            const submissionData: CancelNotificationData = {
                type: 'cancelNotification',
                choice: 'no'
            };

            const reply: Partial<Activity> = await client.sendActivity({ value: submissionData });

            assert(reply.text?.includes('Notification has not been cancelled'), 'Should show not cancelled message');
            expect(client.dialogTurnResult.status).toBe('complete');
        });

        it('should handle unknown card submission type', async function (): Promise<void> {
            const submissionData: SubmissionData = {
                type: 'unknownType',
                someData: 'test'
            };

            const reply: Partial<Activity> = await client.sendActivity({ value: submissionData });

            expect(reply.text).toBe('Thank you for your submission!');
            expect(client.dialogTurnResult.status).toBe('complete');
        });
    });

    describe('Edge Cases and Error Handling', function (): void {

        it('should handle empty text message', async function (): Promise<void> {
            const reply: Partial<Activity> = await client.sendActivity('');

            assert(reply.text?.includes('🤖 **Available Commands:**'), 'Should show help for empty message');
            expect(client.dialogTurnResult.status).toBe('complete');
        });

        it('should handle null text message', async function (): Promise<void> {
            const activity: Partial<Activity> = { text: null };
            const reply: Partial<Activity> = await client.sendActivity(activity);

            assert(reply.text?.includes('🤖 **Available Commands:**'), 'Should show help for null text');
            expect(client.dialogTurnResult.status).toBe('complete');
        });

        it('should handle message with only whitespace', async function (): Promise<void> {
            const reply: Partial<Activity> = await client.sendActivity('   ');

            assert(reply.text?.includes('🤖 **Available Commands:**'), 'Should show help for whitespace-only message');
            expect(client.dialogTurnResult.status).toBe('complete');
        });

        it('should handle card submission with null/undefined values', async function (): Promise<void> {
            const submissionData: JiraInformationData = {
                type: 'jiraInformation',
                sprintId: null,
                boardId: undefined
            };

            const reply: Partial<Activity> = await client.sendActivity({ value: submissionData });

            assert(reply.text?.includes('❌ Please fill in all required fields'), 'Should handle null/undefined values as missing');
            expect(client.dialogTurnResult.status).toBe('complete');
        });

        it('should handle card submission with empty string values', async function (): Promise<void> {
            const submissionData: JiraInformationData = {
                type: 'jiraInformation',
                sprintId: '',
                boardId: '   '
            };

            const reply: Partial<Activity> = await client.sendActivity({ value: submissionData });

            assert(reply.text?.includes('❌ Please fill in all required fields'), 'Should handle empty strings as missing');
            expect(client.dialogTurnResult.status).toBe('complete');
        });
    });

    describe('Multiple Interaction Flow Tests', function (): void {

        it('should handle multiple sequential commands', async function (): Promise<void> {
            // First command
            let reply: Partial<Activity> = await client.sendActivity('help');
            assert(reply.text?.includes('🤖 **Available Commands:**'), 'First command should work');

            // Reset client for second interaction
            client = new DialogTestClient('test', dialog, null, [new DialogTestLogger()]);

            // Second command
            reply = await client.sendActivity('configure');
            assert(reply.attachments, 'Second command should work');

            const attachment: Attachment = reply.attachments![0];
            const card: AdaptiveCard = attachment.content as AdaptiveCard;
            expect(card.type).toBe('AdaptiveCard');
        });

        it('should handle command followed by card submission', async function (): Promise<void> {
            // First send configure command
            let reply: Partial<Activity> = await client.sendActivity('configure');
            assert(reply.attachments, 'Should receive Jira config card');

            // Reset client for card submission
            client = new DialogTestClient('test', dialog, null, [new DialogTestLogger()]);

            // Then submit the card
            const submissionData: JiraInformationData = {
                type: 'jiraInformation',
                sprintId: 'SPRINT-123',
                boardId: 'BOARD-456'
            };

            reply = await client.sendActivity({ value: submissionData });
            assert(reply.text?.includes('✅ **Notification Created Successfully!**'), 'Should process submission');
        });
    });
});