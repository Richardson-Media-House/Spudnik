import { Message, MessageEmbed, MessageEmbedAuthor, MessageOptions, Permissions, TextChannel } from 'discord.js';
import { KlasaMessage, MessageAskOptions, Extendable, ExtendableStore } from 'klasa';
import { GuildSettings } from '@lib/types/settings/GuildSettings';

export default class extends Extendable {

	public constructor(store: ExtendableStore, file: string[], directory: string) {
		super(store, file, directory, { appliesTo: [KlasaMessage] });
	}

	public async ask(this: Message, options: MessageOptions, promptOptions?: MessageAskOptions): Promise<boolean>;
	public async ask(this: Message, content: string | MessageOptions | null, options?: MessageOptions | MessageAskOptions, promptOptions?: MessageAskOptions): Promise<boolean> {
		if (typeof content !== 'string') {
			options = content;
			content = null;
		}
		const message = await this.send(content, options as MessageOptions);

		return this.reactable
			? awaitReaction(this, message, promptOptions)
			: awaitMessage(this, promptOptions);
	}

	public async sendSimpleEmbed(this: KlasaMessage, description: string, timeout?: number | null): Promise<KlasaMessage | KlasaMessage[]> {
		return this.sendSimpleEmbedWithAuthorAndTitle(description, null, null, timeout);
	}

	public async sendSimpleEmbedWithAuthor(this: KlasaMessage, description: string, author: MessageEmbedAuthor, timeout?: number | null): Promise<KlasaMessage | KlasaMessage[]> {
		return this.sendSimpleEmbedWithAuthorAndTitle(description, author, null, timeout);
	}

	public async sendSimpleEmbedWithTitle(this: KlasaMessage, description: string, title: string, timeout?: number | null): Promise<KlasaMessage | KlasaMessage[]> {
		return this.sendSimpleEmbedWithAuthorAndTitle(description, null, title, timeout);
	}

	public async sendSimpleEmbedWithAuthorAndTitle(this: KlasaMessage, description: string, author: MessageEmbedAuthor | null, title: string | null, timeout?: number | null): Promise<KlasaMessage | KlasaMessage[]> {
		const color = await this.guild.settings.get(GuildSettings.EmbedColor);
		const promise: Promise<KlasaMessage | KlasaMessage[]> = this.sendEmbed(new MessageEmbed({
			author,
			color,
			description,
			title
		}));

		if (timeout) {
			promise.then((reply: Message | Message[]) => {
				if (reply instanceof Message) {
					reply.delete({ timeout }).catch(() => undefined);
				} else if (reply instanceof Array) {
					this.channel.bulkDelete(reply).catch(() => undefined);
				}
			}).catch((err: Error) => {
				this.client.emit('api', err);
			});
		}

		return promise;
	}

	public async sendSimpleError(this: KlasaMessage, description: string, timeout?: number | null): Promise<KlasaMessage | KlasaMessage[]> {
		const promise: Promise<KlasaMessage | KlasaMessage[]> = this.sendEmbed(new MessageEmbed({
			author: {
				iconURL: this.client.user.displayAvatarURL({ size: 128, format: 'png', dynamic: true }),
				name: `${this.client.user.username}`
			},
			color: 16711680,
			description
		}));

		if (timeout) {
			promise.then((reply: Message | Message[]) => {
				if (reply instanceof Message) {
					reply.delete({ timeout }).catch(() => undefined);
				} else if (reply instanceof Array) {
					this.channel.bulkDelete(reply).catch(() => undefined);
				}
			}).catch((err: Error) => {
				this.client.emit('api', err);
			});
		}

		return promise;
	}

	public async sendSimpleSuccess(this: KlasaMessage, description: string, timeout?: number | null): Promise<KlasaMessage | KlasaMessage[]> {
		const promise: Promise<KlasaMessage | KlasaMessage[]> = this.sendEmbed(new MessageEmbed({
			author: {
				iconURL: this.client.user.displayAvatarURL({ size: 128, format: 'png', dynamic: true }),
				name: `${this.client.user.username}`
			},
			color: 3447003,
			description
		}));

		if (timeout) {
			promise.then((reply: Message | Message[]) => {
				if (reply instanceof Message) {
					reply.delete({ timeout }).catch(() => undefined);
				} else if (reply instanceof Array) {
					this.channel.bulkDelete(reply).catch(() => undefined);
				}
			}).catch((err: Error) => {
				this.client.emit('api', err);
			});
		}

		return promise;
	}

	public async sendSimpleImage(this: KlasaMessage, description: string | null, url: string): Promise<KlasaMessage | KlasaMessage[]> {
		return this.sendEmbed(new MessageEmbed({
			author: {
				iconURL: this.client.user.displayAvatarURL({ size: 128, format: 'png', dynamic: true }),
				name: `${this.client.user.username}`
			},
			description,
			image: { url }
		}));
	}

}

const OPTIONS = { time: 1000 * 60 * 1, max: 1 };
const REACTIONS = { YES: '✅', NO: '❎' };
const REG_ACCEPT = /^y|yes?|yeah?$/i;

async function awaitReaction(message: Message, messageSent: Message, promptOptions: MessageAskOptions = OPTIONS): Promise<boolean> {
	await messageSent.react(REACTIONS.YES);
	await messageSent.react(REACTIONS.NO);

	// eslint-disable-next-line @typescript-eslint/typedef
	const reactions = await messageSent.awaitReactions((__, user) => user.id === message.author.id, promptOptions);

	// Remove all reactions if the user has permissions to do so
	if (message.guild && (message.channel as TextChannel).permissionsFor(message.guild.me!)!.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
		messageSent.reactions.removeAll().catch((err: any) => this.client.emit('warn', `There was an error trying to remove all reactions from a message; ${err}`));
	}

	return Boolean(reactions.size) && reactions.firstKey() === REACTIONS.YES;
}

async function awaitMessage(message: Message, promptOptions: MessageAskOptions = OPTIONS): Promise<boolean> {
	const messages = await message.channel.awaitMessages((mes: any) => mes.author === message.author, promptOptions);

	return Boolean(messages.size) && REG_ACCEPT.test(messages.first()!.content);
}