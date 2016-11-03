import {Howler} from 'howler';
import {rand, cap} from 'util/helpers';
import {MODE} from './constants';
import $ from 'jquery';

const url = `https://s3.eu-central-1.amazonaws.com/pingpongsound/`;

export default class SoundManager {
  constructor(config) {
    this.config = config;
    this.muted = false;
    this.paddleSounds = [];
    this.tableSounds = [];
    for (let i = 1; i <= 3; i++) {
      this.paddleSounds.push(new Howl({
        src: `${url}racket0${i}.mp3`,
      }));
      this.tableSounds.push(new Howl({
        src: `${url}table0${i}.mp3`,
      }));
    }
    this.uiSounds = new Map();
    this.uiSounds.set('button', new Howl({src: `${url}button.mp3`}));
    this.uiSounds.set('joined', new Howl({src: `${url}joined.mp3`}));
    this.uiSounds.set('lose', new Howl({src: `${url}lose.mp3`}));
    this.uiSounds.set('touch', new Howl({src: `${url}touch.mp3`}));
    this.uiSounds.set('transition', new Howl({src: `${url}transition.mp3`}));
    this.uiSounds.set('win', new Howl({src: `${url}win.mp3`}));

    this.loopSounds = new Map();
    this.loopSounds.set('game1', new Howl({loop: true, src: `${url}music_game01.mp3`}));
    this.loopSounds.set('game2', new Howl({loop: true, src: `${url}music_game02.mp3`}));
    this.loopSounds.set('menu', new Howl({loop: true, src: `${url}music_menu.mp3`}));
    this.loopSounds.set('waiting', new Howl({loop: true, src: `${url}waiting.mp3`}));
    this.loopSounds.get('menu').play();
    if (localStorage.muted === 'true') {
      this.mute();
    }
  }

  playLoop(keyLoop) {
    let key = '';
    for (key of this.loopSounds.keys()) {
      this.loopSounds.get(key).stop();
    }
    this.loopSounds.get(keyLoop).play();
  }

  playUI(id) {
    console.log(id);
    this.uiSounds.get(id).play();
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

  toggleMute() {
    if (this.muted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  blur() {
    Howler.mute(true);
  }
  
  focus() {
    if (!this.muted) {
      Howler.mute(false);
    }
  }

  mute() {
    $('.mute img').attr('src', 'images/icon-unmute.svg');
    localStorage.muted = 'true';
    Howler.mute(true);
    this.muted = true;
  }

  unmute() {
    $('.mute img').attr('src', 'images/icon-mute.svg');
    localStorage.muted = 'false';
    Howler.mute(false);
    this.muted = false;
  }
}
