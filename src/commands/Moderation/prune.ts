import { stripIndents } from 'common-tags';
import { MessageEmbed } from 'discord.js';
import { sendSimpleEmbeddedError, sendSimpleEmbeddedMessage, getEmbedColor, modLogMessage } from '../../lib/helpers';
import * as format from 'date-fns/format';
import { Command, KlasaClient, CommandStore, KlasaMessage } from 'klasa';

/**
 * Deletes previous messages.
 *
 * @export
 * @class PruneCommand
 * @extends {Command}
 */
export default class PruneCommand extends Command {
	/**
	 * Creates an instance of PruneCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof PruneCommand
	 */
	constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: [
				'clean',
				'purge',
				'clear'
			],
			description: 'Deletes messages.',
			extendedHelp: stripIndents`
				syntax: \`!prune <number> (filter) (@userMention)\`

				List of filters:
				\`invites\`: Messages containing an invite
				\`@usermention\`: Messages sent by @user
				\`bots\`: Messages sent by bots
				\`uploads\`: Messages containing an attachment
				\`me\`: Messages sent by you
				\`links\`: Messages containing a link\n

				\`MANAGE_MESSAGES\` permission required.
			`,
			name: 'prune',
			permissionLevel: 1,
			usage: '[limit:integer] [links|invites|bots|me|uploads|user:user]',
			requiredPermissions: ['MANAGE_MESSAGES']
		});
	}

	/**
	 * Run the "prune" command.
	 *
	 * @param {KlasaMessage} msg
	 * @param {{ limit: number, filter: string, member: GuildMember }} args
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof PruneCommand
	 */
	public async run(msg: KlasaMessage, [limit, filter]): Promise<KlasaMessage | KlasaMessage[]> {
		await msg.delete();

		let messages = await msg.channel.messages.fetch({ limit: 100 });
		if (filter) {
			const user = typeof filter !== 'string' ? filter : null;
			const type = typeof filter === 'string' ? filter : 'user';
			messages = messages.filter(this.getFilter(msg, type, user));
		}
		const messagesToDelete = messages.array().slice(0, limit);
		try {
			await msg.channel.bulkDelete(messagesToDelete.reverse());
			// Log the event in the mod log
			const modlogEmbed: MessageEmbed = new MessageEmbed({
				author: {
					iconURL: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/google/146/black-scissors_2702.png',
					name: 'Prune'
				},
				color: getEmbedColor(msg),
				description: stripIndents`
					**Moderator:** ${msg.author.tag} (${msg.author.id})
					**Action:** Prune
					**Details:** Deleted ${limit} messages from <#${msg.channel.id}>
					${filter ? `**Filter:** ${filter}` : ''}
				`
			}).setTimestamp();
			modLogMessage(msg, modlogEmbed);

			return sendSimpleEmbeddedMessage(msg, `Pruned ${limit} messages`, 5000);
		} catch (err) {
			this.catchError(msg, { limit, filter }, err);
		}
		await msg.channel.bulkDelete(messagesToDelete);
		return msg.sendMessage(`Successfully deleted ${messagesToDelete.length} messages from ${limit}.`);
	}

	private getFilter(msg, filter, user) {
		switch (filter) {
			case 'links': return mes => /https?:\/\/[^ /.]+\.[^ /.]+/.test(mes.content);
			case 'invites': return mes => /(https?:\/\/)?(www\.)?(discord\.(gg|li|me|io)|discordapp\.com\/invite)\/.+/.test(mes.content);
			case 'bots': return mes => mes.author.bot;
			case 'me': return mes => mes.author.id === msg.author.id;
			case 'uploads': return mes => mes.attachments.size > 0;
			case 'user': return mes => mes.author.id === user.id;
			default: return () => true;
		}
	}

	private catchError(msg: KlasaMessage, args: { limit: number, filter: string }, err: Error) {
		// Emit warn event for debugging
		msg.client.emit('warn', stripIndents`
		Error occurred in \`prune\` command!
		**Server:** ${msg.guild.name} (${msg.guild.id})
		**Author:** ${msg.author.tag} (${msg.author.id})
		**Time:** ${format(msg.createdTimestamp, 'MMMM Do YYYY [at] HH:mm:ss [UTC]Z')}
		**Input:** \`limit: ${args.limit} | filter: ${args.filter}\`
		**Error Message:** ${err}`);

		// Inform the user the command failed
		return sendSimpleEmbeddedError(msg, `Pruning ${args.limit} messages failed!`, 3000);
	}
}