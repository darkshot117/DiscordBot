var Discordie = require('discordie');

const Events = Discordie.Events;
const client = new Discordie();

  token: 'MjI2MTY1Mzk3NDQ2MDY2MTc4.Crzogw.esctG7eWnD1jLXqWu6LfzWqFn1k'
})
client.Dispatcher.on(Events.GATEWAY_READY, e=>{
});

client.Dispatcher.on(Events.MESSAGE_CREATE, e=>{
  if (e.message.content == 'PING'){
    e.message.channel.sendMessage('PONG');
  }

console.log('Node is installed!');
