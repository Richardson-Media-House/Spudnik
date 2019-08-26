import { Command, KlasaClient, CommandStore, KlasaMessage, Stopwatch } from 'klasa';
import { join } from 'path';
import { pathExists } from 'fs-nextra';

/**
 * Loads a command.
 *
 * @export
 * @class LoadCommandCommand
 * @extends {Command}
 */
export default class extends Command {
	regExp = /\\\\?|\//g;

	/**
	 * Creates an instance of LoadCommandCommand.
	 *
	 * @param {CommandoClient} client
	 * @memberof LoadCommandCommand
	 */
	constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['l'],
			permissionLevel: 10,
			guarded: true,
			description: language => language.get('COMMAND_LOAD_DESCRIPTION'),
			usage: '[core] <Store:store> <path:...string>',
			usageDelim: ' '
		});
	}

	/**
	 * Run the "LoadCommand" command.
	 *
	 * @param {KlasaMessage} msg
	 * @param {{ command: Command }} args
	 * @returns {(Promise<KlasaMessage | KlasaMessage[]>)}
	 * @memberof LoadCommandCommand
	 */
	async run(message: KlasaMessage, [core, store, path]: any) {
		path = (path.endsWith('.js') ? path : `${path}.js`).split(this.regExp);
		const timer = new Stopwatch();
		const piece = await (core ? this.tryEach(store, path) : store.load(store.userDirectory, path));

		try {
			if (!piece) throw message.language.get('COMMAND_LOAD_FAIL');
			await piece.init();
			if (this.client.shard) {
				await this.client.shard.broadcastEval(`
					if (String(this.shard.id) !== '${this.client.shard.id}') {
						const piece = this.${piece.store}.load('${piece.directory}', ${JSON.stringify(path)});
						if (piece) piece.init();
					}
				`);
			}
			return message.sendLocale('COMMAND_LOAD', [timer.stop(), store.name, piece.name]);
		} catch (error) {
			timer.stop();
			throw message.language.get('COMMAND_LOAD_ERROR', store.name, piece ? piece.name : path.join('/'), error);
		}
	}

	async tryEach(store: any, path: string) {
		for (const dir of store.coreDirectories) if (await pathExists(join(dir, ...path))) return store.load(dir, path);
		return undefined;
	}
}
