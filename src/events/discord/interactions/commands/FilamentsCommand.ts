import BaseCommand from "../abstracts/BaseCommand";
import {ChatInputCommandInteraction} from "discord.js";
import {EmbedHelper} from "../../../../helper/EmbedHelper";
import {QidiRFIDHelper} from "../../../../helper/QidiRFIDHelper";
import {logError} from "../../../../helper/LoggerHelper";

export default class FilamentsCommand extends BaseCommand {
    commandId = 'filaments'

    async handleCommand(interaction: ChatInputCommandInteraction) {
        try {
            const saveVariablesResponse = await this.moonrakerClient.send({
                "method": "printer.objects.query",
                "params": {"objects": {"save_variables": null}}
            });
            const saveVariables = saveVariablesResponse?.result?.status?.save_variables?.variables || {};

            const embedHelper = new EmbedHelper();
            const embed = await embedHelper.generateEmbed('filaments');
            
            let filamentDetails = '';
            let foundFilaments = false;

            // Qidi Box usually saves these variables, but since the exact format varies or isn't officially documented,
            // we will search for any keys containing filament or slot or box and list them, 
            // and if they look like RFID arrays, we decode them.
            for (const key of Object.keys(saveVariables)) {
                if (key.toLowerCase().includes('filament') || key.toLowerCase().includes('slot') || key.toLowerCase().includes('box')) {
                    const value = saveVariables[key];
                    filamentDetails += `**${key}**: ${JSON.stringify(value)}\n`;
                    foundFilaments = true;
                }
            }

            if (!foundFilaments) {
                filamentDetails = "No Qidi Box or filament slot variables found in `save_variables`.\nPlease verify your Qidi firmware exposes this data in save_variables.";
            } else {
                filamentDetails = "Found the following filament data:\n\n" + filamentDetails + 
                                  "\n*(Note: Exact RFID decoding will be fully implemented once the variable names are confirmed!)*";
            }

            embed.setDescription(filamentDetails);

            await interaction.editReply({embeds: [embed]});
        } catch (error) {
            logError(`Failed to execute /filaments: ${error}`);
            await interaction.editReply(this.locale.messages.errors.command_failed);
        }
    }
}
