import { oneLine } from 'common-tags';
import { Message, MessageEmbed } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { getEmbedColor } from '../../lib/custom-helpers';
import { sendSimpleEmbeddedError } from '../../lib/helpers';

/**
 * Manage notifications when someone leaves the guild.
 *
 * @export
 * @class GoodbyeCommand
 * @extends {Command}
 */
export default class GoodbyeCommand extends Command {
	/**
	 * Creates an instance of GoodbyeCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof GoodbyeCommand
	 */
	constructor(client: CommandoClient) {
		super(client, {
			args: [
				{
					key: 'subCommand',
					prompt: 'What sub-command would you like to use?\nOptions are:\n* channel\n* message\n* enable\n* disable',
					type: 'string'
				},
				{
					default: '',
					key: 'content',
					prompt: 'channelMention or goodbye text\n',
					type: 'string'
				}
			],
			description: 'Used to configure the message to be sent when a user leaves your guild.',
			details: oneLine`
				syntax: \`!goodbye (message|channel|enable|disable) [text | #channelMention]\`\n
				\n
				\`message <text to say goodbye/heckle (leave blank to show current)>\` - Set/return the goodbye message. Use { guild } for guild name, and { user } to reference the user joining.\n
				\`channel (#channelMention)\` - Set the channel for the goodbye message to be displayed.\n
				\`enable\` - Enable the goodbye message feature.\n
				\`disable\` - Disable the goodbye message feature.\n
				\n
				Manage Guild permission required.
			`,
			group: 'util',
			guildOnly: true,
			memberName: 'goodbye',
			name: 'goodbye',
			throttling: {
				duration: 3,
				usages: 2
			}
		});
	}

	/**
	 * Determine if a member has permission to run the "goodbye" command.
	 *
	 * @param {CommandMessage} msg
	 * @returns {boolean}
	 * @memberof GoodbyeCommand
	 */
	public hasPermission(msg: CommandMessage): boolean {
		return this.client.isOwner(msg.author) || msg.member.hasPermission('MANAGE_GUILD');
	}

	/**
	 * Run the "goodbye" command.
	 *
	 * @param {CommandMessage} msg
	 * @param {{ subCommand: string, content: string }} args
	 * @returns {(Promise<Message | Message[]>)}
	 * @memberof GoodbyeCommand
	 */
	public async run(msg: CommandMessage, args: { subCommand: string, content: string }): Promise<Message | Message[]> {
		const goodbyeEmbed = new MessageEmbed({
			author: {
				icon_url: 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/google/119/waving-hand-sign_1f44b.png',
				name: 'Server Goodbye Message'
			},
			color: getEmbedColor(msg)
		});

		const goodbyeChannel = msg.client.provider.get(msg.guild, 'goodbyeChannel', msg.guild.systemChannelID);
		const goodbyeMessage = msg.client.provider.get(msg.guild, 'goodbyeMessage', '{user} has left the server.');
		const goodbyeEnabled = msg.client.provider.get(msg.guild, 'goodbyeEnabled', false);
		switch (args.subCommand.toLowerCase()) {
			case 'channel': {
				if (goodbyeChannel === msg.channel.id) {
					goodbyeEmbed.description = `Goodbye channel already set to <#${msg.channel.id}>!`;
					return msg.embed(goodbyeEmbed);
				} else {
					return msg.client.provider.set(msg.guild, 'goodbyeChannel', msg.channel.id)
						.then(() => {
							goodbyeEmbed.description = `Goodbye channel set to <#${msg.channel.id}>.`;
							return msg.embed(goodbyeEmbed);
						})
						.catch((err: Error) => {
							msg.client.emit('warn', `Error in command util:goodbye: ${err}`);
							return sendSimpleEmbeddedError(msg, 'There was an error processing the request.', 3000);
						});
				}
			}
			case 'message': {
				if (args.content === undefined || args.content === '') {
					goodbyeEmbed.description = 'You must include the new message along with the `message` command. See `help goodbye` for details.\nThe current goodbye message is set to: ```' + goodbyeMessage + '```';
					return msg.embed(goodbyeEmbed);
				} else {
					return msg.client.provider.set(msg.guild, 'goodbyeMessage', args.content)
						.then(() => {
							goodbyeEmbed.description = 'Goodbye message set to: ```' + args.content + '```' + '\nCurrently, Goodbye messages are set to: ' + goodbyeEnabled ? '_ON_' : '_OFF_' + '\nAnd, are displaying in this channel: <#' + goodbyeChannel + '>';
							return msg.embed(goodbyeEmbed);
						})
						.catch((err: Error) => {
							msg.client.emit('warn', `Error in command util:goodbye: ${err}`);
							return sendSimpleEmbeddedError(msg, 'There was an error processing the request.', 3000);
						});
				}
			}
			case 'enable': {
				if (goodbyeEnabled === false) {
					return msg.client.provider.set(msg.guild, 'goodbyeEnabled', true)
						.then(() => {
							goodbyeEmbed.description = `Goodbye message enabled.\nGoodbye channel set to: <#${goodbyeChannel}>\nGoodbye message set to: ${goodbyeMessage}`;
							return msg.embed(goodbyeEmbed);
						})
						.catch((err: Error) => {
							msg.client.emit('warn', `Error in command util:goodbye: ${err}`);
							return sendSimpleEmbeddedError(msg, 'There was an error processing the request.', 3000);
						});
				} else {
					goodbyeEmbed.description = 'Goodbye message is already enabled! Disable with `goodbye disable`';
					return msg.embed(goodbyeEmbed);
				}
			}
			case 'disable': {
				if (goodbyeEnabled === true) {
					return msg.client.provider.set(msg.guild, 'goodbyeEnabled', false)
						.then(() => {
							goodbyeEmbed.description = `Goodbye message disabled.\nGoodbye channel set to: <#${goodbyeChannel}>\nGoodbye message set to: ${goodbyeMessage}`;
							return msg.embed(goodbyeEmbed);
						})
						.catch((err: Error) => {
							msg.client.emit('warn', `Error in command util:goodbye: ${err}`);
							return sendSimpleEmbeddedError(msg, 'There was an error processing the request.', 3000);
						});
				} else {
					goodbyeEmbed.description = 'Goodbye message is already disabled! Enable with `goodbye enable`';
					return msg.embed(goodbyeEmbed);
				}
			}
			default: {
				return sendSimpleEmbeddedError(msg, 'Invalid subcommand. Please see `help goodbye`.', 3000);
			}
		}
	}
}
