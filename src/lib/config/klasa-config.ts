/**
 * Copyright (c) 2020 Spudnik Group
 */

import { Client, KlasaClientOptions } from 'klasa';
import { SpudConfig } from './spud-config';
import { permissionLevels } from '@lib/schemas/permission-levels';

export const KlasaConfig: KlasaClientOptions = {
	/**
	 * General Options
	 */
	disabledEvents: [
		'GUILD_INTEGRATIONS_UPDATE',
		'GUILD_BAN_ADD',
		'GUILD_BAN_REMOVE',
		'GUILD_EMOJIS_UPDATE',
		'CHANNEL_PINS_UPDATE',
		'MESSAGE_DELETE',
		'MESSAGE_DELETE_BULK',
		'MESSAGE_REACTION_ADD',
		'MESSAGE_REACTION_REMOVE',
		'MESSAGE_REACTION_REMOVE_ALL',
		'PRESENCE_UPDATE',
		'VOICE_STATE_UPDATE',
		'TYPING_START',
		'VOICE_STATE_UPDATE',
		'VOICE_SERVER_UPDATE',
		'WEBHOOKS_UPDATE'
	],
	disabledCorePieces: [
		'commands',
		'providers'
	],
	owners: SpudConfig.owners,
	disableEveryone: false,
	language: 'en-US',
	prefix: '!',
	production: !!SpudConfig.debug,
	readyMessage: (client: Client) => `Successfully initialized. Ready to serve ${client.guilds.size} guild${client.guilds.size === 1 ? '' : 's'}.`,
	restTimeOffset: 500,

	/**
	 * Caching Options
	 */
	commandMessageLifetime: 1800,
	fetchAllMembers: false,
	messageCacheLifetime: 900,
	messageCacheMaxSize: 300,
	// The above 2 options are ignored while the interval is 0
	messageSweepInterval: 60,

	/**
	 * Command Handler Options
	 */
	commandEditing: true,
	commandLogging: true,
	typing: true,

	/**
	 * Database Options
	 */
	providers: {
		default: 'mongodb',
		mongodb: {
			db: SpudConfig.spudCoreDB,
			connectionString: SpudConfig.spudCoreDBConnection
		}
	},

	/**
	 * Custom Prompt Defaults
	 */
	customPromptDefaults: {
		limit: Infinity,
		quotedStringSupport: true,
		time: 30000
	},

	/**
	 * Klasa Piece Defaults
	 */
	pieceDefaults: {
		commands: {
			aliases: [],
			autoAliases: true,
			bucket: 2,
			cooldown: 3,
			deletable: true,
			description: '',
			enabled: true,
			guarded: false,
			nsfw: false,
			promptLimit: 0,
			promptTime: 30000,
			quotedStringSupport: true,
			runIn: ['text'],
			subcommands: false,
			usage: '',
			usageDelim: ' '
		},
		events: {
			enabled: true,
			once: false
		},
		extendables: {
			appliesTo: [],
			enabled: true
		},
		finalizers: { enabled: true },
		inhibitors: {
			enabled: true,
			spamProtection: false
		},
		languages: { enabled: true },
		monitors: {
			enabled: true,
			ignoreBots: true,
			ignoreEdits: true,
			ignoreSelf: true,
			ignoreWebhooks: true
		},
		providers: {
			enabled: true
		}
	},
	permissionLevels,

	/**
	 * Console Event Handlers (enabled/disabled)
	 */
	consoleEvents: {
		debug: SpudConfig.debug,
		error: true,
		log: true,
		verbose: SpudConfig.debug,
		warn: true,
		wtf: true
	},

	/**
	 * Console Options
	 */
	console: {
		colors: {
			debug: { time: { background: 'magenta' } },
			error: { time: { background: 'red' } },
			log: { time: { background: 'blue' } },
			verbose: { time: { text: 'gray' } },
			warn: { time: { background: 'lightyellow', text: 'black' } },
			wtf: { message: { text: 'red' }, time: { background: 'red' } }
		},
		timestamps: true,
		utc: false
	},

	/**
	 * Custom Setting Gateway Options
	 */
	// gateways: {
	// 	clientStorage: {},
	// 	guilds: {},
	// 	users: {}
	// },

	/**
	 * Klasa Schedule Options
	 */
	schedule: { interval: 60000 }
};
