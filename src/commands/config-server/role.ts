/**
 * Copyright (c) 2020 Spudnik Group
 */

import { stripIndents } from 'common-tags';
import { Collection, Message, MessageEmbed, Role, Permissions } from 'discord.js';
import { getEmbedColor, modLogMessage, sendSimpleEmbeddedError, isNormalInteger, hexColor } from '@lib/helpers';
import { Command, CommandStore, KlasaMessage, Timestamp } from 'klasa';

/**
 * Manage guild roles.
 *
 * @export
 * @class RoleCommand
 * @extends {Command}
 */
export default class RoleCommand extends Command {

	constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: 'Used to add or remove roles from your server.',
			extendedHelp: stripIndents`
				**Subcommand Usage**:
				\`add "role name" (hexcolor)\` - adds the role to your guild with the supplied color.
				\`remove "role name" ("reason")\` - removes the role from your guild.
			`,
			name: 'role',
			permissionLevel: 2, // MANAGE_ROLES
			requiredPermissions: Permissions.FLAGS.MANAGE_ROLES,
			subcommands: true,
			usage: '<add|remove> <name:Role|name:string> [color:color]'
		});

		this.createCustomResolver('color', hexColor);
	}

	/**
	 * Add a new role
	 *
	 * @param {KlasaMessage} msg
	 * @param {[ name: Role | string, color: string ]}
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof RoleManagementCommands
	 */
	public async add(msg: KlasaMessage, [name, color]): Promise<KlasaMessage | KlasaMessage[]> {
		const roleEmbed = new MessageEmbed({
			author: {
				icon_url: 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/google/110/lock_1f512.png',
				name: 'Role Manager'
			},
			color: getEmbedColor(msg),
			footer: {
				text: 'Use the `role` command to add/remove a role from your guild'
			}
		}).setTimestamp();

		try {
			let roleMetaData = {};

			if (color !== '') {
				roleMetaData = {
					data: {
						color,
						name
					}
				};
			} else {
				roleMetaData = {
					data: {
						name
					}
				};
			}

			// TODO: add a reason
			await msg.guild.roles.create(roleMetaData);
		} catch (err) {
			return this.catchError(msg, { subCommand: 'add', name, arg3: color }, err);
		}

		roleEmbed.setDescription(stripIndents`
					**Member:** ${msg.author.tag} (${msg.author.id})
					**Action:** Added role '${name}' to the guild.
				`);

		modLogMessage(msg, roleEmbed);

		return msg.sendEmbed(roleEmbed);
	}

	/**
	 * Remove a role
	 *
	 * @param {KlasaMessage} msg
	 * @param {[ name: Role | string, color: string ]}
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof RoleManagementCommands
	 */
	public async remove(msg: KlasaMessage, [name]): Promise<KlasaMessage | KlasaMessage[]> {
		const roleEmbed = new MessageEmbed({
			author: {
				icon_url: 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/google/110/lock_1f512.png',
				name: 'Role Manager'
			},
			color: getEmbedColor(msg),
			footer: {
				text: 'Use the `role` command to add/remove a role from your guild'
			}
		}).setTimestamp();
		const rolesFound: Collection<string, Role> = await msg.guild.roles.filter(role => role.name.toLocaleLowerCase() === name.toLocaleLowerCase());

		if (rolesFound.size > 1) {
			const rolesFoundArray = rolesFound.array();

			roleEmbed.setDescription(stripIndents`
						More than one role was found matching the provided name.
						Which role would you like to delete?\n
						${rolesFoundArray.map((role, i) => `**${i + 1}** - \`${role.id}\` - <@&${role.id}> - ${role.members.size} members`).join('\n')}`);

			await msg.sendEmbed(roleEmbed);

			const filter = (res: Message) => (res.author.id === msg.author.id);

			try {
				const responses = await msg.channel.awaitMessages(filter, { max: 1 });
				const response = responses.first();

				if (isNormalInteger(response.content) && ((Number(response.content) > -1) && (Number(response.content) < rolesFoundArray.length))) {
					try {
						await rolesFoundArray[Number(response.content) - 1].delete().then(deletedRole => {
							roleEmbed.setDescription(stripIndents`
											**Member:** ${msg.author.tag} (${msg.author.id})
											**Action:** Removed role \`${deletedRole.name}\` from the guild.
										`);

							modLogMessage(msg, roleEmbed);

							return msg.sendEmbed(roleEmbed);
						}).catch(err => this.catchError(msg, { subCommand: 'remove', name }, err));

					} catch (err) {
						return this.catchError(msg, { subCommand: 'remove', name }, err);
					}
				} else {
					return sendSimpleEmbeddedError(msg, 'Please supply a row number corresponding to the role you want to delete.');
				}
			} catch (err) {
				return this.catchError(msg, { subCommand: 'remove', name }, err);
			}
		} else if (rolesFound.size === 1) {
			const roleToDelete = rolesFound.first();

			try {
				await roleToDelete.delete().then(deletedRole => {
					roleEmbed.setDescription(stripIndents`
								**Member:** ${msg.author.tag} (${msg.author.id})
								**Action:** Removed role \`${deletedRole.name}\` from the guild.
							`);

					modLogMessage(msg, roleEmbed);

					return msg.sendEmbed(roleEmbed);
				}).catch(err => this.catchError(msg, { subCommand: 'remove', name }, err));
			} catch (err) {
				return this.catchError(msg, { subCommand: 'remove', name }, err);
			}
		} else {
			return sendSimpleEmbeddedError(msg, `A role with the supplied name \`${name}\` was not found on this guild.`);
		}
	}

	private catchError(msg: KlasaMessage, args: { subCommand: string; name: string; arg3?: string }, err: Error): Promise<KlasaMessage | KlasaMessage[]> {
		// Build warning message
		let roleWarn = stripIndents`
			Error occurred in \`role\` command!
			**Server:** ${msg.guild.name} (${msg.guild.id})
			**Author:** ${msg.author.tag} (${msg.author.id})
			**Time:** ${new Timestamp('MMMM D YYYY [at] HH:mm:ss [UTC]Z').display(msg.createdTimestamp)}
			**Input:** \`Role ${args.subCommand.toLowerCase()}\` | role name: ${args.name} | color/reason: ${args.arg3}`;
		let roleUserWarn = '';

		switch (args.subCommand.toLowerCase()) {
			case 'add': {
				roleUserWarn = 'Adding new role failed!\n';
				break;
			}
			case 'remove': {
				roleUserWarn = 'Removing role failed!\n';
				break;
			}
		}

		roleWarn += `**Error Message:** ${err}`;

		// Emit warn event for debugging
		msg.client.emit('warn', roleWarn);

		// Inform the user the command failed
		return sendSimpleEmbeddedError(msg, roleUserWarn);
	}

}
