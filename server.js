'use strict';

const fallback = require('express-history-api-fallback');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
// io.engine.ws = new (require('uws').Server)({
//   noServer: true,
//   perMessageDeflate: false
// });

const port = process.env.PORT || 8081;
const root = `${__dirname}/public`;

server.listen(port);

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

app.use(fallback('index.html', {root}));

console.log(`Google PingPong Server listening on port ${port}.`);
