'use strict'

import {Message, MessageReaction, PartialMessageReaction} from "discord.js";
import {PermissionHelper} from "../../../helper/PermissionHelper";
import {logNotice, logWarn} from "../../../helper/LoggerHelper";
import {WebsocketHandler} from "./handlers/WebsocketHandler";
import {ExcludeConfirmHandler} from "./handlers/ExcludeConfirmHandler";
import {ModalHandler} from "./handlers/ModalHandler";
import {PrintJobStartHandler} from "./handlers/PrintJobStartHandler";
import {MessageHandler} from "./handlers/MessageHandler";
import {EmbedHandler} from "./handlers/EmbedHandler";
import {DeleteHandler} from "./handlers/DeleteHandler";
import {ReconnectHandler} from "./handlers/ReconnectHandler";
import {RefreshHandler} from "./handlers/RefreshHandler";
import {ListHandler} from "./handlers/ListHandler";
import {PageHandler} from "./handlers/PageHandler";
import {MacroHandler} from "./handlers/MacroHandler";
import {DeleteMessageHandler} from "./handlers/DeleteMessageHandler";
import {CameraSettingHandler} from "./handlers/CameraSettingHandler";
import DownloadHandler from "./handlers/DownloadHandler";
import {SetupHandler} from "./handlers/SetupHandler";
import {NotificationHandler} from "./handlers/NotificationHandler";
import {ClearAttachmentsHandler} from "./handlers/ClearAttachmentsHandler";
import {WaitMessageHandler} from "./handlers/WaitMessageHandler";
import {ConfigHelper} from "../../../helper/ConfigHelper";
import {getEntry} from "../../../utils/CacheUtil";
const HANDLER_CLASSES = [
    WaitMessageHandler, ClearAttachmentsHandler, MacroHandler, DeleteHandler,
    CameraSettingHandler, WebsocketHandler, ExcludeConfirmHandler, ModalHandler,
    PrintJobStartHandler, EmbedHandler, MessageHandler, ReconnectHandler,
    RefreshHandler, ListHandler, DownloadHandler, PageHandler, DeleteMessageHandler,
    SetupHandler, NotificationHandler
];

export class ReactionInteraction {
    protected config = new ConfigHelper()

    public async execute(interaction: MessageReaction | PartialMessageReaction) {
        const emoji = interaction.emoji.toString()
        const message = interaction.message as Message

        if (message.author === null) {
            return
        }

        if (message.author.id !== getEntry("discord_client").clientId) {
            return
        }

        const permissionHelper = new PermissionHelper()
        const reactionConfigs = this.config.getEntriesByFilter(/^reaction /g, true)

        let reactionData = undefined
        let reactionId = ''

        for (const configReactionId in reactionConfigs) {
            const reactionConfig = reactionConfigs[configReactionId]
            if(!reactionConfig.emoji.includes(emoji)) continue

            reactionId = configReactionId
            reactionData = reactionConfig
        }

        if(!reactionData) return

        const user = interaction.users.cache.first()

        if (!user) {
            logWarn(`could not resolve reacting user for: ${reactionId}`)
            return
        }

        logNotice(`${user.tag} reacted: ${reactionId}`)

        if (!permissionHelper.hasPermission(user, interaction.message.guild, reactionId)) {
            logWarn(`${user.tag} doesnt have the permission for: ${reactionId}`)
            return;
        }
        await Promise.allSettled(HANDLER_CLASSES.map(Handler => 
            new Handler().executeHandler(message, user, reactionData)
        ))
    }
}