// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TurnContext } from "botbuilder";
import { Activity, ActivityHandler, BotState, ConversationState, StatePropertyAccessor, UserState } from 'botbuilder';
import { Dialog, DialogState } from 'botbuilder-dialogs';
import { ConversationReference } from 'botbuilder';
import { InputCardDialog } from '../dialogs/inputCardDialog.js';

export class InputCardBot extends ActivityHandler {
    private conversationState: BotState;
    private dialog: Dialog;
    private dialogState: StatePropertyAccessor<DialogState>;
    public conversationReferences: Partial<ConversationReference>;

    /**
     *
     * @param {ConversationState} conversationState
     * @param {Dialog} dialog
     * @param {Partial<ConversationReference>} conversationReferences
     */
    constructor(dialog: Dialog,conversationState:ConversationState, conversationReferences: Partial<ConversationReference>) {
        super();
        if (!dialog) throw new Error('[InputCardBot]: Missing parameter. dialog is required');

        this.conversationState = conversationState as ConversationState;
        // this.userState = userState as UserState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');
        this.conversationReferences = conversationReferences;

        this.onConversationUpdate(async (context, next) => {
            this.addConversationReference(context.activity);
            await next();
        });

        this.onMessage(async (context: TurnContext, next) => {
            console.log('Running dialog with Message Activity.');

            this.addConversationReference(context.activity);

            // Run the Dialog with the new message Activity.
            await (this.dialog as InputCardDialog).run(context, this.dialogState);

            await next();
        });

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await next();
        });
    }

    private addConversationReference(activity: Activity): void {
        const conversationReference = TurnContext.getConversationReference(activity);
        console.log("logging the conversation reference");
        console.log(conversationReference);
        this.conversationReferences[conversationReference.conversation.id] = conversationReference;
    }
}