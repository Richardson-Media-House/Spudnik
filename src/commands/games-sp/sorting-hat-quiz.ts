/**
 * Copyright (c) 2020 Spudnik Group
 */

import { stripIndents } from 'common-tags';
import { Command, CommandStore, KlasaMessage } from 'klasa';
import { questions, houses, descriptions } from '../../extras/sorting-hat-quiz';
import { shuffle } from '@lib/utils/util';

const choices = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

/**
 * Starts a game of Sorting Hats.
 *
 * @export
 * @class SortingHatQuizCommand
 * @extends {Command}
 */
export default class SortingHatQuizCommand extends Command {

	private playing: Set<string> = new Set();

	/**
	 * Creates an instance of SortingHatQuizCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof SortingHatQuizCommand
	 */
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['sorting-hat', 'pottermore', 'hogwarts', 'sorting-hat-quiz'],
			description: 'Take a quiz to determine your Hogwarts house.'
		});
	}

	/**
	 * Run the "SortingHatQuiz" command.
	 *
	 * @param {KlasaMessage} msg
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof SortingHatQuizCommand
	 */
	public async run(msg: KlasaMessage): Promise<KlasaMessage | KlasaMessage[]> {
		if (this.playing.has(msg.channel.id)) return msg.sendSimpleEmbedReply('Only one quiz may be occurring per channel.');
		this.playing.add(msg.channel.id);
		try {
			const points: any = {
				g: 0,
				h: 0,
				r: 0,
				s: 0
			};
			const blacklist: any[] = [];
			const questionNums = ['2', '3', '4', '5', '6', '7'];
			let turn = 1;

			while (turn < 9) {
				let question;

				if (turn === 1) {
					question = questions.first[Math.floor(Math.random() * questions.first.length)];
				} else if (turn === 8) {
					question = questions.last[Math.floor(Math.random() * questions.last.length)];
				} else {
					const possible = questionNums.filter((num: string) => !blacklist.includes(num));
					const value = possible[Math.floor(Math.random() * possible.length)];
					const group = questions[value];

					blacklist.push(value);

					question = group[Math.floor(Math.random() * group.length)];
				}

				const answers = shuffle(question.answers);

				await msg.sendMessage(stripIndents`
					**${turn}**. ${question.text}
					${answers.map((answer: any, i: number) => `- **${choices[i]}**. ${answer.text}`).join('\n')}
				`);

				const filter = (res: any): boolean => res.author.id === msg.author.id && choices.slice(0, answers.length).includes(res.content.toUpperCase());
				const choice: any = await msg.channel.awaitMessages(filter, {
					max: 1,
					time: 120000
				});

				if (!choice.size) return msg.sendMessage('Time\'s Up!');

				const answer = answers[choices.indexOf(choice.first().content.toUpperCase())];

				for (const [house, amount] of Object.entries(answer.points)) points[house] += amount;

				++turn;

				await choice.first().delete();
			}

			const house = Object.keys(points).sort((a: string, b: string) => points[b] - points[a])[0];

			this.playing.delete(msg.channel.id);

			return msg.sendSimpleEmbedReply(stripIndents`
				You are a member of... **${houses[house]}**!
				_${descriptions[house]}_
			`);
		} catch (err) {
			this.playing.delete(msg.channel.id);

			throw err;
		}
	}

}
