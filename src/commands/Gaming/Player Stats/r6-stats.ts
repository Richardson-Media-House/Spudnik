import { stripIndents } from 'common-tags';
import { MessageEmbed } from 'discord.js';
import { sendSimpleEmbeddedError, getEmbedColor } from '../../../lib/helpers';
import { Command, KlasaClient, CommandStore, KlasaMessage } from 'klasa';

const Scout = require('@scoutsdk/server-sdk');
const games = require('../../extras/scout-games');
const scoutID: string = process.env.spud_scoutid;
const scoutSecret: string = process.env.spud_scoutsecret;

/**
 * Returns Rainbow 6: Siege stats for a user on a specific platform.
 *
 * @export
 * @class R6StatsCommand
 * @extends {Command}
 */
export default class R6StatsCommand extends Command {
	/**
	 * Creates an instance of R6StatsCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof R6StatsCommand
	 */
	constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['r6', 'rainbow6-stats'],
			description: 'Returns Rainbow 6: Siege stats for a user on a specific platform. Uses the TrackerNetwork API.',
			extendedHelp: stripIndents`
				syntax: \`!r6-stats <platform> <username>\`
				
				Platform must be one of: pc, psn, xbl
			`,
			name: 'r6-stats',
			usage: '<platform:string> <username:string>'
		});
	}

	/**
	 * Run the "r6-stats" command.
	 *
	 * @param {KlasaMessage} msg
	 * @param {{ platform: string, username: string }} args
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof R6StatsCommand
	 */
	public async run(msg: KlasaMessage, [platform, username]): Promise<KlasaMessage | KlasaMessage[]> {
		const plat = platform === 'pc' ? 'uplay' : platform;
		const r6Embed: MessageEmbed = new MessageEmbed({
			author: {
				icon_url: 'https://i.imgur.com/BsQ6ebY.jpg',
				name: 'R6 Stats',
				url: 'https://scoutsdk.com/'
			},
			color: getEmbedColor(msg),
			description: '',
			footer: {
				text: 'powered by ScoutSDK'
			}
		});
		await Scout.configure({
			clientId: scoutID,
			clientSecret: scoutSecret,
			scope: 'public.read'
		});

		const search = await Scout.players.search(username, plat, null, games.r6siege.id, true, true);
		if (search.results.length) {
			const matches = search.results.filter((result: any) => result.player);
			if (matches.length) {
				// TODO: change this to allow selection of a result
				const firstMatch = matches.find((item: any) => item.player);
				const playerStats = await Scout.players.get(games.r6siege.id, firstMatch.player.playerId, '*');
				if (playerStats) {
					r6Embed.setDescription(stripIndents`
						**${firstMatch.persona.handle}**
	
						${playerStats.metadata[1].name}: ${playerStats.metadata[1].displayValue}
					`);
					playerStats.stats.forEach((statObj: any) => {
						if (!statObj.displayValue) return;
						r6Embed.addField(statObj.metadata.name, statObj.displayValue, true);
					});
	
					return msg.sendEmbed(r6Embed);
				} else {
					return sendSimpleEmbeddedError(msg, 'Couldn\'t retrieve stats for that person, check the spelling and try again.', 3000);
				}
			} else {
				return sendSimpleEmbeddedError(msg, 'Unable to find anyone with that player name, check the spelling and try again.', 3000);
			}
		} else {
			return sendSimpleEmbeddedError(msg, 'Unable to find anyone with that player name, check the spelling and try again.', 3000);
		}
	}
}