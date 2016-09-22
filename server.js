'use strict';

const express = require('express');
const fallback = require('express-history-api-fallback');
const app = express();
const expressPeerServer = require('peer').ExpressPeerServer;

const port = process.env.PORT || 8081;
const root = `${__dirname}/public`;

// serve statically through express TODO: serve through nginx later for better performance or use CDN
app.use(express.static(root));

// start the main express server
let server = app.listen(port);

// create a peer server to hook into express
let peerServer = expressPeerServer(server, {});

// map the peer onto the /api route
app.use('/api', peerServer);

// route everthing else back to the index.html for the SPA to work nicely
// NOTE: it's important to load this after the /api route to not overwrite it
app.use(fallback('index.html', {root}));

console.log(`Google PingPong Server listening on port ${port}.`);
