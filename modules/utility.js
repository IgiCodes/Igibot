var exports = module.exports = {};

exports.load = function(bot) {
	bot.registerCommand("ping", (msg, args) => {
		ping(bot, msg, args);
	}, {
		'description': "Pong!",
		'fullDescription':"Simple Ping/Pong response command to check bot functionality."
	});

	bot.registerCommand("shardping", (msg, args) => {
		shardPing(bot, msg, args);
	}, {
		'description': "Shard Pong!",
		'fullDescription':"Simple Ping/Pong response command to check shard latency."
	});

	bot.registerCommand("ginfo", (msg,args) => {
		guildInfo(bot, msg, args);
	}, {
			'description': "Guild Info",
			'fullDescription':"Returns various information about the current guild."
	});

	bot.registerCommand("inrole", (msg,args) => {
		inRole(bot, msg, args);
	}, {
			'description': "Show all users in role",
			'fullDescription':"Return a list of all users in a given role."
	});

	bot.registerCommand("roles", (msg,args) => {
		roles(bot, msg, args);
	}, {
			'description': "Show all roles",
			'fullDescription':"Return a list of all roles in the guild."
	});

	return true;
};

exports.unload = function(bot) {
	bot.unregisterCommand("ping");
	bot.unregisterCommand("shardping");
	bot.unregisterCommand("ginfo");
	bot.unregisterCommand("inrole");

	return true;
}


function ping(bot, msg, args) {
	var ping = Date.now() - msg.timestamp;
	bot.createMessage(msg.channel.id, {
		embed: {
			title: ":ping_pong: Pong!",
			color: 0x008000,
			description: msg.author.username,
			fields:[
				{
					name: "Response time:",
					value: ping + "ms",
					inline: true,
				}
			]
		}
	});
}

function shardPing(bot, msg, args) {
	var shardMap = bot.guildShardMap;
	var guild = msg.channel.guild.id;
	var shardID = shardMap[guild];
	var shard = bot.shards.get(shardID);

	var ping = shard.latency;
	bot.createMessage(msg.channel.id, {
		embed: {
			title: ":ping_pong: Pong!",
			color: 0x008000,
			description: msg.author.username,
			fields:[
				{
					name: "Response time:",
					value: ping + "ms",
					inline: true,
				}
			]
		}
	});
}

function guildInfo(bot, msg, args) {
	var guild = msg.channel.guild;
	bot.createMessage(msg.channel.id, {
		embed: {
			color: 0x008000,
			author: {
				name: guild.name,
				icon_url: guild.iconURL
			},
			fields:[
				{
					name: "Guild ID:",
					value: guild.id,
					inline: true,
				}
			]
		}
	});
}

function inRole(bot, msg, args) {
	var roleID;
	var members = [];
	var role = args.join(" ").replace(/"+/g,"");
	var guild = msg.channel.guild;
	console.log(args);
	console.log(role);
	guild.roles.forEach(function (e) {
		if (e.name === role) roleID = e.id;
	});

	console.log(roleID);
	guild.members.forEach(function (e) {
		if (e.roles.indexOf(roleID) !== -1) {
			console.log("in role");
			members.push(e.username);
		}
	});
console.log(members);
	bot.createMessage(msg.channel.id, {
		embed: {
			color: 0x008000,
			author: {
				name: guild.name,
				icon_url: guild.iconURL
			},
			description: 'List of users in the "' + role +'" role.',
			fields:[
				{
					name: "Members:",
					value: members.join(", "),
					inline: true,
				}
			]
		}
	});
}

function roles(bot, msg, args) {
	var guild = msg.channel.guild;
	guild.roles.forEach(function (e) {
		if (e.name !== "") roles.push(e.name);
	});

	bot.createMessage(msg.channel.id, {
		embed: {
			color: 0x008000,
			author: {
				name: guild.name,
				icon_url: guild.iconURL
			},
			fields:[
				{
					name: "Roles:",
					value: roles.join(", "),
					inline: true,
				}
			]
		}
	});
}