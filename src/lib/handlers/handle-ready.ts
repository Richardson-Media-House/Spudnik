import chalk from 'chalk';
import { Guild, PresenceData } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import { Configuration } from 'src/lib/spudnik';
import * as rp from 'request-promise';

export async function handleReady(version: string, client: CommandoClient, config: Configuration) {
	const statuses: PresenceData[] = [
		{
			activity: {
				name: `${client.commandPrefix}help | ${client.guilds.array().length} Servers`,
				type: 'PLAYING'
			}
		},
		{
			activity: {
				name: 'spudnik.io',
				type: 'PLAYING'
			}
		},
		{
			activity: {
				name: `${client.commandPrefix}donate 💕`,
				type: 'PLAYING'
			}
		},
		{
			activity: {
				name: `Version: v${version} | ${client.commandPrefix}help`,
				type: 'PLAYING'
			}
		},
		{
			activity: {
				name: `spudnik.io/support | ${client.commandPrefix}support`,
				type: 'PLAYING'
			}
		},
		{
			activity: {
				name: 'docs.spudnik.io',
				type: 'PLAYING'
			}
		},
		{
			activity: {
				name: `and Assisting ${client.guilds.map((guild: Guild) => guild.memberCount).reduce((a: number, b: number): number => a + b)} users.`,
				type: 'WATCHING'
			}
		},
		{
			activity: {
				name: `and Assisting ${client.guilds.array().length} servers.`,
				type: 'WATCHING'
			}
		},
		{
			activity: {
				name: 'For the Motherland!',
				type: 'PLAYING'
			}
		}
	];

	console.log(chalk.magenta(`Logged into Discord! Serving in ${client.guilds.array().length} Discord servers`));
	console.log(chalk.blue('---Spudnik Launch Success---'));

	// Update bot status, using array of possible statuses
	let statusIndex: number = -1;
	statusIndex = updateStatus(client, statuses, statusIndex);
	setInterval(() => { statusIndex = updateStatus(client, statuses, statusIndex) }, config.statusUpdateInterval, true);
	setInterval(() => updateBotListStats(config, client), config.botListUpdateInterval, true);
}

/**
 * Updates bot status on interval
 */
const updateStatus = (client: CommandoClient, statuses: PresenceData[], statusIndex: number): number => {
	++statusIndex;

	if (statusIndex >= statuses.length) {
		statusIndex = 0;
	}

	client.user.setPresence(statuses[statusIndex]);

	return statusIndex;
}

/**
 * Update bot list stats on interval
 */
const updateBotListStats = (config: Configuration, client: CommandoClient): void => {
	// discord.bots.gg

	// bots.ondiscord.xyz

	// discordbots.org
	if (process.env.DB_TOKEN) {
		rp({
			uri: `https://discordbots.org/api/bots/${client.user.id}/stats`,
			method: 'POST',
			headers: { Authorization: process.env.DB_TOKEN },
			body: { server_count: client.guilds.size }
		})
		.then(() => client.log('- Posted statistics successfully', 'discordbots.org'))
		.catch(() => client.log('Failed to post statistics', 'discordbots.org'))
	}

	// botsfordiscord.com
	if (process.env.BOTSFORDISCORD_TOKEN) {
		rp({
			uri: `https://botsfordiscord.com/api/bots/${client.user.id}/stats`,
			method: 'POST',
			headers: { Authorization: process.env.BOTSFORDISCORD_TOKEN },
			body: { server_count: client.guilds.size }
		})
		.then(() => client.log('- Posted statistics successfully', 'botsfordiscord.com'))
		.catch(() => client.log('Failed to post statistics', 'botsfordiscord.com'))
	}

	if (process.env.DBL_TOKEN) {
		rp({
			uri: `https://discordbotlist.com/api/bots/${client.user.id}/stats`,
			method: 'POST',
			headers: { Authorization: `Bot ${process.env.DBL_TOKEN}` },
			body: { guilds: client.guilds.size, users: client.users.size }
		})
		.then(() => client.log('- Posted statistics successfully', 'discordbotlist.com'))
		.catch(() => client.log('Failed to post statistics', 'discordbotlist.com'))
	}
}