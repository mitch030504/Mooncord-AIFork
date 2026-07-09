'use strict'

import {ConfigHelper} from '../helper/ConfigHelper'
import {Websocket, WebsocketBuilder, WebsocketEvent} from 'websocket-ts'
import {APIKeyHelper} from '../helper/APIKeyHelper'
import {waitUntil} from 'async-wait-until'
import {
    changePath,
    changeTempPath,
    gracefulShutdown,
    logEmpty,
    logError,
    logRegular,
    logSuccess,
    logWarn,
    unhookTempLog
} from '../helper/LoggerHelper'
import {setData} from '../utils/CacheUtil'
import {MessageHandler} from "../events/moonraker/MessageHandler";
import {FileListHelper} from "../helper/FileListHelper";
import {MetadataHelper} from "../helper/MetadataHelper";
import * as App from '../Application'
import {StatusHelper} from "../helper/StatusHelper";
import {TempHelper} from "../helper/TempHelper";
import {PowerDeviceHelper} from "../helper/PowerDeviceHelper";
import {HistoryHelper} from "../helper/HistoryHelper";
import {WebcamHelper} from "../helper/WebcamHelper";
import {updateAllRestEndpoints} from "../helper/RestApiHelper";

const requests: any = {}
let messageHandler: MessageHandler

export class MoonrakerClient {
    protected ready = false
    protected websocket!: Websocket
    protected alreadyRunning = false
    protected reconnectScheduler: ReturnType<typeof setInterval> | undefined
    protected reconnectAttempt = 1

    public async connect() {
        logSuccess('Connect to Moonraker...')

        if (this.websocket) {
            this.websocket.close()
        }

        this.ready = false

        const config = new ConfigHelper()

        const oneShotToken = await new APIKeyHelper().getOneShotToken()
        let socketUrl = config.getMoonrakerSocketUrl()

        if (socketUrl === undefined ||
            socketUrl === '') {
            socketUrl = `${config.getMoonrakerUrl()}/websocket`
        }

        socketUrl = socketUrl.replace(/(http:\/\/)|(https:\/\/)/g, 'ws://')

        this.websocket = new WebsocketBuilder(`${socketUrl}?token=${oneShotToken}`)
            .build()

        this.websocket.addEventListener(WebsocketEvent.close, ((async (instance, ev) => {
            await this.closeHandler(instance, ev)
        })))

        this.websocket.addEventListener(WebsocketEvent.error, ((async (instance, ev) => {
            await this.errorHandler(instance, ev)
        })))

        this.websocket.addEventListener(WebsocketEvent.open, ((async (instance, ev) => {
            clearInterval(this.reconnectScheduler)

            await this.reconnectHandler(instance, ev)
            await this.connectHandler(instance, ev)

            this.reconnectScheduler = undefined
        })))
    }

    public async sendInitCommands() {
        const config = new ConfigHelper()
        logRegular('Send Initial Commands...')

        this.getCacheData({"method": "machine.update.status"}, 'updates')
        this.getCacheData({"method": "printer.info"}, 'printer_info')
        this.getCacheData({"method": "server.config"}, 'server_config')
        this.getCacheData({"method": "server.info"}, 'server_info')
        this.getCacheData({"method": "machine.system_info"}, 'machine_info')
        this.getCacheData({"method": "machine.proc_stats"}, 'proc_stats')

        logRegular('Retrieve Subscribable Moonraker Objects...')
        const objects = await this.send({"method": "printer.objects.list"})

        await new HistoryHelper().parseData()

        new PowerDeviceHelper().getPowerDevices()

        const fileListHelper = new FileListHelper()

        fileListHelper.retrieveFiles('config', 'config_files')
        fileListHelper.retrieveFiles('gcodes', 'gcode_files')
        fileListHelper.retrieveFiles('logs', 'log_files')
        fileListHelper.retrieveFiles('timelapse', 'timelapse_files', /(.*\.mp4)/)

        const subscriptionObjects: any = {
            'webhooks.state': null,
            'webhooks.state_message': null,
            'configfile': ['config', 'settings', 'warnings']
        }

        for (const index in objects.result.objects) {
            const object = objects.result.objects[index]

            if(subscriptionObjects[object]) continue

            subscriptionObjects[object] = null
        }

        delete subscriptionObjects['webhooks']
        delete subscriptionObjects['telemetry']
        delete subscriptionObjects['bed_mesh']

        logRegular('Subscribe to Moonraker Objects...')
        let data: any
        try {
            const subResult = await this.send({
                "method": "printer.objects.subscribe",
                "params": {"objects": subscriptionObjects}
            })
            data = subResult.result.status
        } catch (e) {
            logWarn(`Failed to subscribe to Moonraker objects: ${e}`)
            // Fallback: query objects individually instead
            try {
                const queryResult = await this.send({
                    "method": "printer.objects.query",
                    "params": {"objects": subscriptionObjects}
                })
                data = queryResult.result.status
            } catch (e2) {
                logWarn(`Failed to query Moonraker objects: ${e2}`)
                data = {}
            }
        }

        data = this.clearStateData(data)

        this.ready = true

        setData('state', data)

        if (typeof data !== 'undefined') {
            if (typeof data.print_stats !== 'undefined') {
                if (data.print_stats.filename !== null) {
                    await new MetadataHelper().updateMetaData(data.print_stats.filename)
                }
            }
        }

        setData('moonraker_client', {
            'rest_url': config.getMoonrakerUrl(),
            'url': this.websocket.underlyingWebsocket.url,
            'readySince': Date.now() / 1000,
            'event_count': (this.websocket.underlyingWebsocket as any)['_eventsCount']
        })

        await updateAllRestEndpoints()

        new TempHelper().generateColors()
        void new WebcamHelper().generateCache()
    }

    public changeLogPath() {
        const config = new ConfigHelper()

        if (config.isLogFileDisabled()) {
            logWarn('Log File is disabled!')
            unhookTempLog()
        } else if (config.getLogPath() !== '') {
            changePath(config.getLogPath())
        }

        changeTempPath(config.getTempPath())

        logSuccess('Moonraker Client is ready')
    }

    public sendThread(message: Record<string, any>, timeout: number = 10_000) {
        void (async () => {
            try {
                await this.send(message, timeout)
            } catch (error) {
                logError(`An Error occurred while sending a Websocket Request:`)
                logError(JSON.stringify(error, Object.getOwnPropertyNames(error)))
                logError(`Websocket Request: ${JSON.stringify(message, null, 4)}`)
            }
        })()
    }

    public async send(message: Record<string, any>, timeout: number = 10_000): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = Math.floor(Math.random() * 1_000_000_000) + 1

            message.id = id
            message.jsonrpc = '2.0'

            const timer = setTimeout(() => {
                delete requests[id]
                reject(new Error(`Websocket request timed out after ${timeout}ms: ${JSON.stringify(message)}`))
                if (this.isConnected()) {
                    logWarn('Websocket request timed out! Force closing Moonraker connection to trigger reconnect...')
                    this.close()
                }
            }, timeout)

            requests[id] = { resolve, reject, timer }

            this.websocket.send(JSON.stringify(message))
        })
    }

    public isReady() {
        if (!this.isConnected()) {
            return false
        }

        return this.ready
    }

    public isConnected() {
        if (typeof (this.websocket) === 'undefined') {
            return false
        }

        return this.websocket.underlyingWebsocket.readyState === this.websocket.underlyingWebsocket.OPEN
    }

    public getWebsocket() {
        return this.websocket
    }

    public close() {
        this.websocket.close()
    }

    public clearStateData(data: any) {
        if(data['configfile']) {
            if(data['configfile']['config']) {
                for (const key in data['configfile']['config']) {
                    if (key.includes('bed_mesh')) {
                        delete data['configfile']['config'][key]
                    }
                }
            }
            if(data['configfile']['settings']) {
                for (const key in data['configfile']['settings']) {
                    if (key.includes('bed_mesh')) {
                        delete data['configfile']['settings'][key]
                    }
                }
            }
        }

        delete data['bed_mesh']

        return data
    }

    private async errorHandler(instance: Websocket, event: any) {
        const reason = event.message
        logEmpty()
        logError('Websocket Error:')
        logError(event.error)
    }

    private async closeHandler(instance: Websocket, event: any) {
        logWarn('Moonraker disconnected!')
        if (this.reconnectAttempt !== 1) {
            return
        }

        const statusHelper = new StatusHelper()
        await statusHelper.update('moonraker_disconnected')

        const config = new ConfigHelper()

        this.reconnectScheduler = setInterval(async () => {
            try {
                logRegular(`Reconnect Attempt ${this.reconnectAttempt} to Moonraker...`)
                await this.connect()
                this.reconnectAttempt++
            } catch (error) {
                logError(error)
            }
        }, config.getMoonrakerRetryInterval() * 15_000)
    }

    private async connectHandler(instance: Websocket, event: any) {
        if (this.alreadyRunning) {
            return
        }
        if (typeof this.reconnectScheduler !== 'undefined') {
            return
        }

        logSuccess('Connected to MoonRaker')

        this.alreadyRunning = true
        this.registerEvents()
        await this.sendInitCommands()
        this.changeLogPath()
    }

    private async reconnectHandler(instance: Websocket, event: any) {
        if (!this.alreadyRunning) {
            return
        }
        if (typeof this.reconnectScheduler === 'undefined') {
            return
        }

        const statusHelper = new StatusHelper()

        logSuccess('Reconnected to Moonraker')

        this.reconnectAttempt = 1

        this.registerEvents()

        App.reloadCache()

        await this.sendInitCommands()

        this.changeLogPath()

        await App.reconnectDiscord()
        await App.restartScheduler()
        await statusHelper.update()
    }

    private getCacheData(websocketCommand: Record<string, any>, cacheKey: string) {
        void (async () => {
            try {
                logRegular(`Retrieve Data for ${cacheKey}...`)
                const data = await this.send(websocketCommand, 300_000)

                setData(cacheKey, data.result)
            } catch (e) {
                logWarn(`Failed to retrieve cache data for ${cacheKey}`)
            }
        })()
    }

    private registerEvents() {
        logRegular('Register Events...')
        this.websocket.addEventListener(WebsocketEvent.message, ((instance, ev) => {
            const messageData = JSON.parse(ev.data)

            if (typeof (messageData) === 'undefined') {
                return
            }
            if (typeof (messageData.id) === 'undefined') {
                return
            }

            if (typeof requests[messageData.id] !== 'undefined') {
                const req = requests[messageData.id]
                clearTimeout(req.timer)
                delete requests[messageData.id]
                
                if (messageData.error) {
                    req.reject(new Error(JSON.stringify(messageData.error)))
                } else {
                    req.resolve(messageData)
                }
            }
        }))

        messageHandler = new MessageHandler(this.websocket)
    }
}