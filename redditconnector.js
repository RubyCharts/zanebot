'use strict';
const Https = require('https');
const Fs = require('fs');

// how often to poll reddit (5 minutes)
const CYCLE_TIME = (1000 * 60) * 5;
const REDDIT_USER = 'https://www.reddit.com/user/';

const printLine = (x, sendMsg) => {
    sendMsg(new Date(x.time).toUTCString().split(' ')[4] + ' ' + x.url + ' ' + x.body);
};

const parse = (data) => {
    const out = [];
    data.data.children.forEach((x) => {
        const date = Number(x.data.created_utc + '000');
        const url = 'https://reddit.com/r/' + x.data.subreddit + '/comments/' +
            x.data.link_id.slice(3) + '//' + x.data.name.slice(3);
        out.push({ time: date, url: url, body: x.data.body.replace(/\n/g, ' ') });
    });
    return out;
};

const checkHistory = (dat, sendMsg) => {
    Fs.readFile('./state.json', (err, ret) => {
        let dataStr = '';
        if (err) {
            if (err.code !== 'ENOENT') { throw err; }
        } else {
            dataStr = ret.toString('utf8');
        }
        const data = dataStr.split('\n').filter((x)=>(x)).map(JSON.parse);
        const known = {};
        data.forEach((d) => { known[d.url] = 1; });
        const out = dat.filter((d) => (!known[d.url]));
        out.sort((a, b) => ( a.time - b.time ));
        Fs.writeFile('./state.json', dat.map(JSON.stringify).join('\n'), (err) => {
            if (err) { throw err; }
            //out.forEach((line) => { console.log(line) });
            out.forEach((line) => { printLine(line, sendMsg); });
        });
    });
};

const run = (url, sendMsg) => {
    Https.get(url + '.json', (ret) => {
        const dat = [];
        ret.on('data', (d) => { dat.push(d); });
        ret.on('end', () => {
            const data = dat.map((x)=>(x.toString('utf8'))).join('');
            try {
                const parsed = parse(JSON.parse(data));
                checkHistory(parsed, sendMsg);
            } catch (e) {
                console.log('error could not handle [' + data + ']');
                console.log(e.stack);
            }
        });
    }).on('error', (e) => {
        throw e;
    });
};

module.exports.trackRedditUser = (user, sendMsg) => {
    const url = REDDIT_USER + user;
    run(url, sendMsg);
    setInterval(() => { run(url, sendMsg); }, CYCLE_TIME);
};
