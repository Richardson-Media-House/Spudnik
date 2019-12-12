import { MessageEmbed } from 'discord.js';
import { stripIndents } from 'common-tags';
import { sendSimpleEmbeddedError, getEmbedColor } from '../../lib/helpers';
import { Command, KlasaClient, CommandStore, KlasaMessage } from 'klasa';

/**
 * Returns or sets the command prefix.
 *
 * @export
 * @class PrefixCommand
 * @extends {Command}
 */
export default class PrefixCommand extends Command {

	constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			description: 'Returns or sets the command prefix.',
			extendedHelp: stripIndents`
				If no prefix is provided, the current prefix will be shown.
				If the prefix is "default", the prefix will be reset to the bot's default prefix.
				If the prefix is "none", the prefix will be removed entirely, only allowing mentions to run commands.
			`,
			guarded: true,
			permissionLevel: 6, // MANAGE_GUILD
			name: 'prefix',
			usage: '[prefix:string]'
		});
	}

	/**
	 * Run the "Prefix" command.
	 *
	 * @param {KlasaMessage} msg
	 * @param {{ prefix: string }} args
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof PrefixCommand
	 */
	public async run(msg: KlasaMessage, [prefix]): Promise<KlasaMessage | KlasaMessage[]> {
		const prefixEmbed: MessageEmbed = new MessageEmbed({
			author: {
				iconURL: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/google/146/memo_1f4dd.png',
				name: 'Prefix'
			},
			color: getEmbedColor(msg),
			description: ''
		}).setTimestamp();

		// Just output the prefix
		if (!prefix) {
			const currentPrefix = msg.guild ? msg.guild.settings.get('prefix') : this.client.options.prefix;
			prefixEmbed.setDescription(stripIndents`
				${currentPrefix ? `The command prefix is \`\`${currentPrefix}\`\`.` : 'There is no command prefix.'}
				To run commands, use ${currentPrefix}\`commandName\`.
			`);

			return msg.sendEmbed(prefixEmbed);
		}

		// Check the user's permission before changing anything
		if (!msg.guild && this.client.owner !== msg.author) {
			return sendSimpleEmbeddedError(msg, 'Only the bot owner(s) may change the global command prefix.', 3000);
		}

		// Save the prefix
		const lowercase = prefix.toLowerCase();
		const newPrefix = lowercase === 'none' ? '' : prefix;
		let response;
		if (lowercase === 'default') {
			if (msg.guild) {
				msg.guild.settings.reset('prefix');
			} else {
				this.client.options.prefix = '!';
			}

			const current = this.client.options.prefix ? `\`\`${this.client.options.prefix}\`\`` : 'no prefix';

			response = `Reset the command prefix to the default (currently ${current}).`;
		} else {
			if (msg.guild) {
				msg.guild.settings.update('prefix', newPrefix, msg.guild);
			} else {
				this.client.options.prefix = newPrefix;
			}

			response = newPrefix ? `Set the command prefix to \`\`${prefix}\`\`.` : 'Removed the command prefix entirely.';
		}

		prefixEmbed.setDescription(stripIndents`
			${response} To run commands, use ${newPrefix}\`commandName\`.
		`);

		return msg.sendEmbed(prefixEmbed);
	}
}