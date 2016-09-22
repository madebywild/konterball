import Scene from './scene';
import TweenMax from 'gsap';
import {EVENT, MODE, INITIAL_CONFIG} from './constants';
import $ from 'jquery';
import Clipboard from 'clipboard';
import EventEmitter from 'event-emitter';

class PingPong {
  constructor() {
    this.emitter = EventEmitter({});
    this.emitter.on('test', e => {
      console.log(e);
    });
    this.introTicker();
    console.log(this.emitter);
    this.scene = new Scene(this.emitter);
    this.scene.setup();
    this.setupHandlers();

    if (this.checkRoom()) {
      $('.mode-chooser').hide();
      $('#room-url, #join-waiting-room').hide();
    }
  }

  setupHandlers() {
    $('#start-singleplayer').click(e => {
      this.scene.startSingleplayer();
    });
    $('#start-multiplayer').click(e => {
      this.viewRoomScreenAnimation();
    });
    $('#join-waiting-room').click(e => {
      this.scene.startGame();
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
    tl.to('.intro', 10.1, {
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
          $('.room-screen').show();
          this.scene.startMultiplayer();
          this.scene.startGame();
        }
      }
    }, '-=1');
  }

  viewRoomScreenAnimation() {
    this.scene.startMultiplayer();
    console.log(this.scene.communication.isHost);
    if (!this.scene.communication.isHost) {
      this.scene.startGame();
      return;
    }

    $('#room-url').val('http://pong.wild.plus/' + this.scene.communication.id);
    // TODO annoying during development
    history.pushState(null, null, this.scene.communication.id);
    this.emitter.on(EVENT.OPPONENT_CONNECTED, () => {
      this.scene.startGame();
      $('#multiplayer-waiting-text').text('Player 2 has joined the room');
      $('#join-waiting-room').hide();
    });

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
