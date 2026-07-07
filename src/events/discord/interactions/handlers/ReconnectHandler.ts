'use strict'

import {Message, User} from "discord.js";
import * as App from '../../../../Application'
import BaseHandler from "../abstracts/BaseHandler";

export class ReconnectHandler extends BaseHandler {
    async isValid(message: Message, user: User, data: any, interaction: any = null) {
        return data.functions.includes("reconnect");
    }

    async handleHandler(message: Message, user: User, data: any, interaction: any = null) {
        await App.reconnectMoonraker()
    }
}