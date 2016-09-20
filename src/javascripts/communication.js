import Peer from 'peerjs';
import randomstring from 'randomstring';
import {ACTION, INITIAL_CONFIG} from './constants';
import $ from 'jquery';

export default class Communication {
  constructor(callbacks, joinRoom) {
    this.callbacks = callbacks;
    this.connectionIsOpen = false;
    this.conn = null;

    this.id = randomstring.generate({
      length: INITIAL_CONFIG.ROOM_CODE_LENGTH,
      readable: true,
    });

    this.isHost = !joinRoom;

    this.peer = new Peer(this.id, {host: '192.168.1.182', port: 8080, path: '/api'});

    // connect to the peer server
    this.peer.on('open', () => {
      if (this.connectionIsOpen) return;
      this.connectionIsOpen = true;
    });

    if (this.isHost) {
      // use my id as a room code and listen for incoming connections
      $('#room-url').val('http://192.168.1.182:8080/' + this.id);
      this.peer.on('connection', c => {
        if (this.conn) {
          c.close();
          return;
        }
        let event = new Event('opponentConnected');
        $('body')[0].dispatchEvent(event);
        this.conn = c;
        this.connectionIsOpen = true;
        this.startListening();
      });
    } else {
      // use code (from url) to connect to room host
      this.peer.on('open', () => {
        this.conn = this.peer.connect(joinRoom);
        this.conn.on('open', () => {
          setInterval(() => {
            this.conn.send({
              action: 'PING',
              time: Date.now(),
            });
          }, 1000);
          this.startListening();
        });
      });
    }
  }

  startListening() {
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
        case 'PING':
          if (this.listen) {
            console.log('PING TIME: ' + (Date.now() - data.time) / 2 + 'ms');
          } else {
            this.conn.send({
              action: 'PING',
              time: data.time,
            });
          }
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

  sendMiss() {
    if (!this.conn) return;
    this.conn.send({
      action: ACTION.MISS,
    });
  }
}
