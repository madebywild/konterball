import Peer from 'peerjs';
import {ACTION} from './constants';

export default class Communication {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.connectionIsOpen = false;
    this.conn = null;
    this.id = navigator.userAgent.indexOf('Macintosh') === -1 ? 'peer1' : 'peer2';
    this.peer = new Peer(this.id, {host: '192.168.1.182', port: 9000, path: '/'});


    // connect to the peer server
    this.peer.on('open', () => {
      if (this.connectionIsOpen) return;
      this.connectionIsOpen = true;
    });


    this.listen = this.id === 'peer2';
    if (this.listen) {
      this.peer.on('connection', c => {
        if (this.conn) {
          c.close();
          return;
        }
        this.conn = c;
        this.connectionIsOpen = true;
        this.startListening();
      });

    } else {
      this.peer.on('open', () => {
        this.conn = this.peer.connect(this.id === 'peer1' ? 'peer2' : 'peer1');
        this.conn.on('open', () => {
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
