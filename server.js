'use strict';

let express = require('express');
let fallback =  require('express-history-api-fallback');
let app = express();
let ExpressPeerServer = require('peer').ExpressPeerServer;

const root = `${__dirname}/public`;

app.use(express.static(root));

app.use(fallback('index.html', {root}))

let server = app.listen(8080);

let peerServer = ExpressPeerServer(server, {})
app.use('/api', peerServer);

console.log('listening');


// peerServer.on('connection', id => {
//   // console.log(id);
// });
