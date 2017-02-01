import deepstream from 'deepstream.io-client-js';
import $ from 'zepto-modules';
import chunk from 'lodash.chunk';
import randomstring from 'randomstring';
import {ACTION, EVENT} from './constants';
import {rand} from './util/helpers';

const availableChars = '23456789QWERTZUPASDFGHJKLYXCVBNM';

export default class Communication {
  constructor(emitter) {
    this.emitter = emitter;
    this.callbacks = {};
    this.opponentConnected = false;
    this.latency = 100;
    this.conn = null;
    this.isHost = undefined;
    this.pingNumber = 0;
    this.pingInterval = null;
    this.opponentConnected = false;
    this.availableServers = [
      '138.68.98.41:6020', // frankfurt
      '104.236.73.94:6020', // new york
    ];
    this.availablePrefixes = chunk(
      availableChars,
      Math.floor(availableChars.length / this.availableServers.length)
    );

    this.pings = {};
    this.roundTripTimes = [];

    $(window).on('beforeunload', () => {
      if (this.opponentConnected) {
        // tell opponent we disconnected
        this.statusRecord.set(`player-${this.isHost ? 1 : 2}`, {action: ACTION.DISCONNECT});
      } else {
        // delete all records
        this.statusRecord.discard();
        this.statusRecord.delete();
        this.paddle1Record.discard();
        this.paddle1Record.delete();
        this.paddle2Record.discard();
        this.paddle2Record.delete();
        this.hitRecord.discard();
        this.hitRecord.delete();
        this.missRecord.discard();
        this.missRecord.delete();
        this.pingRecord.discard();
        this.pingRecord.delete();
      }
    });
  }

  setCallbacks(callbacks) {
    this.callbacks = callbacks;
  }

  pingServer(hostIndex) {
    return new Promise(resolve => {
      const client = deepstream(this.availableServers[hostIndex]);
      const timeout = setTimeout(() => {
        client.close();
        resolve('timeout');
      }, 3000);
      client.on('error', () => {
        // in case a server is down it will throw an error
        // ignore these and use timeout for determining that
      });
      client.on('connectionStateChanged', e => {
        if (e !== deepstream.CONSTANTS.CONNECTION_STATE.ERROR
            && e !== deepstream.CONSTANTS.CONNECTION_STATE.RECONNECTING) {
          clearTimeout(timeout);
          client.close();
          resolve(hostIndex);
        }
      });
    });
  }

  chooseClosestServer() {
    return new Promise((resolve, reject) => {
      Promise.race(this.availableServers.map((server, index) => this.pingServer(index))).then(fastestServer => {
        if (fastestServer === 'timeout') {
          reject(fastestServer);
          return;
        }
        this.chosenServer = fastestServer;
        console.log(`fastest response from: ${this.availableServers[fastestServer]}`);
        // eslint-disable-next-line
        return this.connectToServer(this.availableServers[fastestServer]);
      }).then(() => {
        resolve();
      }).catch(e => {
        console.log(`error:  ${e}`);
        reject(e);
      });
    });
  }

  connectToServer(host) {
    // connect to the deepstream server
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject('timeout');
      }, 2000);
      console.log(`connecting to server: ${host}`);
      this.client = deepstream(host, {
        mergeStrategy: deepstream.MERGE_STRATEGIES.REMOTE_WINS
      });
      this.client.login();
      this.client.on('error', e => {
        reject(e);
      });
      this.client.on('connectionStateChanged', e => {
        if (e === deepstream.CONSTANTS.CONNECTION_STATE.OPEN) {
          resolve();
        }
        if (e === deepstream.CONSTANTS.CONNECTION_STATE.ERROR) {
          reject('error');
        }
      });
    });
  }

  tryConnecting(id) {
    this.isHost = false;
    return new Promise((resolve, reject) => {
      let serverIndex = -1;
      this.availablePrefixes.forEach((prefixes, index) => {
        if (prefixes.indexOf(id[0]) !== -1) {
          serverIndex = index;
        }
      });
      if (serverIndex === -1) {
        reject('unknown prefix');
      }
      this.connectToServer(this.availableServers[serverIndex]).then(() => {
        console.log('connected to server, connecting to room');
        this.GAME_ID = id;
        this.isHost = false;
        this.setRecords();
        this.statusRecord.subscribe('room-is-open', value => {
          if (value) {
            this.startListening();
            this.statusRecord.set('player-2', {action: ACTION.CONNECT});
            this.opponentConnected = true;
            setTimeout(this.sendPings.bind(this), 1000);
            resolve();
          } else {
            reject('room already full');
          }
        });
        setTimeout(() => {
          reject('no room found');
        }, 2000);
      }).catch(e => {
        reject(e);
      });
    });
  }

  openRoom() {
    this.isHost = true;
    // pick a random prefix which belongs to the available prefixes for this server
    const prefix = this.availablePrefixes[this.chosenServer][rand(0, this.availablePrefixes[this.chosenServer].length)];
    this.GAME_ID = prefix + randomstring.generate({
      length: 3,
      charset: availableChars,
    });
    this.setRecords();
    this.statusRecord.set('room-is-open', true);
    this.startListening();
    return this.GAME_ID;
  }

  setRecords() {
    this.statusRecord = this.client.record.getRecord(`${this.GAME_ID}-status`);
    this.paddle1Record = this.client.record.getRecord(`${this.GAME_ID}-paddle1`);
    this.paddle2Record = this.client.record.getRecord(`${this.GAME_ID}-paddle2`);
    this.hitRecord = this.client.record.getRecord(`${this.GAME_ID}-hit`);
    this.missRecord = this.client.record.getRecord(`${this.GAME_ID}-miss`);
    this.pingRecord = this.client.record.getRecord(`${this.GAME_ID}-ping`);
  }

  sendPings() {
    this.pingInterval = setInterval(() => {
      this.pings[this.pingNumber] = Date.now();
      this.pingRecord.set(`player-${this.isHost ? 1 : 2}-ping-${this.pingNumber}`, {
        index: this.pingNumber,
        ping: true
      });
      this.pingNumber += 1;
      if (this.pingNumber >= 20) {
        clearInterval(this.pingInterval);
        console.log(this.latency);
      }
    }, 1000);
  }

  receivedPong(data) {
    const rtt = Date.now() - this.pings[data.index];
    this.roundTripTimes.push(rtt);
    this.roundTripTimes.sort((a, b) => a - b);
    // get median of all received roundtrips, divide by 2 to get the one-way-latency
    this.latency = this.roundTripTimes[Math.floor(this.roundTripTimes.length / 2)] / 2;
  }

  startListening() {
    console.log('subscribing');
    this.statusRecord.subscribe(`player-${this.isHost ? 2 : 1}`, value => {
      switch (value.action) {
        case ACTION.CONNECT:
          setTimeout(this.sendPings.bind(this), 1000);
          this.statusRecord.set('room-is-open', false);
          this.opponentConnected = true;
          this.emitter.emit(EVENT.OPPONENT_CONNECTED);
          break;
        case ACTION.DISCONNECT:
          this.opponentConnected = false;
          this.emitter.emit(EVENT.OPPONENT_DISCONNECTED);
          break;
        case ACTION.REQUEST_COUNTDOWN:
          console.log('receive request countdown');
          this.callbacks.requestCountdown();
          break;
        case ACTION.RESTART_GAME:
          this.callbacks.restartGame();
          break;
        default:
          // eslint-disable-next-line
          console.warn('unknown action');
      }
    });
    if (this.isHost) {
      this.paddle2Record.subscribe('position', value => {
        this.callbacks.move(value);
      });
    } else {
      this.paddle1Record.subscribe('position', value => {
        this.callbacks.move(value);
      });
    }
    this.hitRecord.subscribe(`player-${this.isHost ? 2 : 1}`, value => {
      this.callbacks.hit(value);
    });
    this.missRecord.subscribe(`player-${this.isHost ? 2 : 1}`, value => {
      this.callbacks.miss(value);
    });
    for (let i = 0; i < 20; i += 1) {
      this.pingRecord.subscribe(`player-${this.isHost ? 2 : 1}-ping-${i}`, value => {
        if (value.ping) {
          this.pingRecord.set(`player-${this.isHost ? 1 : 2}-ping-${value.index}`, {
            index: value.index,
            pong: true,
          });
        } else {
          this.receivedPong(value);
        }
      });
    }
  }

  sendMove(position, rotation) {
    if (this.isHost) {
      this.paddle1Record.set('position', {position, rotation});
    } else {
      this.paddle2Record.set('position', {position, rotation});
    }
  }

  sendHit(point, velocity) {
    // TODO remove date testing in prod
    this.hitRecord.set(`player-${this.isHost ? 1 : 2}`, {point, velocity, time: Date.now()});
  }

  sendMiss(point, velocity, ballHasHitEnemyTable, isInit = false) {
    // insert random value so the record is actually updated
    // in case we reset it twice with the same values
    this.missRecord.set(`player-${this.isHost ? 1 : 2}`, {
      point,
      velocity,
      ballHasHitEnemyTable,
      isInit,
      v: Math.random(),
    });
  }

  sendRestartGame() {
    // insert random value so the record is actually updated
    this.statusRecord.set(`player-${this.isHost ? 1 : 2}`, {
      action: ACTION.RESTART_GAME,
      v: Math.random(),
    });
  }

  sendRequestCountdown() {
    console.log('send request countdown:');
    console.log(`player-${this.isHost ? 1 : 2}`, {action: ACTION.REQUEST_COUNTDOWN});
    this.statusRecord.set(`player-${this.isHost ? 1 : 2}`, {action: ACTION.REQUEST_COUNTDOWN, v: Math.random()});
  }
}
