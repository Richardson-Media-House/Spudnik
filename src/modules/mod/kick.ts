import { stripIndents } from 'common-tags';
import { GuildMember, Message, MessageEmbed } from 'discord.js';
import { Command, CommandoMessage, CommandoClient } from 'discord.js-commando';
import { getEmbedColor, modLogMessage, deleteCommandMessages } from '../../lib/custom-helpers';
import { sendSimpleEmbeddedError, startTyping, stopTyping } from '../../lib/helpers';
import * as format from 'date-fns/format';

/**
 * Kick a member from the guild.
 *
 * @export
 * @class KickCommand
 * @extends {Command}
 */
export default class KickCommand extends Command {
	/**
	 * Creates an instance of KickCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof KickCommand
	 */
	constructor(client: CommandoClient) {
		super(client, {
			args: [
				{
					key: 'member',
					prompt: 'Who needs the boot?\n',
					type: 'member'
				},
				{
					key: 'reason',
					prompt: 'Why do you want to kick this noob?\n',
					type: 'string'
				}
			],
			clientPermissions: ['KICK_MEMBERS'],
			description: 'Kicks a user.',
			details: stripIndents`
				syntax: \`!kick <@userMention> <reason>\`

				KICK_MEMBERS permission required.
			`,
			examples: [
				'!kick @user being a pleb'
			],
			group: 'mod',
			guildOnly: true,
			memberName: 'kick',
			name: 'kick',
			throttling: {
				duration: 3,
				usages: 2
			},
			userPermissions: ['KICK_MEMBERS']
		});
	}

	/**
	 * Run the "kick" command.
	 *
	 * @param {CommandoMessage} msg
	 * @param {{ member: GuildMember, reason: string }} args
	 * @returns {(Promise<Message | Message[] | any>)}
	 * @memberof KickCommand
	 */
	public async run (msg: CommandoMessage, args: { member: GuildMember, reason: string }): Promise<Message | Message[] | any> {
		const memberToKick: GuildMember = args.member;
		const kickEmbed: MessageEmbed = new MessageEmbed({
			author: {
				icon_url: 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/google/119/eject-symbol_23cf.png',
				name: 'Get Out! - уходить!!'
			},
			color: getEmbedColor(msg),
			description: ''
		}).setTimestamp();

		startTyping(msg);
		
		// Check if user is able to kick the mentioned user
		if (!memberToKick.kickable || !(msg.member.roles.highest.comparePositionTo(memberToKick.roles.highest) > 0)) {
			stopTyping(msg);
			
			return sendSimpleEmbeddedError(msg, `I can't kick ${memberToKick}. Do they have the same or a higher role than me or you?`, 3000);
		}

		try {
			await memberToKick.kick(`Kicked by: ${msg.author} for: ${args.reason}`);
			// Set up embed message
			kickEmbed.setDescription(stripIndents`
				**Moderator:** ${msg.author.tag} (${msg.author.id})
				**Member:** ${memberToKick.user.tag} (${memberToKick.id})
				**Action:** Kick
				**Reason:** ${args.reason}
			`);

			modLogMessage(msg, kickEmbed);
			deleteCommandMessages(msg);
			stopTyping(msg);

			// Send the success response
			return msg.embed(kickEmbed);
		} catch (err) {
			// Emit warn event for debugging
			msg.client.emit('warn', stripIndents`
			Error occurred in \`kick\` command!
			**Server:** ${msg.guild.name} (${msg.guild.id})
			**Author:** ${msg.author.tag} (${msg.author.id})
			**Time:** ${format(msg.createdTimestamp, 'MMMM Do YYYY [at] HH:mm:ss [UTC]Z')}
			**Input:** \`${args.member.user.tag} (${args.member.id})\` || \`${args.reason}\`
			**Error Message:** ${err}`);

			// Inform the user the command failed
			stopTyping(msg);

			return sendSimpleEmbeddedError(msg, `Kicking ${args.member} for ${args.reason} failed!`, 3000);
		}
	}
}
