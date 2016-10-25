import {Howler} from 'howler';
import {rand, cap} from 'util/helpers';
import {MODE} from './constants';

export default class SoundManager {
  constructor(config) {
    this.config = config;
    this.paddleSounds = [];
    this.tableSounds = [];
    this.floorSounds = [
      new Howl({
        src: `/audio/floor0.ogg`,
      }),
      new Howl({
        src: `/audio/floor1.ogg`,
      }),
    ];
    for (let i = 0; i <= 5; i++) {
      this.paddleSounds.push(new Howl({
        src: `/audio/paddle${i}.ogg`,
      }));
      this.tableSounds.push(new Howl({
        src: `/audio/table${i}.ogg`,
      }));
    }
  }

  paddle(point={x: 0, y: 0, z: 0}) {
    point = point || {x: 0, y: 0, z: 0};
    let i = rand(0, this.paddleSounds.length);
    this.paddleSounds[i].pos(point.x, point.y, point.z);
    this.paddleSounds[i].play();
  }

  table(point={x: 0, y: 0, z: 0}, velocity={x: 0, y: 0, z: 0}) {
    if (point.y > this.config.tableHeight + 0.1 && this.config.mode === MODE.MULTIPLAYER) {
      // ball hit vertical table but its not visible
      return;
    }
    let i = rand(0, this.tableSounds.length);
    this.tableSounds[i].pos(point.x, point.y, point.z);
    if (point.y > this.config.tableHeight + 0.1) {
      // ball hit vertical table half, use z velocity as volume
      this.tableSounds[i].volume(cap(velocity.z * -0.5, 0, 1));
    } else {
      // ball hit horizontal table, use y velocity as volume
      this.tableSounds[i].volume(cap(velocity.y * -0.5, 0, 1));
    }
    this.tableSounds[i].play();
  }

  gameOver() {
    return;
    this.gameOverSound.play();
  }
}
