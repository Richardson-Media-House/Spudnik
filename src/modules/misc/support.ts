import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { sendSimpleEmbeddedMessage } from '../../lib/helpers';

/**
 * Post a link to the Spudnik Command Discord Server.
 *
 * @export
 * @class SupportCommand
 * @extends {Command}
 */
export default class SupportCommand extends Command {
	/**
	 * Creates an instance of SupportCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof SupportCommand
	 */
	constructor(client: CommandoClient) {
		super(client, {
			description: 'Link to my support server!',
			group: 'misc',
			guildOnly: true,
			memberName: 'support',
			name: 'support',
			throttling: {
				duration: 3,
				usages: 2,
			},
		});
	}

	/**
	 * Run the "support" command.
	 *
	 * @param {CommandMessage} msg
	 * @returns {(Promise<Message | Message[]>)}
	 * @memberof SupportCommand
	 */
	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		return sendSimpleEmbeddedMessage(msg, 'https://spudnik.io/support');
	}
}
