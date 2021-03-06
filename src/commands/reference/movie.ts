/**
 * Copyright (c) 2020 Spudnik Group
 */

import axios from 'axios';
import { Command, CommandStore, KlasaMessage, RichMenu, ReactionHandler } from 'klasa';
import { SpudConfig } from '@lib/config';
import { baseEmbed } from '@lib/helpers/embed-helpers';
import { MessageEmbed } from 'discord.js';

const { tmdbAPIkey } = SpudConfig;

export default class MovieCommand extends Command {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['movies', 'film', 'films'],
			description: 'Finds a movie on TMDB.org',
			usage: '<query:...string>'
		});

		this.customizeResponse('query', 'Please supply a Movie to look up.');
	}

	public async run(msg: KlasaMessage, [query]: [string, number]): Promise<KlasaMessage | KlasaMessage[]> {
		if (!tmdbAPIkey) return msg.sendSimpleError('No API Key has been set up. This feature is unusable', 3000);

		const movieEmbed: MessageEmbed = baseEmbed(msg)
			.setFooter('Spudnik uses the TMDb API but is not endorsed or certified by TMDb.',
				'https://www.themoviedb.org/assets/1/v4/logos/408x161-powered-by-rectangle-green-bb4301c10ddc749b4e79463811a68afebeae66ef43d17bcfd8ff0e60ded7ce99.png');

		try {
			const { data } = await axios.get('https://api.themoviedb.org/3/search/movie', {
				params: {
					api_key: tmdbAPIkey,
					query
				}
			});
			let result;

			if (!data.results.length) return msg.sendSimpleError(`I couldn't find a movie with title **${query}**.`, 3000);

			if (data.results.length > 1) {
				// build RichMenu
				const menu: RichMenu = new RichMenu(baseEmbed(msg)
					.setFooter('Spudnik uses the TMDb API but is not endorsed or certified by TMDb.',
						'https://www.themoviedb.org/assets/1/v4/logos/408x161-powered-by-rectangle-green-bb4301c10ddc749b4e79463811a68afebeae66ef43d17bcfd8ff0e60ded7ce99.png')
					.setDescription('Use the arrow reactions to scroll between pages.\nUse number reactions to select an option.'));

				data.results.forEach((item: any) => {
					menu.addOption(item.title, `Release Date: ${item.release_date}`);
				});

				const collector: ReactionHandler = await menu.run(await msg.send('Taking a look in the database...'));

				// wait for selection
				const choice: number = await collector.selection;
				if (choice === null || choice === undefined) {
					await collector.message.delete();
					return;
				}

				result = data.results[choice];
			} else {
				result = data.results.shift();
			}

			this.buildEmbed(movieEmbed, result);

			// Send the success response
			return msg.sendEmbed(movieEmbed);
		} catch (err) {
			msg.client.emit('warn', `Error in command reference:movie: ${err}`);

			return msg.sendSimpleError('There was an error with the request. Try again?', 3000);
		}
	}

	private buildEmbed(embed: MessageEmbed, result: any): void {
		embed
			.setImage(`https://image.tmdb.org/t/p/original${result.poster_path}`)
			.setTitle(result.title)
			.setDescription(result.overview);

		if (result.title !== result.original_title) embed.addField('Original Title', result.original_title, true);
		embed
			.addField('Vote Count', result.vote_count, true)
			.addField('Vote Average', result.vote_average, true)
			.addField('Popularity', result.popularity, true)
			.addField('Adult Content', result.adult ? 'Yes' : 'No', true)
			.addField('Release Date', result.release_date);
	}

}
