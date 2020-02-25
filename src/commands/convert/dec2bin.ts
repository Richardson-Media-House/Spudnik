/**
 * Copyright (c) 2020 Spudnik Group
 */

import { sendSimpleEmbeddedMessageWithAuthor, Convert } from '@lib/helpers';
import { Command, CommandStore, KlasaMessage } from 'klasa';

/**
 * Converts Decimal to Binary
 *
 * @export
 * @class Dec2BinCommand
 * @extends {Command}
 */
export default class Dec2BinCommand extends Command {

	constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: 'Converts hexadecimal to decimal',
			name: 'dec2bin',
			usage: '<numberToConvert:int>'
		});
	}

	/**
	 * Run the "dec2bin" command.
	 *
	 * @param {KlasaMessage} msg
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof Dec2BinCommand
	 */
	public async run(msg: KlasaMessage, [numberToConvert]): Promise<KlasaMessage | KlasaMessage[]> {
		return sendSimpleEmbeddedMessageWithAuthor(msg, `${numberToConvert} = ${Convert.dec2bin(numberToConvert)}`, { name: 'Decimal to Binary Conversion:' });
	}

}
