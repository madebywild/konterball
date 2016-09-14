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

  hit() {
    this.playerSound.play();
  }

  gameOver() {
    this.gameOverSound.play();
  }
}
