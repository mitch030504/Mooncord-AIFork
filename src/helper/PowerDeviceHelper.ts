'use strict'

import {getEntry, setData} from "../utils/CacheUtil";
import {logRegular} from "./LoggerHelper";
import {LocaleHelper} from "./LocaleHelper";
import {getMoonrakerClient} from "../Application";

export class PowerDeviceHelper {
    public getPowerDeviceData(powerDeviceName: string) {
        const powerDeviceCache = getEntry('power_devices')
        for (const index in powerDeviceCache) {
            const powerDevice = powerDeviceCache[index]

            if (powerDevice.device === powerDeviceName) {
                return powerDevice
            }
        }

        return null
    }

    public getPowerDevices() {
        logRegular('Retrieve Power Devices...')
        void (async () => {
            const powerDevicesData = await getMoonrakerClient().send({"method": "machine.device_power.devices"})

            if (powerDevicesData.error !== undefined) {
                return
            }

            setData('power_devices', powerDevicesData.result.devices)
        })()
    }

    public updatePowerDevice(powerDeviceData: any) {
        const powerDeviceCache = getEntry('power_devices')
        for (const index in powerDeviceCache) {
            const powerDevice = powerDeviceCache[index]

            if (powerDeviceData.device === powerDevice.device) {
                powerDeviceCache[index] = powerDeviceData
            }
        }

        setData('power_devices', powerDeviceCache)
    }

    public parseFields() {
        const fields = []
        const locale = new LocaleHelper().getLocale()
        const powerDeviceCache = getEntry('power_devices')
        const icons = getEntry('config')['icons']

        const onLabel = locale.embeds.fields.on
            .replace(/(\${icon})/g, icons.power_device_on.icon)
        const offLabel = locale.embeds.fields.off
            .replace(/(\${icon})/g, icons.power_device_off.icon)

        for (const powerDevice of powerDeviceCache) {
            fields.push({
                'name': powerDevice.device,
                'value': (powerDevice.status === 'on') ? onLabel : offLabel
            })
        }

        return fields
    }
}