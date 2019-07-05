import { Message, MessageEmbed } from 'discord.js';
import { Command, CommandoMessage, CommandoClient } from 'discord.js-commando';
import { getEmbedColor, deleteCommandMessages } from '../../lib/custom-helpers';
import { startTyping, stopTyping } from '../../lib/helpers';
import { stripIndents } from 'common-tags';

/**
 * Simulate dice rolling.
 *
 * @export
 * @class RollCommand
 * @extends {Command}
 */
export default class RollCommand extends Command {
	/**
	 * Creates an instance of RollCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof RollCommand
	 */
	constructor(client: CommandoClient) {
		super(client, {
			args: [
				{
					default: '1d20',
					key: 'roll',
					prompt: 'What die combo would you like to roll?',
					type: 'string'
				},
				{
					default: '',
					key: 'reason',
					prompt: 'What are you rolling the dice for?',
					type: 'string'
				}
			],
			description: 'Roll one die with x sides + any modifiers, with an optional reason.',
			details: 'syntax: `!roll [# of sides | [# of dice]d[# of sides]+modifiers] [reason] >`',
			examples: [
				'!roll',
				'!roll 6',
				'!roll 2d20',
				'!roll 4d8+2',
				'!roll 2d8+2 to kick someone from the server'
			],
			group: 'random',
			guildOnly: true,
			memberName: 'roll',
			name: 'roll'
		});
	}

	/**
	 * Run the "roll" command.
	 *
	 * @param {CommandoMessage} msg
	 * @param {{ rolls: string[] }} args
	 * @returns {(Promise<Message | Message[]>)}
	 * @memberof RollCommand
	 */
	public async run(msg: CommandoMessage, args: { roll: string, reason: string }): Promise<Message | Message[]> {
		const result = require('d20').roll(args.roll);
		const diceEmbed: MessageEmbed = new MessageEmbed({
			color: getEmbedColor(msg),
			description: '',
			title: ':game_die: Dice Roller'
		});

		startTyping(msg);
		diceEmbed.description = stripIndents`
			Roll: ${args.roll}${args.reason ? `

			For: ${args.reason}` : ''}

			--
			Result: ${result}
		`;

		deleteCommandMessages(msg);
		stopTyping(msg);

		// Send the success response
		return msg.embed(diceEmbed);
	}
}
