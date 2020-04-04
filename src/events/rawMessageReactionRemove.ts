/**
 * Copyright (c) 2020 Spudnik Group
 */

import { Event, EventStore } from 'klasa';
import { TextChannel, Message, GuildChannel, Guild } from 'discord.js';
import { SpudConfig } from '@lib//config/spud-config';
import { GuildSettings } from '@lib/types/settings/GuildSettings';

export default class extends Event {

	public constructor(store: EventStore, file: string[], directory: string) {
		super(store, file, directory, { name: 'MESSAGE_REACTION_REMOVE', emitter: store.client.ws });
	}

	public async run(event) {
		if (!event.guild_id) return; // Ignore non-guild events

		const guild: Guild = await this.client.guilds.get(event.guild_id);
		const channel: GuildChannel = await guild.channels.get(event.channel_id);

		if (SpudConfig.botListGuilds.includes(guild.id)) return; // Guild is on Blacklist, ignore.
		if ((channel as TextChannel).nsfw) return; // Ignore NSFW channels
		if (!(channel as TextChannel).permissionsFor(this.client.user.id).has('READ_MESSAGE_HISTORY')) return; // Bot doesn't have the right permissions to retrieve the message

		const message: Message = await (channel as TextChannel).messages.fetch(event.message_id);
		const starboardEnabled: boolean = guild.settings.get(GuildSettings.Starboard.Enabled);

		if (message.author.id === event.user_id) return; // You can't star your own messages
		if (message.author.bot) return; // You can't star bot messages
		if (!starboardEnabled) return; // Ignore if starboard isn't set up

		const currentEmojiKey: any = (event.emoji.id) ? `${event.emoji.name}:${event.emoji.id}` : event.emoji.name;
		const starboardTrigger: string = guild.settings.get(GuildSettings.Starboard.Trigger);

		// Check for starboard reaction
		if (starboardTrigger === currentEmojiKey) {
			const starboardChannel = guild.settings.get(GuildSettings.Starboard.Channel);
			const starboard: GuildChannel = guild.channels.get(starboardChannel);

			if (!starboard || !starboardChannel) return; // Ignore if starboard isn't set up
			if (starboard === channel) return; // Can't star items in starboard channel
			if (!starboard.permissionsFor(this.client.user.id).has('SEND_MESSAGES')
				|| !starboard.permissionsFor(this.client.user.id).has('EMBED_LINKS')
				|| !starboard.permissionsFor(this.client.user.id).has('ATTACH_FILES')) {
				// Bot doesn't have the right permissions in the starboard channel
				// TODO: add a modlog error message here, this shouldn't silently fail
				return;
			}

			const starboardMessages = await (starboard as TextChannel).messages.fetch({ limit: 100 });
			// eslint-disable-next-line array-callback-return
			const existingStar = starboardMessages.find((m): boolean => {
				// Need this filter if there are non-starboard posts in the starboard channel.
				if (m.embeds.length > 0) {
					if (m.embeds[0].footer) {
						// Find the previously-starred message
						return m.embeds[0].footer.text.startsWith('⭐') && m.embeds[0].footer.text.endsWith(message.id);
					}
				}
			});
			// Check if message is in the starboard
			if (existingStar) {
				// And remove it
				await existingStar.delete();
			}
		}
	}

}