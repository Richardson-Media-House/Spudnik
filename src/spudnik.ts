import chalk from 'chalk';
import { Client as DiscordClient, Message, RichEmbed } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import * as fs from 'fs';
import * as Mongoose from 'mongoose';
import * as path from 'path';
import { Auth, Authorization } from './lib/auth';
import { Config, Configuration } from './lib/config';
import { MongoProvider } from './lib/providers/mongodb-provider';
import { SettingProviderConfig } from './lib/providers/setting-provider-config';

export class Spudnik {
	public Auth: Authorization;
	public Config: Configuration;
	public Database: Mongoose.Mongoose;
	public Discord: CommandoClient;

	private _uptime: number;

	constructor(auth: Authorization, config: Configuration) {
		this.Auth = auth;
		this.Config = config;
		this.Database = Mongoose;

		this.Discord = new CommandoClient({
			commandPrefix: '!',
			messageCacheLifetime: 30,
			messageSweepInterval: 60,
			owner: '',
		});

		this.setupDatabase();
		this.login();

		require('./lib/on-event')(this);
		console.log(chalk.blue('---Spudnik MECO---'));

		this.setupCommands();
	}

	public getFileContents = (filePath: string) => {
		try {
			return fs.readFileSync(filePath, 'utf-8');
		} catch (err) {
			console.log(chalk.red(err));
			return '';
		}
	}
	public getJsonObject = (filePath: string) => {
		return JSON.parse(this.getFileContents(filePath));
	}
	public getUptime = () => {
		const now = Date.now();
		let msec = now - this._uptime;
		console.log(`Uptime is ${msec} milliseconds`);
		const days = Math.floor(msec / 1000 / 60 / 60 / 24);
		msec -= days * 1000 * 60 * 60 * 24;
		const hours = Math.floor(msec / 1000 / 60 / 60);
		msec -= hours * 1000 * 60 * 60;
		const mins = Math.floor(msec / 1000 / 60);
		msec -= mins * 1000 * 60;
		const secs = Math.floor(msec / 1000);
		let timestr = '';
		if (days > 0) {
			timestr += `${days} days `;
		}
		if (hours > 0) {
			timestr += `${hours} hours `;
		}
		if (mins > 0) {
			timestr += `${mins} minutes `;
		}
		if (secs > 0) {
			timestr += `${secs} seconds `;
		}
		return timestr;
	}
	public resolveMention = (usertxt: string) => {
		let userid = usertxt;
		if (usertxt.startsWith('<@!')) {
			userid = usertxt.substr(3, usertxt.length - 4);
		} else if (usertxt.startsWith('<@')) {
			userid = usertxt.substr(2, usertxt.length - 3);
		}
		return userid;
	}
	public defaultEmbed = (message: string) => {
		return new RichEmbed({ color: this.Config.getDefaultEmbedColor(), description: message });
	}
	public processMessage = (output: any, msg: Message, expires: boolean, delCalling: boolean) => {
		return msg.channel.send(output).then((message) => {
			if (expires) {
				if (message instanceof Message) {
					message.delete(5000);
				}
			}
			if (delCalling) {
				msg.delete();
			}
		});
	}
	public setupCommands = () => {
		this.Discord.registry
			.registerGroups([
				['nsfw', 'Nsfw'],
				['util', 'Util'],
				['gifs', 'Gifs'],
				['levels', 'Levels'],
			])
			.registerDefaults()
			.registerCommandsIn(path.join(__dirname, 'modules'));
	}
	public setupDatabase = () => {
		const databaseConfig = this.Config.getDatabase();
		if (!databaseConfig) {
			throw new Error('There are not any database settings specified in the config file.');
		}

		this.Discord.setProvider(
			Mongoose.connect(databaseConfig.getConnection()).then(() => new MongoProvider(Mongoose.connection)),
		).catch((err: any) => {
			console.error('Failed to connect to database.');
			process.exit(-1);
		});
	}
	public login = () => {
		if (this.Auth.getToken()) {
			console.log(chalk.magenta('Logging in to Discord...'));

			this.Discord.login(this.Auth.getToken());

			this._uptime = new Date().getTime();
		} else {
			console.error('Spudnik must have a Discord bot token...');
			process.exit(-1);
		}
	}
}
