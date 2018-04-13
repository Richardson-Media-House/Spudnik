import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { sendSimpleEmbeddedMessage } from '../../lib/helpers';

export default class YodifyCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			description: 'Translate to Yoda speak.',
			group: 'translate',
			guildOnly: true,
			memberName: 'yodify',
			name: 'yodify',
			throttling: {
				duration: 3,
				usages: 2,
			},
			args: [
				{
					key: 'query',
					prompt: 'your statement, I must have.\n',
					type: 'string',
				},
			],
		});
	}

	public async run(msg: CommandMessage, args: { query: string }): Promise<Message | Message[]> {
		require('soap').createClient('http://www.yodaspeak.co.uk/webservice/yodatalk.php?wsdl', (err: Error, client: any) => {
			if (err) {
				return sendSimpleEmbeddedMessage(msg, 'Lost, I am. Not found, the web service is. Hrmm...');
			}

			client.yodaTalk({ inputText: args.query }, (err: Error, result: any) => {
				if (err) {
					return sendSimpleEmbeddedMessage(msg, 'Confused, I am. Disturbance in the force, there is. Hrmm...');
				}
				msg.delete();
				return sendSimpleEmbeddedMessage(msg, result.return);
			});
		});
		return sendSimpleEmbeddedMessage(msg, 'Loading...');
	}
}
