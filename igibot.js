const fs = require("fs");
const path = require("path");
const eris = require("eris");

const botToken = "";

var botOptions = {
};
var botDetails = {
		'description':"Igi's personal robot slave",
		'owner':"Igi",
		'prefix':"!",
		'defaultCommandOptions':{
				'caseInsensitive':true
		}
};

var bot = new eris.CommandClient(botToken, botOptions, botDetails);
var modules = {};

function loadModules() {
	var normalizedPath = path.join(__dirname, "modules");
	fs.readdirSync(normalizedPath).forEach(function(file) {
		moduleName = file.replace(/\.js$/,"");
		modules[moduleName] = require("./modules/" + file);
		modules[moduleName].load(bot);
	});
}

function loadModule(module) {
	var module = module.toLowerCase();
	if (!(module in modules)) {
		var modulePath = path.join(__dirname, "modules/") + module + ".js";
		modules[module] = require(modulePath);
		modules[module].load(bot);
	} else {
		throw "Module already loaded!";
	}
}

function unloadModule(module) {
	if (module in modules) {
		modules[module].unload(bot);
		delete modules[module];
	} else {
		throw false;
	}
}

bot.registerCommand("unload", (msg,args) => {
	args.forEach(function(module) {
		try {
			unloadModule(module);

			bot.createMessage(msg.channel.id, {
				embed: {
					color: 0x008000,
					fields:[
						{
							name: "Unloaded module: ",
							value: module,
							inline: true,
						}
					]
				}
			});
		} catch (e) {
			bot.createMessage(msg.channel.id, {
				embed: {
					color: 0x800000,
					fields:[
						{
							name: "Failed to unload module: ",
							value: module,
							inline: true,
						}
					]
				}
			});
		}
	});
}, {
	'description': "Unloads modules",
	'fullDescription':"Used to unload modules from the bot. Accepts multiple modules passed."
});

bot.registerCommand("load", (msg,args) => {
	args.forEach(function(module) {
		try {
			loadModule(module);

			bot.createMessage(msg.channel.id, {
				embed: {
					color: 0x008000,
					fields:[
						{
							name: "Loaded module: ",
							value: module,
							inline: true,
						}
					]
				}
			});
		} catch (e) {
			var message = '';
			if (e.code == 'MODULE_NOT_FOUND') {
				message = "Module not found!";
			} else {
				message = e.toString();
			}
			bot.createMessage(msg.channel.id, {
				embed: {
					color: 0x800000,
					fields:[
						{
							name: "Failed to load module: " + module,
							value: message,
							inline: true,
						}
					]
				}
			});
		}
	});
}, {
	'description': "Loads modules",
	'fullDescription':"Used to load modules for the bot. Accepts multiple modules passed."
});

bot.registerCommand("modules", (msg,args) => {
	var normalizedPath = path.join(__dirname, "modules");
	var unloadedModules = [];
	fs.readdirSync(normalizedPath).forEach(function(module) {
		module = module.replace(/\.js$/,"");
		if (!(module in modules)) unloadedModules.push(module);
	});

	var loadedModules = Object.keys(modules);
	var message = {
		color: 0x008000,
		fields:[]
	}

	if (loadedModules.length > 0) {
		message.fields.push({
			name: "Loaded Modules: ",
			value: loadedModules.join(", "),
			inline: true,
		});
	}
	if (unloadedModules.length > 0) {
		message.fields.push({
			name: "Available Modules: ",
			value: unloadedModules.join(", "),
			inline: true,
		})
	}

	bot.createMessage(msg.channel.id, {
		embed: message
	});
}, {
	'description': "List modules",
	'fullDescription':"Displays all available and loaded modules for the bot."
});

bot.on("ready", () => {
	console.log("Ready!");
});

loadModules();

bot.connect();
