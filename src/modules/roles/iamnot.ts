import { Message, MessageEmbed, Role } from 'discord.js';
import { Command, CommandoMessage, CommandoClient } from 'discord.js-commando';
import { getEmbedColor } from '../../lib/custom-helpers';
import { sendSimpleEmbeddedError } from '../../lib/helpers';

/**
 * Allows a member to unassign a role from themselves.
 *
 * @export
 * @class IAmNotCommand
 * @extends {Command}
 */
export default class IAmNotCommand extends Command {
	/**
	 * Creates an instance of IAmNotCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof IAmNotCommand
	 */
	constructor(client: CommandoClient) {
		super(client, {
			args: [
				{
					key: 'query',
					prompt: 'What role do you want removed from yourself?\n',
					type: 'string'
				}
			],
			clientPermissions: ['MANAGE_ROLES'],
			description: 'Used to remove a self-assignable role from yourself.',
			details: 'syntax: `!iamnot <<role name>>`',
			examples: ['!iamnot PUBG'],
			group: 'roles',
			guildOnly: true,
			memberName: 'iamnot',
			name: 'iamnot'
		});
	}

	/**
	 * Run the "iamnot" command.
	 *
	 * @param {CommandoMessage} msg
	 * @param {{ query: string }} args
	 * @returns {(Promise<Message | Message[]>)}
	 * @memberof IAmNotCommand
	 */
	public async run(msg: CommandoMessage, args: { query: string }): Promise<Message | Message[]> {
		const roleEmbed = new MessageEmbed({
			author: {
				icon_url: 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/google/110/lock_1f512.png',
				name: 'Role Manager'
			},
			color: getEmbedColor(msg)
		});

		const role = msg.guild.roles.find((r: Role) => r.name.toLowerCase() === args.query.toLowerCase());
		const guildAssignableRoles: string[] = msg.client.provider.get(msg.guild.id, 'assignableRoles', []);

		if (role && guildAssignableRoles) {
			if (guildAssignableRoles.includes(role.id)) {
				msg.member.roles.remove(role.id);

				roleEmbed.description = `<@${msg.member.id}>, you no longer have the ${role.name} role.`;

				return msg.embed(roleEmbed);
			} else {
				return sendSimpleEmbeddedError(msg, `<@${msg.member.id}>, you do not have the role ${role.name}.`, 3000);
			}
		} else {
			return sendSimpleEmbeddedError(msg, `Cannot find ${args.query} in list of assignable roles.`, 3000);
		}
	}
}
