import { sendSimpleEmbeddedMessage } from '../../lib/helpers';
import { Command, KlasaClient, CommandStore, KlasaMessage } from 'klasa';

/**
 * Generates a "Let Me Google That For You" link.
 *
 * @export
 * @class LmgtfyCommand
 * @extends {Command}
 */
export default class LmgtfyCommand extends Command {
	/**
	 * Creates an instance of LmgtfyCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof LmgtfyCommand
	 */
	constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			description: 'Returns a Let Me Google That For You link, so you can school a n00b.',
			extendedHelp: 'syntax: `!lmgtfy <query>`',
			name: 'lmgtfy',
			usage: '<query:string>'
		});
	}

	/**
	 * Run the "lmgtfy" command.
	 *
	 * @param {KlasaMessage} msg
	 * @param {{ query: string }} args
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof LmgtfyCommand
	 */
	public async run(msg: KlasaMessage, [query]): Promise<KlasaMessage | KlasaMessage[]> {
		return sendSimpleEmbeddedMessage(msg, `<http://lmgtfy.com/?q=${encodeURI(query)}>`);
	}
}
