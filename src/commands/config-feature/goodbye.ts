/**
 * Copyright (c) 2020 Spudnik Group
 */

import { stripIndents } from 'common-tags';
import { Channel, MessageEmbed } from 'discord.js';
import { resolveChannel } from '@lib/helpers/base';
import { Command, CommandStore, KlasaMessage, Timestamp } from 'klasa';
import { GuildSettings } from '@lib/types/settings/GuildSettings';
import { basicFeatureContent } from '@lib/helpers/resolvers';
import { specialEmbed, specialEmbedTypes } from '@lib/helpers/embed-helpers';
import { modLogMessage } from '@lib/helpers/custom-helpers';

/**
 * Manage notifications when someone leaves the guild.
 *
 * @export
 * @class GoodbyeCommand
 * @extends {Command}
 */
export default class GoodbyeCommand extends Command {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: 'Used to configure the message to be sent when a user leaves your guild.',
			extendedHelp: stripIndents`
				**Subcommand Usage**:
				\`status\` - return the goodbye feature configuration details.
				\`message <text to say send>\` - set the goodbye message. Use { guild } for guild name, and { user } to reference the user leaving.
				\`channel <#channelMention>\` - set the channel for the goodbye message to be displayed.
				\`on\` - enable the goodbye message feature.
				\`off\` - disable the goodbye message feature.
			`,
			permissionLevel: 6, // MANAGE_GUILD
			subcommands: true,
			usage: '<message|channel|on|off|status> (content:content)'
		});

		this.createCustomResolver('content', basicFeatureContent);
	}

	/**
	 * Change the message that is sent
	 *
	 * @param {KlasaMessage} msg
	 * @param {string} content
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof GoodbyeCommand
	 */
	public async message(msg: KlasaMessage, [content]: string): Promise<KlasaMessage | KlasaMessage[]> {
		const goodbyeEmbed = specialEmbed(msg, specialEmbedTypes.Goodbye);

		try {
			await msg.guild.settings.update(GuildSettings.Goodbye.Message, content);

			// Set up embed message
			goodbyeEmbed.setDescription(stripIndents`
						**Member:** ${msg.author.tag} (${msg.author.id})
						**Action:** Goodbye message set to:
						\`\`\`${content}\`\`\`
					`);
			goodbyeEmbed.setFooter('Use the `goodbye status` command to see the details of this feature');

			return this.sendSuccess(msg, goodbyeEmbed);
		} catch (err) {
			return this.catchError(msg, { subCommand: 'message', content }, err);
		}
	}

	/**
	 * Change the channel the goodbye message is sent to
	 *
	 * @param {KlasaMessage} msg
	 * @param {Channel} content
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof GoodbyeCommand
	 */
	public async channel(msg: KlasaMessage, [content]: string): Promise<KlasaMessage | KlasaMessage[]> {
		const goodbyeEmbed = specialEmbed(msg, specialEmbedTypes.Goodbye);
		const goodbyeChannel = msg.guild.settings.get(GuildSettings.Goodbye.Channel);
		const channelID = msg.guild.channels.get(resolveChannel(content)).id;

		if (goodbyeChannel && goodbyeChannel === channelID) {
			return msg.sendSimpleEmbed(`Goodbye channel already set to <#${channelID}>!`, 3000);
		}
		try {
			await msg.guild.settings.update(GuildSettings.Goodbye.Channel, channelID);

			// Set up embed message
			goodbyeEmbed.setDescription(stripIndents`
							**Member:** ${msg.author.tag} (${msg.author.id})
							**Action:** Goodbye Channel set to <#${channelID}>
						`);
			goodbyeEmbed.setFooter('Use the `goodbye status` command to see the details of this feature');

			return this.sendSuccess(msg, goodbyeEmbed);
		} catch (err) {
			return this.catchError(msg, { subCommand: 'channel', content }, err);
		}

	}

	/**
	 * Turn the feature on
	 *
	 * @param {KlasaMessage} msg
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof GoodbyeCommand
	 */
	public async on(msg: KlasaMessage): Promise<KlasaMessage | KlasaMessage[]> {
		const goodbyeEmbed = specialEmbed(msg, specialEmbedTypes.Goodbye);
		const goodbyeChannel = msg.guild.settings.get(GuildSettings.Goodbye.Channel);
		const goodbyeEnabled = msg.guild.settings.get(GuildSettings.Goodbye.Enabled);

		if (goodbyeChannel) {
			if (goodbyeEnabled) {
				return msg.sendSimpleEmbed('Goodbye message already enabled!', 3000);
			}
			try {
				await msg.guild.settings.update(GuildSettings.Goodbye.Enabled, true);

				// Set up embed message
				goodbyeEmbed.setDescription(stripIndents`
						**Member:** ${msg.author.tag} (${msg.author.id})
						**Action:** Goodbye messages set to: _Enabled_
					`);
				goodbyeEmbed.setFooter('Use the `goodbye status` command to see the details of this feature');

				return this.sendSuccess(msg, goodbyeEmbed);
			} catch (err) {
				return this.catchError(msg, { subCommand: 'on' }, err);
			}

		} else {
			return msg.sendSimpleError('Please set the channel for the goodbye message before enabling the feature. See `help goodbye` for info.', 3000);
		}
	}

	/**
	 * Turn the feature off
	 *
	 * @param {KlasaMessage} msg
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof GoodbyeCommand
	 */
	public async off(msg: KlasaMessage): Promise<KlasaMessage | KlasaMessage[]> {
		const goodbyeEmbed = specialEmbed(msg, specialEmbedTypes.Goodbye);
		const goodbyeEnabled = msg.guild.settings.get(GuildSettings.Goodbye.Enabled);

		if (goodbyeEnabled) {
			try {
				await msg.guild.settings.update(GuildSettings.Goodbye.Enabled, false);

				// Set up embed message
				goodbyeEmbed.setDescription(stripIndents`
					**Member:** ${msg.author.tag} (${msg.author.id})
					**Action:** Goodbye messages set to: _Disabled_
				`);
				goodbyeEmbed.setFooter('Use the `goodbye status` command to see the details of this feature');

				return this.sendSuccess(msg, goodbyeEmbed);
			} catch (err) {
				return this.catchError(msg, { subCommand: 'off' }, err);
			}
		} else {
			return msg.sendSimpleError('Goodbye message already disabled!', 3000);
		}
	}

	/**
	 * Return the status of the feature
	 *
	 * @param {KlasaMessage} msg
	 * @param {Channel | string } content
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof GoodbyeCommand
	 */
	public status(msg: KlasaMessage): Promise<KlasaMessage | KlasaMessage[]> {
		const goodbyeEmbed = specialEmbed(msg, specialEmbedTypes.Goodbye);
		const goodbyeChannel = msg.guild.settings.get(GuildSettings.Goodbye.Channel);
		const goodbyeMessage = msg.guild.settings.get(GuildSettings.Goodbye.Message);
		const goodbyeEnabled = msg.guild.settings.get(GuildSettings.Goodbye.Enabled);

		// Set up embed message
		goodbyeEmbed.setDescription(stripIndents`
			Goodbye feature: ${goodbyeEnabled ? '_Enabled_' : '_Disabled_'}
			Channel set to: <#${goodbyeChannel}>
			Message set to:
			\`\`\`${goodbyeMessage}\`\`\`
		`);

		// Send the success response
		return msg.sendEmbed(goodbyeEmbed);
	}

	/**
	 * Handle errors in the command's execution
	 *
	 * @param {KlasaMessage} msg
	 * @param {{ subCommand: string, content?: Channel | string }} args
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof GoodbyeCommand
	 */
	private catchError(msg: KlasaMessage, args: { subCommand: string; content?: Channel | string }, err: Error): Promise<KlasaMessage | KlasaMessage[]> {
		// Build warning message
		let goodbyeWarn = stripIndents`
			Error occurred in \`goodbye\` command!
			**Server:** ${msg.guild.name} (${msg.guild.id})
			**Author:** ${msg.author.tag} (${msg.author.id})
			**Time:** ${new Timestamp('MMMM D YYYY [at] HH:mm:ss [UTC]Z').display(msg.createdTimestamp)}
			**Input:** \`Goodbye ${args.subCommand.toLowerCase()}\`
		`;
		let goodbyeUserWarn = '';

		switch (args.subCommand.toLowerCase()) {
			case 'on': {
				goodbyeUserWarn = 'Enabling goodbye feature failed!';
				break;
			}
			case 'off': {
				goodbyeUserWarn = 'Disabling goodbye feature failed!';
				break;
			}
			case 'message': {
				goodbyeWarn += stripIndents`
					**Message:** ${args.content}`;
				goodbyeUserWarn = 'Failed saving new goodbye message!';
				break;
			}
			case 'channel': {
				goodbyeWarn += stripIndents`
					**Channel:** ${args.content}`;
				goodbyeUserWarn = 'Failed setting new goodbye channel!';
				break;
			}
		}
		goodbyeWarn += stripIndents`
			**Error Message:** ${err}`;

		// Emit warn event for debugging
		msg.client.emit('warn', goodbyeWarn);

		// Inform the user the command failed
		return msg.sendSimpleError(goodbyeUserWarn);
	}

	private async sendSuccess(msg: KlasaMessage, embed: MessageEmbed): Promise<KlasaMessage | KlasaMessage[]> {
		await modLogMessage(msg, embed);

		// Send the success response
		return msg.sendEmbed(embed);
	}

}
