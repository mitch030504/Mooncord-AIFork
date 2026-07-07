'use strict'

import {Message, MessageFlagsBitField, User} from "discord.js";
import {getEntry} from "../../../../utils/CacheUtil";
import BaseHandler from "../abstracts/BaseHandler";

export class RefreshHandler extends BaseHandler {
    async isValid(message: Message, user: User, data: any, interaction: any = null) {
        return data.functions.includes('refresh_status');
    }

    async handleHandler(message: Message, user: User, data: any, interaction: any = null) {
        const functionCache = getEntry('function')

        const waitMessage = this.locale.messages.answers.status_update
            .replace(/(\${username})/g, interaction.user.tag)

        if (interaction !== null) {
            if (interaction.replied) {
                await interaction.followUp({flags: MessageFlagsBitField.Flags.Ephemeral, content: waitMessage})
            } else {
                await interaction.update({components: undefined, content: waitMessage})
            }
        }

        const currentStatus = functionCache.current_status
        const currentStatusMeta = this.config.getStatusMeta()[currentStatus]

        await message.edit({components: undefined})

        const newMessage = await this.embedHelper.generateEmbed(currentStatusMeta.embed_id)

        await message.removeAttachments()
        await message.edit(newMessage.embed)
    }
}