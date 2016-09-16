try {
	//var Discord = require("discord.js");
  var Discordie = require('discordie');
} catch (e){
	console.log(e.stack);
	console.log(process.version);
	console.log("Please run npm install and ensure it passes with no errors!");
	process.exit();
}

try {
	var yt = require("./youtube_plugin");
	var youtube_plugin = new yt();
} catch(e){
	console.log("couldn't load youtube plugin!\n"+e.stack);
}

try {
	var wa = require("./wolfram_plugin");
	var wolfram_plugin = new wa();
} catch(e){
	console.log("couldn't load wolfram plugin!\n"+e.stack);
}

// Get authentication data
try {
	var AuthDetails = require("./auth.json");
} catch (e){
	console.log("Please create an auth.json like auth.json.example with a bot token or an email and password.\n"+e.stack);
	process.exit();
}

// Load custom permissions
var Permissions = {};
try{
	Permissions = require("./permissions.json");
} catch(e){}
Permissions.checkPermission = function (user,permission){
	try {
		var allowed = false;
		try{
			if(Permissions.global.hasOwnProperty(permission)){
				allowed = Permissions.global[permission] == true;
			}
		} catch(e){}
		try{
			if(Permissions.users[user.id].hasOwnProperty(permission)){
				allowed = Permissions.users[user.id][permission] == true;
			}
		} catch(e){}
		return allowed;
	} catch(e){}
	return false;
}

//load config data
var Config = {};
try{
	Config = require("./config.json");
} catch(e){ //no config file, use defaults
	Config.debug = false;
	Config.respondToInvalid = false;
}

var qs = require("querystring");

var d20 = require("d20");

var htmlToText = require('html-to-text');

var startTime = Date.now();

var giphy_config = {
    "api_key": "dc6zaTOxFJmzC",
    "rating": "r",
    "url": "http://api.giphy.com/v1/gifs/random",
    "permission": ["NORMAL"]
};

//https://api.imgflip.com/popular_meme_ids
var meme = {
	"brace": 61546,
	"mostinteresting": 61532,
	"fry": 61520,
	"onedoesnot": 61579,
	"yuno": 61527,
	"success": 61544,
	"allthethings": 61533,
	"doge": 8072285,
	"drevil": 40945639,
	"skeptical": 101711,
	"notime": 442575,
	"yodawg": 101716
};

var aliases;
var messagebox;

var commands={
  "gif": {
    usage: "<image tags>",
    description: "returns a random gif matching the tags passed",
    process: function(bot, msg, suffix) {
      var tags = suffix.split(" ");
      get_gif(tags, function(id) {
        if (typeof id !== "undefined") {
            msg.channel.sendMessage("http://media.giphy.com/media/" + id + "/giphy.gif [Tags: " + (tags ? tags : "Random GIF") + "]");
        }
        else {
            msg.channel.sendMessage("Invalid tags, try something different. [Tags: " + (tags ? tags : "Random GIF") + "]");
        }
      });
    }
  },
  "servers": {
      description: "lists servers bot is connected to",
      process: function(bot,msg){
        var servers = "";
        try{
          for (var i = 0; i < client.Guilds.toArray().length; i++){
            servers += client.Guilds.toArray()[i].name + ', ';
          }
          servers = servers.substring(0,servers.length-2);
          console.log("channels: " + servers);
          msg.channel.sendMessage(servers);
        } catch (err){
          console.log(err);
        }
      }
  },
  "channels": {
      description: "lists channels bot is connected to",
      process: function(bot,msg){
        var channels = "";
        try{
          for (var i = 0; i < client.Channels.toArray().length; i++){
            channels += client.Channels.toArray()[i].name + ', ';
          }
          channels = channels.substring(0,channels.length-2);
          console.log("channels: " + channels);
          msg.channel.sendMessage(channels);
        } catch (err){
          console.log(err);
        }
      }
  },
  "ping": {
      description: "responds pong, useful for checking if bot is alive",
      process: function(bot, msg, suffix) {
          msg.channel.sendMessage(msg.author.mention+" pong!");
          if(suffix){
              msg.channel.sendMessage(msg.author.mention+ " note that .ping takes no arguments!");
          }
      }
  },
  "lenny":{
    process: function(bot, msg, suffix) {
        msg.channel.sendMessage("( ͡° ͜ʖ ͡°)");
    }
  },
  "no":{
    process: function(bot, msg, suffix) {
        msg.channel.sendMessage("ಠ_ಠ");
    }
  }
}

try{
var rssFeeds = require("./rss.json");
function loadFeeds(){
    for(var cmd in rssFeeds){
        commands[cmd] = {
            usage: "[count]",
            description: rssFeeds[cmd].description,
            url: rssFeeds[cmd].url,
            process: function(bot,msg,suffix){
                var count = 1;
                if(suffix != null && suffix != "" && !isNaN(suffix)){
                    count = suffix;
                }
                rssfeed(bot,msg,this.url,count,false);
            }
        };
    }
}
} catch(e) {
    console.log("Couldn't load rss.json. See rss.json.example if you want rss feed commands. error: " + e);
}

try{
	aliases = require("./alias.json");
} catch(e) {
	//No aliases defined
	aliases = {};
}

try{
	messagebox = require("./messagebox.json");
} catch(e) {
	//no stored messages
	messagebox = {};
}
function updateMessagebox(){
	require("fs").writeFile("./messagebox.json",JSON.stringify(messagebox,null,2), null);
}

function rssfeed(bot,msg,url,count,full){
    var FeedParser = require('feedparser');
    var feedparser = new FeedParser();
    var request = require('request');
    request(url).pipe(feedparser);
    feedparser.on('error', function(error){
        bot.sendMessage(msg.channel,"failed reading feed: " + error);
    });
    var shown = 0;
    feedparser.on('readable',function() {
        var stream = this;
        shown += 1
        if(shown > count){
            return;
        }
        var item = stream.read();
        bot.sendMessage(msg.channel,item.title + " - " + item.link, function() {
            if(full === true){
                var text = htmlToText.fromString(item.description,{
                    wordwrap:false,
                    ignoreHref:true
                });
                bot.sendMessage(msg.channel,text);
            }
        });
        stream.alreadyRead = true;
    });
}

const Events = Discordie.Events;
const client = new Discordie();

client.connect({
  token: 'MjI2MTY1Mzk3NDQ2MDY2MTc4.Crzogw.esctG7eWnD1jLXqWu6LfzWqFn1k'
})

client.Dispatcher.on(Events.GATEWAY_READY, e=>{
  //loadFeeds();
  console.log('Connected as: ' + client.User.username);
  console.log("Ready to begin! Serving in " + client.Channels.length + " channels");
	//require("./plugins.js").init();
});

client.Dispatcher.on(Events.GATEWAY_RESUMED, e=>{
  console.log('Reconnected as: ' + client.User.username);
});

client.Dispatcher.on(Events.GATEWAY_RESUMED, e=>{
  console.log('Reconnected as: ' + client.User.username);
});

client.Dispatcher.on(Events.MESSAGE_CREATE, e=>{
	//check if message is a command
  if (e.message.author.id != client.User.id && (e.message.content[0] === '.' || e.message.content.indexOf(client.User.mention) == 0)){
    console.log("treating" + e.message.content + " from " + e.message.author + " as command");

    var cmdTxt = e.message.content.split(" ")[0].substring(1);
    var suffix = e.message.content.substring(cmdTxt.length+2); //one for the . and one for the space

    if(e.message.content.indexOf(client.User.mention) == 0){
      try{
        cmdTxt = e.message.content.split(" ")[1];
        suffix = e.message.content.substring(client.User.mention.length+cmdTxt.length+2);
      }catch(ex){
        e.message.channel.sendMessage("Yes?");
        return;
      }
    }
    alias = aliases[cmdTxt];
    if (alias){
			console.log(cmdTxt + " is an alias, constructed command is " + alias.join(" ") + " " + suffix);
			cmdTxt = alias[0];
			suffix = alias[1] + " " + suffix;
    }
    var cmd = commands[cmdTxt];

    if (cmdTxt === "help"){
      //help is special since it iterates over the other commands

      e.message.channel.sendMessage(e.message.author, "Available Commands:", function(){
				for(var cmd in commands) {
					var info = "!" + cmd;
					var usage = commands[cmd].usage;
					if(usage){
						info += " " + usage;
					}
					var description = commands[cmd].description;
					if(description){
						info += "\n\t" + description;
					}
					e.message.channel.sendMessage(e.message.author,info);
				}
      });
    }
    else if (cmd){
      try{
        console.log("Processing command: " + cmd.description);
        cmd.process(client,e.message,suffix);
      } catch(e){
        if (Config.debug){
          e.message.channel.sendMessage("command " + cmdTxt + " failed :(\n" + e.stack);
        }
      }
    }else{
			if(Config.respondToInvalid){
				e.message.channel.sendMessage("Invalid command " + cmdTxt);
      }
    }
  }else{
    //message isn't a command or is from us
    //drop our own messages to prevent feedback loops
    if (e.message.author == client.User.id){
      return;
    }else if (e.message.content.indexOf(client.User.mention) >= 0){
      e.message.channel.sendMessage(e.message.author.mention + ", you called?");
    }
  }
});

//Log user status changes
client.Dispatcher.on(Events.PRESENCE_UPDATE, e=>{
	//if(status === "online"){
	//console.log("presence update");
	console.log(e.user + " went " + e.user.status);
	//}
	try{
	if(e.user.status != 'offline'){
		if(messagebox.hasOwnProperty(e.user.id)){
			console.log("found message for " + e.user.id);
			var message = messagebox[e.user.id];
			var channel = client.Channels.get("id",message.channel);
			delete messagebox[e.user.id];
			updateMessagebox();
			channel.sendMessage(message.content);
		}
	}
	}catch(e){}
});

function get_gif(tags, func) {
    //limit=1 will only return 1 gif
    var params = {
        "api_key": giphy_config.api_key,
        "rating": giphy_config.rating,
        "format": "json",
        "limit": 1
    };
    var query = qs.stringify(params);

    if (tags !== null) {
        query += "&tag=" + tags.join('+')
    }

    //wouldnt see request lib if defined at the top for some reason:\
    var request = require("request");
    //console.log(query)
    request(giphy_config.url + "?" + query, function (error, response, body) {
        //console.log(arguments)
        if (error || response.statusCode !== 200) {
            console.error("giphy: Got error: " + body);
            console.log(error);
            //console.log(response)
        }
        else {
            try{
                var responseObj = JSON.parse(body)
                func(responseObj.data.id);
            }
            catch(err){
                func(undefined);
            }
        }
    }.bind(this));
}

exports.addCommand = function(commandName, commandObject){
  try{
    commands[commandName] = commandObject;
  } catch(err){
    console.log(err);
  }
}

exports.commandCount = function(){
  return Object.keys(commands).length;
}

console.log('Node is working!');
