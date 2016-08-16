const Config = require('./config.js');
const Slackbots = require('slackbots');
const Connector = require('./redditconnector');

const bot = new Slackbots({
    token: Config.token,
    name: 'cjdbot'
});
bot.on('start', () => {
    config.follow.forEach((person) => {
        Connector.trackRedditUser('zanetackett', (msg) => {
            bot.postMessageToChannel(config.channel, person + ': ' + msg);
        });
    });
});
