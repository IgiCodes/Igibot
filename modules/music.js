var exports = module.exports = {};

const ytdl = require("ytdl-core");
const async = require("async");
const request = require("request");

const googleAPIKey = "";

var queue = {};
var musicChannels = {};
var defaultVol = 0.05;

exports.load = function(bot) {

	bot.registerCommand("join", (msg, args) => {
		joinVoice(bot, msg);
	}, {
		'description': "Bot joins current channel",
		'fullDescription':"Joins the bot to your current voice channel."
	});

	bot.registerCommand("leave", (msg, args) => {
		leaveVoice(bot, msg);
	}, {
		'description': "Bot leaves current channel",
		'fullDescription':"Disconnects the bot from the voice channel.",
		'aliases':['fuckoff']
	});

	bot.registerCommand("queue", (msg, args) => {
		if (!(args[0])) {
			return "Please pass a valid video link.";
		}
		var regExp = /^.*(youtu.be\/|list=)([^#\&\?]*).*/;
		var match = args[0].match(regExp);

		if (match && match[2]) {
			async.series([
				(callback) => {
					queueYoutubePlaylist(bot, msg, match[2]);
					callback(null, "one");
				},
				(callback) => {
					var conn = bot.voiceConnections.get(msg.channel.guild.id);
					if (typeof conn === 'undefined') {
						joinVoice(bot, msg).catch((err) => {
							console.log("Failed to join after queue");
							return false;
						}).then((connection) => {
							callback(null, 'two');
						});
					} else {
						callback(null, 'two');
					}
				},
				(callback) => {
					var conn = bot.voiceConnections.get(msg.channel.guild.id);
					if (!(conn.playing)) nextQueue(bot, msg.channel.guild.id);
					callback(null, "three");
				}]);
		} else {
			queueYoutubeTrack(bot, msg, args[0]);
		}

	}, {
		'description': "Queue music",
		'fullDescription':"Add a track or playlist to the queue.",
		'aliases':['q']
	});

	bot.registerCommand("skip", (msg,args) => {
		async.series([
			(callback) => {
				stopPlaying(bot, msg.channel.guild.id);

				callback(null, "one");
			},
			(callback) => {
				nextQueue(bot, msg.channel.guild.id);

				callback(null, "two");
			}
		]);
	}, {
		'description': "Skip a track",
		'fullDescription':"Skip the currently playing track in the queue.",
		'aliases':['next']
	});

	bot.registerCommand("listqueue", (msg, args) => {
		var guildID = msg.channel.guild.id;
		if (queue[guildID]) {
			var message = '';
			queue[guildID].forEach((track, index) => {
				pos = index + 1;
				message += "**" + pos + ")** " + track['title'] + "\n";
				if (pos % 10 == 0) {
					bot.createMessage(msg.channel.id, message);
					message = '';
				}
			});
			bot.createMessage(msg.channel.id, message);
		}
	}, {
		'description': "List current queue",
		'fullDescription':"List the current queue of songs.",
		'aliases':['list','lq']
	});

	bot.registerCommand("nowplaying", (msg, args) => {
		var guildID = msg.channel.guild.id;
		if (musicChannels[guildID] && musicChannels[guildID].playing) {
			return "Now playing: " + musicChannels[guildID].playing.title;
		}
	}, {
		'description': "Show the current song",
		'fullDescription':"Show what the song currently playing is.",
		'aliases':['np','now']
	});

	bot.registerCommand("move", (msg, args) => {
		var match = (/^(\d+)>(\d+)$/).exec(args[0]);
		var guildID = msg.channel.guild.id;
		if (queue[guildID] && match && match[1] && match[2]) {
			moveFrom = parseInt(match[1]) - 1;
			if (queue[guildID][moveFrom]) toMove = queue[guildID][moveFrom];
			else return "Song not found at position " + match[1];
			moveTo = parseInt(match[2]) - 1;

			queue[guildID] = queue[guildID].filter(function(track) {
				return track.id !== toMove.id;
			});
			queue[guildID].splice(moveTo, 0, toMove);

			return "Moved " + toMove.title + " from position " + match[1] + " to " + match[2];
		}
	}, {
		'description': "Show the current song",
		'fullDescription':"Show what the song currently playing is.",
		'aliases':['np','now']
	});

	bot.registerCommand("stop", (msg,args) => {
		stopPlaying(bot, msg.channel.guild.id);
	}, {
		'description': "Stop the music.",
		'fullDescription':"Stops the currently playing song and ends the queue."
	});

	bot.registerCommand("setvol", (msg,args) => {
		vol = args[0].match(/^\.\d+|^0\.?\d*$|^1\.?\d*$|^2$/);
		if (args[0] && vol) {
			setVol(bot, msg.channel.guild.id, vol);
			return "Set volume to " + vol;
		} else {
			return "Invalid volume passed!";
		}
	}, {
		'description': "Skip a track",
		'fullDescription':"Skip the currently playing track in the queue.",
		'aliases':['vol']
	});

	return true;
};

exports.unload = function(bot) {

	bot.unregisterCommand("join");
	bot.unregisterCommand("leave");
	bot.unregisterCommand("queue");
	bot.unregisterCommand("skip");
	bot.unregisterCommand("listqueue");
	bot.unregisterCommand("nowplaying");
	bot.unregisterCommand("move");
	bot.unregisterCommand("stop");
	bot.unregisterCommand("setvol");

	return true;
}


function joinVoice(bot, msg) {
	return new Promise(
		(resolve,reject) => {
			bot.joinVoiceChannel(msg.member.voiceState.channelID).catch((err) => { // Join the user's voice channel
				bot.createMessage(msg.channel.id, "Error joining voice channel: " + err.message); // Notify the user if there is an error
				console.log(err); // Log the error
				reject(err);
			}).then((connection) => {
				connection.setVolume(defaultVol);
				console.log("Joined channel");
				var guildID = msg.channel.guild.id;
				if (!(guildID in musicChannels)) musicChannels[guildID] = {'channel':msg.channel.id};
				connection.on("ready", resolve(connection));
			});
		}
	);
}

function leaveVoice(bot, msg) {
	bot.leaveVoiceChannel(bot.voiceConnections.get(msg.channel.guild.id).channelID);
}

function stopPlaying(bot, guildID) {
	return new Promise(
		(resolve,reject) => {
			var conn = bot.voiceConnections.get(guildID);
			musicChannels[guildID].stopped = true;
			delete musicChannels[guildID].playing;
			conn.stopPlaying();
			connection.on("ready", resolve(true));
		}
	);
}

function setVol(bot, guildID, vol) {
	var conn = bot.voiceConnections.get(guildID);
	if (conn && vol) {
		conn.setVolume(vol);
	}
}

function addQueue(bot, msg, track) {
	var guildID = msg.channel.guild.id;
	if (!(guildID in queue)) queue[guildID] = [];
	queue[guildID].push({title: track["title"], id: track["video_id"], user: msg.author.username});
}

function nextQueue(bot, guildID) {
	if (!(queue[guildID]) || queue[guildID].length < 1) {
		if (guildID in musicChannels) delete musicChannels[guildID];
		return false;
	}
	var conn = bot.voiceConnections.get(guildID);
	if (typeof conn === 'undefined') return false;

	var video_id = queue[guildID][0]["id"];
	var title = queue[guildID][0]["title"];
	var user = queue[guildID][0]["user"];

	ytdl.getInfo("https://www.youtube.com/watch?v=" + video_id, (error, info) => {
		if(error) {
			if (guildID in musicChannels) {
				bot.createMessage(musicChannels[guildID].channel,
					"The requested video (" + video_id + ") does not exist or cannot be played.\n" + error);

			}
			console.log("Error (" + video_id + "): " + error);

			queue[guildID].splice(0,1);
			nextQueue(bot, guildID);
		} else {
			var audio_stream = ytdl("https://www.youtube.com/watch?v=" + video_id);

			options = {
				inlineVolume:true,
			}
			if (conn.playing) {
				stopPlaying(bot, guildID).then(() => {

					try {
						conn.play(audio_stream, options);
					} catch (err) {
						console.log("Failed to play due to copywrite");
					}
				});
			} else {
				try {
					conn.play(audio_stream, options);
				} catch (err) {
					console.log("Failed to play due to copywrite");
				}
			}

			if (guildID in musicChannels) {
				musicChannels[guildID].stopped = false;
				musicChannels[guildID].playing = queue[guildID][0];
				bot.createMessage(musicChannels[guildID].channel, "Now Playing: " + title);
			}

			conn.once("end", () => {
				if (musicChannels[guildID] && !(musicChannels[guildID].stopped)) nextQueue(bot, guildID);
			});

			queue[guildID].splice(0,1);
		}
	});

}

function getYoutubeID(args) {
	var regex = /(?:\?v=|&v=|youtu\.be\/)(.*?)(?:\?|&|$)/;
	var matches = args.match(regex);

	if(matches) {
		return matches[1];
	} else {
		return args;
	}
}

function queueYoutubeTrack(bot, msg, args) {
	var video_id = getYoutubeID(args);
	ytdl.getInfo("https://www.youtube.com/watch?v=" + video_id, (error, track) => {
		if(error) {
			bot.createMessage(msg.channel.id, "The requested video (" + video_id + ") does not exist or cannot be played.");
			console.log("Error (" + video_id + "): " + error);
		} else {
			async.series([
				(callback) => {
					bot.createMessage(msg.channel.id, "Adding to queue: " + track['title']);
					addQueue(bot, msg, track);
					callback(null, 'one');
				},
				(callback) => {
					var conn = bot.voiceConnections.get(msg.channel.guild.id);
					if (typeof conn === 'undefined') {
						joinVoice(bot, msg).catch((err) => {
							console.log("Failed to join after queue");
							return false;
						}).then((connection) => {
							callback(null, 'two');
						});
					} else {
						callback(null, 'two');
					}
				},
				(callback) => {
					var conn = bot.voiceConnections.get(msg.channel.guild.id);

					if (!(conn.playing)) {
						console.log("calling nextQueue");
						nextQueue(bot, msg.channel.guild.id);
					} else {
						console.log("currently playing");
					}
					callback(null, 'three');
				},
			]);
		}
	});
}

function queueYoutubePlaylist(bot, msg, playlistID, pageToken) {
	if (typeof pageToken === 'undefined') pageToken = '';
	request("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=" + playlistID + "&key=" + googleAPIKey + "&pageToken=" + pageToken, (error, response, body) => {
		var json = JSON.parse(body);
		if ("error" in json) {
			bot.createMessage(msg.channel.id, "An error has occurred: " + json.error.errors[0].msg + " - " + json.error.errors[0].reason);
		} else if (json.items.length === 0) {
			bot.createMessage(msg.channel.id, "No videos found within playlist.");
		} else {
			for (var i = 0; i < json.items.length; i++) {
				var video_id = getYoutubeID(json.items[i].snippet.resourceId.videoId);
				addQueue(bot, msg, {'video_id':json.items[i].snippet.resourceId.videoId,'title':json.items[i].snippet.title});
			}
			if (json.nextPageToken == null){
				return;
			}
			queueYoutubePlaylist(bot, msg, playlistID, json.nextPageToken);
		}
	});
}