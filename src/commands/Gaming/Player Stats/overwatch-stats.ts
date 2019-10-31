import { stripIndents } from 'common-tags';
import { MessageEmbed } from 'discord.js';
import { sendSimpleEmbeddedError } from '../../../lib/helpers';
import axios from 'axios';
import { Command, KlasaClient, CommandStore, KlasaMessage } from 'klasa';

/**
 * Returns Overwatch stats for a user on a specific platform and region.
 *
 * @export
 * @class OverwatchStatsCommand
 * @extends {Command}
 */
export default class OverwatchStatsCommand extends Command {
	/**
	 * Creates an instance of OverwatchStatsCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof OverwatchStatsCommand
	 */
	
	constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			description: 'Returns Overwatch stats for a user on a specific platform and region. ',
			extendedHelp: stripIndents`
				syntax: \`!overwatch-stats <platform: pc|xbl|psn> <battletag> <region: eu|us|kr|cn|global>\`
			`,
			name: 'overwatch-stats',
			usage: '<platform:string> <battletag:string> [region:string]'
		});
	}

	/**
	 * Run the "overwatch-stats" command.
	 *
	 * @param {KlasaMessage} msg
	 * @param {{ platform: string, battletag: string, region: string }} args
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof OverwatchStatsCommand
	 */
	public async run(msg: KlasaMessage, [platform, battletag, region = 'global']): Promise<KlasaMessage | KlasaMessage[]> {
		try {
			const { data: profile } = await axios.get(`https://overwatchy.com/profile/${platform}/${region}/${encodeURI(battletag)}`);
			if (profile.message) {
				return sendSimpleEmbeddedError(msg, profile.message, 3000);
			}

			const overwatchEmbed: MessageEmbed = new MessageEmbed({
				author: {
					icon_url: profile.competitive ? profile.competitive.rank_img : null,
					name: `${battletag.replace('-', '#')}'s Overwatch Stats`,
					url: `https://playoverwatch.com/career/${platform}/${encodeURI(battletag)}`
				},
				fields: [
					{
						inline: true,
						name: 'Level',
						value: `${profile.level}`
					},
					{
						inline: true,
						name: 'Rank',
						value: profile.competitive.rank ? `${profile.competitive.rank}` : 'N/A'
					},
					{
						inline: true,
						name: 'Competitive Playtime',
						value: profile.playtime.competitive || '0'
					},
					{
						inline: true,
						name: 'Competitive Win Rate',
						value: profile.games.competitive.win_rate ? `${profile.games.competitive.win_rate}%` : 'N/A'
					},
					{
						inline: true,
						name: 'Quickplay Playtime',
						value: profile.playtime.quickplay || '0'
					},
					{
						inline: true,
						name: 'Quickplay Games Won',
						value: profile.games.quickplay.won ? `${profile.games.quickplay.won}` : '0'
					}
				],
				thumbnail: {
					url: profile.portrait
				}
			});
			
			if (profile.endorsement) {
				overwatchEmbed.fields.push(
					{
						inline: true,
						name: 'Endorsement Level',
						value: profile.endorsement.level !== null ? `${profile.endorsement.level}` : 'N/A'
					},
					{
						inline: true,
						name: 'Sportsmanship',
						value: profile.endorsement.sportsmanship.rate !== null ? `${profile.endorsement.sportsmanship.rate}%` : 'N/A'
					},
					{
						inline: true,
						name: 'Shotcaller',
						value: profile.endorsement.shotcaller.rate !== null ? `${profile.endorsement.shotcaller.rate}%` : 'N/A'
					},
					{
						inline: true,
						name: 'Good Teammate',
						value: profile.endorsement.teammate.rate !== null ? `${profile.endorsement.teammate.rate}%` : 'N/A'
					}
				);
			}

			return msg.sendEmbed(overwatchEmbed);
		} catch (err) {
			msg.client.emit('warn', `Error in command gaming:overwatch-stats: ${err}`);

			return sendSimpleEmbeddedError(msg, 'There was an error with the request. Try again?', 3000);
		}
	}
}