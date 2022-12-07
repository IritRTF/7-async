const express = require('express');

const getBuh = require('./data/buh');
const getAnalytics = require('./data/analytics');
const getReqBase = require('./data/reqBase');

const app = express();
const port = 3000;
const ORGS_LIST = [
    '1027700092661',
    '1026605606620',
    '1027700070518',
    '1037739877295',
    '1106659003769',
    '1130280036040',
    '1026604939855',
    '1115000005614',
    '1106659013658',
    '1027402166835',
];

app.use(express.static('static'));

// app.all()

// // app.use((req, res, next) => {
// //     // res.status(404).send('Net');
// // });

app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err);
    }

    console.log(`server is listening on http://localhost:${port}`);
});

app.get('/orgsList', (request, response) => {
    response.json(ORGS_LIST);
});

app.get('/api3/:path', (request, response) => {
    const reqParam = request.params.path;
    if (reqParam === 'buh') {
        response.send(getBuh(request.query));
    } else if (reqParam === 'analytics') {
        response.send(getAnalytics(request.query));
    } else if (reqParam === 'reqBase') {
        response.send(getReqBase(request.query));
    } else {
        response.status(404).send();
    }
});
