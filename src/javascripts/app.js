import Scene from './scene';
import TweenMax from 'gsap';
import {PRESET, EVENT, MODE, INITIAL_CONFIG} from './constants';
import $ from 'jquery';
import Clipboard from 'clipboard';
import EventEmitter from 'event-emitter';
import Util from 'webvr-manager/util';

import FlatBox from 'models/box-flat';
import ShadedBox from 'models/box';
import GridBox from 'models/box-grid';
import ShadedPaddle from 'models/square-paddle';
import FlatPaddle from 'models/square-paddle-flat';

class PingPong {
  constructor() {
    this.emitter = EventEmitter({});
    this.scene = new Scene(this.emitter);
    this.scene.setup();
    this.setupHandlers();
    this.introTicker();

    if (this.checkRoom()) {
      $('.player-mode-chooser').hide();
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
      this.scene.setSingleplayer();
      this.viewVRChooserScreen();
    });

    $('#start-multiplayer').click(e => {
      this.viewRoomScreenAnimation();
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
      if (this.scene.config.preset === PRESET.NORMAL) {
        this.scene.scene.remove(this.scene.paddle);
        this.scene.paddle = FlatPaddle(this.scene.scene, this.scene.config);
      }
    });

    $('#shaded').click(() => {
      this.scene.scene.remove(this.scene.box);
      this.scene.box = ShadedBox(this.scene.scene, this.scene.config);
      if (this.scene.config.preset === PRESET.NORMAL) {
        this.scene.scene.remove(this.scene.paddle);
        this.scene.paddle = ShadedPaddle(this.scene.scene, this.scene.config);
      }
    });

    $('#grid').click(() => {
      this.scene.scene.remove(this.scene.box);
      this.scene.box = GridBox(this.scene.scene, this.scene.config);
    });

    $('#cardboard').click(() => {
      let e = new Event('vrdisplaypresentchange');
      //window.dispatchEvent(e);
      this.scene.manager.enterVRMode_();
      this.scene.startGame();
    });

    $('#tilt').click(() => {
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
    tl.to('.intro', 1.1, {
      x: -animateDistance,
      ease: Power0.easeNone,
    }, 0);
    if (!this.checkRoom()) {
      tl.set('.player-mode-chooser', {
        display: 'block',
        autoAlpha: 0,
      }, '-=1');
      tl.to('.player-mode-chooser', 0.5, {
        autoAlpha: 1,
      }, '-=1');
    } else {
      this.scene.setMultiplayer();
      this.viewVRChooserScreen();
    }
  }

  viewVRChooserScreen() {
    if (!this.scene.manager.isVRCompatible) {
      this.scene.startGame();
      return;
    }
    if (!Util.isMobile()) {
      $("#cardboard p").text("Vive");
      $("#tilt p").text("Mouse");
    }
    let tl = new TimelineMax();
    tl.set('.vr-mode-chooser', {
      display: 'flex',
      opacity: 0,
    });

    tl.to('.intro, .player-mode-chooser', 0.5, {
      autoAlpha: 0,
    });

    tl.to('.vr-mode-chooser', 0.5, {
      opacity: 1,
    });
  }

  viewRoomScreenAnimation() {
    this.scene.setMultiplayer();

    $('#room-url').val('http://' + location.hostname + '/' + this.scene.communication.id);

    // TODO annoying during development
    // history.pushState(null, null, this.scene.communication.id);
    this.emitter.on(EVENT.OPPONENT_CONNECTED, () => {
      this.viewVRChooserScreen();
      $('#multiplayer-waiting-text').text('Player 2 has joined the room');
      $('#join-waiting-room').hide();
    });

    new Clipboard('#room-url');
    let tl = new TimelineMax();
    tl.to('.button-frame', 0.3, {
      y: '+100%',
    });
    tl.to('.player-mode-chooser', 0.3, {
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
