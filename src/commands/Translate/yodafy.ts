import { MessageEmbed } from 'discord.js';
import { sendSimpleEmbeddedError, getEmbedColor } from '../../lib/helpers';
import { Command, KlasaClient, CommandStore, KlasaMessage } from 'klasa';
import { stripIndents } from 'common-tags';

/**
 * Convert a statement to be structured as Yoda speaks.
 *
 * @export
 * @class YodafyCommand
 * @extends {Command}
 */
export default class YodafyCommand extends Command {
	/**
	 * Creates an instance of YodafyCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof YodafyCommand
	 */
	constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			description: 'Translates text to Yoda speak.',
			extendedHelp: stripIndents`
				syntax: \`!yodafy <text>\`
			`,
			name: 'yodafy',
			usage: '<query:...string>'
		});
	}

	/**
	 * Run the "yodafy" command.
	 *
	 * @param {KlasaMessage} msg
	 * @param {{ query: string }} args
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof YodafyCommand
	 */
	public async run(msg: KlasaMessage, [query]): Promise<KlasaMessage | KlasaMessage[]> {
		const yodaEmbed: MessageEmbed = new MessageEmbed({
			author: {
				iconURL: 'https://avatarfiles.alphacoders.com/112/112847.jpg',
				name: 'Yoda speak. Hmmmmmm.'
			},
			color: getEmbedColor(msg),
			footer: {
				text: 'powered by: yodaspeak.co.uk'
			}
		});

		return require('soap').createClient('http://www.yodaspeak.co.uk/webservice/yodatalk.php?wsdl', (err: Error, client: any) => {
			if (err) {
				msg.client.emit('warn', `Error in command translate:yodafy: ${err}`);

				return sendSimpleEmbeddedError(msg, 'Lost, I am. Not found, the web service is. Hrmm...', 3000);
			}

			client.yodaTalk({ inputText: query }, (err: Error, result: any) => {
				if (err) {
					msg.client.emit('warn', `Error in command translate:yodafy: ${err}`);

					return sendSimpleEmbeddedError(msg, 'Confused, I am. Disturbance in the force, there is. Hrmm...', 3000);
				}

				yodaEmbed.setDescription(`${result.return}\n`);
				// Send the success response
				return msg.sendEmbed(yodaEmbed);
			});
		});
	}
}