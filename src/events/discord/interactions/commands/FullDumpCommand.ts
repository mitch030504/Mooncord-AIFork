import BaseCommand from "../abstracts/BaseCommand";
import {AttachmentBuilder, ChatInputCommandInteraction} from "discord.js";
import {logError} from "../../../../helper/LoggerHelper";

export default class FullDumpCommand extends BaseCommand {
    commandId = 'fulldump'
    ephemeral = true

    async handleCommand(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ephemeral: true});

        try {
            // Get all available objects
            const listResponse = await this.moonrakerClient.send({"method": "printer.objects.list"});
            const objectsList = listResponse?.result?.objects || [];

            // Prepare the query object
            const queryObjects: Record<string, null> = {};
            for (const obj of objectsList) {
                queryObjects[obj] = null;
            }

            // Query all objects
            const queryResponse = await this.moonrakerClient.send({
                "method": "printer.objects.query",
                "params": {"objects": queryObjects}
            });
            const status = queryResponse?.result?.status || {};

            // Flatten JSON for CSV
            const rows: [string, string][] = [['Key', 'Value']];
            const flatten = (obj: any, prefix = '') => {
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        const val = obj[key];
                        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                            flatten(val, `${prefix}${key}.`);
                        } else {
                            let strVal = JSON.stringify(val);
                            if (strVal && strVal.includes(',')) {
                                strVal = `"${strVal.replace(/"/g, '""')}"`;
                            }
                            rows.push([`${prefix}${key}`, strVal || 'null']);
                        }
                    }
                }
            };
            flatten(status);

            const csvContent = rows.map(r => `${r[0]},${r[1]}`).join('\n');
            const buffer = Buffer.from(csvContent, 'utf8');

            const attachment = new AttachmentBuilder(buffer, {name: `moonraker_fulldump.csv`});

            await interaction.editReply({content: 'Here is your full printer state dump:', files: [attachment]});
        } catch (error) {
            logError(`Failed to execute /fulldump: ${error}`);
            await interaction.editReply(this.locale.messages.errors.command_failed || 'Command failed');
        }
    }
}
