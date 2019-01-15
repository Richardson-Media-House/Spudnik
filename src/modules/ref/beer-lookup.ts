import { stripIndents } from 'common-tags';
import { Message, MessageEmbed } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as rp from 'request-promise';
import { getEmbedColor } from '../../lib/custom-helpers';
import { sendSimpleEmbeddedError, startTyping, stopTyping, deleteCommandMessages } from '../../lib/helpers';

const breweryDbApiKey: string = process.env.spud_brewdbapi;

/**
 * Post information about an alcoholic brew.
 *
 * @export
 * @class BrewCommand
 * @extends {Command}
 */
export default class BrewCommand extends Command {
	/**
	 * Creates an instance of BrewCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof BrewCommand
	 */
	constructor(client: CommandoClient) {
		super(client, {
			args: [
				{
					key: 'query',
					prompt: 'What brew or brewery should I look up?\n',
					type: 'string'
				}
			],
			description: 'Returns information about a brewery or brew. Uses the BreweryDB API.',
			details: stripIndents`
				syntax: \`!brew <brew|brewery name>\`
			`,
			examples: [
				'!brew guinness blonde',
				'!brew death by coconut',
				'!brew Monday Night Brewing'
			],
			group: 'ref',
			guildOnly: true,
			memberName: 'brew',
			name: 'brew',
			throttling: {
				duration: 3,
				usages: 2
			}
		});
	}

	/**
	 * Run the "brew" command.
	 *
	 * @param {CommandMessage} msg
	 * @param {{ query: string }} args
	 * @returns {(Promise<Message | Message[]>)}
	 * @memberof BrewCommand
	 */
	public async run(msg: CommandMessage, args: { query: string }): Promise<Message | Message[]> {
		const brewEmbed: MessageEmbed = new MessageEmbed({
			author: {
				icon_url: 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/twitter/103/beer-mug_1f37a.png',
				name: 'BreweryDB',
				url: 'http://www.brewerydb.com/'
			},
			color: getEmbedColor(msg),
			description: '',
			footer: {
				icon_url: 'http://s3.amazonaws.com/brewerydb/Powered-By-BreweryDB.png',
				text: 'powered by BreweryDB'
			}
		});

		startTyping(msg);

		rp(`http://api.brewerydb.com/v2/search?q=${encodeURIComponent(args.query)}&key=${breweryDbApiKey}`)
			.then((content) => {
				const response = JSON.parse(content);
				if (response) {
					const result = response.data[0];
					if (result.description) {
						const fields: any = [];
						let thumbnail = '';
						if (result.labels) {
							thumbnail = result.labels.medium;
						}

						if (result.images) {
							thumbnail = result.images.squareMedium;
						}
						if (result.name) {
							brewEmbed.title = result.name;
						}
						if (result.style) {
							fields.push({
								name: `Style: ${result.style.name}`,
								value: result.style.description
							});
						}
						if (result.abv) {
							fields.push({
								inline: true,
								name: 'ABV (Alcohol By Volume)',
								value: `${result.abv}%`
							});
						}
						if (result.ibu) {
							fields.push({
								inline: true,
								name: 'IBU (International Bitterness Units)',
								value: `${result.ibu}/100`
							});
						}

						if (result.website) {
							fields.push({
								inline: true,
								name: 'Website',
								value: result.website
							});
						}

						if (result.established) {
							fields.push({
								inline: true,
								name: 'Year Established',
								value: result.established
							});
						}

						if (fields !== []) {
							brewEmbed.fields = fields;
						}
						if (thumbnail !== '') {
							brewEmbed.thumbnail = {
								url: thumbnail
							};
						}
						brewEmbed.setDescription(`\n${result.description}\n\n`);
					} else {
						brewEmbed.setDescription(`${response.data[0].name} is a good beer, but I don't have a good way to describe it.`);
					}
				} else {
					brewEmbed.setDescription("Damn, I've never heard of that. Where do I need to go to find it?");
				}
			})
			.catch((err: Error) => {
				msg.client.emit('warn', `Error in command ref:brew: ${err}`);
				stopTyping(msg);
				return sendSimpleEmbeddedError(msg, 'There was an error with the request. Try again?', 3000);
			});
		
			deleteCommandMessages(msg, this.client);
			stopTyping(msg);
	
			// Send the success response
			return msg.embed(brewEmbed);
	}
}
