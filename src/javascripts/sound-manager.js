import {Howler} from 'howler';
import {rand, cap} from 'util/helpers';
import {MODE} from './constants';
import $ from 'jquery';

export default class SoundManager {
  constructor(config) {
    this.config = config;
    this.muted = false;
    this.paddleSounds = [];
    this.tableSounds = [];
    let url = `/audio/menu/`;
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
    this.uiSounds.set('touch', new Howl({src: `${url}touch.mp3`}));
    this.uiSounds.set('transition', new Howl({src: `${url}transition.mp3`}));

    this.uiSounds.set('lose', new Howl({src: `${url}lose.mp3`}));
    this.uiSounds.set('win', new Howl({src: `${url}win.mp3`}));
    this.uiSounds.set('miss', new Howl({src: `${url}miss.mp3`}));
    this.uiSounds.set('point', new Howl({src: `${url}point.mp3`}));
    this.uiSounds.set('net', new Howl({src: `${url}net.mp3`}));
    this.uiSounds.set('type', new Howl({src: `${url}type.mp3`}));

    url = `/audio/loops/`;
    this.loopSounds = new Map();
    this.loopSounds.set('bass', new Howl({loop: true, src: `${url}loop1-bass.mp3`}));
    this.loopSounds.set('bass-pad', new Howl({loop: true, src: `${url}loop1-bass-pad.mp3`, onloaderror: (a, b) => {this.error = true;}}));
    this.loopSounds.set('bass-pad-synth', new Howl({loop: true, src: `${url}loop1-bass-pad-synth.mp3`}));
    this.loopSounds.set('waiting', new Howl({loop: true, src: `${url}waiting.mp3`}));
    this.loopSounds.get('bass').play();
    if (localStorage.muted === 'true') {
      this.mute();
    }
  }

  playLoop(keyLoop) {
    if (this.error) return;
    let key = '';
    let pos = 0;
    for (key of this.loopSounds.keys()) {
      if (this.loopSounds.get(key).playing()) {
        pos = this.loopSounds.get(key).seek();
        this.loopSounds.get(key).stop();
      }
    }
    this.loopSounds.get(keyLoop).seek(pos);
    this.loopSounds.get(keyLoop).play();
  }

  playUI(id) {
    if (this.error) return;
    console.log('play ' + id);
    this.uiSounds.get(id).play();
  }

  paddle(point={x: 0, y: 0, z: 0}) {
    if (this.error) return;
    let i = rand(0, this.paddleSounds.length);
    this.paddleSounds[i].pos(point.x, point.y, point.z);
    this.paddleSounds[i].play();
  }

  table(point={x: 0, y: 0, z: 0}, velocity={x: 0, y: -1, z: -1}) {
    if (this.error) return;
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
    $('.mute img').attr('src', 'images/icon-mute.svg');
    localStorage.muted = 'true';
    Howler.mute(true);
    this.muted = true;
  }

  unmute() {
    $('.mute img').attr('src', 'images/icon-unmute.svg');
    localStorage.muted = 'false';
    Howler.mute(false);
    this.muted = false;
  }
}
