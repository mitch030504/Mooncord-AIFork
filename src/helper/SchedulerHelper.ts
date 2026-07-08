'use strict'

import {MoonrakerClient} from "../clients/MoonrakerClient";
import {ConfigHelper} from "./ConfigHelper";
import {findValue, getEntry, purgeOldCacheEntries, setData, updateData} from "../utils/CacheUtil";
import {StatusHelper} from "./StatusHelper";
import {UsageHelper} from "./UsageHelper";
import {clearInterval} from "timers";
import {TempHelper} from "./TempHelper";
import {PromptHelper} from "./PromptHelper";
import {updateAllRestEndpoints} from "./RestApiHelper";
import {MetadataHelper} from "./MetadataHelper";
import {ImageHelper} from "./ImageHelper";
import {logWarn} from "./LoggerHelper";

export class SchedulerHelper {
    protected configHelper = new ConfigHelper()
    protected functionCache = getEntry('function')
    protected statusHelper = new StatusHelper()
    protected moonrakerClient!: MoonrakerClient
    protected highScheduler: ReturnType<typeof setInterval> | undefined
    protected moderateScheduler: ReturnType<typeof setInterval> | undefined
    protected statusScheduler: ReturnType<typeof setInterval> | undefined
    protected loadScheduler: ReturnType<typeof setInterval> | undefined
    protected usageHelper = new UsageHelper()
    protected tempHelper = new TempHelper()
    protected promptHelper = new PromptHelper()
    protected metadataHelper = new MetadataHelper()

    public init(moonrakerClient: MoonrakerClient) {
        this.moonrakerClient = moonrakerClient

        this.scheduleModerate()
        this.scheduleHigh()
        this.scheduleLoad()
        this.scheduleStatus()

        this.usageHelper.updateDiskUsage()
    }

    public clear() {
        clearInterval(this.highScheduler)
        clearInterval(this.moderateScheduler)
        clearInterval(this.statusScheduler)
        clearInterval(this.loadScheduler)
    }

    protected scheduleHigh() {
        this.highScheduler = setInterval(() => {
            this.functionCache = getEntry('function')

            if (typeof this.moonrakerClient.getWebsocket() === 'undefined')
                return

            updateData('moonraker_client', {
                'event_count': (this.moonrakerClient.getWebsocket().underlyingWebsocket as any)['_eventsCount']
            })
        }, 250)
    }

    protected scheduleLoad() {
        this.loadScheduler = setInterval(async () => {
            this.usageHelper.updateMemoryUsage()
            this.usageHelper.updateKlipperLoad()
            this.usageHelper.updateSystemLoad()
            this.promptHelper.purgePrompt()
            this.metadataHelper.purgeMetaData()
            purgeOldCacheEntries()

            await this.tempHelper.notifyHeaterTargetNotifications()

            this.updateThrottleCooldown()

            if (this.functionCache.poll_printer_info)
                await this.pollServerInfo()
        }, 1000)
    }

    protected scheduleModerate() {
        this.moderateScheduler = setInterval(async () => {
            if (!this.moonrakerClient.isConnected()) {
                return
            }

            try {
                const machineInfo = await this.moonrakerClient.send({"method": "machine.system_info"})
                if (machineInfo && machineInfo.result) {
                    setData('machine_info', machineInfo.result)
                }
            } catch (e) {
                logWarn(`Failed to retrieve machine system info: ${e}`)
            }

            await this.usageHelper.updateDiskUsage()

            await updateAllRestEndpoints()
        }, 60000)
    }

    protected scheduleStatus() {
        this.statusScheduler = setInterval(() => {
            if (this.configHelper.isStatusPerPercent())
                void this.updateStatusCooldown()
            else
                this.postPrintProgress()
        }, this.getStatusInterval())
    }

    protected updateThrottleCooldown() {
        const currentThrottleState = getEntry('throttle')

        if (currentThrottleState.cooldown === 0)
            currentThrottleState.throttle_states = []
        else
            currentThrottleState.cooldown--

        setData('throttle', currentThrottleState)
    }

    protected postPrintProgress() {
        if (this.functionCache.current_status !== 'printing')
            return

        void this.statusHelper.update('printing')
    }

    protected async updateStatusCooldown() {
        const statusCooldown = this.functionCache.status_cooldown
        const statusInterval = this.functionCache.status_interval

        if (statusInterval === 0 && statusCooldown === 0 && this.functionCache.current_status === 'printing') {
            await this.statusHelper.update('printing')

            this.functionCache = getEntry('function')
            this.functionCache.status_interval = this.configHelper.getStatusMinInterval()

            updateData('function', this.functionCache)
            return
        } else if (statusInterval !== 0 && statusCooldown === 0)
            this.functionCache.status_interval--

        updateData('function', this.functionCache)

        if (statusCooldown === 0)
            return

        this.functionCache.status_cooldown--

        updateData('function', this.functionCache)
    }

    protected getStatusInterval() {
        if (this.configHelper.isStatusPerPercent())
            return 1000
        else
            return this.configHelper.getStatusInterval() * 1000 * 60
    }

    private async pollServerInfo() {
        if (!this.moonrakerClient.isConnected())
            return

        if (this.functionCache.server_info_in_query)
            return

        updateData('function', {
            'server_info_in_query': true
        })

        const currentStatus = findValue('function.current_status')
        try {
            const serverInfo = await this.moonrakerClient.send({"method": "server.info"})

            if (typeof serverInfo.result === 'undefined')
                return
            if (typeof serverInfo.result.klippy_state === 'undefined')
                return

            if (currentStatus !== serverInfo.result.klippy_state)
                await this.requestPrintInfo()

            updateData('server_info', serverInfo.result)
        } catch (e) {
            logWarn(`Failed to poll server info: ${e}`)
        }

        updateData('function', {
            'server_info_in_query': false
        })

        const serverInfoCached = getEntry('server_info')
        if (serverInfoCached && serverInfoCached.klippy_state === 'ready')
            return

        await this.statusHelper.update()
    }

    private async requestPrintInfo() {
        if (!this.moonrakerClient.isConnected())
            return

        try {
            const printerInfo = await this.moonrakerClient.send({"method": "printer.info"})
            if (printerInfo && printerInfo.result) {
                updateData('printer_info', printerInfo.result)
            }
        } catch (e) {
            logWarn(`Failed to request print info: ${e}`)
        }
    }
}