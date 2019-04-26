import chalk from 'chalk';
import * as Discord from 'discord.js';
import { Spudnik } from './lib/spudnik';
const Config = {
	'bfdApiKey': process.env.spud_bfdapi ? process.env.spud_bfdapi : '',
	'bodApiKey': process.env.spud_bodapi ? process.env.spud_bodapi : '',
	'botListUpdateInterval': process.env.spud_botlist_update_interval ? +process.env.spud_botlist_update_interval : 600000,
	'botsggApiKey': process.env.spud_botsggapi ? process.env.spud_botsggapi : '',
	'dbApiKey': process.env.spud_dbapi ? process.env.spud_dbapi : '',
	'dblApiKey': process.env.spud_dblapi ? process.env.spud_dblapi : '',
	'debug': process.env.spud_debug ? !!process.env.spud_debug : false,
	'mongoDB': process.env.spud_mongo,
	'owner': process.env.spud_owner.split(','),
	'rollbarApiKey': process.env.spud_rollbarapi ? process.env.spud_rollbarapi : '',
	'statusUpdateInterval': process.env.spud_status_update_interval ? +process.env.spud_status_update_interval : 30000,
	'token': process.env.spud_token
}

console.log(chalk.blue('3...\n2...\n1...\nLAUNCH'));
console.log(chalk.blue('---Spudnik Stage 1 Engaged.---'));
console.log(chalk.green(`LD - Node version: ${process.version}`));
console.log(chalk.green(`LDA - Discord.js version: ${Discord.version}`));

process.chdir(__dirname);
// @ts-ignore
const bot: Spudnik = new Spudnik(Config);
