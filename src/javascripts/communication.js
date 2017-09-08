import deepstream from 'deepstream.io-client-js/dist/deepstream';
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
    this.latency = 100;
    this.isHost = undefined;
    this.pingNumber = 0;
    this.pingInterval = null;
    this.isOpponentConnected = false;
    this.availableServers = [
      'wss://konter-eu-1.madebywild.com:6020',
    ];
    // chunk available characters into n parts where n is the number of servers
    this.availablePrefixes = chunk(
      availableChars,
      Math.floor(availableChars.length / this.availableServers.length)
    );

    // will store the timestamps of the pings
    this.pings = {};
    // will store the roundtriptimes in ms
    this.roundTripTimes = [];

    $(window).on('beforeunload', () => {
      if (this.isOpponentConnected) {
        // tell opponent we disconnected
        this.statusRecord.set(`player-${this.isHost ? 1 : 2}`, {action: ACTION.DISCONNECT});
      }
      if (this.statusRecord) {
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
            && e !== deepstream.CONSTANTS.CONNECTION_STATE.CLOSED
            && e !== deepstream.CONSTANTS.CONNECTION_STATE.RECONNECTING) {
          // we're in
          clearTimeout(timeout);
          client.close();
          resolve(hostIndex);
        }
      });
    });
  }

  chooseClosestServer() {
    // try connecting to every available server, choose the one that answers first
    return new Promise((resolve, reject) => {
      Promise.race(this.availableServers.map((server, index) => this.pingServer(index))).then(fastestServer => {
        if (fastestServer === 'timeout') {
          reject(fastestServer);
          return;
        }
        this.chosenServer = fastestServer;
        // eslint-disable-next-line
        return this.connectToServer(this.availableServers[fastestServer]);
      }).then(() => {
        resolve();
      }).catch(e => {
        console.warn(`error:  ${e}`);
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
      this.client = deepstream(host, {
        mergeStrategy: deepstream.MERGE_STRATEGIES.REMOTE_WINS,
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
    // try to connect to a given room id. the first character is a code for
    // which server the opponent is connected to. in case of 2 servers, the
    // first half of the available characters is reserved for the first server,
    // the second half is reserved for the second server. this way we can still
    // have as many random combinations with 4 letters.
    this.isHost = false;
    return new Promise((resolve, reject) => {
      let serverIndex = -1;
      this.availablePrefixes.forEach((prefixes, index) => {
        if (prefixes.indexOf(id[0]) !== -1) {
          serverIndex = index;
        }
      });
      if (serverIndex === -1) {
        // impossible room code, there is no prefix like that
        reject('no room found');
      }
      this.connectToServer(this.availableServers[serverIndex]).then(() => {
        this.GAME_ID = id;
        this.isHost = false;
        this.setRecords();
        this.statusRecord.subscribe('room-is-open', value => {
          if (value) {
            this.startListening();
            this.statusRecord.set('player-2', {action: ACTION.CONNECT});
            this.isOpponentConnected = true;
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
        ping: true,
      });
      this.pingNumber += 1;
      if (this.pingNumber >= 20) {
        clearInterval(this.pingInterval);
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
    this.statusRecord.subscribe(`player-${this.isHost ? 2 : 1}`, value => {
      switch (value.action) {
        case ACTION.CONNECT:
          setTimeout(this.sendPings.bind(this), 1000);
          this.statusRecord.set('room-is-open', false);
          this.isOpponentConnected = true;
          this.emitter.emit(EVENT.OPPONENT_CONNECTED);
          break;
        case ACTION.DISCONNECT:
          this.isOpponentConnected = false;
          this.emitter.emit(EVENT.OPPONENT_DISCONNECTED);
          break;
        case ACTION.PAUSE:
          if (this.isOpponentConnected) {
            this.emitter.emit(EVENT.OPPONENT_PAUSED);
          }
          break;
        case ACTION.UNPAUSE:
          if (this.isOpponentConnected) {
            this.emitter.emit(EVENT.OPPONENT_UNPAUSED);
          }
          break;
        case ACTION.REQUEST_COUNTDOWN:
          this.callbacks.receivedRequestCountdown();
          break;
        case ACTION.RESTART_GAME:
          this.callbacks.receivedRestartGame();
          break;
        default:
          console.warn('unknown action');
      }
    });
    if (this.isHost) {
      this.paddle2Record.subscribe('position', value => {
        this.callbacks.receivedMove(value);
      });
    } else {
      this.paddle1Record.subscribe('position', value => {
        this.callbacks.receivedMove(value);
      });
    }
    this.hitRecord.subscribe(`player-${this.isHost ? 2 : 1}`, value => {
      this.callbacks.receivedHit(value);
    });
    this.missRecord.subscribe(`player-${this.isHost ? 2 : 1}`, value => {
      this.callbacks.receivedMiss(value);
    });
    for (let i = 0; i < 20; i += 1) {
      // make 20 ping records so the pings don't get mixed up
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
    // insert timestamp so the record is actually updated
    // in case we reset it twice with the same values
    this.hitRecord.set(`player-${this.isHost ? 1 : 2}`, {
      point,
      velocity,
      t: Date.now(),
    });
  }

  sendMiss(point, velocity, ballHasHitEnemyTable, isInit = false) {
    this.missRecord.set(`player-${this.isHost ? 1 : 2}`, {
      point,
      velocity,
      ballHasHitEnemyTable,
      isInit,
      t: Date.now(),
    });
  }

  sendRestartGame() {
    this.statusRecord.set(`player-${this.isHost ? 1 : 2}`, {
      action: ACTION.RESTART_GAME,
      t: Date.now(),
    });
  }

  sendRequestCountdown() {
    this.statusRecord.set(`player-${this.isHost ? 1 : 2}`, {
      action: ACTION.REQUEST_COUNTDOWN,
      t: Date.now(),
    });
  }

  sendPause() {
    this.statusRecord.set(`player-${this.isHost ? 1 : 2}`, {
      action: ACTION.PAUSE,
      t: Date.now(),
    });
  }

  sendUnpause() {
    this.statusRecord.set(`player-${this.isHost ? 1 : 2}`, {
      action: ACTION.UNPAUSE,
      t: Date.now(),
    });
  }
}
