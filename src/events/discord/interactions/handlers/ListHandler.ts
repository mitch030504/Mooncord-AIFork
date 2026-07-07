'use strict'

import {Message, User} from "discord.js";
import {PageHelper} from "../../../../helper/PageHelper";
import BaseHandler from "../abstracts/BaseHandler";

export class ListHandler extends BaseHandler {
    async isValid(message: Message, user: User, data: any, interaction: any = null) {
        return true
    }

    async handleHandler(message: Message, user: User, data: any, interaction: any = null) {
        const listId = data.list
        if (!listId) {
            return
        }

        if (interaction !== null && !interaction.replied && !interaction.deferred) {
            await interaction.deferReply()
        }

        const pageHelper = new PageHelper(listId)
        const pageData = await pageHelper.getPage(false, 2)

        await message.edit({components: undefined})
        await message.removeAttachments()

        await message.edit((pageData as any).embed)

        if (interaction !== null && !interaction.replied) {
            await interaction.deleteReply()
        }
    }
}