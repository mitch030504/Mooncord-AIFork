import BaseCommand from "../abstracts/BaseCommand";
import {ChatInputCommandInteraction} from "discord.js";
import {EmbedHelper} from "../../../../helper/EmbedHelper";
import {QidiRFIDHelper} from "../../../../helper/QidiRFIDHelper";
import {logError} from "../../../../helper/LoggerHelper";

export default class FilamentsCommand extends BaseCommand {
    commandId = 'filaments'

    async handleCommand(interaction: ChatInputCommandInteraction) {
        try {
            const response = await this.moonrakerClient.send({
                "method": "printer.objects.query",
                "params": {
                    "objects": {
                        "multi_color_controller": null,
                        "aht20_f heater_box1": null
                    }
                }
            });

            const multiColorController = response?.result?.status?.multi_color_controller || {};
            const boxSensor = response?.result?.status?.["aht20_f heater_box1"] || {};

            const embedHelper = new EmbedHelper();
            const embed = await embedHelper.generateEmbed('filaments');

            // Check if Qidi multi_color_controller is present
            if (!multiColorController.slots) {
                embed.setDescription("Qidi Box multi-color controller not found on this printer.\nThis command is only compatible with QIDI printers equipped with the QIDI Box / CFS system.");
                await interaction.editReply({embeds: [embed]});
                return;
            }

            const slots = multiColorController.slots || {};
            const states = slots.states || {};
            const materials = slots.materials || {};
            const config = multiColorController.config || {};
            const print = multiColorController.print || {};
            const currentTool = print.current_tool; // number (-1 or tool index)
            const lastLoaded = slots.last_loaded; // string (e.g. "slot16", "slot0")
            const extruderLoaded = multiColorController.extruder?.loaded === true;
            
            const isBoxEnabled = config.enable_box === 1;

            let description = `**QIDI Box Filament Changer**: ${isBoxEnabled ? '🟢 Enabled' : '🔴 Disabled'}\n`;

            // Add temperature/humidity if available
            if (boxSensor.temperature !== undefined) {
                description += `🌡️ **Box Temp**: ${boxSensor.temperature}°C | 💧 **Humidity**: ${boxSensor.humidity}%\n`;
            }

            // Check dryer state
            const drying = multiColorController.drying?.box1 || {};
            if (drying.dry_state > 0) {
                const now = Math.floor(Date.now() / 1000);
                const remainingSeconds = drying.end_time - now;
                if (remainingSeconds > 0) {
                    const hours = Math.floor(remainingSeconds / 3600);
                    const minutes = Math.floor((remainingSeconds % 3600) / 60);
                    description += `🔥 **Dryer Status**: Active (Time remaining: ${hours}h ${minutes}m)\n`;
                } else {
                    description += `🔥 **Dryer Status**: Active (Finishing...)\n`;
                }
            }

            description += `\n__**Spool Slots**__\n`;

            // Loop through Box Slots (0 to 3)
            for (let i = 0; i < 4; i++) {
                const slotKey = `slot${i}`;
                const hasFilament = states[slotKey] === 1;
                const material = materials[slotKey] || {};
                const filament = material.filament || {};

                const slotNum = i + 1;
                const isToolActive = currentTool !== -1 && config[`value_t${currentTool}`] === slotKey;
                const isSlotLoaded = lastLoaded === slotKey && extruderLoaded;

                let slotName = `**Slot ${slotNum}**`;
                if (isToolActive) {
                    slotName = `👉 **Slot ${slotNum} (T${currentTool})**`;
                }

                if (hasFilament) {
                    const filamentName = filament.filament || filament.type || 'Unknown Filament';
                    const colorHex = material.color || '#000000';
                    const colorEmoji = QidiRFIDHelper.getClosestColorEmoji(colorHex);
                    const vendor = material.vendor || 'Generic';
                    
                    let statusSuffix = '';
                    if (isSlotLoaded) {
                        statusSuffix = ' *(Active in Extruder)*';
                    } else if (lastLoaded === slotKey) {
                        statusSuffix = ' *(Pre-loaded)*';
                    }

                    description += `${colorEmoji} ${slotName}: ${vendor} ${filamentName}${statusSuffix}\n`;
                } else {
                    description += `⚪ ${slotName}: *Empty*\n`;
                }
            }

            // Loop through External/Extra Slots if loaded or has data (specifically slot 16)
            const extSlotKey = 'slot16';
            const extMaterial = materials[extSlotKey];
            const extState = states[extSlotKey]; // Might be undefined or 0
            
            if (extMaterial || extState === 1) {
                const extFilament = extMaterial?.filament || {};
                const filamentName = extFilament.filament || extFilament.type || 'Unknown Filament';
                const colorHex = extMaterial?.color || '#000000';
                const colorEmoji = QidiRFIDHelper.getClosestColorEmoji(colorHex);
                const vendor = extMaterial?.vendor || 'Generic';
                
                const isExtLoaded = lastLoaded === extSlotKey && extruderLoaded;
                
                description += `\n__**External Spool**__\n`;
                let slotName = `**External Slot**`;
                if (isExtLoaded) {
                    slotName = `👉 **External Slot**`;
                }

                let statusSuffix = '';
                if (isExtLoaded) {
                    statusSuffix = ' *(Active in Extruder)*';
                }

                description += `${colorEmoji} ${slotName}: ${vendor} ${filamentName}${statusSuffix}\n`;
            }

            embed.setDescription(description);
            await interaction.editReply({embeds: [embed]});
        } catch (error) {
            logError(`Failed to execute /filaments: ${error}`);
            await interaction.editReply(this.locale.messages.errors.command_failed);
        }
    }
}
