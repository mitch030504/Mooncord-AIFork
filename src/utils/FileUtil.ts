import {ConfigHelper} from "../helper/ConfigHelper";
import axios from "axios";
import {Attachment} from "discord.js";
import {logError, logNotice} from "../helper/LoggerHelper";

export async function downloadFile(root: string, fileName: string) {
    const config = new ConfigHelper()

    const result = await axios.get(`${config.getMoonrakerUrl()}/server/files/${root}/${fileName}`, {
        responseType: 'arraybuffer',
        headers: {
            'X-Api-Key': config.getMoonrakerApiKey()
        }
    })

    const bufferSize = Buffer.byteLength(<Buffer>result.data)

    return {
        size: bufferSize,
        data: <Buffer>result.data,
        overSizeLimit: bufferSize > config.getUploadLimit(),
        sizeLimit: config.getUploadLimit()
    }
}

export async function uploadAttachment(attachment: Attachment, fileRoot = 'gcodes', filePath = '') {
    try {
        logNotice(`Upload for ${attachment.name} started`)
        const attachmentResponse = await fetch(attachment.url)
        const attachmentData = Buffer.from(await attachmentResponse.arrayBuffer())
        const configHelper = new ConfigHelper()

        const formData = new FormData()
        formData.append('file', new Blob([attachmentData]), attachment.name ?? 'file')
        formData.append('root', fileRoot)
        formData.append('path', filePath)

        const response = await fetch(`${configHelper.getMoonrakerUrl()}/server/files/upload`, {
            method: 'POST',
            headers: {
                'X-Api-Key': configHelper.getMoonrakerApiKey()
            },
            body: formData
        })

        if (!response.ok) {
            throw new Error(`upload HTTP ${response.status}: ${await response.text()}`)
        }
        return true
    } catch (error) {
        logError(`Upload for ${attachment.name} failed:`)
        logError(JSON.stringify(error, Object.getOwnPropertyNames(error as Error)))
        return false
    }
}