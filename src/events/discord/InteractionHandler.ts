'use strict'

import {Client, Events} from "discord.js";
import {ButtonInteraction} from "./interactions/ButtonInteraction";
import {CommandInteraction} from "./interactions/CommandInteraction";
import {SelectInteraction} from "./interactions/SelectInteraction";
import {ModalInteraction} from "./interactions/ModalInteraction";
import {ReactionInteraction} from "./interactions/ReactionInteraction";

export class InteractionHandler {
    public constructor(discordClient: Client) {
        discordClient.on(Events.InteractionCreate, async interaction => {
            if (interaction.applicationId !== discordClient.application?.id) {
                return
            }
            try {
                if (interaction.isButton()) {
                    await new ButtonInteraction().execute(interaction);
                } else if (interaction.isChatInputCommand()) {
                    await new CommandInteraction().execute(interaction);
                } else if (interaction.isStringSelectMenu()) {
                    await new SelectInteraction().execute(interaction);
                } else if (interaction.isModalSubmit()) {
                    await new ModalInteraction().execute(interaction);
                }
            } catch (error) {
                console.error('Error handling interaction:', error)
            }
        })

        discordClient.on(Events.MessageReactionAdd, async interaction => {
            try {
                await new ReactionInteraction().execute(interaction);
            } catch (error) {
                console.error('Error handling reaction:', error)
            }
        })
    }
}