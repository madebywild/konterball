import Scene from './scene';
import TweenMax from 'gsap';
import {PRESET, EVENT, MODE, INITIAL_CONFIG} from './constants';
import $ from 'jquery';
import Clipboard from 'clipboard';
import EventEmitter from 'event-emitter';
import Util from 'webvr-manager/util';

import Communication from './communication';
import FlatBox from 'models/box-flat';
import ShadedBox from 'models/box';
import GridBox from 'models/box-grid';
import ShadedPaddle from 'models/square-paddle';
import FlatPaddle from 'models/square-paddle-flat';

const minimumLoadingTime = 3000;

class PingPong {
  constructor() {
    this.emitter = EventEmitter({});
    this.communication = new Communication(this.emitter);
    this.scene = new Scene(this.emitter, this.communication);
    this.setupHandlers();
    this.setupListeners();
    this.introTicker();
    this.aboutScreenOpen = false;

    // wait at least 3 seconds before hiding load screen
    Promise.all([
      this.scene.setup(), 
      new Promise((resolve, reject) => {setTimeout(() => {resolve();}, minimumLoadingTime);})
    ]).then(() => {
      this.loaded();
    });

    if (this.checkRoom()) {
      // dont display the mode chooser if the user wants to join a room
      $('.player-mode-chooser').hide();
      $('#room-url, #join-waiting-room').hide();
    }
  }

  setupListeners() {
    this.emitter.on(EVENT.RESTART_GAME, () => {
      $('.game-over-screen-wrapper').hide();
      $('#play-again').text('Play again');
    });

    this.emitter.on(EVENT.GAME_OVER, score => {
      $('.game-over-screen-wrapper').show();
      document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
      document.exitPointerLock();
      if (score.self >= INITIAL_CONFIG.POINTS_FOR_WIN) {
        $('#result').text('You won!');
      } else {
        $('#result').text('Your opponent won!');
      }
    });
    this.emitter.on(EVENT.OPPONENT_DISCONNECTED, () => {
      // TODO
      alert('Your opponent has disconnected');
    });
  }

  setupHandlers() {
    $('#start-singleplayer').click(e => {
      this.scene.setSingleplayer();
      this.viewVRChooserScreen();
    });

    $('#open-room').click(e => {
      this.viewOpenRoomScreenAnimation();
    });

    $('#join-room').click(e => {
      this.viewJoinRoomScreenAnimation();
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
    $('.about-button').click(() => {
      if (this.aboutScreenOpen) {
        TweenMax.to('.about-screen', 0.5, {
          autoAlpha: 0,
        });
        $('.about-button').text('About');
      } else {
        TweenMax.set('.about-screen', {
          display: 'block',
          opacity: 0,
        });
        TweenMax.to('.about-screen', 0.5, {
          autoAlpha: 1,
        });
        $('.about-button').text('Close');
      }
      this.aboutScreenOpen = !this.aboutScreenOpen;
    });

    $('#grid').click(() => {
      this.scene.scene.remove(this.scene.box);
      this.scene.box = GridBox(this.scene.scene, this.scene.config);
    });

    $('#cardboard').click(() => {
      this.scene.manager.enterVRMode_();
      this.scene.startGame();
    });

    $('#tilt').click(() => {
      this.scene.startGame();
    });
  }

  checkRoom() {
    return false;
    // is the user trying to join a room?
    return window.location.pathname.length === INITIAL_CONFIG.ROOM_CODE_LENGTH + 1;
  }

  introTicker() {
    // TODO change this to a css animation so it actually loads first?
    let tickerWidth = $('.intro').width();
    let viewportWidth = $(document).width();
    let animateDistance = tickerWidth + viewportWidth / 2;
    TweenMax.to('.intro-ribbon', 3, {
      x: -animateDistance,
      ease: Power0.easeNone,
      repeat: -1,
    }, 0);
    TweenMax.set('.webvr-button', {
      autoAlpha: 0,
    });
    let tl = new TimelineMax({repeat: -1, repeatDelay: 1});
    tl.set('.dot-1, .dot-2, .dot-3', {
      color: '#999',
    });
    tl.set('.dot-1', {
      color: '#fff',
    }, 1);
    tl.set('.dot-2', {
      color: '#fff',
    }, 2);
    tl.set('.dot-3', {
      color: '#fff',
    }, 3);
  }

  loaded() {
    TweenMax.to('.intro', 0.5, {
      autoAlpha: 0,
      onComplete: () => {
        TweenMax.killTweensOf('.intro *');
      },
    });
    if (!this.checkRoom()) {
      TweenMax.set('.player-mode-chooser', {
        display: 'block',
        autoAlpha: 0,
      });
      TweenMax.to('.player-mode-chooser, .webvr-button', 0.5, {
        autoAlpha: 1,
        delay: 0.5,
      });
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
      display: 'block',
      opacity: 0,
    });

    tl.to('.intro, .player-mode-chooser', 0.5, {
      autoAlpha: 0,
    });

    tl.to('.vr-mode-chooser', 0.5, {
      opacity: 1,
    });
  }

  viewJoinRoomScreenAnimation() {
    $('#room-code').bind('input', function() {
      if ($(this).val().length === 4) {
        $('#join-room-button').removeClass('inactive');
        $('#join-room-button').css('pointer-events', 'auto');
      } else {
        $('#join-room-button').addClass('inactive');
        $('#join-room-button').css('pointer-events', 'none');
      }
    });
    $('#join-room-button').click(() => {
      console.log('trying to connect');
      this.communication.tryConnecting($('#room-code').val().toUpperCase()).then(e => {
        this.scene.setMultiplayer();
        this.viewVRChooserScreen();
      }).catch(e => {
        alert(e);
      });
    });

    let tl = new TimelineMax();
    tl.to('.button-frame', 0.3, {
      y: '+200%',
    });
    tl.to('.player-mode-chooser', 0.3, {
      autoAlpha: 0,
    });
    tl.set('.join-room-screen', {
      display: 'block',
      autoAlpha: 0,
    });
    tl.to('.join-room-screen', 0.3, {
      autoAlpha: 1,
    });
  }

  viewOpenRoomScreenAnimation() {
    let id = this.communication.openRoom();
    this.scene.setMultiplayer();

    //$('#room-url').val('http://' + location.hostname + '/' + this.scene.communication.id);
    $('#room-url').val(id);

    // TODO annoying during development
    // history.pushState(null, null, this.scene.communication.id);
    this.emitter.on(EVENT.OPPONENT_CONNECTED, () => {
      this.viewVRChooserScreen();
      $('.opponent-joined').text('Opponent joined');
      TweenMax.set('.opponent-icon', {opacity: 1});
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
    tl.set('.open-room-screen', {
      display: 'block',
      autoAlpha: 0,
    });
    tl.to('.open-room-screen', 0.3, {
      autoAlpha: 1,
    });

    const blinkSpeed = 1;
    let blinkTL = new TimelineMax({repeat: -1, repeatDelay: blinkSpeed});
    blinkTL.set('.opponent-joined', {
      opacity: 0,
    }, 0);
    blinkTL.set('.opponent-joined', {
      opacity: 1,
    }, blinkSpeed);
  }
}

let p = new PingPong();
