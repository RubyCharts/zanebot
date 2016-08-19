const Config = require('./config.js');
const Slackbots = require('slackbots');
const Connector = require('./redditconnector');

const bot = new Slackbots({
    token: Config.token,
    name: Config.name
});
bot.on('start', () => {
    setTimeout(() => {
        Connector.trackUsers(Config.follow, (msg) => {
            const date = new Date(msg.time).toUTCString().split(' ')[4].replace(/:[0-9]+$/, '');
            const body = msg.body.replace(/\n/g, ' ');
            bot.postMessageToChannel(Config.channel, '<' + msg.url + '|' + date + '> <' + msg.from + '> ' + body);
        });
    });
});
