import Peer from 'peerjs';

export default class Communication {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.connectionIsOpen = false;
    this.conn = null;
    this.id = navigator.userAgent.indexOf('Macintosh') === -1 ? 'peer1' : 'peer2';
    console.log('MY ID: ' + this.id);
    this.peer = new Peer(this.id, {host: '192.168.1.182', port: 9000, path: '/'});


    // connect to the peer server
    this.peer.on('open', () => {
      if (this.connectionIsOpen) return;
      console.log('connection opened!');
      this.connectionIsOpen = true;
    });


    this.listen = this.id === 'peer2';
    if (this.listen) {
      console.log('WAITING FOR OPPONENT');
      this.peer.on('connection', c => {
        if (this.conn) {
          c.close();
          return;
        }
        this.conn = c;
        console.log('connection opened!');
        this.connectionIsOpen = true;
        this.startListening();
      });

    } else {
      console.log('CONNECTING TO OPPONENT');
      this.peer.on('open', () => {
        this.conn = this.peer.connect(this.id === 'peer1' ? 'peer2' : 'peer1');
        this.conn.on('open', () => {
          this.startListening();
        });
      });
    }

  }

  startListening() {
    console.log('Connected');
    this.conn.on('data', data => {
      switch (data.action) {
        case 'move':
          this.callbacks.move(data);
          break;
        case 'hit':
          console.log('received hit');
          this.callbacks.hit(data);
          break;
        case 'miss':
          console.log('received miss');
          this.callbacks.miss(data);
          break;
      }
    });
  }

  sendMove(x, y) {
    if (!this.conn) return;
    this.conn.send({
      action: 'move',
      x: x,
      y: y,
    });
  }

  sendHit(point, velocity) {
    if (!this.conn) return;
    console.log('sending hit');
    this.conn.send({
      action: 'hit',
      point: point,
      velocity: velocity,
    });
  }

  sendMiss() {
    if (!this.conn) return;
    console.log('sending miss');
    this.conn.send({
      action: 'miss',
    });
  }
}
