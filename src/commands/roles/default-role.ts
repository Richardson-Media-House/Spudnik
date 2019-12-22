import { stripIndents } from 'common-tags';
import { MessageEmbed, Role } from 'discord.js';
import { getEmbedColor, modLogMessage, sendSimpleEmbeddedError } from '../../lib/helpers';
import * as format from 'date-fns/format';
import { Command, KlasaClient, CommandStore, KlasaMessage } from 'klasa';

/**
 * Manage setting a default role.
 *
 * @export
 * @class DefaultRoleCommand
 * @extends {Command}
 */
export default class DefaultRoleCommand extends Command {
	/**
	 * Creates an instance of RoleCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof RoleCommand
	 */
	constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: [
				'dr'
			],
			requiredPermissions: ['MANAGE_ROLES'],
			description: 'Used to configure the default role for the `accept` command.',
			extendedHelp: stripIndents`
				\`(@roleMention)\` - sets the default role, or clears all if no role is provided.
			`,
			name: 'default-role',
			permissionLevel: 2,
			usage: '[role:Role]'
		});

		this.customizeResponse('role', 'Please supply a valid role to set as the default.');
	}

	/**
	 * Run the "role" command.
	 *
	 * @param {KlasaMessage} msg
	 * @param {{ subCommand: string, role: Role }} args
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof RoleManagementCommands
	 */
	public async run(msg: KlasaMessage, [role]): Promise<KlasaMessage | KlasaMessage[]> {
		const roleEmbed = new MessageEmbed({
			author: {
				icon_url: 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/google/110/lock_1f512.png',
				name: 'Role Manager'
			},
			color: getEmbedColor(msg),
			footer: {
				text: 'Use the `roles` command to list the current default & assignable roles'
			}
		}).setTimestamp();

		let guildDefaultRole: Role = await msg.guild.settings.get('roles.defaultRole');

		if (!role) {
			try {
				await msg.guild.settings.reset('roles.defaultRole');
				// Set up embed message
				roleEmbed.setDescription(stripIndents`
					**Member:** ${msg.author.tag} (${msg.author.id})
					**Action:** Removed default role(s).
				`);

				return this.sendSuccess(msg, roleEmbed);
			} catch (err) {
				this.catchError(msg, role, 'reset', err);
			}
		} else if (guildDefaultRole === role) {
			return sendSimpleEmbeddedError(msg, `Default role already set to <@${role.id}>`, 3000);
		} else {
			try {
				await msg.guild.settings.update('roles.defaultRole', role);

				// Set up embed message
				roleEmbed.setDescription(stripIndents`
					**Member:** ${msg.author.tag} (${msg.author.id})
					**Action:** Set '${role.name}' as the default role for the server.
				`);

				return this.sendSuccess(msg, roleEmbed);
			} catch (err) {
				this.catchError(msg, role, 'set', err);
			}
		}
	}

	private catchError(msg: KlasaMessage, role: Role, action: string, err: Error) {
		// Build warning message
		const roleWarn = stripIndents`
			Error occurred in \`role-management\` command!
			**Server:** ${msg.guild.name} (${msg.guild.id})
			**Author:** ${msg.author.tag} (${msg.author.id})
			**Time:** ${format(msg.createdTimestamp, 'MMMM Do YYYY [at] HH:mm:ss [UTC]Z')}
			${action === 'set' ? `**Input:** \`Role name: ${role}` : ''}
			**Error Message:** ${action === 'set' ? 'Setting' : 'Resetting'} default role failed!\n
			`;
		let roleUserWarn = `${action === 'set' ? 'Setting' : 'Resetting'} default role failed!`;

		// Emit warn event for debugging
		msg.client.emit('warn', roleWarn);

		// Inform the user the command failed
		return sendSimpleEmbeddedError(msg, roleUserWarn);
	}

	private sendSuccess(msg: KlasaMessage, embed: MessageEmbed): Promise<KlasaMessage | KlasaMessage[]> {
		modLogMessage(msg, embed);

		// Send the success response
		return msg.sendEmbed(embed);
	}
}
