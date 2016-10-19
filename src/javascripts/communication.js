import deepstream from 'deepstream.io-client-js';
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

    this.connectToServer();
  }

  setCallbacks(callbacks) {
    this.callbacks = callbacks;
  }

  connectToServer() {
    // connect to the deepstream server
    return new Promise((resolve, reject) => {
      this.client = deepstream('192.168.1.5:6020').login();
      this.client.on('connectionStateChanged', e => {
        if (e === deepstream.CONSTANTS.CONNECTION_STATE.OPEN) {
          resolve();
        }
      });
    });
  }

  tryConnecting(id) {
    return new Promise((resolve, reject) => {
      this.GAME_ID = id;
      this.isHost = false;
      this.setRecords();
      this.statusRecord.set('player-2', {action: ACTION.CONNECT});
      this.startListening();
      resolve();
    });
  }

  openRoom() {
    this.isHost = true;
    this.GAME_ID = randomstring.generate({
      length: 4,
      capitalization: 'uppercase',
      readable: true,
    });
    this.setRecords();
    this.startListening();
    return this.GAME_ID;
  }

  setRecords() {
    this.statusRecord = this.client.record.getRecord(`${this.GAME_ID}-status`);
    this.paddleRecord = this.client.record.getRecord(`${this.GAME_ID}-paddle`);
    this.hitRecord = this.client.record.getRecord(`${this.GAME_ID}-hit`);
    this.missRecord = this.client.record.getRecord(`${this.GAME_ID}-miss`);
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
    this.statusRecord.subscribe(`player-${this.isHost ? 2 : 1}`, value => {
      switch (value.action) {
        case ACTION.CONNECT:
          this.emitter.emit(EVENT.OPPONENT_CONNECTED);
          break;
        case ACTION.DISCONNECT:
          this.emitter.emit(EVENT.OPPONENT_DISCONNECTED);
          break;
        case ACTION.REQUEST_COUNTDOWN:
          this.callbacks.requestCountdown();
          break;
        case ACTION.RESTART_GAME:
          this.callbacks.restartGame();
          break;
      }
    });
    this.paddleRecord.subscribe(`player-${this.isHost ? 2 : 1}`, value => {
      this.callbacks.move(value);
    });
    this.hitRecord.subscribe(`player-${this.isHost ? 2 : 1}`, value => {
      this.callbacks.hit(value);
    });
    this.missRecord.subscribe(`player-${this.isHost ? 2 : 1}`, value => {
      this.callbacks.miss(value);
    });
  }

  sendMove(x, y) {
    this.paddleRecord.set(`player-${this.isHost ? 1 : 2}`, {x, y});
  }

  sendHit(point, velocity, addBall=false) {
    this.hitRecord.set(`player-${this.isHost ? 1 : 2}`, {point, velocity, addBall});
  }

  sendMiss(point, velocity, ballHasHitEnemyTable) {
    this.missRecord.set(`player-${this.isHost ? 1 : 2}`, {point, velocity, ballHasHitEnemyTable});
  }

  sendRestartGame() {
    this.statusRecord.set(`player-${this.isHost ? 1 : 2}`, {action: ACTION.RESTART_GAME});
  }

  sendRequestCountdown() {
    this.statusRecord.set(`player-${this.isHost ? 1 : 2}`, {action: ACTION.REQUEST_COUNTDOWN});
  }
}
