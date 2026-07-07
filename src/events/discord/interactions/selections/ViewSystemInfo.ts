'use strict'

import {Message, StringSelectMenuInteraction} from "discord.js";
import {MCUHelper} from "../../../../helper/MCUHelper";
import BaseSelection from "../abstracts/BaseSelection";

export class ViewSystemInfo extends BaseSelection {
    selectionId = 'systeminfo_select'

    async handleSelection(interaction: StringSelectMenuInteraction) {
        const currentMessage = interaction.message as Message

        const mcuHelper = new MCUHelper()

        const component = interaction.values[0]

        let embedData: any

        if (component?.startsWith('mcu')) {
            const mcuData = mcuHelper.getMCULoad(component as string)
            embedData = await this.embedHelper.generateEmbed(`systeminfo_mcu`, mcuData)
        } else {
            embedData = await this.embedHelper.generateEmbed(`systeminfo_${component}`)
        }

        try {
            await currentMessage.edit({components: undefined})
            await currentMessage.removeAttachments()

            await currentMessage.edit(embedData.embed)

            await interaction.deleteReply()
        } catch (e) {
            // Message might have been deleted, ignore
        }
    }
}