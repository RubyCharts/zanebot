'use strict';
const Https = require('https');
const Fs = require('fs');
const setRandInterval = require('setrandinterval');

// how often to poll reddit (5 minutes)
const CYCLE_TIME = (1000 * 60) * 5;
const REDDIT_USER = 'https://www.reddit.com/user/';
const STATE_FILE = './state.json';

const parse = (data) => {
    const out = [];
    data.data.children.forEach((x) => {
        const date = Number(x.data.created_utc + '000');
        const url = 'https://reddit.com/r/' + x.data.subreddit + '/comments/' +
            x.data.link_id.slice(3) + '//' + x.data.name.slice(3);
        out.push({ time: date, url: url, body: x.data.body });
    });
    return out;
};

const run = (url, sendMsg, stream, knownURLs, name) => {
    Https.get(url + '.json', (ret) => {
        const dat = [];
        ret.on('data', (d) => { dat.push(d); });
        ret.on('end', () => {
            const data = dat.map((x)=>(x.toString('utf8'))).join('');
            try {
                const parsed = parse(JSON.parse(data));
                const out = parsed.filter((d) => (!knownURLs[d.url]));
                out.sort((a, b) => ( a.time - b.time ));
                out.forEach((line) => {
                    knownURLs[line.url] = true;
                    line.from = name;
                    stream.write(JSON.stringify(line) + '\n');
                    sendMsg(line);
                });
            } catch (e) {
                console.log('error could not handle [' + data + ']');
                console.log(e.stack);
            }
        });
    }).on('error', (e) => {
        console.log(e.stack);
    });
};

let globalLock = false;
module.exports.trackUsers = (names, sendMsg) => {
    if (globalLock) { throw new Error("already tracking"); }
    globalLock = true;

    Fs.readFile(STATE_FILE, (err, ret) => {
        let dataStr = '';
        if (err) {
            if (err.code !== 'ENOENT') { throw err; }
        } else {
            dataStr = ret.toString('utf8');
        }
        const data = dataStr.split('\n').filter((x)=>(x)).map(JSON.parse);
        const knownURLs = {};
        data.forEach((d) => { knownURLs[d.url] = true; });
        const stream = Fs.createWriteStream(STATE_FILE, {'flags': 'a'});

        names.forEach((name) => {
            const url = REDDIT_USER + name;
            const r = () => {
                run(url, sendMsg, stream, knownURLs, name);
            };
            setRandInterval(r, CYCLE_TIME);
            r();
        })
    });
};
