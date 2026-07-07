import BaseHandler from "../abstracts/BaseHandler";
import {Message, User} from "discord.js";

export class ClearAttachmentsHandler extends BaseHandler {
    async isValid(message: Message, user: User, data: any, interaction: any = null) {
        return data.functions.includes("clearAttachments");
    }

    async handleHandler(message: Message, user: User, data: any, interaction: any = null) {
        await message.removeAttachments()
    }
}