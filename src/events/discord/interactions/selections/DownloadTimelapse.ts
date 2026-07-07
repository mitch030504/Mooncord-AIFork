'use strict'

import {AttachmentBuilder, Message, StringSelectMenuInteraction} from "discord.js";
import {getEntry} from "../../../../utils/CacheUtil";
import {findValueByPartial} from "../../../../helper/DataHelper";
import {TimelapseHelper} from "../../../../helper/TimelapseHelper";
import {resolve} from "path";
import {statSync, unlinkSync} from "fs";
import BaseSelection from "../abstracts/BaseSelection";
import {logError} from "../../../../helper/LoggerHelper";

export class DownloadTimelapse extends BaseSelection {
    selectionId = 'timelapse_download'

    async handleSelection(interaction: StringSelectMenuInteraction) {
        const timelapseHelper = new TimelapseHelper()

        const timelapseFile = findValueByPartial(getEntry('timelapse_files'), interaction.values[0] as string, 'path')

        const placeholderMessage = this.locale.messages.answers.timelapse_render
            .replace(/(\${timelapsefile})/g, timelapseFile)

        const placeholderImage = new AttachmentBuilder(
            resolve(__dirname, `../assets/icon-sets/${this.config.getIconSet()}/timelapse-render.png`),
            {name: 'snapshot-error.png'}
        )

        const currentMessage = interaction.message as Message

        await currentMessage.removeAttachments()
        await currentMessage.edit({content: placeholderMessage, components: [], embeds: [], files: [placeholderImage]})

        await interaction.deleteReply()

        const timelapseMessage = this.locale.messages.answers.timelapse_download
            .replace(/(\${timelapsefile})/g, timelapseFile)

        const timelapseContent = await timelapseHelper.downloadTimelapse(timelapseFile, timelapseMessage)

        try {
            const fileStats = statSync(timelapseContent.path)
            const fileSizeInBytes = fileStats.size
            const uploadLimit = this.config.getUploadLimit()

            if (fileSizeInBytes > uploadLimit) {
                logError(`${timelapseFile} Timelapse too big, file: ${fileSizeInBytes}bytes, Limit: ${uploadLimit}bytes`)
                const errorMessage = this.locale.messages.errors.file_too_large
                    .replace(/(\${filename})/g, `\`${timelapseFile}\``)
                
                await currentMessage.edit({
                    content: errorMessage,
                    components: timelapseContent.message.components,
                    embeds: [],
                    files: []
                })
            } else {
                await currentMessage.edit(timelapseContent.message)
            }
        } catch (error: any) {
            logError(`Failed to upload timelapse:`)
            logError(error?.stack || error)
            const errorMessage = this.locale.messages.errors.command_failed || 'An error occurred!'
            try {
                await currentMessage.edit({
                    content: errorMessage,
                    components: [],
                    embeds: [],
                    files: []
                })
            } catch (editError) {
                logError(`Failed to send fallback error message: ${editError}`)
            }
        } finally {
            try {
                unlinkSync(timelapseContent.path)
            } catch (unlinkError) {
                logError(`Failed to unlink temp file ${timelapseContent.path}: ${unlinkError}`)
            }
        }
    }
}