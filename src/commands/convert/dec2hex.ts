/**
 * Copyright (c) 2020 Spudnik Group
 */

import { Convert } from '@lib/helpers/convert';
import { Command, CommandStore, KlasaMessage } from 'klasa';

/**
 * Converts Decimal to Hexadecimal
 *
 * @export
 * @class Dec2HexCommand
 * @extends {Command}
 */
export default class Dec2HexCommand extends Command {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: 'Converts decimal to hexadecimal',
			usage: '<numberToConvert:regex/^[0-9]+$/>'
		});
	}

	/**
	 * Run the "dec2hex" command.
	 *
	 * @param {KlasaMessage} msg
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof Dec2HexCommand
	 */
	public run(msg: KlasaMessage, [numberToConvert]: [number]): Promise<KlasaMessage | KlasaMessage[]> {
		return msg.sendSimpleEmbedWithAuthor(`${numberToConvert} = 0x${Convert.dec2hex(numberToConvert.toString()).toUpperCase()}`, { name: 'Decimal to Hexadecimal Conversion:' });
	}

}
