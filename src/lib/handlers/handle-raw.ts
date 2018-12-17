import { MessageReaction, Channel, GuildChannel, TextChannel, Message, MessageEmbed } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';

const starboardGuildBlacklist: string[] = process.env.STARBOARD_GUILD_BLACKLIST ? process.env.STARBOARD_GUILD_BLACKLIST.split(',') : [];

export async function handleRaw(event: any, client: CommandoClient) {
	if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(event.t)) { return; } //Ignore non-emoji related actions
	const { d: data } = event;
	const channel: Channel = await client.channels.get(data.channel_id);
	if (starboardGuildBlacklist.includes((channel as TextChannel).guild.id)) { return; } //Guild is on Blacklist, ignore.
	if ((channel as TextChannel).nsfw) { return; } //Ignore NSFW channels
	if (!(channel as TextChannel).permissionsFor(client.user.id).has('READ_MESSAGE_HISTORY')) { return; } //Bot doesn't have the right permissions to retrieve the message
	const message: Message = await (channel as TextChannel).messages.fetch(data.message_id);
	const starboardEnabled: boolean = await client.provider.get(message.guild.id, 'starboardEnabled', false);
	if (!starboardEnabled) { return; } //Ignore if starboard isn't set up
	const starboardChannel = await client.provider.get(message.guild.id, 'starboardChannel');
	const starboard: GuildChannel = await message.guild.channels.get(starboardChannel);
	if (starboard === undefined) { return; } //Ignore if starboard isn't set up
	if (starboard === channel) { return; } //Can't star items in starboard channel
	if (!starboard.permissionsFor(client.user.id).has('SEND_MESSAGES') ||
		!starboard.permissionsFor(client.user.id).has('EMBED_LINKS') ||
		!starboard.permissionsFor(client.user.id).has('ATTACH_FILES')) {
		//Bot doesn't have the right permissions in the starboard channel
		return;
	}
	const emojiKey: any = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
	const reaction: MessageReaction = message.reactions.get(emojiKey);
	const starboardMessages = await (starboard as TextChannel).messages.fetch({ limit: 100 });
	const starboardTrigger: string = await client.provider.get(message.guild.id, 'starboardTrigger', '⭐');
	const existingStar = starboardMessages.find(m => {
		// Need this filter if there are non-starboard posts in the starboard channel.
		if (m.embeds[0].footer) {
			return m.embeds[0].footer.text.startsWith('⭐') && m.embeds[0].footer.text.endsWith(message.id);
		}
	});

	// If all emojis were removed from this message, check if message is in the starboard
	if (!reaction) {
		if (existingStar) {
			// Remove from the starboard
			existingStar.delete()
			return;
		}
		return;
	}

	// Check for starboard reaction
	if (starboardTrigger === (reaction as MessageReaction).emoji.name) {
		const stars = await message.reactions.find((mReaction: MessageReaction) => mReaction.emoji.name === starboardTrigger).users.fetch();
		const starboardEmbed: MessageEmbed = new MessageEmbed()
			.setAuthor(message.guild.name, message.guild.iconURL())
			.setThumbnail(message.author.displayAvatarURL())
			.addField('Author', message.author.toString(), true)
			.addField('Channel', (channel as TextChannel).toString(), true)
			.setColor(await client.provider.get(message.guild.id, 'embedColor', 5592405))
			.setTimestamp()
			.setFooter(`⭐ ${stars.size} | ${message.id} `);

		// You can't star your own messages
		if (message.author.id === data.user_id && !client.owners.includes(data.user_id)) {
			return (channel as TextChannel)
				.send(`⚠ You cannot star your own messages, **<@${data.user_id}>**!`)
				.then((reply: Message | Message[]) => {
					if (reply instanceof Message) {
						if (reply.deletable) {
							reply.delete({ timeout: 3000 });
						}
					}
				});
		}
		// You can't star bot messages
		if (message.author.bot) {
			return (channel as TextChannel)
				.send(`⚠ You cannot star bot messages, **<@${data.user_id}>**!`)
				.then((reply: Message | Message[]) => {
					if (reply instanceof Message) {
						if (reply.deletable) {
							reply.delete({ timeout: 3000 });
						}
					}
				});
		}
		if (message.content.length > 1) { starboardEmbed.addField('Message', message.content); } // Add message
		if (message.attachments.size > 0) {
			starboardEmbed.setImage((message.attachments as any).first().attachment); // Add attachments
		}

		// Check for presence of post in starboard channel
		if (existingStar) {
			// Old star, update star count
			existingStar.edit({ embed: starboardEmbed })
				.catch((err) => {
					client.emit('warn', `Failed to edit starboard embed. Message ID: ${message.id}\nError: ${err}`);
					return;
				});
		} else {
			// Fresh star, add to starboard
			(starboard as TextChannel).send({ embed: starboardEmbed })
				.catch((err) => {
					client.emit('warn', `Failed to send new starboard embed. Message ID: ${message.id}\nError: ${err}`);
					return;
				});
		}
	}
}