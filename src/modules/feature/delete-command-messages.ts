import { stripIndents } from 'common-tags';
import { Message, MessageEmbed } from 'discord.js';
import { Command, CommandoMessage, CommandoClient } from 'discord.js-commando';
import { sendSimpleEmbeddedError, sendSimpleEmbeddedMessage, startTyping, stopTyping, deleteCommandMessages } from '../../lib/helpers';
import { getEmbedColor, modLogMessage } from '../../lib/custom-helpers';
import * as format from 'date-fns/format';

/**
 * Enable or disable the DeleteCommandMessages feature.
 *
 * @export
 * @class DeleteCommandMessagesCommand
 * @extends {Command}
 */
export default class DeleteCommandMessagesCommand extends Command {
	/**
	 * Creates an instance of DeleteCommandMessagesCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof DeleteCommandMessagesCommand
	 */
	constructor(client: CommandoClient) {
		super(client, {
			aliases: [
				'deletecommandmessages'
			],
			args: [
				{
					key: 'subCommand',
					prompt: 'Would you like to enable or disable the feature?\n',
					type: 'string',
					validate: (subCommand: string) => {
						const allowedSubCommands = ['enable', 'disable'];
						
						if (allowedSubCommands.indexOf(subCommand) !== -1) return true;
						
						return 'You provided an invalid subcommand.';
					}
				}
			],
			clientPermissions: ['MANAGE_MESSAGES'],
			description: 'Enable or disable the Delete Command Messages feature.',
			details: stripIndents`
				syntax: \`!delete-command-messages <enable|disable>\`

				Supplying no subcommand returns an error.
				MANAGE_MESSAGES permission required.`,
			examples: [
				'!delete-command-messages enable',
				'!delete-command-messages disable'
			],
			group: 'feature',
			guildOnly: true,
			memberName: 'delete-command-messages',
			name: 'delete-command-messages',
			throttling: {
				duration: 3,
				usages: 2
			},
			userPermissions: ['MANAGE_MESSAGES']
		});
	}

	/**
	 * Run the "DeleteCommandMessages" command.
	 *
	 * @param {CommandMessage} msg
	 * @param {{ subCommand: string }} args
	 * @returns {(Promise<Message | Message[]>)}
	 * @memberof DeleteCommandMessagesCommand
	 */
	public async run(msg: CommandoMessage, args: { subCommand: string }): Promise<Message | Message[]> {
		const deleteCommandMessagesEnabled = msg.guild.settings.get('deleteCommandMessage', false);
		const deleteCommandMessagesEmbed: MessageEmbed = new MessageEmbed({
			author: {
				name: '🛑 DeleteCommandMessages'
			},
			color: getEmbedColor(msg),
			description: ''
		}).setTimestamp();

		startTyping(msg);

		if (args.subCommand.toLowerCase() === 'enable') {
			if (deleteCommandMessagesEnabled) {
				stopTyping(msg);

				return sendSimpleEmbeddedMessage(msg, 'DeleteCommandMessages feature already enabled!', 3000);
			} else {
				msg.guild.settings.set('deleteCommandMessage', true)
					.then(() => {
						// Set up embed message
						deleteCommandMessagesEmbed.setDescription(stripIndents`
							**Member:** ${msg.author.tag} (${msg.author.id})
							**Action:** DeleteCommandMessages ${args.subCommand.toLowerCase()}
						`);
						this.sendSuccess(msg, deleteCommandMessagesEmbed);
					})
					.catch((err: Error) => this.catchError(msg, args, err));
			}
		} else if (args.subCommand.toLowerCase() === 'disable') {
			if (!deleteCommandMessagesEnabled) {
				stopTyping(msg);

				return sendSimpleEmbeddedMessage(msg, 'DeleteCommandMessages feature already disabled!', 3000);
			} else {
				msg.guild.settings.set('deleteCommandMessage', false)
					.then(() => {
						// Set up embed message
						deleteCommandMessagesEmbed.setDescription(stripIndents`
							**Member:** ${msg.author.tag} (${msg.author.id})
							**Action:** DeleteCommandMessages ${args.subCommand.toLowerCase()}
						`);
						this.sendSuccess(msg, deleteCommandMessagesEmbed);
					})
					.catch((err: Error) => this.catchError(msg, args, err));
			}
		}
	}

	private catchError(msg: CommandoMessage, args: { subCommand: string }, err: Error) {
		// Emit warn event for debugging
		msg.client.emit('warn', stripIndents`
			Error occurred in \`delete-command-messages\` command!
			**Server:** ${msg.guild.name} (${msg.guild.id})
			**Author:** ${msg.author.tag} (${msg.author.id})
			**Time:** ${format(msg.createdTimestamp, 'MMMM Do YYYY [at] HH:mm:ss [UTC]Z')}
			**Input:** \`delete-command-messages ${args.subCommand.toLowerCase()}\`
			**Error Message:** ${err}
		`);

		// Inform the user the command failed
		stopTyping(msg);

		if (args.subCommand.toLowerCase() === 'enable') {
			return sendSimpleEmbeddedError(msg, 'Enabling DeleteCommandMessages feature failed!');
		} else {
			return sendSimpleEmbeddedError(msg, 'Disabling DeleteCommandMessages feature failed!');
		}
	}
	
	private sendSuccess(msg: CommandoMessage, embed: MessageEmbed): Promise<Message | Message[]> {
		// Log the event in the mod log
		if (msg.guild.settings.get('modlogEnabled', true)) {
			modLogMessage(msg, embed);
		}

		deleteCommandMessages(msg, this.client);
		stopTyping(msg);

		// Send the success response
		return msg.embed(embed);
	}
}