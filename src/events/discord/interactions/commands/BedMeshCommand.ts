import BaseCommand from "../abstracts/BaseCommand";
import {ChatInputCommandInteraction, EmbedBuilder} from "discord.js";
import * as app from "../../../../Application";
import BedMeshGraph from "../../../../helper/graphs/BedMeshGraph";

export default class BedMeshCommand extends BaseCommand {
    commandId = 'bedmesh'

    async handleCommand(interaction: ChatInputCommandInteraction) {
        const client = app.getMoonrakerClient()

        try {
            const result = await client.send({"method": "printer.objects.query", "params": {"objects": {"bed_mesh": null}}})
            const bedMeshState = result.result.status.bed_mesh

            if (!bedMeshState) {
                await interaction.editReply(this.locale.messages.errors.not_ready.replace(/(\${username})/g, interaction.user.tag))
                return
            }

            let matrix: number[][] = []
            if (bedMeshState.probed_matrix && bedMeshState.probed_matrix.length > 0) {
                matrix = bedMeshState.probed_matrix
            } else if (bedMeshState.profile_name && bedMeshState.profiles[bedMeshState.profile_name]) {
                matrix = bedMeshState.profiles[bedMeshState.profile_name].points
            } else {
                await interaction.editReply("No active bed mesh found on the printer.")
                return
            }

            let min = Infinity
            let max = -Infinity
            for (const row of matrix) {
                for (const val of row) {
                    if (val < min) min = val
                    if (val > max) max = val
                }
            }

            const variance = (max - min).toFixed(3)
            
            const graph = await new BedMeshGraph().renderGraph(matrix, min, max)

            const embedData = await this.embedHelper.generateEmbed('bedmesh', {
                variance,
                min: min.toFixed(3),
                max: max.toFixed(3),
                profile: bedMeshState.profile_name || 'default'
            })

            const embed = embedData.embed.embeds[0] as EmbedBuilder
            embed.setImage(`attachment://${graph.name}`)

            embedData.embed.embeds = [embed]
            embedData.embed['files'] = [graph]

            await interaction.editReply(embedData.embed)

        } catch (e) {
            await interaction.editReply("Failed to fetch bed mesh from Moonraker.")
        }
    }
}
