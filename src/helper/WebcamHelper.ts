'use strict'

import {ConfigHelper} from "./ConfigHelper";
import {sleep} from "./DataHelper";
import axios from "axios";
import {resolve} from "path"
import {logEmpty, logError, logRegular, logWarn} from "./LoggerHelper";
import {getMoonrakerClient} from "../Application";
import {getEntry, setData} from "../utils/CacheUtil";
import {AttachmentBuilder} from "discord.js";
import SharpRenderBackend from "./snapshotBackend/SharpRenderBackend";
import NoneRenderBackend from "./snapshotBackend/NoneRenderBackend";

export class WebcamHelper {
    public async generateCache() {
        const moonrakerClient = getMoonrakerClient()
        const config = new ConfigHelper()

        let webcamData = []
        try {
            const webcamEntries = await moonrakerClient.send({"method": "server.webcams.list"})
            webcamData = webcamEntries.result.webcams
        } catch (e) {
            logWarn(`Failed to retrieve webcams from Moonraker: ${e}`)
        }
        let webcamConfigs = config.getEntriesByFilter(/^webcam(?:\s|$)/g, true)
        let activeWebcam = ''

        const webcamCache = {
            entries: {} as Record<string, any>,
            active: ''
        }

        for (const data of webcamData) {
            if (!data.enabled) {
                continue
            }

            if (activeWebcam === '') {
                activeWebcam = data.name
            }

            webcamCache.entries[data.name] = data
        }

        for (let webcamName in webcamConfigs) {
            const webcamConfig = webcamConfigs[webcamName]

            if(webcamName === '') {
                webcamName = 'default'
            }

            if (activeWebcam === '') {
                activeWebcam = webcamName
            }

            if(webcamConfig.url) {
                webcamConfig.snapshot_url = webcamConfig.url
            }

            webcamConfig.name = webcamName

            webcamCache.entries[webcamName] = webcamConfig
        }

        webcamCache.active = activeWebcam

        setData('webcam', webcamCache)
    }

    public getWebcamChoices() {
        const stateCache = getEntry('webcam')
        const options = []

        for (const key in stateCache.entries) {
            options.push({
                "label": key,
                "value": key
            })
        }

        return options
    }

    public async retrieveWebcam() {
        const cache = getEntry('webcam')
        const webcamData = cache.entries[cache.active]
        const configHelper = new ConfigHelper()
        const snapshotConfig = configHelper.getEntriesByFilter(/^snapshot$/g)[0]

        const beforeStatus = {
            'enable': snapshotConfig.enable_before_snapshot_commands,
            'execute': snapshotConfig.before_snapshot_commands,
            'delay': snapshotConfig.delay_before_snapshot_commands
        }
        const afterStatus = {
            'enable': snapshotConfig.enable_after_snapshot_commands,
            'execute': snapshotConfig.after_snapshot_commands,
            'delay': snapshotConfig.delay_after_snapshot_commands
        }

        try {
            if (webcamData === undefined)
                throw new Error('Config Error: Webcam has invalid config or was not found')

            if(snapshotConfig.backend === 'none') {
                logRegular('the none backend is active, the snapshot will be replaced with a empty pixel...')

                const editBuffer = await new NoneRenderBackend(Buffer.from('placeholder', 'utf8'), webcamData).render()

                return new AttachmentBuilder(editBuffer, {name: "snapshot.png"})
            }

            if (webcamData.snapshot_url.startsWith('/'))
                webcamData.snapshot_url = `http://192.168.8.194${webcamData.snapshot_url}`

            logRegular('Run Webcam pre Tasks if present...')
            await this.executePostProcess(beforeStatus)

            logRegular(`Retrieve Webcam ${webcamData.name} Snapshot...`)
            const res = await axios({
                method: 'get',
                responseType: 'arraybuffer',
                url: webcamData.snapshot_url,
                timeout: 2000
            })

            const contentType = res.headers['content-type'] as string | undefined
            if (!contentType || !contentType.startsWith('image')) {
                throw new Error('the Webcam URL is not a static image!')
            }

            const buffer = Buffer.from(res.data, 'binary')

            logRegular('Run Webcam follow up Tasks if present...')
            await this.executePostProcess(afterStatus)

            // Only run Sharp if they want the image modifed
            if (
                webcamData.flip_horizontal ||
                webcamData.flip_vertical ||
                webcamData.rotation
            ) {

                let editBuffer: Buffer

                logRegular(`modify the Snapshot with the sharp backend...`)

                editBuffer = await new SharpRenderBackend(buffer, webcamData).render()

                buffer.fill(0)

                return new AttachmentBuilder(editBuffer, {name: "snapshot.png"})
            }

            return new AttachmentBuilder(buffer, {name: "snapshot.png"})
        } catch (error) {
            const trace = new Error().stack

            let url = 'not configured'

            if (webcamData !== undefined)
                url = webcamData.snapshot_url

            logEmpty()
            logError('Webcam Error:')
            logError(`Url: ${url}`)
            logError(JSON.stringify(error, Object.getOwnPropertyNames(error)))
            if (configHelper.traceOnWebErrors()) {
                logError(trace)
            }

            logRegular('Run Webcam follow up Tasks if present...')
            await this.executePostProcess(afterStatus)

            return this.getFallbackImage()
        }
    }

    public getFallbackImage() {
        const configHelper = new ConfigHelper()

        return new AttachmentBuilder(
            resolve(__dirname, `../assets/icon-sets/${configHelper.getIconSet()}/snapshot-error.png`),
            {name: 'snapshot-error.png'}
        )
    }

    private triggerWebsite(url: string, post: boolean) {
        void (async () => {
            if (post) {
                await axios.post(url)
                return
            }
            await axios.get(url)
        })()
    }

    private async executePostProcess(config: any) {
        if (!config.enable || config.execute.length === 0) {
            return
        }

        const moonrakerClient = getMoonrakerClient()

        await sleep(config.delay)

        let index = 0

        while (index < config.execute.length) {
            const execute = config.execute[index]
            logRegular(`Execute Webcam Task ${index + 1} from ${config.execute.length}: ${execute}`)
            if (execute.key.toLowerCase() === 'gcode') {
                const gcode = execute.value
                try {
                    await moonrakerClient
                        .send(
                            {"method": "printer.gcode.script", "params": {"script": gcode}},
                            new ConfigHelper().getGcodeExecuteTimeout() * 1000
                        )
                } catch (error) {
                    logError(JSON.stringify(error, Object.getOwnPropertyNames(error)))
                }
            }
            if (execute.key.toLowerCase() === 'website_post') {
                const url = execute.value
                this.triggerWebsite(url, true)
            }
            if (execute.key.toLowerCase() === 'website') {
                const url = execute.value
                this.triggerWebsite(url, false)
            }
            await sleep(config.delay)
            index++
        }

        await sleep(config.delay)
    }
}

