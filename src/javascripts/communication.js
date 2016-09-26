import Peer from 'peerjs';
import randomstring from 'randomstring';
import {ACTION, INITIAL_CONFIG, EVENT} from './constants';
import $ from 'jquery';

export default class Communication {
  constructor(callbacks, joinRoom, emitter) {
    this.emitter = emitter;
    console.log(this.emitter);
    this.callbacks = callbacks;
    this.connectionIsOpen = false;
    this.opponentConnected = false;
    this.latency = null;
    this.conn = null;
    this.lastPings = [];

    this.id = randomstring.generate({
      length: INITIAL_CONFIG.ROOM_CODE_LENGTH,
      readable: true,
    });

    this.isHost = !joinRoom;

    this.peer = new Peer(this.id, {host: location.hostname, port: 80, path: '/api'});

    // connect to the peer server
    this.peer.on('open', () => {
      if (this.connectionIsOpen) return;
      this.connectionIsOpen = true;
    });

    if (this.isHost) {
      // use my id as a room code and listen for incoming connections
      this.peer.on('connection', c => {
        if (this.conn) {
          c.close();
          return;
        }
        console.log('opponent connected!');
        this.emitter.emit(EVENT.OPPONENT_CONNECTED);

        this.conn = c;
        this.connectionIsOpen = true;
        this.opponentConnected = true;
        this.startListening();
      });
    } else {
      // use code (from url) to connect to room host
      this.peer.on('open', () => {
        this.conn = this.peer.connect(joinRoom, {reliable: true});
        this.conn.on('open', () => {
          this.opponentConnected = true;
          this.startListening();
        });
      });
    }
  }

  sendPings() {
    setInterval(() => {
      console.log('SEND PING');
      this.conn.send({
        action: 'PING',
        time: Date.now(),
      });
    }, 1000);
  }

  receivedPing(data) {
    this.conn.send({
      action: 'PONG',
      time: data.time,
    });
  }

  receivedPong(data) {
    console.log('PING TIME: ' + (Date.now() - data.time) / 2 + 'ms');
  }

  startListening() {
    this.sendPings();
    this.conn.on('data', data => {
      switch (data.action) {
        case ACTION.MOVE:
          this.callbacks.move(data);
          break;
        case ACTION.HIT:
          this.callbacks.hit(data);
          break;
        case ACTION.MISS:
          this.callbacks.miss(data);
          break;
        case ACTION.PRESETCHANGE:
          this.callbacks.presetChange(data);
          break;
        case ACTION.RESTART_GAME:
          this.callbacks.restartGame(data);
          break;
        case 'PING':
          this.receivedPing(data);
          break;
        case 'PONG':
          this.receivedPong(data);
          break;
      }
    });
  }

  sendMove(x, y) {
    if (!this.conn) return;
    this.conn.send({
      action: ACTION.MOVE,
      x: x,
      y: y,
    });
  }

  sendHit(point, velocity) {
    if (!this.conn) return;
    this.conn.send({
      action: ACTION.HIT,
      point: point,
      velocity: velocity,
    });
  }

  sendMiss(point, velocity) {
    if (!this.conn) return;
    this.conn.send({
      action: ACTION.MISS,
      point: point,
      velocity: velocity,
    });
  }

  sendRestartGame() {
    if (!this.conn) return;
    this.conn.send({
      action: ACTION.RESTART_GAME,
    });
  }

  sendPresetChange(name) {
    if (!this.conn) return;
    this.conn.send({
      action: ACTION.PRESETCHANGE,
      name: name,
    });
  }
}
