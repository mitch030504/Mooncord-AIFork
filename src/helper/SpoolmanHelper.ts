import {getMoonrakerClient} from "../Application";
import {logWarn} from "./LoggerHelper";

export class SpoolmanHelper {
    public async getFields() {
        const moonrakerClient = getMoonrakerClient()

        try {
            const request = await moonrakerClient.send({"method": "server.spoolman.get_spool_id"})

            if (request.error !== undefined) {
                return []
            }

            const spoolId = request.result.spool_id

            return [{
                name: "${embeds.fields.active_spool}",
                value: (spoolId === null) ? "${locale.messages.answers.empty_spool}" : "${locale.messages.answers.current_spool} " + spoolId
            }]
        } catch (e) {
            logWarn(`Failed to retrieve spool id from Spoolman: ${e}`)
            return []
        }
    }
}