/**
 * Copyright (c) 2020 Spudnik Group
 */

import { stripIndents } from 'common-tags';
import { MessageEmbed, Permissions } from 'discord.js';
import { sendSimpleEmbeddedError, sendSimpleEmbeddedMessage, getEmbedColor, modLogMessage } from '@lib/helpers';
import { Command, CommandStore, KlasaMessage, Timestamp } from 'klasa';
import { GuildSettings } from '@lib/types/settings/GuildSettings';

/**
 * Enable or disable the adblock feature.
 *
 * @export
 * @class AdblockCommand
 * @extends {Command}
 */
export default class AdblockCommand extends Command {

	constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: 'Enable or disable the adblock feature.',
			name: 'adblock',
			permissionLevel: 1, // MANAGE_MESSAGES
			requiredPermissions: Permissions.FLAGS['MANAGE_MESSAGES'],
			subcommands: true,
			usage: '<on|off>'
		});
	}

	public async off(msg: KlasaMessage): Promise<KlasaMessage | KlasaMessage[]> {
		const adblockEnabled = msg.guild.settings.get(GuildSettings.AdblockEnabled);
		const adblockEmbed: MessageEmbed = new MessageEmbed({
			author: {
				name: '🛑 Adblock'
			},
			color: getEmbedColor(msg),
			description: ''
		}).setTimestamp();

		if (adblockEnabled) {
			try {
				await msg.guild.settings.update(GuildSettings.AdblockEnabled, false);

				// Set up embed message
				adblockEmbed.setDescription(stripIndents`
						**Member:** ${msg.author.tag} (${msg.author.id})
						**Action:** Adblock _Disabled_
					`);

				return this.sendSuccess(msg, adblockEmbed);
			} catch (err) {
				return this.catchError(msg, { subCommand: 'disable' }, err);
			}
		} else {
			return sendSimpleEmbeddedMessage(msg, 'Adblock feature already disabled!', 3000);
		}
	}

	public async on(msg: KlasaMessage): Promise<KlasaMessage | KlasaMessage[]> {
		const adblockEnabled = await msg.guild.settings.get(GuildSettings.AdblockEnabled);
		const adblockEmbed: MessageEmbed = new MessageEmbed({
			author: {
				name: '🛑 Adblock'
			},
			color: getEmbedColor(msg),
			description: ''
		}).setTimestamp();

		if (adblockEnabled) {
			return sendSimpleEmbeddedMessage(msg, 'Adblock feature already enabled!', 3000);
		}
		try {
			await msg.guild.settings.update(GuildSettings.AdblockEnabled, true);

			// Set up embed message
			adblockEmbed.setDescription(stripIndents`
						**Member:** ${msg.author.tag} (${msg.author.id})
						**Action:** Adblock _Enabled_
					`);

			return this.sendSuccess(msg, adblockEmbed);
		} catch (err) {
			return this.catchError(msg, { subCommand: 'enable' }, err);
		}

	}

	private catchError(msg: KlasaMessage, args: { subCommand: string }, err: Error): Promise<KlasaMessage | KlasaMessage[]> {
		// Emit warn event for debugging
		msg.client.emit('warn', stripIndents`
			Error occurred in \`adblock\` command!
			**Server:** ${msg.guild.name} (${msg.guild.id})
			**Author:** ${msg.author.tag} (${msg.author.id})
			**Time:** ${new Timestamp('MMMM D YYYY [at] HH:mm:ss [UTC]Z').display(msg.createdTimestamp)}
			**Input:** \`Adblock ${args.subCommand.toLowerCase()}\`
			**Error Message:** ${err}
		`);

		// Inform the user the command failed
		if (args.subCommand.toLowerCase() === 'enable') {
			return sendSimpleEmbeddedError(msg, 'Enabling adblock feature failed!');
		}
		return sendSimpleEmbeddedError(msg, 'Disabling adblock feature failed!');

	}

	private sendSuccess(msg: KlasaMessage, embed: MessageEmbed): Promise<KlasaMessage | KlasaMessage[]> {
		modLogMessage(msg, embed);

		// Send the success response
		return msg.sendEmbed(embed);
	}

}
