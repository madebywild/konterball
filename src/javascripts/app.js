import Scene from './scene';
import TweenMax from 'gsap';
import {EVENT, MODE, INITIAL_CONFIG} from './constants';
import $ from 'jquery';
import Clipboard from 'clipboard';
import bodymovin from 'bodymovin';
import EventEmitter from 'event-emitter';
import Util from 'webvr-manager/util';
import Modes from 'webvr-manager/modes';
import NoSleep from 'nosleep';
import Communication from './communication';

document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

const screenTransitionDuration = 1;
const screenTransitionInterval = 0.1;
const screenTransitionEase = Power4.easeInOut;

class PingPong {
  constructor() {
    this.emitter = EventEmitter({});
    this.communication = new Communication(this.emitter);
    this.scene = new Scene(this.emitter, this.communication);
    this.setupHandlers();
    this.setupListeners();
    this.aboutScreenOpen = false;
    this.introBallTween = null;

    if (Util.isMobile() && 'orientation' in window && $(window).width() < $(window).height()) {
      TweenMax.set('.phone', {rotation: 90});
      TweenMax.set('.checkmark', {visibility: 'hidden'}, 0.3);
      const tl = new TimelineMax({repeat: -1, repeatDelay: 1});
      tl.to('.phone', 0.5, {
        ease: Back.easeInOut.config(1),
        rotation: 180,
        onComplete: () => {
        }
      });
      tl.set('.x', {visibility: 'hidden'}, 0.3);
      tl.set('.checkmark', {visibility: 'visible'}, 0.3);
      tl.to('.phone', 0.5, {
        ease: Back.easeInOut.config(1),
        rotation: 90,
      }, '+=1');
      tl.set('.x', {visibility: 'visible'}, '-=0.2');
      tl.set('.checkmark', {visibility: 'hidden'}, '-=0.2');
      $('.rotate-phone-screen').css('display', 'block');
      $(window).on('orientationchange', () => {
        setTimeout(() => {
          window.scrollTo(0, 80);
          if ($(window).width() > $(window).height()) {
            TweenMax.to('.rotate-phone-screen', 0.3, {
              autoAlpha: 0,
            });
            if (!this.startedLoading) {
              this.startLoading();
            }
            tl.pause();
          } else {
            TweenMax.to('.rotate-phone-screen', 0.3, {
              autoAlpha: 1,
            });
            tl.play();
          }
        }, 100);
      });
    } else {
      this.startLoading();
    }
  }

  startLoading() {
    this.startedLoading = true;
    Promise.all([
      this.scene.setup(), 
      this.loadModeChooserAnimation(),
      this.loadingAnimation(),
    ]).then(() => {
      console.log('done loading');
      this.introAnimation();
    });
  }

  loadingAnimation() {
    return new Promise((resolve, reject) => {
      TweenMax.to('header span', 0.5, {
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

  introAnimation() {
    TweenMax.to(['.intro-screen > div > *'], 0.5, {
      y: 0,
    });
    TweenMax.to(['.intro-screen > div > *'], 0.2, {
      opacity: 1,
      delay: 0.3,
    });
    this.startBallTween();
  }

  startBallTween() {
    const ballRadius = parseInt($('#ball').attr('r'));
    const no = {
      x: Math.random() > 0.5 ? -ballRadius : 1920 + ballRadius,
      y: Math.random() * 800 - 400,
    };
    this.introBallTween = new TimelineMax({
      onComplete: () => {
        setTimeout(() => {
          if (!this.introOver) {
            this.startBallTween();
          }
        }, Math.random() * 2000);
      },
    });
    const $ball = $('#ball');
    const $shadow = $('#ball-shadow');
    const width = $('.intro-screen svg').width();
    const startY = no.y;
    const shadowPos = 840;
    this.introBallTween.to(no, 1, {
      x: no.x > 0 ? -ballRadius : 1920 + ballRadius,
      ease: Power0.easeNone,
      onUpdate: () => {
        $ball.attr('cx', no.x);
        $shadow.attr('cx', no.x);
        $shadow.attr('cy', shadowPos);
        let rx = 40 + 15 * (1 - (shadowPos - no.y) / shadowPos);
        let ry = rx / 2;
        $shadow.attr('rx', rx);
        $shadow.attr('ry', ry);
      },
    }, 0);
    this.introBallTween.to(no, 0.6, {
      y: 800,
      ease: Power1.easeIn,
      onUpdate: () => {
        $ball.attr('cy', no.y);
      },
    }, 0);
    this.introBallTween.to(no, 0.8, {
      y: startY + 150,
      ease: Power1.easeOut,
      onUpdate: () => {
        $ball.attr('cy', no.y);
      },
    }, 0.6);
  }

  setupListeners() {
    this.emitter.on(EVENT.RESTART_GAME, () => {
      $('.game-over-screen-wrapper').hide();
      $('#play-again').text('Play again');
    });

    this.emitter.on(EVENT.GAME_OVER, (score, mode) => {
      // let className = mode === MODE.SINGLEPLAYER ? 'pink' : this.communication.isHost ? 'blue' : 'green';
      // $('.game-over-screen-wrapper').addClass(className);
      // $('.game-over-screen-wrapper').show();
      // if (document.exitPointerLock) {
      //   document.exitPointerLock();
      // }
      // if (mode === MODE.MULTIPLAYER) {
      //   if (score.self >= INITIAL_CONFIG.POINTS_FOR_WIN) {
      //     $('#result').text('You won!');
      //   } else {
      //     $('#result').text('Your opponent won!');
      //   }
      //   $('#score').text(`You ${score.self} : ${score.opponent} Opponent`);
      // } else {
      //   $('#result').text('Game Over');
      //   $('#score').text(`Your highscore this round: ${score.highest}`);
      // }
    });
    this.emitter.on(EVENT.OPPONENT_DISCONNECTED, () => {
      // TODO
      this.scene.hud.message.setMessage('Opponent disconnected');
      this.scene.hud.message.showMessage();
      this.scene.paddleOpponent.visible = false;
    });
  }

  showModeChooserScreen() {
    if (Util.isMobile()) {
      const noSleep = new NoSleep();
      noSleep.enable();
    }

    this.scene.sound.playUI('transition');
    const tl = new TimelineMax();
    tl.set('.choose-mode-screen h3, .choose-mode-screen svg, .buttons', {
      opacity: 0,
      y: 10,
    });
    tl.set('.intro-screen', {zIndex: 10});
    tl.set('.transition-color-screen', {zIndex: 11});
    tl.set('.choose-mode-screen', {zIndex: 12});
    const width = $(window).width();
    tl.staggerTo([
      '.intro-screen h1',
      '.intro-screen p',
      '.intro-screen button',
      '.intro-screen',
    ], screenTransitionDuration, {
      x: width,
      ease: screenTransitionEase,
    }, screenTransitionInterval);
    tl.set('.intro-screen', {display: 'none'});
    tl.call(() => {
      this.introBallTween.kill();
      this.introOver = true;
    });
    tl.staggerTo([
      '.transition-color-screen.pink',
      '.transition-color-screen.blue',
      '.transition-color-screen.green',
      '.choose-mode-screen',
    ], screenTransitionDuration, {
      left: '0%',
      ease: screenTransitionEase,
    }, screenTransitionInterval, `-=${screenTransitionDuration + screenTransitionInterval}`);
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
    ], 0.3, {
      y: 0,
      opacity: 1,
    }, 0.1);
    tl.staggerTo([
      '.one-player-col .buttons',
      '.two-player-col .buttons',
    ], 0.3, {
      y: 0,
      opacity: 1,
    }, 0.1, '+=0.2');
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
    $(window).on('blur', () => {
      this.scene.tabActive = false;
      this.scene.sound.blur();
    });

    $(window).on('focus', () => {
      this.scene.tabActive = true;
      this.scene.sound.focus();
    });

    $('#start').on('click', () => {
      $('body').scrollTop(80);
      this.showModeChooserScreen();
    });

    $('#start-singleplayer').on('click', e => {
      if (this.scene.manager.isVRCompatible) {
        if (Util.isMobile()) {
          $('#cardboard img').attr('src', '/images/cardboard-pink.gif');
          $('#tilt img').attr('src', '/images/phone-tilt-pink.gif');
        } else {
          $('#cardboard img').attr('src', '/images/vive-pink.gif');
          $('#tilt img').attr('src', '/images/desktop-pink.gif');
        }
        $('.choose-vr-mode-screen').removeClass('blue green');
        $('.choose-vr-mode-screen').addClass('pink');
      }
      this.scene.setSingleplayer();
      this.viewVRChooserScreen().then(() => {
        bodymovin.stop();
        bodymovin.destroy();
      });
    });

    $('#open-room').on('click', e => {
      if (this.scene.manager.isVRCompatible) {
        if (Util.isMobile()) {
          $('#cardboard img').attr('src', '/images/cardboard-blue.gif');
          $('#tilt img').attr('src', '/images/phone-tilt-blue.gif');
        } else {
          $('#cardboard img').attr('src', '/images/vive-blue.gif');
          $('#tilt img').attr('src', '/images/desktop-blue.gif');
        }
        $('.choose-vr-mode-screen').removeClass('pink green');
        $('.choose-vr-mode-screen').addClass('blue');
      }
      this.scene.setMultiplayer();
      this.viewOpenRoomScreenAnimation().then(() => {
        bodymovin.stop();
        bodymovin.destroy();
      });
    });

    $('#join-room').on('click', e => {
      if (this.scene.manager.isVRCompatible) {
        if (Util.isMobile()) {
          $('#cardboard img').attr('src', '/images/cardboard-green.gif');
          $('#tilt img').attr('src', '/images/phone-tilt-green.gif');
        } else {
          $('#cardboard img').attr('src', '/images/vive-green.gif');
          $('#tilt img').attr('src', '/images/desktop-green.gif');
        }
        $('.choose-vr-mode-screen').removeClass('pink blue');
        $('.choose-vr-mode-screen').addClass('green');
      }
      this.scene.setMultiplayer();
      if (window.location.pathname.length === INITIAL_CONFIG.ROOM_CODE_LENGTH + 1) {
        $('#room-code').val(window.location.pathname.slice(1));
      }
      this.viewJoinRoomScreenAnimation().then(() => {
        bodymovin.stop();
        bodymovin.destroy();
      });
    });

    $('#play-again').on('click', () => {
      if (this.scene.config.mode === MODE.MULTIPLAYER) {
        $('#play-again').text('waiting for opponent to restart');
        this.scene.playerRequestedRestart = true;
        this.communication.sendRestartGame();
      }
      this.scene.restartGame();
    });

    $('#exit').on('click', () => {
      location.reload();
    });

    $('.exit-arrow').on('click', () => {
      location.reload();
    });

    $('.about-button').on('click', () => {
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

    $('#cardboard').on('click', () => {
      this.scene.setupVRControls();
      this.scene.controlMode = 'VR';
      this.scene.manager.enterVRMode_();
      this.scene.startGame();
    });

    $('#tilt').on('click', () => {
      if (Util.isMobile()) {
        this.scene.manager.onFSClick_();
        this.scene.setupVRControls();
        this.scene.controlMode = 'VR';
      } else {
        this.scene.controlMode = 'MOUSE';
      }
      this.scene.startGame();
    });

    $('button.btn').on('click', () => {
      this.scene.sound.playUI('button');
    });

    $('button.btn').on('click', function() {
      const duration = 0.1;
      TweenMax.to($(this), duration, {
        backgroundColor: '#fff',
      });
      TweenMax.to($(this), duration, {
        backgroundColor: 'transparent',
        delay: duration,
      });
    });

    $('.back-arrow').on('click', () => {
      this.backAnimation();
    });

    $('.back-arrow').on('click', () => {
      this.backAnimation();
    });

    $('.mute').on('click', () => {
      this.scene.sound.toggleMute();
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
        $('#cardboard p').text('Vive');
        $('#tilt p').text('Mouse');
      }

      this.scene.sound.playUI('transition');
      const tl = new TimelineMax();
      tl.set('.choose-vr-mode-screen, .transition-color-screen', {
        'left': '-100%',
      });
      tl.set([
        '.open-room-screen',
        '.join-room-screen',
        '.choose-mode-screen',
      ], {zIndex: 10});
      tl.set('.transition-color-screen', {zIndex: 11});
      tl.set('.choose-vr-mode-screen', {zIndex: 12, display: 'block'});
      tl.to([
        '.open-room-screen',
        '.join-room-screen',
        '.choose-mode-screen',
      ], screenTransitionDuration, {
        left: '100%',
        ease: screenTransitionEase,
      });
      tl.staggerTo([
        '.transition-color-screen.pink',
        '.transition-color-screen.blue',
        '.transition-color-screen.green',
        '.choose-vr-mode-screen',
      ], screenTransitionDuration, {
        left: '0%',
        ease: screenTransitionEase,
      }, screenTransitionInterval, `-=${screenTransitionDuration + screenTransitionInterval}`);
      tl.call(resolve);
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
      $('#room-form').on('submit', e => {
        e.preventDefault();
        $('#room-form .grey-text').text('connecting to server');
        this.communication.tryConnecting($('#room-code').val().toUpperCase()).then(e => {
          this.viewVRChooserScreen();
        }).catch(e => {
          alert(e);
        });
      });

      this.scene.sound.playUI('transition');
      const tl = new TimelineMax();
      tl.set('.join-room-screen > div > .present-players, .join-room-screen > div > form > *', {
        opacity: 0,
        y: 10,
      });
      tl.set('.choose-mode-screen', {zIndex: 10});
      tl.set('.transition-color-screen', {zIndex: 11});
      tl.set('.join-room-screen', {zIndex: 12});
      tl.to('.choose-mode-screen', screenTransitionDuration, {
        left: '100%',
        ease: screenTransitionEase,
      });
      tl.staggerTo([
        '.transition-color-screen.pink',
        '.transition-color-screen.blue',
        '.transition-color-screen.green',
        '.join-room-screen',
      ], screenTransitionDuration, {
        left: '0%',
        ease: screenTransitionEase,
      }, screenTransitionInterval, `-=${screenTransitionDuration - screenTransitionInterval}`);
      tl.staggerTo([
        '.join-room-screen .present-players',
        '.join-room-screen .input-wrapper',
        '.join-room-screen .grey-text',
        '.join-room-screen #join-room-button',
      ], 0.3, {
        y: 0,
        opacity: 1,
      }, 0.1);
    });
  }

  backAnimation() {
    this.scene.sound.playUI('transition');
    const tl = new TimelineMax();
    tl.set('.choose-mode-screen', {zIndex: 12});
    tl.set('.transition-color-screen', {zIndex: 11, left: '100%'});
    tl.set('.join-room-screen, .open-room-screen', {zIndex: 10});
    tl.staggerTo([
      '.join-room-screen, .open-room-screen',
      '.transition-color-screen.green',
      '.transition-color-screen.blue',
      '.transition-color-screen.pink',
    ], screenTransitionDuration, {
      left: '-100%',
      ease: screenTransitionEase,
    }, screenTransitionInterval);
    tl.to([
      '.choose-mode-screen',
    ], screenTransitionDuration, {
      left: '0%',
      ease: screenTransitionEase,
    }, `-=${screenTransitionDuration - screenTransitionInterval}`);
  }

  viewOpenRoomScreenAnimation() {
    return new Promise((resolve, reject) => {
      this.communication.chooseClosestServer().then(() => {
        let id = this.communication.openRoom();
        $('#generated-room-code').val(id);
        $('#generated-room-url').val(`pong.wild.plus/${id}`);
        $('.opponent-joined').text('waiting for opponent');
      }).catch(e => {
        console.log(e);
        $('.opponent-joined').text('cannot connect to server');
        TweenMax.killTweensOf('.opponent-joined');
        TweenMax.set('.opponent-joined', {visibility: 'visible', opacity: 1});
      });

      // TODO annoying during development
      this.emitter.on(EVENT.OPPONENT_CONNECTED, () => {
        this.scene.sound.playUI('joined');
        $('.opponent-joined').text('Opponent joined');
        TweenMax.set('.opponent-icon', {opacity: 1});
        $('#join-waiting-room').hide();
        setTimeout(() => {
          this.viewVRChooserScreen();
        }, 1000);
      });

      new Clipboard('#generated-room-url');
      new Clipboard('#generated-room-code');
      const tl = new TimelineMax();
      tl.set('.open-room-screen > div > *', {
        opacity: 0,
        y: 10,
      });
      tl.set(['#generated-room-code', '#generated-room-url', '.open-room-screen .grey-text'], {
        opacity: 0,
        y: 10,
      });
      tl.set(['.open-room-screen .present-players', '.open-room-screen .opponent-joined'], {
        opacity: 0,
      });
      tl.set('.choose-mode-screen', {zIndex: 10});
      tl.set('.transition-color-screen', {zIndex: 11});
      tl.set('.open-room-screen', {zIndex: 12});
      tl.to('.choose-mode-screen', screenTransitionDuration, {
        left: '100%',
        ease: screenTransitionEase,
      });
      tl.staggerTo([
        '.transition-color-screen.pink',
        '.transition-color-screen.blue',
        '.transition-color-screen.green',
        '.open-room-screen',
      ], screenTransitionDuration, {
        left: '0%',
        ease: screenTransitionEase,
      }, screenTransitionInterval, `-=${screenTransitionDuration}`);
      tl.staggerTo(['#generated-room-code', '#generated-room-url', '.open-room-screen .grey-text'], 0.3, {
        y: 0,
        opacity: 1,
      });
      tl.to(['.open-room-screen .present-players', '.open-room-screen .opponent-joined'], 0.3, {
        opacity: 1,
      }, '+=0.5');

      const blinkSpeed = 1;
      const blinkTL = new TimelineMax({repeat: -1, repeatDelay: blinkSpeed});
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
