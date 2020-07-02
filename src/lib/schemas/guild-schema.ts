import { Client, SchemaFolder } from 'klasa';

Client.defaultGuildSchema
	.add('warnings', 'warning', { array: true })
	.add('commands', (folder: SchemaFolder) => folder
		.add('deleteMessages', 'boolean')
		.add('disabled', 'string', { array: true })
		.add('disabledCategories', 'string', { array: true }))
	.add('roles', (folder: SchemaFolder) => folder
		.add('selfAssignable', 'Role', { array: true }))
	.add('starboard', (folder: SchemaFolder) => folder
		.add('enabled', 'boolean')
		.add('channel', 'TextChannel')
		.add('trigger', 'string', { 'default': '⭐' }))
	.add('welcome', (folder: SchemaFolder) => folder
		.add('enabled', 'boolean')
		.add('channel', 'TextChannel')
		.add('message', 'string', { 'default': '@here, please Welcome {user} to {guild}!' }))
	.add('goodbye', (folder: SchemaFolder) => folder
		.add('enabled', 'boolean')
		.add('channel', 'TextChannel')
		.add('message', 'string', { 'default': '{user} has left the server.' }))
	.add('modlog', (folder: SchemaFolder) => folder
		.add('initialMessageSent', 'boolean')
		.add('channel', 'TextChannel')
		.add('enabled', 'boolean'))
	.add('announce', (folder: SchemaFolder) => folder
		.add('channel', 'TextChannel'))
	.add('tos', (folder: SchemaFolder) => folder
		.add('channel', 'TextChannel')
		.add('role', 'Role')
		.add('welcome', (folder2: SchemaFolder) => folder2
			.add('enabled', 'boolean')
			.add('message', 'string', { 'default': 'Hi {user}, Welcome to {guild}! Terms of service are above, in 5 seconds reactions will appear below to accept or reject. You must react to the message that you are highlighted in.' }))
		.add('messages', 'any', { array: true }))
	.add('embedColor', 'string', { 'default': '555555' })
	.add('language', 'Language', { 'default': 'en-US' })
	.add('adblockEnabled', 'boolean');
