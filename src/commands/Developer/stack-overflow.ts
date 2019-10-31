import { stripIndents } from 'common-tags';
import { MessageEmbed } from 'discord.js';
import { sendSimpleEmbeddedError, getEmbedColor } from '../../lib/helpers';
import axios from 'axios';
import * as format from 'date-fns/format';
import { Command, KlasaClient, CommandStore, KlasaMessage } from 'klasa';

const apikey = process.env.spud_stackoverflowapi;

/**
 * Returns Stack Overflow results for a query.
 *
 * @export
 * @class StackOverflowCommand
 * @extends {Command}
 */
export default class StackOverflowCommand extends Command {
	/**
	 * Creates an instance of StackOverflowCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof StackOverflowCommand
	 */
	constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			requiredPermissions: ['EMBED_LINKS'],
			description: 'Returns results for the supplied query from Stack Overflow.',
			extendedHelp: stripIndents`
				syntax: \`!stack-overflow <query>\`
			`,
			name: 'stack-overflow',
			usage: '<query:...string>'
		});
	}

	/**
	 * Run the "stack-overflow" command.
	 *
	 * @param {KlasaMessage} msg
	 * @param {{ query: string }} args
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof StackOverflowCommand
	 */
	public async run(msg: KlasaMessage, [query]): Promise<KlasaMessage | KlasaMessage[]> {
		const stackEmbed: MessageEmbed = new MessageEmbed({
			author: {
				icon_url: 'https://i.imgur.com/b4Hhl8y.png',
				name: 'Stack Overflow',
				url: 'https://stackoverflow.com'
			},
			color: getEmbedColor(msg),
			description: ''
		});
		const queryParams = `q=${encodeURIComponent(query)}&page=1&pagesize=1&order=asc&sort=relevance&answers=1&site=stackoverflow&key=${apikey}`;

		try {
			const { data } = await axios.get(`https://api.stackexchange.com/2.2/search/advanced?${queryParams}`);
			if (!data.items) {
				return sendSimpleEmbeddedError(msg, 'Your query did not return any results', 3000)
			}
			const firstRes = data.items[0];

			stackEmbed
				.setURL(firstRes.link)
				.setTitle(firstRes.title)
				.addField('❯ ID', firstRes.question_id, true)
				.addField('❯ Asker', `[${firstRes.owner.display_name}](${firstRes.owner.link})`, true)
				.addField('❯ Views', firstRes.view_count, true)
				.addField('❯ Score', firstRes.score, true)
				.addField('❯ Creation Date', format(firstRes.creation_date * 1000, 'MM/DD/YYYY h:mm A'), true)
				.addField('❯ Last Activity', format(firstRes.last_activity_date * 1000, 'MM/DD/YYYY h:mm A'), true);

			return msg.sendEmbed(stackEmbed)
		} catch (err) {
			msg.client.emit('warn', `Error in command dev:stack-overflow: ${err}`);

			return sendSimpleEmbeddedError(msg, 'There was an error with the request. Try again?', 3000);
		}
	}
}
