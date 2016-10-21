import Scene from './scene';
import TweenMax from 'gsap';
import {EVENT, MODE, INITIAL_CONFIG} from './constants';
import $ from 'jquery';
import Clipboard from 'clipboard';
import bodymovin from 'bodymovin';
import EventEmitter from 'event-emitter';
import Util from 'webvr-manager/util';
import NoSleep from 'nosleep';
import Communication from './communication';

class PingPong {
  constructor() {
    this.emitter = EventEmitter({});
    this.communication = new Communication(this.emitter);
    this.scene = new Scene(this.emitter, this.communication);
    this.setupHandlers();
    this.setupListeners();
    this.aboutScreenOpen = false;

    Promise.all([
      this.scene.setup(), 
      this.loadModeChooserAnimation(),
      this.loadingAnimation(),
    ]).then(() => {
      TweenMax.to(['.intro > div > *'], 0.5, {
        y: 10,
      });
      TweenMax.to(['.intro > div > *'], 0.2, {
        opacity: 1,
        delay: 0.3,
      });
    });
  }

  loadingAnimation() {
    return new Promise((resolve, reject) => {
      TweenMax.to('header span', 2.5, {
        ease: SlowMo.ease.config(0.3, 0.7, false),
        width: '100%',
        onComplete: () => {
          $('header h1').css('opacity', 1);
          $('header span').remove();
          resolve();
        }
      });
    });
  }

  requestFullscreen() {
    if (!Util.isMobile()) {
      return;
    }
    /*
    document.addEventListener("fullscreenchange", function(event) {
      if ( document.fullscreen ) {
        screen.lockOrientationUniversal = screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation;
        window.screen.lockOrientationUniversal('landscape-primary');
      }
    });
    */
    let noSleep = new NoSleep();
    noSleep.enable();
    let i = document.documentElement;
    if (i.requestFullscreen) {
      i.requestFullscreen();
    } else if (i.webkitRequestFullscreen) {
      i.webkitRequestFullscreen();
    } else if (i.mozRequestFullScreen) {
      i.mozRequestFullScreen();
    } else if (i.msRequestFullscreen) {
      i.msRequestFullscreen();
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
      console.log('Your opponent has disconnected');
    });
  }

  showModeChooserScreen() {
    let tl = new TimelineMax();
    tl.set('.player-mode-chooser h3, .player-mode-chooser svg, .buttons', {
      opacity: 0,
      y: 10,
    });
    tl.set('.intro', {zIndex: 10});
    tl.set('.transition-color-screen', {zIndex: 11});
    tl.set('.player-mode-chooser', {zIndex: 12});
    tl.staggerTo([
      '.intro button',
      '.intro p',
      '.intro h1',
      '.intro',
    ], 0.5, {
      left: '100%',
    }, 0.1);
    tl.staggerTo([
      '.transition-color-screen.pink',
      '.transition-color-screen.blue',
      '.transition-color-screen.green',
      '.player-mode-chooser',
    ], 0.5, {
      left: '0%',
      ease: Power2.easeInOut,
    }, 0.1, '-=0.9');
    tl.set([
      '.transition-color-screen.pink',
      '.transition-color-screen.blue',
      '.transition-color-screen.green',
    ], {
      left: '-100%',
    });
    tl.staggerTo([
      '#singleplayer-animation svg',
      '#multiplayer-animation svg',
      '.one-player-col h3',
      '.two-player-col h3',
      '.one-player-col .buttons',
      '.two-player-col .buttons',
    ], 0.3, {
      y: 0,
      opacity: 1,
    }, 0.1);
  }
  
  loadModeChooserAnimation() {
    return Promise.all([
      new Promise((resolve, reject) => {
        $.getJSON('/animations/1player.json', data => {
          this.singleplayerAnimation = bodymovin.loadAnimation({
            container: document.getElementById('singleplayer-animation'),
            renderer: 'svg',
            loop: true,
            animationData: data,
          });
          resolve();
        });
      }),
      new Promise((resolve, reject) => {
        $.getJSON('/animations/2player.json', data => {
          this.multiplayerAnimation = bodymovin.loadAnimation({
            container: document.getElementById('multiplayer-animation'),
            renderer: 'svg',
            loop: true,
            animationData: data,
          });
          resolve();
        });
      })
    ]);
  }

  setupHandlers() {
    $('#start').click(() => {
      this.showModeChooserScreen();
    });

    $('#start-singleplayer').click(e => {
      $('#cardboard img').attr('src', '/images/cardboard-pink.gif');
      $('#tilt img').attr('src', '/images/phone-tilt-pink.gif');
      $('.vr-mode-chooser').addClass('pink');
      // TODO dev
      // this.requestFullscreen();
      this.scene.setSingleplayer();
      this.viewVRChooserScreen().then(() => {
        bodymovin.stop();
        bodymovin.destroy();
      });
    });

    $('#open-room').click(e => {
      $('#cardboard img').attr('src', '/images/cardboard-blue.gif');
      $('#tilt img').attr('src', '/images/phone-tilt-blue.gif');
      $('.vr-mode-chooser').addClass('blue');
      // this.requestFullscreen();
      this.scene.setMultiplayer();
      this.viewOpenRoomScreenAnimation().then(() => {
        bodymovin.stop();
        bodymovin.destroy();
      });
    });

    $('#join-room').click(e => {
      $('#cardboard img').attr('src', '/images/cardboard-green.gif');
      $('#tilt img').attr('src', '/images/phone-tilt-green.gif');
      $('.vr-mode-chooser').addClass('green');
      // this.requestFullscreen();
      this.scene.setMultiplayer();
      this.viewJoinRoomScreenAnimation().then(() => {
        bodymovin.stop();
        bodymovin.destroy();
      });
    });

    $('#play-again').click(() => {
      this.communication.sendRestartGame();
      $('#play-again').text('Waiting for opponent to restart...');
      this.scene.playerRequestedRestart = true;
      this.scene.restartGame();
    });

    $('#exit').click(() => {
      location.reload();
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

    $('#cardboard').click(() => {
      this.scene.setupVRControls();
      this.scene.controlMode = 'VR';
      this.scene.manager.enterVRMode_();
      this.scene.startGame();
    });

    $('#tilt').click(() => {
      // TODO 
      if (Util.isMobile()) {
        this.scene.setupVRControls();
        this.scene.controlMode = 'VR';
      } else {
        this.scene.controlMode = 'MOUSE';
      }
      this.scene.startGame();
    });

    $('button').on('click', function() {
      const duration = 0.1;
      TweenMax.to($(this), duration, {
        backgroundColor: '#fff',
      });
      TweenMax.to($(this), duration, {
        backgroundColor: 'transparent',
        delay: duration,
      });
    });
  }

  viewVRChooserScreen() {
    return new Promise((resolve, reject) => {
      if (!this.scene.manager.isVRCompatible) {
        this.scene.startGame();
        resolve();
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
        onComplete: () => {
          resolve();
        },
      });
    });
  }

  viewJoinRoomScreenAnimation() {
    return new Promise((resolve, reject) => {
      $('#room-code').focus();
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
        this.communication.tryConnecting($('#room-code').val().toUpperCase()).then(e => {
          this.viewVRChooserScreen();
        }).catch(e => {
          alert(e);
        });
      });

      let tl = new TimelineMax();
      tl.set('.join-room-screen > div > *', {
        opacity: 0,
        y: 10,
      });
      tl.set('.player-mode-chooser', {zIndex: 10});
      tl.set('.transition-color-screen', {zIndex: 11});
      tl.set('.join-room-screen', {zIndex: 12});
      tl.to('.player-mode-chooser', 0.5, {
        left: '100%',
      });
      tl.staggerTo([
        '.transition-color-screen.pink',
        '.transition-color-screen.blue',
        '.transition-color-screen.green',
        '.join-room-screen',
      ], 0.5, {
        left: '0%',
        ease: Power2.easeInOut,
      }, 0.1, '-=0.6');
      tl.staggerTo([
        '.join-room-screen .present-players',
        '.join-room-screen #room-code',
        '.join-room-screen .grey-text',
        '.join-room-screen #join-room-button',
      ], 0.3, {
        y: 0,
        opacity: 1,
      }, 0.1);
    });
  }

  viewOpenRoomScreenAnimation() {
    return new Promise((resolve, reject) => {

      this.communication.chooseClosestServer().then(() => {
        let id = this.communication.openRoom();
        $('#room-url').val(id);
      });

      // TODO annoying during development
      this.emitter.on(EVENT.OPPONENT_CONNECTED, () => {
        $('.opponent-joined').text('Opponent joined');
        TweenMax.set('.opponent-icon', {opacity: 1});
        $('#join-waiting-room').hide();
        setTimeout(() => {
          this.viewVRChooserScreen();
        }, 1000);
      });

      new Clipboard('#room-url');
      let tl = new TimelineMax();
      tl.set('.open-room-screen > div > *', {
        opacity: 0,
        y: 10,
      });
      tl.set(['.open-room-screen #room-url', '.open-room-screen .grey-text'], {
        opacity: 0,
        y: 10,
      });
      tl.set(['.open-room-screen .present-players', '.open-room-screen .opponent-joined'], {
        opacity: 0,
      });
      tl.set('.player-mode-chooser', {zIndex: 10});
      tl.set('.transition-color-screen', {zIndex: 11});
      tl.set('.open-room-screen', {zIndex: 12});
      tl.to('.player-mode-chooser', 0.5, {
        left: '100%',
      });
      tl.staggerTo([
        '.transition-color-screen.pink',
        '.transition-color-screen.blue',
        '.transition-color-screen.green',
        '.open-room-screen',
      ], 0.5, {
        left: '0%',
        ease: Power2.easeInOut,
      }, 0.1, '-=0.6');
      tl.staggerTo(['.open-room-screen #room-url', '.open-room-screen .grey-text'], 0.3, {
        y: 0,
        opacity: 1,
      });
      tl.to(['.open-room-screen .present-players', '.open-room-screen .opponent-joined'], 0.3, {
        opacity: 1,
      }, '+=0.5');

      const blinkSpeed = 1;
      let blinkTL = new TimelineMax({repeat: -1, repeatDelay: blinkSpeed});
      blinkTL.set('.opponent-joined', {
        visibility: 'hidden',
      }, 0);
      blinkTL.set('.opponent-joined', {
        visibility: 'visible',
      }, blinkSpeed);
    });
  }
}

let p = new PingPong();
