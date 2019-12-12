import { stripIndents } from 'common-tags';
import { Channel, MessageEmbed } from 'discord.js';
import { getEmbedColor, modLogMessage, sendSimpleEmbeddedError, sendSimpleEmbeddedMessage, resolveChannel } from '../../lib/helpers';
import * as format from 'date-fns/format';
import { Command, KlasaClient, CommandStore, KlasaMessage, Possible } from 'klasa';
import * as markdownescape from 'markdown-escape';
import { ITOSMessage } from '../../lib/interfaces';

/**
 * Sets/Shows the terms of service for a guild.
 *
 * @export
 * @class TermsOfServiceCommand
 * @extends {Command}
 */
export default class TermsOfServiceCommand extends Command {

	constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			description: 'Used to configure the Terms of Service for a guild.',
			extendedHelp: stripIndents`
				**Subcommand Usage**:
				\`channel <#channelMention>\` - set the channel to display the terms of service in.
				\`title <info block number> <text>\` - edit the title of a terms of service info block.
				\`body <info block number> <text>\` - edit the body of a terms of service info block.
				\`get <info block number> (raw:boolean)\` - returns the requested block number
				\`list\` - return all the terms of service embedded blocks.
				\`status\` - return the terms of service feature configuration details.
			`,
			name: 'tos',
			permissionLevel: 6, // MANAGE_GUILD
			subcommands: true,
			usage: '<channel|title|body|get|list|status> (item) (text)'
		});

		this
			.createCustomResolver('item', (arg: string, possible: Possible, message: KlasaMessage, [subCommand]) => {
				if (subCommand === 'channel' && (!arg || !message.guild.channels.get(resolveChannel(arg)))) throw 'Please provide a channel for the TOS message to be displayed in.';
				if (['title', 'body'].includes(subCommand) && !arg) throw 'Please include the index of the TOS message you would like to update.';
				if (subCommand === 'get' && !arg) throw 'Please include the index of the TOS message you would like to view.';

				return arg;
			})
			.createCustomResolver('text', (arg: string, possible: Possible, message: KlasaMessage, [subCommand]) => {
				if (['title', 'body'].includes(subCommand) && !arg) throw 'Please include the new text.';
				if (subCommand === 'get' && (['true', 'false', 't', 'f'].includes(arg))) throw 'Please supply a valid boolean option for `raw` option.';
			});
	}

	public async channel(msg: KlasaMessage, [item]): Promise<KlasaMessage | KlasaMessage[]> {
		const tosEmbed: MessageEmbed = new MessageEmbed({
			author: {
				icon_url: 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/google/119/ballot-box-with-check_2611.png',
				name: 'Terms of Service'
			},
			color: getEmbedColor(msg)
		});
		const tosChannel: string = await msg.guild.settings.get('tos.channel');
		const channelID = (item as Channel).id;
		if (tosChannel && tosChannel === channelID) {
			return sendSimpleEmbeddedMessage(msg, `Terms of Service channel already set to <#${channelID}>!`, 3000);
		} else {
			try {
				await msg.guild.settings.update('tos.channel', channelID, msg.guild);
				// Set up embed message
				tosEmbed
					.setDescription(stripIndents`
						**Member:** ${msg.author.tag} (${msg.author.id})
						**Action:** Terms of Service Channel set to <#${channelID}>
					`)
					.setFooter('Use the `tos status` command to see the details of this feature')
					.setTimestamp();

				return this.sendSuccess(msg, tosEmbed);
			} catch (err) {
				return this.catchError(msg, { subCommand: 'channel', item }, err);
			}
		}
	}

	public async title(msg: KlasaMessage, [item, text]): Promise<KlasaMessage | KlasaMessage[]> {
		const tosEmbed: MessageEmbed = new MessageEmbed({
			author: {
				icon_url: 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/google/119/ballot-box-with-check_2611.png',
				name: 'Terms of Service'
			},
			color: getEmbedColor(msg)
		});
		const tosMessageCount: number = await msg.guild.settings.get('tos.messageCount');
		const tosMessages: ITOSMessage[] = await msg.guild.settings.get('tos.messages');

		let message: ITOSMessage;
		let tosEmbedUpsertMessage = 'updated';
		item = Number(item);
		message = tosMessages[item - 1];
		if (Number.isInteger(item) && text.length) {
			if (item === tosMessageCount + 1) {
				tosEmbedUpsertMessage = 'added';
			} else if (item > tosMessageCount + 2) {
				return sendSimpleEmbeddedError(msg, 'You must supply either an already existing message number or one greater than the current count.', 3000);
			}

			if (!message) {
				message = {
					body: '',
					id: item - 1,
					title: ''
				}
				tosMessages.push(message);
			}
		}
		message.title = text;
		try {
			// TODO: don't know if this upsert shit works
			await msg.guild.settings.update(`tos.messages`, message, msg.guild);
			tosEmbed
				.setDescription(stripIndents`
					**Member:** ${msg.author.tag} (${msg.author.id})
					**Action:** Terms of Service message #${item} ${tosEmbedUpsertMessage}.
				`)
				.setFooter('Use the `tos status` command to see the details of this feature')
				.setTimestamp();

			await msg.guild.settings.update('tos.messageCount', tosMessages.length, msg.guild);

			return this.sendSuccess(msg, tosEmbed);
		} catch (err) {
			return this.catchError(msg, { subCommand: 'title', item, text }, err);
		}
	}

	public async body(msg: KlasaMessage, [item, text]): Promise<KlasaMessage | KlasaMessage[]> {
		const tosEmbed: MessageEmbed = new MessageEmbed({
			author: {
				icon_url: 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/google/119/ballot-box-with-check_2611.png',
				name: 'Terms of Service'
			},
			color: getEmbedColor(msg)
		});
		// TODO: disallow message bodies with more than the allowed characters for an embed
		const tosMessageCount: number = await msg.guild.settings.get('tos.messageCount');
		const tosMessages: ITOSMessage[] = [];
		for (let i = 1; i < tosMessageCount + 1; i++) {
			// TODO: fix this
			const tosMessage: ITOSMessage = await msg.guild.settings.get('tos.message')[`${i}`];
			if (tosMessage) {
				tosMessages.push(tosMessage);
			}
		}
		let message: ITOSMessage;
		let tosEmbedUpsertMessage = 'updated';
		item = Number(item);
		message = tosMessages[item - 1];
		if (Number.isInteger(item) && text.length) {
			if (item === tosMessageCount + 1) {
				tosEmbedUpsertMessage = 'added';
			} else if (item > tosMessageCount + 2) {
				return sendSimpleEmbeddedError(msg, 'You must supply either an already existing message number or one greater than the current count.', 3000);
			}
			if (!message) {
				message = {
					body: '',
					id: item - 1,
					title: ''
				}
				tosMessages.push(message);
			}
		}
		message.body = text;
		try {
			// TODO: don't know if this upsert shit works
			await msg.guild.settings.update(`tos.messages`, message, msg.guild);
			tosEmbed
				.setDescription(stripIndents`
					**Member:** ${msg.author.tag} (${msg.author.id})
					**Action:** Terms of Service message #${item} ${tosEmbedUpsertMessage}.
				`)
				.setFooter('Use the `tos status` command to see the details of this feature')
				.setTimestamp();

			await msg.guild.settings.update('tos.messageCount', tosMessages.length, msg.guild);

			return this.sendSuccess(msg, tosEmbed);
		} catch (err) {
			return this.catchError(msg, { subCommand: 'body', item, text }, err);
		}
	}

	public async get(msg: KlasaMessage, [item, raw]): Promise<KlasaMessage | KlasaMessage[]> {
		const tosEmbed: MessageEmbed = new MessageEmbed({
			author: {
				icon_url: 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/google/119/ballot-box-with-check_2611.png',
				name: 'Terms of Service'
			},
			color: getEmbedColor(msg)
		});

		const tosMessageCount: number = await msg.guild.settings.get('tos.messageCount');
		const tosMessages: ITOSMessage[] = [];
		for (let i = 1; i < tosMessageCount + 1; i++) {
			// TODO: fix this
			const tosMessage: ITOSMessage = await msg.guild.settings.get(`tos.messages`)[`${i}`];
			if (tosMessage) {
				tosMessages.push(tosMessage);
			}
		}
		let message: ITOSMessage;
		try {
			item = Number(item);
			message = tosMessages[item - 1];
			tosEmbed
				.setDescription(stripIndents`
					**ID:** ${message.id}
					**Title:** ${message.title}
					**Body:** ${raw.toLowerCase() === 'true' ? markdownescape(message.body) : message.body}
				`)
				.setFooter('Use the `tos status` command to see the details of this feature')
				.setTimestamp();

			return this.sendSuccess(msg, tosEmbed);
		} catch (err) {
			return this.catchError(msg, { subCommand: 'get', item, raw }, err);
		}
	}

	public async list(msg: KlasaMessage): Promise<KlasaMessage | KlasaMessage[]> {
		const tosEmbed: MessageEmbed = new MessageEmbed({
			author: {
				icon_url: 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/google/119/ballot-box-with-check_2611.png',
				name: 'Terms of Service'
			},
			color: getEmbedColor(msg)
		});
		const tosChannel: string = await msg.guild.settings.get('tos.channel');
		const tosMessageCount: number = await msg.guild.settings.get('tos.messageCount');
		const tosMessages: ITOSMessage[] = [];
		for (let i = 1; i < tosMessageCount + 1; i++) {
			// TODO: fix this
			const tosMessage: ITOSMessage = await msg.guild.settings.get('tos.messages')[`${i}`];
			if (tosMessage) {
				tosMessages.push(tosMessage);
			}
		}
		if (tosChannel && tosChannel === msg.channel.id) {
			if (tosMessages && tosMessages.length) {
				tosMessages.forEach((message) => {
					tosEmbed.author.name = message.title;
					tosEmbed.author.iconURL = undefined;
					tosEmbed.description = message.body;

					return msg.sendEmbed(tosEmbed);
				});
			} else {
				return sendSimpleEmbeddedError(msg, 'There are no terms of service messages set.', 3000);
			}
		}
	}

	/**
	 * Run the "tos" command.
	 *
	 * @param {KlasaMessage} msg
	 * @param {{ subCommand: string, item: Channel | number, text: string }} args
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof TermsOfServiceCommand
	 */
	public async status(msg: KlasaMessage): Promise<KlasaMessage | KlasaMessage[]> {
		const tosEmbed: MessageEmbed = new MessageEmbed({
			author: {
				icon_url: 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/google/119/ballot-box-with-check_2611.png',
				name: 'Terms of Service'
			},
			color: getEmbedColor(msg)
		});
		const tosChannel: string = await msg.guild.settings.get('tos.channel');
		const tosMessageCount: number = await msg.guild.settings.get('tos.messageCount');
		const tosMessages: ITOSMessage[] = [];
		for (let i = 1; i < tosMessageCount + 1; i++) {
			// TODO: fix this?
			const tosMessage: ITOSMessage = await msg.guild.settings.get('tos.messages')[`${i}`];
			if (tosMessage) {
				tosMessages.push(tosMessage);
			}
		}
		tosEmbed.description = `Channel: ${tosChannel ? `<#${tosChannel}>` : 'None set.'}\nMessage List:\n`;
		if (tosMessages.length) {
			let tosList = '';
			tosMessages.forEach((message, index) => {
				tosList += `${index + 1} - ${message.title}\n`;
			});
			// TODO: change this to better output messages, this could overload the embed character limit
			tosEmbed.description += `\`\`\`${tosList}\`\`\``;
		} else {
			tosEmbed.description += 'No Messages.';
		}

		// Send the success response
		return msg.sendEmbed(tosEmbed);
	}

	private catchError(msg: KlasaMessage, args: { subCommand: string, item: Channel | number, text?: string, raw?: string }, err: Error) {
		// Build warning message
		let tosWarn = stripIndents`
			Error occurred in \`tos\` command!
			**Server:** ${msg.guild.name} (${msg.guild.id})
			**Author:** ${msg.author.tag} (${msg.author.id})
			**Time:** ${format(msg.createdTimestamp, 'MMMM Do YYYY [at] HH:mm:ss [UTC]Z')}
			**Input:** \`TOS ${args.subCommand.toLowerCase()}\`
		`;
		let tosUserWarn = '';

		switch (args.subCommand.toLowerCase()) {
			case 'get': {
				tosUserWarn = `Failed getting tos message #${args.item}`
				break;
			}
			case 'channel': {
				tosUserWarn = `Failed setting new tos channel to <#${args.item}>!`;
				break;
			}
			case 'title': {
				tosUserWarn = `Failed setting tos message #${args.item}!`;
				break;
			}
			case 'body': {
				tosUserWarn = `Failed setting tos message #${args.item}!`;
				break;
			}
		}
		tosWarn += stripIndents`
			**Error Message:** ${err}`;

		// Emit warn event for debugging
		msg.client.emit('warn', tosWarn);

		// Inform the user the command failed
		return sendSimpleEmbeddedError(msg, tosUserWarn);
	}

	private sendSuccess(msg: KlasaMessage, embed: MessageEmbed): Promise<KlasaMessage | KlasaMessage[]> {
		modLogMessage(msg, embed);
		// Send the success response
		return msg.sendEmbed(embed);
	}
}