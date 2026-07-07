'use strict'

import {Interaction} from "discord.js";
import {DiscordCommandGenerator} from "../../../generator/DiscordCommandGenerator";
import {logNotice, logWarn} from "../../../helper/LoggerHelper";
import {PermissionHelper} from "../../../helper/PermissionHelper";
import {LocaleHelper} from "../../../helper/LocaleHelper";
import {sleep} from "../../../helper/DataHelper";
import AdminCommand from "./commands/AdminCommand";
import {FileInfoCommand} from "./commands/FileInfoCommand";
import InfoCommand from "./commands/InfoCommand";
import DumpCommand from "./commands/DumpCommand";
import TempCommand from "./commands/TempCommand";
import RestartCommand from "./commands/RestartCommand";
import ListLogsCommand from "./commands/ListLogsCommand";
import UserIdCommand from "./commands/UserIdCommand";
import ResetDatabaseCommand from "./commands/ResetDatabaseCommand";
import NotifyCommand from "./commands/NotifyCommand";
import EmergencyStopCommand from "./commands/EmergencyStopCommand";
import StatusCommand from "./commands/StatusCommand";
import EditChannelCommand from "./commands/EditChannelCommand";
import GcodeListCommand from "./commands/GcodeListCommand";
import PrintjobCommand from "./commands/PrintjobCommand";
import SystemInfoCommand from "./commands/SystemInfoCommand";
import PreheatCommand from "./commands/PreheatCommand";
import PidtuneCommand from "./commands/PidtuneCommand";
import SaveConfigCommand from "./commands/SaveConfigCommand";
import TuneCommand from "./commands/TuneCommand";
import ConfigCommand from "./commands/ConfigCommand";
import ExecuteCommand from "./commands/ExecuteCommand";
import CustomCommand from "./commands/CustomCommand";
import PowerDeviceCommand from "./commands/PowerDeviceCommand";
import HistoryCommand from "./commands/HistoryCommand";
import TimelapseListCommand from "./commands/TimelapseListCommand";
import BedMeshCommand from "./commands/BedMeshCommand";
import FilamentsCommand from "./commands/FilamentsCommand";

const COMMAND_CLASSES: Record<string, any> = {
    admin: AdminCommand,
    filaments: FilamentsCommand,
    fileinfo: FileInfoCommand,
    info: InfoCommand,
    dump: DumpCommand,
    temp: TempCommand,
    restart: RestartCommand,
    listlogs: ListLogsCommand,
    get_user_id: UserIdCommand,
    reset_database: ResetDatabaseCommand,
    notify: NotifyCommand,
    emergency_stop: EmergencyStopCommand,
    status: StatusCommand,
    editchannel: EditChannelCommand,
    listgcodes: GcodeListCommand,
    printjob: PrintjobCommand,
    systeminfo: SystemInfoCommand,
    preheat: PreheatCommand,
    pidtune: PidtuneCommand,
    saveconfig: SaveConfigCommand,
    tune: TuneCommand,
    config: ConfigCommand,
    execute: ExecuteCommand,
    power: PowerDeviceCommand,
    history: HistoryCommand,
    bedmesh: BedMeshCommand,
    listtimelapses: TimelapseListCommand
};

export class CommandInteraction {

    public async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) {
            return
        }

        let logFeedback = interaction.commandName

        for (const option of (interaction.options as any)['_hoistedOptions']) {
            logFeedback = `${logFeedback} ${option.name}:${option.value}`
        }

        const commandGenerator = new DiscordCommandGenerator()
        const localeHelper = new LocaleHelper()
        const permissionHelper = new PermissionHelper()

        const commandId = commandGenerator.getCommandId(interaction.commandName)

        let permissionId = commandId

        if (commandGenerator.isCustomCommand(commandId as string)) {
            permissionId = 'custom_command'
        }

        if (typeof commandId === 'undefined') {
            return
        }

        logNotice(`${interaction.user.tag} executed command: ${logFeedback}`)

        if (!permissionHelper.hasPermission(interaction.user, interaction.guild, permissionId as string)) {
            await permissionHelper.sendNoPermissionMessage(interaction)
            logWarn(`${interaction.user.tag} doesnt have the permission for: ${interaction.commandName} (${commandId})`)
            return;
        }

        if (commandGenerator.isCustomCommand(commandId as string)) {
            await new CustomCommand().executeCommand(interaction, commandId as string)
        } else if (COMMAND_CLASSES[commandId as string]) {
            await new COMMAND_CLASSES[commandId as string]().executeCommand(interaction, commandId as string)
        }

        await sleep(1_000)

        if (!interaction.deferred && !interaction.replied && !interaction.isModalSubmit()) {
            await interaction.reply(localeHelper.getCommandNotReadyError(interaction.user.tag))
            return
        }

        await sleep(60_000)

        if (interaction.replied) {
            return
        }

        await interaction.editReply(localeHelper.getCommandNotReadyError(interaction.user.tag))
    }
}