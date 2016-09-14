import Physics from './physics';
import Scene from './scene';

class PingPong {
  constructor() {
    this.scene = new Scene();
    this.scene.setup();
  }
}

let p = new PingPong();
