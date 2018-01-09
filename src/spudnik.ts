import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import * as Discord from 'discord.js';
import * as Mongoose from 'mongoose';

export class Spudnik {
	public Auth: any;
	public Config: any;
	public Permissions: any;
	public Discord: any;

	// Helpers
	require = (filePath: string) => {
		delete require.cache[path.join(path.dirname(require.main.filename), filePath)];
		return require(path.join(path.dirname(require.main.filename), filePath))(this);
	};
	getFileContents = (filePath: string) => {
		try {
			return fs.readFileSync(path.join(path.dirname(require.main.filename), filePath), 'utf-8');
		} catch (err) {
			console.log(chalk.red(err));
			return '';
		}
	};
	getFileArray = (srcPath: string) => {
		try {
			srcPath = path.join(path.dirname(require.main.filename), srcPath);
			return fs.readdirSync(srcPath).filter(file => fs.statSync(path.join(srcPath, file)).isFile());
		} catch (err) {
			console.log(chalk.red(err));
			return [];
		}
	};
	getJsonObject = (filePath: string) => {
		return JSON.parse(this.getFileContents(filePath));
	};
	resolveMention = (usertxt: string) => {
		let userid = usertxt;
		if (usertxt.startsWith('<@!')) {
			userid = usertxt.substr(3, usertxt.length - 4);
		} else if (usertxt.startsWith('<@')) {
			userid = usertxt.substr(2, usertxt.length - 3);
		}
		return userid;
	};

	// Functions
	launch = (auth: any, config: any) => {
		this.Auth = auth;
		this.Config = config;

		// Bot login
		this.Discord = new Discord.Client();
		if (this.Auth.bot_token) {
			console.log(chalk.magenta('Logging in to Discord...'));
			this.Discord.login(this.Auth.bot_token);
			require('./lib/on-event')(this);
		} else {
			console.log(chalk.red('ERROR: Spudnik must have a Discord bot token...'));
		}
	}
/*
	this.Permissions = require('./lib/permissions');

	// Set up database
	if (!this.Config.databases) {
		throw new Error('There is no database settings specified in the config file.');
	} else if (!this.Config.databases.mongodb) {
		throw new Error('There is no mongodb settings specified in the config file.');
	} else if (!this.Config.databases.mongodb.connection) {
		throw new Error('There is no mongodb connection specified in the config file.');
	}

	// Get the settings and build the connection.
	const settings = this.Config.databases.mongodb;

	// Connect to the database
	Mongoose.connect(`mongodb://${settings.connection}`, (settings.options || {}), error => {
		if (error) {
			throw error;
		}
		console.log(`Successfully connected to MongoDB at ${settings.connection}.`);
	});

	// Specify the databases value if Spudnik doesn't already have one.
	if (!this.Databases) {
		this.Databases = {};
	}

	// Set the connection.
	this.Databases.mongodb = Mongoose;

	const defaultDatabase = this.Config.databases.default;
	if (!defaultDatabase || defaultDatabase === 'mongodb') {
		// If the default database driver isn't specified or is mongodb,
		// set it as the current database
		this.Database = this.Databases.mongodb;
		console.log('Set current database driver to mongodb.');
	}

	// Load commands
	require('./lib/commands')(this);

	// Initialize AI
	if (this.Config.elizaEnabled && !this.Eliza) {
		const Eliza = require('./extras/eliza');
		this.Eliza = new Eliza();
		console.log('Eliza enabled.');
		this.Eliza.memSize = 500;
	}
*/
}