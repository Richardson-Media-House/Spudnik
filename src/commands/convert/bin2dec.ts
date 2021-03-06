/**
 * Copyright (c) 2020 Spudnik Group
 */

import { Convert } from '@lib/helpers/convert';
import { Command, CommandStore, KlasaMessage } from 'klasa';

/**
 * Convert Binary to Decimal
 *
 * @export
 * @class Bin2DecCommand
 * @extends {Command}
 */
export default class Bin2DecCommand extends Command {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: 'Converts binary to decimal',
			usage: '<numberToConvert:regex/^[0-1]+$/>'
		});
	}

	/**
	 * Run the "bin2dec" command.
	 *
	 * @param {KlasaMessage} msg
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof Bin2DecCommand
	 */
	public run(msg: KlasaMessage, [numberToConvert]: [number]): Promise<KlasaMessage | KlasaMessage[]> {
		return msg.sendSimpleEmbedWithAuthor(`${numberToConvert} = ${Convert.bin2dec(numberToConvert.toString())}`, { name: 'Binary to Decimal Conversion:' });
	}

}
