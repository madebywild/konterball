import Scene from './scene';
import TweenMax from 'gsap';
import {EVENT, MODE, INITIAL_CONFIG} from './constants';
import $ from 'jquery';
import Clipboard from 'clipboard';
import EventEmitter from 'event-emitter';

import FlatBox from 'models/box-flat';
import ShadedBox from 'models/box';
import GridBox from 'models/box-grid';

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

    this.emitter.on(EVENT.RESTART_GAME, () => {
      $('.game-over-screen-wrapper').hide();
      $('#play-again').text('Play again');
    });

    this.emitter.on(EVENT.GAME_OVER, score => {
      $('.game-over-screen-wrapper').show();
      document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
      document.exitPointerLock();
      console.log(score);
      if (score.self >= INITIAL_CONFIG.POINTS_FOR_WIN) {
        $('#result').text('You won!');
      } else {
        $('#result').text('Your opponent won!');
      }
    });
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

    $('#play-again').click(() => {
      this.scene.communication.sendRestartGame();
      $('#play-again').text('Waiting for opponent to restart...');
      this.scene.playerRequestedRestart = true;
      this.scene.restartGame();
    });

    $('#flat').click(() => {
      this.scene.scene.remove(this.scene.box);
      this.scene.box = FlatBox(this.scene.scene, this.scene.config);
    });
    $('#shaded').click(() => {
      this.scene.scene.remove(this.scene.box);
      this.scene.box = ShadedBox(this.scene.scene, this.scene.config);
    });
    $('#grid').click(() => {
      this.scene.scene.remove(this.scene.box);
      this.scene.box = GridBox(this.scene.scene, this.scene.config);
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
    if (!this.checkRoom()) {
      tl.set('.mode-chooser', {
        display: 'block',
        autoAlpha: 0,
      }, '-=1');
      tl.to('.mode-chooser', 0.5, {
        autoAlpha: 1,
      }, '-=1');
    } else {
      tl.to('.intro-wrapper', 0.5, {
        autoAlpha: 0,
        onComplete: () => {
          this.scene.startMultiplayer();
          this.scene.startGame();
        },
      }, '-=1');
    }
  }

  viewRoomScreenAnimation() {
    this.scene.startMultiplayer();

    $('#room-url').val('http://' + location.hostname + '/' + this.scene.communication.id);

    // TODO annoying during development
    // history.pushState(null, null, this.scene.communication.id);
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
