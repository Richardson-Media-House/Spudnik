import { MessageEmbed } from 'discord.js';
import { stripIndents } from 'common-tags';
import { getEmbedColor, sendSimpleEmbeddedError } from '../../lib/helpers';
import { Command, KlasaClient, CommandStore, KlasaMessage } from 'klasa';

const steamGames = require('../../extras/steam-games');
const steamGameNames = Object.keys(steamGames).map(item => {
	return `* ${item}\n`
});

/**
 * Displays a link to launch a steam game.
 *
 * @export
 * @class GoCommand
 * @extends {Command}
 */
export default class GoCommand extends Command {
	/**
	 * Creates an instance of GoCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof GoCommand
	 */
	constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['play-game', 'lets-play', 'go-play'],
			description: 'Displays a link to launch a steam game.',
			extendedHelp: stripIndents`
				syntax: \`!go gameName\`

				Only a few games have been added at this time, submit a ticket on our GitHub to request specific ones.
			`,
			name: 'go',
			usage: '<game:string>'
		});
	}

	/**
	 * Run the "go" command.
	 *
	 * @param {KlasaMessage} msg
	 * @param {{ game: string, member: GuildMember }} args
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof GoCommand
	 */
	public async run(msg: KlasaMessage, [game]): Promise<KlasaMessage | KlasaMessage[]> {
		if (Object.keys(steamGames).indexOf(game.toUpperCase()) === -1) {
			return sendSimpleEmbeddedError(msg, `Sorry, only a few games are supported at this time: \n ${steamGameNames}`, 3000);
		}
		const gameID = steamGames[game.toUpperCase()];

		return msg.sendEmbed(new MessageEmbed()
			.setColor(getEmbedColor(msg))
			.setAuthor(`${msg.author.username}`, `${msg.author.displayAvatarURL()}`)
			.setThumbnail(`${msg.author.displayAvatarURL()}`)
			.setTitle('Let\'s Play!')
			.setDescription(`**Launch game:** steam://run/${gameID}`)
			.setImage(`http://cdn.edgecast.steamstatic.com/steam/apps/${gameID}/header.jpg`));
	}
}