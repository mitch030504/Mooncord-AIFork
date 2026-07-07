import BaseCommand from "../abstracts/BaseCommand";
import {AttachmentBuilder, ChatInputCommandInteraction} from "discord.js";
import * as CacheUtil from "../../../../utils/CacheUtil";
import path from "path";

export default class DumpCommand extends BaseCommand {
    commandId = 'dump'
    ephemeral = true

    async handleCommand(interaction: ChatInputCommandInteraction) {
        const sectionArgument = interaction.options.getString(this.syntaxLocale.commands.dump.options.section.name)!

        const allowedSections = ['cache', 'database', 'database_ws']
        if (!sectionArgument || !allowedSections.includes(sectionArgument)) {
            await interaction.editReply(this.locale.messages.errors.unknown_command)
            return
        }

        if (sectionArgument === 'cache') {
            await CacheUtil.dump()
        } else if (sectionArgument === 'database') {
            await this.database.dump()
        } else if (sectionArgument === 'database_ws') {
            await this.database.dumpWS()
        }

        const attachment = new AttachmentBuilder(path.resolve(__dirname, `../${sectionArgument}_dump.json`), {name: `${sectionArgument}.json`})

        await interaction.editReply({files: [attachment]})
    }
}