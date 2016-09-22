'use strict';

let express = require('express');
let fallback =  require('express-history-api-fallback');
let app = express();
let ExpressPeerServer = require('peer').ExpressPeerServer;

const port = process.env.PORT || 8080;

const root = `${__dirname}/public`;
if (process.env.NODE_ENV !== "staging" && process.env.NODE_ENV !== "production") {
  app.use(express.static(root));
  app.use(fallback('index.html', {root}))
}

let server = app.listen(port);

let peerServer = ExpressPeerServer(server, {})
app.use('/api', peerServer);

console.log('listening');


// peerServer.on('connection', id => {
//   // console.log(id);
// });
