const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');

const VNCConnection = require('./vnc/VNCConnection.js');

// Saving & loading collections
function loadCollection(name, defaults) {
	const filepath = path.join(process.cwd(), 'vncbot.' + name + '.json');

	let data = defaults;
	if(fs.existsSync(filepath)) {
		try {
			data = require(filepath);
		} catch(er) {
			console.warn('Failed to load `vncbot.' + name + '.json`, ignoring...')
		}
	}

	return new Discord.Collection(data);
}

function saveCollection(name, collection) {
	const filepath = path.join(process.cwd(), 'vncbot.' + name + '.json');

	fs.writeFileSync(filepath, JSON.stringify(
		Array.from(
			collection.entries()
		)
	));
}

// Initialize client
const client = new Discord.Client();
client.commands = new Discord.Collection();

// TODO: refactor this horror
loadServersConfig: {
	const vncServersName = 'vncbot.vncservers.json',
		vncServersPath = path.join(process.cwd(), vncServersName);

	try {
		client.vncServersConfig = require(vncServersPath);
	} catch(er) {
		if(fs.existsSync(vncServersPath)) {
			console.error('Your configuration file `' + vncServersName + '` is failing to load.');
			console.error('Please double-check the file\'s validity and permissions prior to restarting the bot.');
		} else {
			console.error('Could not find configuration file `' + vncServersName + '`, is it in the same directory as the bot?');
			console.error('If you have already setup your configuration file, ensure that you are in the same directory.');

		}

		process.exit(1);
	}
}

// initialize connections via config loaded in 'loadServersConfig' block
client.vncServers = Object.fromEntries(
	Object
		.entries(client.vncServersConfig.servers)
		.map(conn => {
			const vncconn = new VNCConnection(conn[1]);
			vncconn.connect();

			return [ conn[0], vncconn ];
		})
);

// load discord-server specific config
client.dscServersConfig = loadCollection('dscservers', []);

// Safe exiting
process.on('exit', (code) => {
	console.log('Saving user data...');
	saveCollection('dscservers', client.dscServersConfig);
});

setInterval(() => {
	saveCollection('dscservers', client.dscServersConfig);
}, 5000);

// Load commands
fs
	.readdirSync('./commands')
	.filter(file => file.endsWith('.js'))
	.map(file => {
		const command = require('./commands/' + file);

		if(command.name) {
			client.commands.set(command.name, command);
		}

		if(command.aliases) {
			command.aliases.forEach(alias => {
				client.commands.set(alias, command);
			});
		}

		return command;
	})
	.forEach(command => {
		if(command.setup) {
			command.setup(client);
		}
	});


// Load events
fs
	.readdirSync('./events')
	.filter(file => file.endsWith('.js'))
	.forEach(file => {
		const event = require('./events/' + file);
		client.on(event.name, event.run);
	});

// Authenticate
client.login(client.vncServersConfig.token);