'use strict'

import {Message, User} from "discord.js";
import BaseHandler from "../abstracts/BaseHandler";

export class DeleteMessageHandler extends BaseHandler {
    async isValid(message: Message, user: User, data: any, interaction: any = null) {
        return data.functions.includes("delete_message");
    }

    async handleHandler(message: Message, user: User, data: any, interaction: any = null) {
        await message.delete()
    }
}