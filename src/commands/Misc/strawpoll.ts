import { stripIndents } from 'common-tags';
import axios from 'axios';
import { sendSimpleEmbeddedError, sendSimpleEmbeddedMessage } from '../../lib/helpers';
import { Command, KlasaClient, CommandStore, KlasaMessage } from 'klasa';

/**
 * Generates a Strawpoll with the provided options.
 *
 * @export
 * @class StrawpollCommand
 * @extends {Command}
 */
export default class StrawpollCommand extends Command {
	/**
	 * Creates an instance of StrawpollCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof StrawpollCommand
	 */
	constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['poll'],
			description: 'Generates a Strawpoll with the provided options.',
			name: 'strawpoll',
			usage: '<title:string> <options:string> [...]'
		});
	}

	/**
	 * Run the "strawpoll" command.
	 *
	 * @param {KlasaMessage} msg
	 * @param {{ title: string, options: string }} args
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof StrawpollCommand
	 */
	public async run(msg: KlasaMessage, [title, ...options]): Promise<KlasaMessage | KlasaMessage[]> {
		try {
			const { data: res } = await axios.post('https://www.strawpoll.me/api/v2/polls', {
				captcha: true,
				options: options.slice(0, 10),
				title: title
			});

			return sendSimpleEmbeddedMessage(msg, stripIndents`
				${res.title}
				http://www.strawpoll.me/${res.id}
			`);
		} catch (err) {
			msg.client.emit('warn', `Error in command misc:strawpoll: ${err}`);

			return sendSimpleEmbeddedError(msg, 'There was an error with the request. Try again?', 3000);
		}
	}
}
