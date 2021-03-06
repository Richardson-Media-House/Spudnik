/**
 * Copyright (c) 2020 Spudnik Group
 */

import { MessageEmbed } from 'discord.js';
import { Command, CommandStore, KlasaMessage } from 'klasa';
import { GuildSettings } from '@lib/types/settings/GuildSettings';
import { baseEmbed } from '@lib/helpers/embed-helpers';
import { IWarning } from '@lib/interfaces/warning';

/**
 * List warns for the guild.
 *
 * @export
 * @class ListWarnsCommand
 * @extends {Command}
 */
export default class ListWarnsCommand extends Command {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['list-warn', 'warn-list', 'warns', 'listwarns'],
			description: 'List warns for the guild.'
		});
	}

	/**
	 * Run the "list-warns" command.
	 *
	 * @param {KlasaMessage} msg
	 * @param {{ member: GuildMember, reason: string }} args
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof ListWarnsCommand
	 */
	public run(msg: KlasaMessage): Promise<KlasaMessage | KlasaMessage[]> {
		const warnEmbed: MessageEmbed = baseEmbed(msg)
			.setAuthor(
				'Warnings List',
				'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/google/146/warning-sign_26a0.png'
			)
			.setDescription('');
		const guildWarnings = msg.guild.settings.get(GuildSettings.Warnings);

		if (guildWarnings.length) {
			// Warnings present for current guild
			// Build embed
			guildWarnings.forEach((warning: IWarning) => {
				warnEmbed.description += `<@${warning.id}> (${warning.id}) - ${warning.points} Points\n`;
			});

			// Send the success response
			return msg.sendEmbed(warnEmbed);
		}
		// No warnings for current guild
		return msg.sendSimpleError('No warnings for current guild', 3000);

	}

}
