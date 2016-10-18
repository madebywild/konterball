import Peer from 'peerjs';
import randomstring from 'randomstring';
import {ACTION, INITIAL_CONFIG, EVENT} from './constants';
import $ from 'jquery';

export default class Communication {
  constructor(emitter) {
    this.emitter = emitter;
    this.callbacks = {};
    this.connectionIsOpen = false;
    this.opponentConnected = false;
    this.latency = null;
    this.conn = null;
    this.reliableConn = null;
    this.isHost = undefined;
    this.lastPings = [];

    this.id = randomstring.generate({
      length: INITIAL_CONFIG.ROOM_CODE_LENGTH,
      capitalization: 'uppercase',
      readable: true,
    });

    this.peer = new Peer(this.id, {host: location.hostname, port: 80, path: '/api'});
    this.connectToServer();
  }

  setCallbacks(callbacks) {
    this.callbacks = callbacks;
  }

  connectToServer() {
    // connect to the peer server
    return new Promise((resolve, reject) => {
      console.log('connecting to server...');
      if (this.connectionIsOpen) {
        console.log('already open');
        resolve();
      }
      this.peer.on('open', () => {
        console.log('connected');
        this.connectionIsOpen = true;
        resolve();
      });
      this.peer.on('error', e => {
        alert(e);
        reject(e);
      });
    });
  }

  tryConnecting(id) {
    return new Promise((resolve, reject) => {
      this.connectToServer().then(() => {
        this.conn = this.peer.connect(id);
        this.conn.on('open', () => {
          this.isHost = false;
          this.opponentConnected = true;
          this.startListening();
          resolve('connected');
        });
        this.conn.on('error', e => {
          reject(e);
        });
        this.conn.on('close', () => {
          this.connectionClosed();
        });
      }).catch(e => {
        alert(e);
        reject(e);
      });
    });
  }

  openRoom() {
    this.isHost = true;
    // use my id as a room code and listen for incoming connections
    this.peer.on('connection', c => {
      if (this.conn) {
        c.close();
        return;
      }
      this.emitter.emit(EVENT.OPPONENT_CONNECTED);

      this.conn = c;
      this.opponentConnected = true;
      this.startListening();
      this.conn.on('close', () => {
        this.connectionClosed();
      });
    });
    return this.id;
  }

  connectionClosed() {
    this.emitter.emit(EVENT.OPPONENT_DISCONNECTED);
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
        case ACTION.RESTART_GAME:
          this.callbacks.restartGame(data);
          break;
        case ACTION.REQUEST_COUNTDOWN:
          this.callbacks.requestCountdown(data);
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

  sendHit(point, velocity, addBall=false) {
    if (!this.conn) return;
    this.conn.send({
      action: ACTION.HIT,
      point: point,
      velocity: velocity,
      addBall: addBall,
    });
  }

  sendMiss(point, velocity, ballHasHitEnemyTable) {
    if (!this.conn) return;
    this.conn.send({
      action: ACTION.MISS,
      point: point,
      velocity: velocity,
      ballHasHitEnemyTable: ballHasHitEnemyTable,
    });
  }

  sendRestartGame() {
    if (!this.conn) return;
    this.conn.send({
      action: ACTION.RESTART_GAME,
    });
  }

  sendRequestCountdown() {
    if (!this.conn) return;
    this.conn.send({
      action: ACTION.REQUEST_COUNTDOWN,
    });
  }
}
