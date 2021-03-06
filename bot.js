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
var autoresponses;
var rssupdaters;
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
  "ping": {
      description: "responds pong, useful for checking if bot is alive",
      process: function(bot, msg, suffix) {
          msg.channel.sendMessage(msg.author.mention+" pong!");
          if(suffix){
              msg.channel.sendMessage(msg.author.mention+ " note that .ping takes no arguments!");
          }
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
  "myid": {
      description: "returns the user id of the sender",
      process: function(bot,msg){msg.channel.sendMessage(msg.author.id);}
  },
  "youtube": {
      usage: "<video tags>",
      description: "gets youtube video matching tags",
      process: function(bot,msg,suffix){
          youtube_plugin.respond(suffix,msg.channel,bot);
      }
  },
  "say": {
      usage: "<message>",
      description: "bot says message",
      process: function(bot,msg,suffix){ msg.channel.sendMessage(suffix);}
  },
  "announce": {
      usage: "<message>",
      description: "bot says message with text to speech",
      process: function(bot,msg,suffix){ msg.channel.sendMessage(suffix,{tts:true});}
  },
  "meme": {
      usage: 'meme "top text" "bottom text"',
      process: function(bot,msg,suffix) {
        try{
          var tags = msg.content.split('"');
          console.log(tags);
          var memetype = tags[0].split(" ")[1];
          console.log(memetype);
          //bot.sendMessage(msg.channel,tags);
          var Imgflipper = require("imgflipper");
          var imgflipper = new Imgflipper(AuthDetails.imgflip_username, AuthDetails.imgflip_password);
          imgflipper.generateMeme(meme[memetype], tags[1]?tags[1]:"", tags[3]?tags[3]:"", function(err, image){
            console.log(image);
            msg.channel.sendMessage(image);
          });
        } catch (err){
          console.log(err);
        }
      }
  },
  "memehelp": { //TODO: this should be handled by !help
      description: "returns available memes for !meme",
      process: function(bot,msg) {
          var str = "Currently available memes:\n"
          for (var m in meme){
              str += m + "\n"
          }
          msg.channel.sendMessage(str);
      }
  },
  "version": {
    description: "returns the git commit this bot is running",
    process: function(bot,msg,suffix) {
      try{
        var commit = require('child_process').spawn('git', ['log','-n','1']);
        commit.stdout.on('data', function(data) {
          msg.channel.sendMessage(data);
        });
        commit.on('close', function(code) {
          if( code != 0){
            msg.channel.sendMessage("failed checking git version!");
          }
        });
      }catch(err){
        console.log(err);
      }
    }
  },
  "log": {
      usage: "<log message>",
      description: "logs message to bot console",
      process: function(bot,msg,suffix){console.log(msg.content);}
  },
  "wiki": {
      usage: "<search terms>",
      description: "returns the summary of the first matching search result from Wikipedia",
      process: function(bot,msg,suffix) {
          var query = suffix;
          if(!query) {
              msg.channel.sendMessage("usage: !wiki search terms");
              return;
          }
          var Wiki = require('wikijs');
          new Wiki().search(query,1).then(function(data) {
              new Wiki().page(data.results[0]).then(function(page) {
                  page.summary().then(function(summary) {
                      var sumText = summary.toString().split('\n');
                      var continuation = function() {
                          var paragraph = sumText.shift();
                          if(paragraph){
                              msg.channel.sendMessage(paragraph,continuation);
                          }
                      };
                      continuation();
                  });
              });
          },function(err){
              msg.channel.sendMessage(err);
          });
      }
  },
  "stock": {
      usage: "<stock to fetch>",
      process: function(bot,msg,suffix) {
          var yahooFinance = require('yahoo-finance');
          yahooFinance.snapshot({
            symbol: suffix,
            fields: ['s', 'n', 'd1', 'l1', 'y', 'r'],
          }, function (error, snapshot) {
              if(error){
                  msg.channel.sendMessage("couldn't get stock: " + error);
              } else {
                  //msg.channel.sendMessage(JSON.stringify(snapshot));
                  msg.channel.sendMessage(snapshot.name
                      + "\nprice: $" + snapshot.lastTradePriceOnly);
              }
          });
      }
  },
  "wolfram": {
    usage: "<search terms>",
    description: "gives results from wolframalpha using search terms",
    process: function(bot,msg,suffix){
      if(!suffix){
        msg.channel.sendMessage("Usage: !wolfram <search terms> (Ex. !wolfram integrate 4x)");
      }
      wolfram_plugin.respond(suffix,msg.channel,bot);
    }
  },
  "rss": {
    description: "lists available rss feeds",
    process: function(bot,msg,suffix) {
      /*var args = suffix.split(" ");
      var count = args.shift();
      var url = args.join(" ");
      rssfeed(bot,msg,url,count,full);*/
      try{
        var message = "Available feeds: \n";
        for(var c in rssFeeds){
          message += c + ": " + rssFeeds[c].url + "\n";
        }
      }
      catch(err){
        console.log(err);
      }
      msg.channel.sendMessage(message);
    }
  },
  "rssupdater": {
    usage: "[rss feed name] <channel id>",
    description: "creates an auto updater for an RSS feed in a given channel",
    process: function(bot,msg,suffix) {
      try{
        var args = suffix.trim().split(" ");
        var name = args.shift();
        if(!name){
          msg.channel.sendMessage(".rssupdater " + this.usage + "\n" + this.description);
        } else {
          var channel = args.shift();
          if (!channel)
            channel = msg.channel.id;
          if (!rssupdaters[name]){
            rssupdaters[name] = {};;
          }
          rssupdaters[name][channel] = " ";
          //now save the new rss updater file
          require("fs").writeFile("./rssupdater.json",JSON.stringify(rssupdaters,null,2), null);
          msg.channel.sendMessage("created rss updater " + name + " in channel: " + channel);
        }
      }catch(err){
        console.log(err);
      }
    }
  },
  "removerssupdater": {
    usage: "[rss feed name] <channel id>",
    description: "removes an auto updater for an RSS feed in a given channel",
    process: function(bot,msg,suffix) {
      try{
        var args = suffix.trim().split(" ");
        var name = args.shift();
        if(!name){
          msg.channel.sendMessage(".removerssupdater " + this.usage + "\n" + this.description);
        } else {
          var channel = args.shift();
          if (!channel)
            channel = msg.channel.id;
          if (!rssupdaters[name]){
            msg.channel.sendMessage("rss updater does not exist");
            return;
          }
          var feed = rssupdaters[name];
          if(!feed[channel]){
            msg.channel.sendMessage("rss updater does not exist in this channel");
            return;
          }
          delete rssupdaters[name][channel];
          var numKeys = Object.keys(rssupdaters[name]).length;
          if (numKeys == 0 || numKeys == 1 && rssupdaters[name].latest)
            delete rssupdaters[name];
          //now save the new rss updater file
          require("fs").writeFile("./rssupdater.json",JSON.stringify(rssupdaters,null,2), null);
          msg.channel.sendMessage("removed rss updater " + name + " from channel: " + channel);
        }
      }catch(err){
        console.log(err);
      }
    }
  },
  "reddit": {
      usage: "[subreddit] [number of posts]",
      description: "Returns the top post on reddit. Can optionally pass a subreddit to get the top post there instead",
      process: function(bot,msg,suffix) {
        var args = suffix.split(" ");
        var count = 1;
        var subreddit;
        var path = "/.rss";

        if (args.length > 0){
          subreddit = args.shift();
          if (args.length > 0)
            count = args.shift();
        }
        if(subreddit)
            path = "/r/"+subreddit+path;
        if (count > 5)
          count = 5;

        rssfeed(bot,msg.channel,"https://www.reddit.com"+path,count,false);
      }
  },
  "alias": {
    usage: "<name> <actual command>",
    description: "Creates command aliases. Useful for making simple commands on the fly",
    process: function(bot,msg,suffix) {
      var args = suffix.trim().split(" ");
      var name = args.shift();
      if(!name){
        msg.channel.sendMessage(".alias " + this.usage + "\n" + this.description);
      } else if(commands[name] || autoresponses[name] || name === "help"){
        msg.channel.sendMessage("overwriting commands with aliases is not allowed!");
      } else {
        var command = args.shift();
        aliases[name] = [command, args.join(" ")];
        //now save the new alias file
        require("fs").writeFile("./alias.json",JSON.stringify(aliases,null,2), null);
        msg.channel.sendMessage("created alias " + name + " for command: " + command);
      }
    }
  },
  "removealias": {
    usage: "<name>",
    description: "Creates command aliases. Useful for making simple commands on the fly",
    process: function(bot,msg,suffix) {
      var name = suffix.trim();
      if(!name){
        msg.channel.sendMessage(".alias " + this.usage + "\n" + this.description);
      } else if(commands[name] || autoresponses[name] || name === "help"){
        msg.channel.sendMessage("this command is not an alias");
      } else {
        delete aliases[name];
        //now save the new alias file
        require("fs").writeFile("./alias.json",JSON.stringify(aliases,null,2), null);
        msg.channel.sendMessage("removed alias " + name);
      }
    }
  },
  "autoresponse": {
    usage: "<command> <response>",
    description: "Creates an auto response command. Useful for making simple responses on the fly",
    process: function(bot,msg,suffix) {
      var args = suffix.trim().split(" ");
      var command = args.shift();
      if(!command){
        msg.channel.sendMessage(".autoresponse " + this.usage + "\n" + this.description);
      } else if(commands[command] || aliases[command] || command === "help"){
        msg.channel.sendMessage("overwriting commands with auto responses is not allowed!");
      } else {
        var response = args.join(" ");
        autoresponses[command] = [response];//, args.join(" ")];
        //now save the new autoresponse file
        require("fs").writeFile("./autoresponse.json",JSON.stringify(autoresponses,null,2), null);
        msg.channel.sendMessage("created auto response " + command + ": " + response);
      }
    }
  },
  "removeautoresponse": {
    usage: "<name>",
    description: "Removes an auto response command.",
    process: function(bot,msg,suffix) {
      try{
        var command = suffix.trim();
        if(!command){
          msg.channel.sendMessage(".removeautoresponse " + this.usage + "\n" + this.description);
        } else if(commands[command] || aliases[command] || command === "help"){
          msg.channel.sendMessage("this command is not an auto response!");
        } else {
          delete autoresponses[command];
          //now save the new autoresponse file
          require("fs").writeFile("./autoresponse.json",JSON.stringify(autoresponses,null,2), null);
          msg.channel.sendMessage("removed auto response " + command);
        }
      } catch (err) {
        console.log(err);
      }
    }
  },
  "userid": {
    usage: "[user to get id of]",
    description: "Returns the unique id of a user. This is useful for permissions.",
    process: function(bot,msg,suffix) {
      if(suffix){
        var users = msg.channel.server.members.getAll("username",suffix);
        if(users.length == 1){
          msg.channel.sendMessage("The id of " + users[0] + " is " + users[0].id)
        } else if(users.length > 1){
          var response = "multiple users found:";
          for(var i=0;i<users.length;i++){
            var user = users[i];
            response += "\nThe id of " + user + " is " + user.id;
          }
          msg.channel.sendMessage(response);
        } else {
          msg.channel.sendMessage("No user " + suffix + " found!");
        }
      } else {
        msg.channel.sendMessage("The id of " + msg.author + " is " + msg.author.id);
      }
    }
  },
  "eval": {
    usage: "<command>",
    description: 'Executes arbitrary javascript in the bot process. User must have "eval" permission',
    process: function(bot,msg,suffix) {
      if(Permissions.checkPermission(msg.author,"eval")){
        msg.channel.sendMessage(eval(suffix,bot));
      } else {
        msg.channel.sendMessage(msg.author + " doesn't have permission to execute eval!");
      }
    }
  },
  "topic": {
    usage: "[topic]",
    description: 'Sets the topic for the channel. No topic removes the topic.',
    process: function(bot,msg,suffix) {
      msg.channel.setChannelTopic(suffix);
    }
  },
  "roll": {
    usage: "[# of sides] or [# of dice]d[# of sides]( + [# of dice]d[# of sides] + ...)",
    description: "roll one die with x sides, or multiple dice using d20 syntax. Default value is 10",
    process: function(bot,msg,suffix) {
      if (suffix.split("d").length <= 1) {
          msg.channel.sendMessage(msg.author + " rolled a " + d20.roll(suffix || "10"));
      }
      else if (suffix.split("d").length > 1) {
        var eachDie = suffix.split("+");
        var passing = 0;
        for (var i = 0; i < eachDie.length; i++){
          if (eachDie[i].split("d")[0] < 50) {
              passing += 1;
          };
        }
        if (passing == eachDie.length) {
          msg.channel.sendMessage(msg.author.mention + " rolled a " + d20.roll(suffix));
        }  else {
          msg.channel.sendMessage(msg.author.mention + " tried to roll too many dice at once!");
        }
      }
    }
  },
  "msg": {
    usage: "<user> <message to leave user>",
    description: "leaves a message for a user the next time they come online",
    process: function(bot,msg,suffix) {
      var args = suffix.split(' ');
      var user = args.shift();
      var message = args.join(' ');
      if(user.startsWith('<@')){
        user = user.substr(2,user.length-3);
      }
      var target = msg.channel.server.members.get("id",user);
      if(!target){
        target = msg.channel.server.members.get("username",user);
      }
      messagebox[target.id] = {
        channel: msg.channel.id,
        content: target + ", " + msg.author + " said: " + message
      };
      updateMessagebox();
      msg.channel.sendMessage("message saved.")
    }
  },
  "beam": {
      usage: "<stream>",
      description: "checks if the given Beam stream is online",
      process: function(bot,msg,suffix){
          require("request")("https://beam.pro/api/v1/channels/"+suffix,
          function(err,res,body){
              var data = JSON.parse(body);
              if(data.user){
                  msg.channel.sendMessage(suffix
                      +" is online, playing "
                      +"\n"+data.type.name
                      +"\n"+data.online
                      +"\n"+data.thumbnail.url)
              }else{
                  msg.channel.sendMessage(suffix+" is offline")
              }
          });
      }
  },
  "twitch": {
    usage: "<stream>",
    description: "checks if the given stream is online",
    process: function(bot,msg,suffix){
      try{
        require("request")("https://api.twitch.tv/kraken/streams/"+suffix,
        function(err,res,body){
          var stream = JSON.parse(body);
          if(stream.stream){
            msg.channel.sendMessage(suffix
              +" is online, playing "
              +stream.stream.game
              +"\n"+stream.stream.channel.status
              +"\n"+stream.stream.preview.large)
          }else{
            msg.channel.sendMessage(suffix+" is offline")
          }
        });
      }catch(err){
        console.log(err);
      }
    }
  },
  "xkcd": {
    usage: "[comic number]",
    description: "displays a given xkcd comic number (or the latest if nothing specified",
    process: function(bot,msg,suffix){
      var url = "http://xkcd.com/";
      if(suffix != "") url += suffix+"/";
      url += "info.0.json";
      require("request")(url,function(err,res,body){
        try{
          var comic = JSON.parse(body);
          msg.channel.sendMessage(comic.title+"\n"+comic.img,function(){
              msg.channel.sendMessage(comic.alt)
          });
        }catch(e){
          msg.channel.sendMessage("Couldn't fetch an XKCD for "+suffix);
        }
      });
    }
  },
  "watchtogether": {
    usage: "[video url (Youtube, Vimeo)",
    description: "Generate a watch2gether room with your video to watch with your little friends!",
    process: function(bot,msg,suffix){
      var watch2getherUrl = "https://www.watch2gether.com/go#";
      msg.channel.sendMessage("watch2gether link",function(){
        msg.channel.sendMessage(watch2getherUrl + suffix)
      })
    }
  },
  "uptime": {
    usage: "",
    description: "returns the amount of time since the bot started",
    process: function(bot,msg,suffix){
      var now = Date.now();
      var msec = now - startTime;
      console.log("Uptime is " + msec + " milliseconds");
      var days = Math.floor(msec / 1000 / 60 / 60 / 24);
      msec -= days * 1000 * 60 * 60 * 24;
      var hours = Math.floor(msec / 1000 / 60 / 60);
      msec -= hours * 1000 * 60 * 60;
      var mins = Math.floor(msec / 1000 / 60);
      msec -= mins * 1000 * 60;
      var secs = Math.floor(msec / 1000);
      var timestr = "";
      if(days > 0) {
        timestr += days + " days ";
      }
      if(hours > 0) {
        timestr += hours + " hours ";
      }
      if(mins > 0) {
        timestr += mins + " minutes ";
      }
      if(secs > 0) {
        timestr += secs + " seconds ";
      }
      msg.channel.sendMessage("Uptime: " + timestr);
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
          try{
            var count = 1;
            if(suffix != null && suffix != "" && !isNaN(suffix)){
              count = suffix;
            }
            if (count > 5)
              count = 5;

            rssfeed(bot,msg.channel,this.url,count,false);
          }
          catch(err){
            console.log(err);
          }
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
  autoresponses = require("./autoresponse.json");
} catch(e) {
  //no autoresponses defined
  autoresponses = {};
}

try{
  rssupdaters = require("./rssupdater.json");
} catch(e) {
  //no autoresponses defined
  rssupdaters = {};
}

setInterval(function(){
  for(var updater in rssupdaters) {
    getlatestrss(updater, rssFeeds[updater].url);
  }
}, 10*1000);

setInterval(function(){
  try{
    var updated = false;
    for(var rss in rssupdaters) {
      var latest = rssupdaters[rss].latest;
      if (!latest)
        continue;

      Object.keys(rssupdaters[rss]).forEach(function(key){
        var val = rssupdaters[rss][key];
        if (val != latest){
          var channel = client.Channels.get(key);
          if (channel){
            channel.sendMessage(latest);
            rssupdaters[rss][key] = latest;
            updated = true;
          }
        }
      });
    }
  } catch (err){
    console.log(err);
  } finally {
    if (updated)
      require("fs").writeFile("./rssupdater.json",JSON.stringify(rssupdaters,null,2), null);
  }
}, 10*1000);

try{
	messagebox = require("./messagebox.json");
} catch(e) {
	//no stored messages
	messagebox = {};
}
function updateMessagebox(){
	require("fs").writeFile("./messagebox.json",JSON.stringify(messagebox,null,2), null);
}

function rssfeed(bot,channel,url,count,full){
    var FeedParser = require('feedparser');
    var feedparser = new FeedParser();
    var request = require('request');
    request(url).pipe(feedparser);
    feedparser.on('error', function(error){
        channel.sendMessage("failed reading feed: " + error);
    });
    var shown = 0;
    feedparser.on('readable',function() {
        var stream = this;
        shown += 1
        if(shown > count){
            return;
        }
        var item = stream.read();
        channel.sendMessage(item.title + " - " + item.link, function() {
            if(full === true){
                var text = htmlToText.fromString(item.description,{
                    wordwrap:false,
                    ignoreHref:true
                });
                channel.sendMessage(text);
            }
        });
        stream.alreadyRead = true;
    });
}

function getlatestrss(updaterentry, url){
    var FeedParser = require('feedparser');
    var feedparser = new FeedParser();
    var request = require('request');
    request(url).pipe(feedparser);
    feedparser.on('error', function(error){
      if (rssupdaters[updaterentry].latest != "failed reading feed: " + error){
        rssupdaters[updaterentry].latest = "failed reading feed: " + error;
        require("fs").writeFile("./rssupdater.json",JSON.stringify(rssupdaters,null,2), null);
      }
      return;
    });
    var shown = 0;
    var count = 1;
    feedparser.on('readable',function() {
        var stream = this;
        shown += 1
        if(shown > count)
            return;
        var item = stream.read();
        stream.alreadyRead = true;
        if (rssupdaters[updaterentry].latest != item.link){
          rssupdaters[updaterentry].latest = item.link;
          require("fs").writeFile("./rssupdater.json",JSON.stringify(rssupdaters,null,2), null);
        }
        return;
    });
}

const Events = Discordie.Events;
const client = new Discordie();

client.connect({
  token: AuthDetails.discord_bot_key
})

client.Dispatcher.on(Events.GATEWAY_READY, e=>{
  loadFeeds();
  console.log('Connected as: ' + client.User.username);
  console.log("Ready to begin! Serving in " + client.Channels.length + " channels");
	require("./plugins.js").init();
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

    autoresponse = autoresponses[cmdTxt]
    if (autoresponse){
      console.log(cmdTxt + " is an auto response, replying with " + autoresponse[0]);
      e.message.channel.sendMessage(autoresponse[0]);
      return;
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
      e.message.author.openDM().then(function(dm){
        dm.sendMessage();
        var info = e.message.author.mention + ": Available Commands: \n";
  			for(var cmd in commands) {
  				info += "!" + cmd;
  				var usage = commands[cmd].usage;
  				if(usage){
  					info += " " + usage;
  				}
  				/*var description = commands[cmd].description;
  				if(description){
  					info += "\n\t" + description;
  				}*/
          info += "\n";
  			}
        dm.sendMessage(info);
      });
    }
    else if (cmd){
      try{
        console.log("Processing command: " + cmdTxt);
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
	console.log(e.user.username + " went " + e.user.status);
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
