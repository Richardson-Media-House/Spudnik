/**
 * Copyright (c) 2020 Spudnik Group
 */

import { CommandStore, KlasaMessage, Command } from 'klasa';
import { sendSimpleEmbeddedMessage } from '@lib/helpers';
import { Permissions } from 'discord.js';

/**
 * Returns options to donate to help support development and hosting of the bot.
 *
 * @export
 * @class DonateCommand
 * @extends {Command}
 */
export default class DonateCommand extends Command {

	constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: 'Returns options to donate to help support development and hosting of the bot.',
			guarded: true,
			name: 'donate',
			requiredPermissions: Permissions.FLAGS.EMBED_LINKS
		});
	}

	/**
	 * Run the "donate" command.
	 *
	 * @param {KlasaMessage} msg
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof DonateCommand
	 */
	public async run(msg: KlasaMessage): Promise<KlasaMessage | KlasaMessage[]> {
		return sendSimpleEmbeddedMessage(msg, "We'd love your help supporting the bot!\nYou can support us on [Patreon](https://www.patreon.com/spudnik)\n\nWe ❤️ You!");
	}

}
