import {Howler} from 'howler';

export default class SoundManager {
  constructor() {
    this.playerSound = new Howl({
      src: ['/audio/pongsound.mp3', '/audio/pongsound.wav']
    });
    this.gameOverSound = new Howl({
      src: ['/audio/gameover.mp3', '/audio/gameover.wav']
    });
  }

  hit(point) {
    point = point || {x: 0, y: 0, z: 0};
    this.playerSound.pos(point.x, point.y, point.z);
    this.playerSound.play();
  }

  gameOver() {
    this.gameOverSound.play();
  }
}
