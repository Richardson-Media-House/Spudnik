/**
 * Copyright (c) 2020 Spudnik Group
 */

import axios from 'axios';
import { Command, CommandStore, KlasaMessage } from 'klasa';
import { MessageEmbed } from 'discord.js';
import { sendSimpleEmbeddedError } from '@lib/helpers';
import { SpudConfig } from '@lib/config';

const { tmdbAPIkey } = SpudConfig;

export default class TVShowCommand extends Command {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['tvshows', 'tv', 'tvseries', 'tv-show'],
			description: 'Finds a TV show on TMDB.org',
			name: 'tvshow',
			usage: '<query:string> [page:number]'
		});

		this.customizeResponse('query', 'Please supply a query');
	}

	public async run(msg: KlasaMessage, [query, page = 1]): Promise<KlasaMessage | KlasaMessage[]> {
		if (!tmdbAPIkey) return sendSimpleEmbeddedError(msg, 'No API Key has been set up. This feature is unusable', 3000);

		try {
			const { data: body } = await axios.get('https://api.themoviedb.org/3/search/tv', {
				params: {
					api_key: tmdbAPIkey,
					query
				}
			});
			const show = body.results[page - 1];
			if (!show) sendSimpleEmbeddedError(msg, `I couldn't find a TV show with title **${query}** in page ${page}.`, 3000);

			const embed = new MessageEmbed()
				.setColor('RANDOM')
				.setImage(`https://image.tmdb.org/t/p/original${show.poster_path}`)
				.setTitle(`${show.name} (${page} out of ${body.results.length} results)`)
				.setDescription(show.overview)
				.setFooter('Spudnik uses the TMDb API but is not endorsed or certified by TMDb.',
					'https://www.themoviedb.org/assets/1/v4/logos/408x161-powered-by-rectangle-green-bb4301c10ddc749b4e79463811a68afebeae66ef43d17bcfd8ff0e60ded7ce99.png');
			if (show.title !== show.original_name) embed.addField('Original Title', show.original_name, true);
			embed
				.addField('Vote Count', show.vote_count, true)
				.addField('Vote Average', show.vote_average, true)
				.addField('Popularity', show.popularity, true)
				.addField('First Air Date', show.first_air_date);

			return msg.sendEmbed(embed);
		} catch (err) {
			msg.client.emit('warn', `Error in command reference:tvshow: ${err}`);

			return sendSimpleEmbeddedError(msg, 'There was an error with the request. Try again?', 3000);
		}
	}

}
