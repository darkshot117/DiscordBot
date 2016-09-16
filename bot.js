try{
  //var Discordie = require('discordie');
  var Discord = require('discord.js');
} catch (e){
  console.log(e.stack);
  console.log(process.version);
  console.log("Please run npm install and ensure it passes with no errors!");
  process.exit();
}

try{
  var yt = require("./youtube_plugin");
  var youtube_plugin = new yt();
}catch(e){
  console.log("couldn't load youtube plugin!\n"+e.stack);
}

try {
	var wa = require("./wolfram_plugin");
	var wolfram_plugin = new wa();
} catch(e){
	console.log("couldn't load wolfram plugin!\n"+e.stack);
}

/*const Events = Discordie.Events;
const client = new Discordie();

client.connect({
  token: 'MjI2MTY1Mzk3NDQ2MDY2MTc4.Crzogw.esctG7eWnD1jLXqWu6LfzWqFn1k'
})

client.Dispatcher.on(Events.GATEWAY_READY, e=>{
  console.log('Connected as: ' + client.User.username);
});

client.Dispatcher.on(Events.MESSAGE_CREATE, e=>{
  if (e.message.content == 'PING'){
    e.message.channel.sendMessage('PONG');
  }
});

console.log('Node is installed!');*/
