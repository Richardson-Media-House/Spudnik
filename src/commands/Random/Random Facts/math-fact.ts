import { MessageEmbed } from 'discord.js';
import axios from 'axios';
import { getEmbedColor, sendSimpleEmbeddedError } from '../../../lib/helpers';
import { Command, KlasaClient, CommandStore, KlasaMessage } from 'klasa';

/**
 * Post a random math fact.
 *
 * @export
 * @class MathFactCommand
 * @extends {Command}
 */
export default class MathFactCommand extends Command {
	/**
	 * Creates an instance of MathFactCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof MathFactCommand
	 */
	constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			description: 'Returns a random math fact.',
			name: 'math-fact'
		});
	}

	/**
	 * Run the "math-fact" command.
	 *
	 * @param {KlasaMessage} msg
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof MathFactCommand
	 */
	public async run(msg: KlasaMessage): Promise<KlasaMessage | KlasaMessage[]> {
		const responseEmbed: MessageEmbed = new MessageEmbed({
			color: getEmbedColor(msg),
			description: '',
			title: 'Math Fact'
		});

		try {
			const { data } = await axios.get('http://numbersapi.com/random/math?json');
			responseEmbed.setDescription(data.text);

			// Send the success response
			return msg.sendEmbed(responseEmbed);
		} catch (err) {
			msg.client.emit('warn', `Error in command facts:math-fact: ${err}`);
			
			return sendSimpleEmbeddedError(msg, 'There was an error with the request. Try again?', 3000);
		}
	}
}
