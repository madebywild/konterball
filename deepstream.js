'use strict';

const express = require('express');
const fallback = require('express-history-api-fallback');
const DeepstreamServer = require('deepstream.io');
const C = DeepstreamServer.constants;

const app = express();
const port = process.env.PORT || 8081;
const root = `${__dirname}/public`;

// serve statically through express
// TODO: serve through nginx later for better performance or use CDN
app.use(express.static(root));

// start the main express server
app.listen(port);

// route everthing else back to the index.html for the SPA to work nicely
// NOTE: it's important to load this after the /api route to not overwrite it
app.use(fallback('index.html', {root}));

// setup deepstream server
const server = new DeepstreamServer({
  host: 'localhost',
  port: 6020,
});

// start the server
server.start();
