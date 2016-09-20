import Scene from './scene';
import TweenMax from 'gsap';
import {MODE, INITIAL_CONFIG} from './constants';
import $ from 'jquery';
import Clipboard from 'clipboard';

class PingPong {
  constructor() {
    this.introTicker();
    this.scene = new Scene();
    this.scene.setup();
    this.setupHandlers();
  }

  setupHandlers() {
    $('#start-singleplayer').click(e => {
      this.scene.startSingleplayer();
    });
    $('#start-multiplayer').click(e => {
      this.viewRoomScreenAnimation();
    });
    $('#join-waiting-room').click(e => {
      this.scene.introAnimation();
    });
  }

  checkRoom() {
    return window.location.pathname.length === INITIAL_CONFIG.ROOM_CODE_LENGTH + 1;
  }

  introTicker() {
    let tl = new TimelineMax();
    let tickerWidth = $('.intro').width();
    let viewportWidth = $(document).width();
    let animateDistance = tickerWidth + viewportWidth / 2;
    tl.to('.intro', 1.1, {
      x: -animateDistance,
      ease: Power0.easeNone,
    }, 0);
    tl.set('.mode-chooser', {
      display: 'block',
      autoAlpha: 0,
    }, '-=1');
    tl.to('.mode-chooser', 0.5, {
      autoAlpha: 1,
      onComplete: () => {
        if (this.checkRoom()) {
          console.log('im a slave 4 u');
          this.scene.startMultiplayer();
          this.scene.introAnimation();
        }
      }
    }, '-=1');
  }

  viewRoomScreenAnimation() {
    let hasJoinedRoom = this.scene.startMultiplayer();
    if (hasJoinedRoom) {
      this.scene.introAnimation();
      return;
    }
    new Clipboard('#room-url');
    let tl = new TimelineMax();
    tl.to('.button-frame', 0.3, {
      y: '+100%',
    });
    tl.to('.mode-chooser', 0.3, {
      autoAlpha: 0,
    });
    tl.set('.room-screen', {
      display: 'block',
      autoAlpha: 0,
    });
    tl.to('.room-screen', 0.3, {
      autoAlpha: 1,
    });
  }
}

let p = new PingPong();
