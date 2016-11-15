import TweenMax from 'gsap';
import $ from 'zepto-modules';
import FPS from 'fps';
import {
  Scene as ThreeScene,
  WebGLRenderer,
  TextureLoader,
  PCFSoftShadowMap,
  BasicShadowMap,
  PerspectiveCamera,
  DirectionalLight,
  CameraHelper,
  AmbientLight,
  Raycaster,
  PlaneGeometry,
  Mesh,
  MeshBasicMaterial,
  LineBasicMaterial,
  Geometry,
  Vector3,
  Vector2,
  Line,
  Euler,
} from 'three';
import OBJLoader from 'three/OBJLoader.js';
import VREffect from 'three/VREffect.js';
import VRControls from 'three/VRControls.js';
import ViveController from 'three/ViveController.js';

import {STATE, MODE, INITIAL_CONFIG, EVENT} from './constants';
import {cap, mirrorPosition, mirrorVelocity, setTransparency} from './util/helpers';
import VR_MODES from './webvr-manager/modes';
import Physics from './physics';
import Hud from './hud';
import SoundManager from './sound-manager';
import WebVRManager from './webvr-manager';
import Util from './webvr-manager/util';
import Time from './util/time';

import Table from './models/table';
import Net from './models/net';
import Ball from './models/ball';
import Crosshair from './models/crosshair';
import setupPaddles from './models/paddle';

const DEBUG_MODE = false;

export default class Scene {
  constructor(emitter, communication) {

    this.emitter = emitter;
    this.time = new Time();
    this.controlMode = 'MOUSE';

    this.communication = communication;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.controller = null;
    this.effect = null;
    this.textureLoader = new TextureLoader();
    this.textureLoader.setPath('/textures/');
    this.objLoader = new OBJLoader();
    this.objLoader.setPath('/models/');
    this.table = null;
    this.display = null;
    this.manager = null;
    this.gamePad = null;
    this.controller1 = null;
    this.controller2 = null;
    this.raycaster = null;
    this.tablePlane = null;
    this.net = null;
    this.tabActive = true;
    this.ball = null;
    this.physicsDebugRenderer = null;
    this.resetBallTimeout = null;
    this.ballHasHitEnemyTable = false;
    this.resetTimeoutDuration = 1500;
    this.physicsTimeStep = 1000;
    this.lastOpponentHitPosition = null;
    this.lastHitPosition = null;
    this.crossHair = null;
    this.paddleInterpolationAlpha = 0;
    this.ballInterpolationAlpha = 0;
    this.ghostPaddlePosition = new Vector3();
    this.pointerIsLocked = false;
    this.fps = FPS({
      every: 10,
      decay: 0.1,
    });

    this.mouseMoveSinceLastFrame = {
      x: 0,
      y: 0,
    };
    this.mousePosition = {
      x: 0,
      y: 0,
    };

    this.hitAvailable = true;

    this.playerRequestedRestart = false;
    this.opponentRequestedRestart = false;

    this.playerRequestedCountdown = false;
    this.opponentRequestedCountdown = false;
    this.mousemove = this.mousemove.bind(this);

    this.isMobile = Util.isMobile();

    this.config = Object.assign({}, INITIAL_CONFIG);

    this.score = {
      self: 0,
      opponent: 0,
      lives: this.config.startLives,
      highest: 0,
    };

    this.physics = new Physics(this.config, this.emitter);
    this.sound = new SoundManager(this.config);

    this.frameNumber = 0;
    this.firstActiveFrame = 0;
    this.totaltime = 0;
    this.lastRender = 0;
  }

  setup() {
    return new Promise((resolve, reject) => {
      this.setupThree();
      this.setupVR();
      this.net = Net(this.scene, this.config);

      this.renderer.domElement.requestPointerLock 
        = this.renderer.domElement.requestPointerLock
        || this.renderer.domElement.mozRequestPointerLock;

      this.renderer.domElement.onclick = () => {
        if (this.config.state !== STATE.GAME_OVER
         && this.renderer.domElement.requestPointerLock) {
          this.renderer.domElement.requestPointerLock();
        }
      };

      this.physics.setupWorld();

      if (DEBUG_MODE) {
        this.physicsDebugRenderer = new CannonDebugRenderer(this.scene, this.physics.world);
      }

      this.setupEventListeners();
      this.setupTablePlane();
      this.setupLights();
      this.hud = new Hud(this.scene, this.config, this.emitter, this.objLoader);
      this.crosshair = new Crosshair(this.scene, this.config);
      this.crosshair.visible = false;

      Promise.all([
        setupPaddles(this.objLoader, this.config, this.scene),
        this.hud.setup(),
      ]).then(response => {
        this.paddle = response[0].paddle;
        this.paddleOpponent = response[0].paddleOpponent;
        this.paddle.position.copy(this.computePaddlePosition() || new Vector3());
        this.ghostPaddlePosition.copy(this.paddle.position);
        resolve('loaded');
      }).catch(e => {
        console.log(e);
      });
    });
  }

  mousemove(e) {
    if (!this.paddle || !this.viewport) {
      return;
    }
    //console.log(e);
    if (this.pointerIsLocked) {
      //console.log('pointer is locked');
      this.mouseMoveSinceLastFrame.x += e.movementX;
      this.mouseMoveSinceLastFrame.y += e.movementY;
    } else {
      this.mousePosition.x = e.offsetX / this.viewport.width - 0.5;
      this.mousePosition.y = -(e.offsetY / this.viewport.height - 0.5);
    }
  }

  setupEventListeners() {
    this.emitter.on(EVENT.GAME_OVER, e => {
      this.sound.playLoop('bass-pad-synth');
      this.ball.visible = false;
      this.paddle.visible = false;
      this.paddleOpponent.visible = false;
      this.config.state = STATE.GAME_OVER;
      this.time.clearTimeout(this.resetBallTimeout);
      this.crosshair.visible = true;
      if (this.config.mode === MODE.SINGLEPLAYER) {
        this.hud.message.gameOver(this.score);
        this.sound.playUI('win');
      } else {
        this.hud.message.gameOver(this.score);
        if (this.score.self > this.score.opponent) {
          this.sound.playUI('win');
        } else {
          this.sound.playUI('lose');
        }
      }
      setTransparency(this.table, 0.2);
      setTransparency(this.net, 0.2);
      this.hud.scoreDisplay.hide();
      this.hud.message.showMessage();
    });
    this.emitter.on(EVENT.BALL_TABLE_COLLISION, this.ballTableCollision.bind(this));
    this.emitter.on(EVENT.RESTART_BUTTON_PRESSED, e => {
      this.hud.message.hideMessage();
      if (this.config.mode === MODE.MULTIPLAYER) {
        this.playerRequestedRestart = true;
        this.hud.message.setMessage('waiting');
        this.hud.message.showMessage();
        this.communication.sendRestartGame();
      }
      this.restartGame();
    });
    this.emitter.on(EVENT.EXIT_BUTTON_PRESSED, e => {
      this.hud.message.setMessage('take off vr device');
    });
    this.emitter.on(EVENT.BALL_NET_COLLISION, e => {
      this.sound.playUI('net');
    });

    // $(document).mousemove(this.mousemove.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.mousemove, false);
    // $('canvas').mousemove(this.mousemove.bind(this));
    $(this.renderer.domElement).click(() => {
      this.hud.message.click();
    });

    if ("onpointerlockchange" in document) {
      document.addEventListener('pointerlockchange', this.pointerLockChange.bind(this), false);
    } else if ("onmozpointerlockchange" in document) {
      document.addEventListener('mozpointerlockchange', this.pointerLockChange.bind(this), false);
    }

    this.fps.on('data', framerate => {
      if (this.tabActive && this.frameNumber - this.firstActiveFrame > 100 && framerate < 30) {
        // TODO maybe reduce shadow map size first
        this.renderer.setPixelRatio(window.devicePixelRatio / 2);
      }
    });
  }

  pointerLockChange() {
    console.log(document.pointerLockElement);
    if (document.pointerLockElement === this.renderer.domElement
      || document.mozPointerLockElement === this.renderer.domElement) {
      this.pointerIsLocked = true;
    } else {
      this.pointerIsLocked = false;
    }
  }

  setupVRControls() {
    // apply VR headset positional data to camera.
    this.controls = new VRControls(this.camera);
    this.controls.standing = true;
    this.controls.userHeight = this.config.cameraHeight;
    this.setupControllers();
  }

  setupVR() {
    // apply VR stereo rendering to renderer.
    this.effect = new VREffect(this.renderer);
    this.effect.setSize(window.innerWidth, window.innerHeight);

    // Create a VR manager helper to enter and exit VR mode.
    const params = {
      hideButton: false, // Default: false.
      isUndistorted: false // Default: false.
    };

    this.manager = new WebVRManager(this.renderer, this.effect, params);

    window.addEventListener('resize', this.onResize.bind(this), true);
    window.addEventListener('vrdisplaypresentchange', this.onResize.bind(this), true);
  }

  setupThree() {
    this.renderer = new WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    // this.renderer.setPixelRatio(0.5);
    this.renderer.shadowMap.enabled = true;
    // this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.shadowMap.type = BasicShadowMap;

    document.body.appendChild(this.renderer.domElement);

    this.scene = new ThreeScene();
    this.camera = new PerspectiveCamera(47, window.innerWidth / window.innerHeight, 0.1, 10000);

    // position over the table, will be animated to the final camera position
    this.camera.position.x = 0;
    this.camera.position.y = 1.6;
    this.camera.position.z = 0.6;
  }

  setupLights() {
    let light = new DirectionalLight(0xffffff, 0.3, 0);
    light.position.z = this.config.tablePositionZ;
    light.position.z = 2;
    light.position.y = 4;
    light.shadow.camera.near = 3.5;
    light.shadow.camera.far = 5.4;
    light.shadow.camera.left = -this.config.tableWidth / 2;
    light.shadow.camera.right = this.config.tableWidth / 2;
    light.shadow.camera.bottom = 0.8;
    light.shadow.camera.top = 3.4;
    light.castShadow = true;
    light.shadow.mapSize.width = (this.isMobile ? 1 : 8) * 512;
    light.shadow.mapSize.height = (this.isMobile ? 1 : 8) * 512;
    this.scene.add(light);
    // this.scene.add(new CameraHelper(light.shadow.camera));

    light = new AmbientLight(0xFFFFFF, 0.9);
    this.scene.add(light);
  }

  setupTablePlane() {
    this.raycaster = new Raycaster();
    const geometry = new PlaneGeometry(40, 40, 5, 5);
    const material = new MeshBasicMaterial({color: 0xffff00, wireframe: true});
    this.tablePlane = new Mesh(geometry, material);
    this.tablePlane.rotation.x = -Math.PI * 0.45;
    this.tablePlane.position.y = this.config.tableHeight + 0.2;
    this.tablePlane.position.z = this.config.tablePositionZ + this.config.tableDepth / 2;
    this.tablePlane.material.visible = false;
    this.scene.add(this.tablePlane);
  }

  setupControllers() {
    navigator.getVRDisplays().then(displays => {
      if (displays.length > 0) {
        this.display = displays[0];
        if (displays[0].capabilities && displays[0].capabilities.hasPosition) {
          // also check gamepads
          this.controller1 = new ViveController(0);
          this.controller1.standingMatrix = this.controls.getStandingMatrix();
          this.scene.add(this.controller1);
          this.controller2 = new ViveController(1);
          this.controller2.standingMatrix = this.controls.getStandingMatrix();
          this.scene.add(this.controller2);

          this.objLoader.load('vr_controller_vive_1_5.obj', object => {
            this.controller = object.children[ 0 ];
            this.controller.material.map = this.textureLoader.load('onepointfive_texture.png');
            this.controller.material.specularMap = this.textureLoader.load('onepointfive_spec.png');

            this.controller1.add(object.clone());
            this.controller2.add(object.clone());
          });
        }
      }
    });
  }

  startGame() {
    // prepare the scene
    this.hud.container.visible = false;
    const table = this.scene.getObjectByName('table');
    if (this.config.mode === MODE.MULTIPLAYER) {
      if (this.communication.isHost) {
        this.renderer.setClearColor(this.config.colors.BLUE_CLEARCOLOR, 1);
        table.material.color.set(this.config.colors.BLUE_TABLE);
      } else {
        this.renderer.setClearColor(this.config.colors.GREEN_CLEARCOLOR, 1);
        table.material.color.set(this.config.colors.GREEN_TABLE);
      }
    } else {
      const upwardsTableGroup = this.scene.getObjectByName('upwardsTableGroup');
      upwardsTableGroup.visible = true;
      this.net.visible = false;
      this.physics.net.collisionResponse = 0;
      this.physics.upwardsTable.collisionResponse = 1;
      this.renderer.setClearColor(this.config.colors.PINK_CLEARCOLOR, 1);
      table.material.color.set(this.config.colors.PINK_TABLE);
    }

    this.introPanAnimation().then(() => {
      this.viewport = {
        width: $(this.renderer.domElement).width(),
        height: $(this.renderer.domElement).height(),
      };
      if (this.display) {
        this.display.resetPose();
      }
      this.paddle.visible = true;
      this.hud.container.visible = true;
      this.setupVRControls();
      if (this.config.mode === MODE.SINGLEPLAYER) {
        this.countdown();
      } else {
        this.paddleOpponent.visible = true;
        this.playerRequestedCountdown = true;
        this.communication.sendRequestCountdown();
        this.requestCountdown();
      }
    });
  }

  introPanAnimation() {
    this.animate();
    return new Promise((resolve, reject) => {
      const tl = new TimelineMax();
      this.camera.lookAt(
        new Vector3().lerpVectors(
          this.ghostPaddlePosition,
          new Vector3(
            this.table.position.x,
            this.config.tableHeight + 0.3,
            this.table.position.z
          ),
          0.5
        )
      );
      this.camera.position.y = 5;
      tl.set(this.renderer.domElement, {display: 'block'});

      if (this.config.mode === MODE.MULTIPLAYER && !this.isMobile && this.controlMode === 'MOUSE') {
        console.log('stagger');
        tl.staggerTo([
          '.present-players',
          '#generated-room-code, #generated-room-url, #room-code',
          '.grey-text',
          '.opponent-joined',
        ], 0.5, {
          y: -20,
          opacity: 0,
        }, 0.1, 0);
      }
      tl.to('.intro-wrapper', 0.3, {autoAlpha: 0});

      const panDuration = 1.5;

      tl.to(this.camera.position, panDuration, {
        y: 1.6,
        ease: Power1.easeInOut,
      }, 0.6);
      tl.call(resolve, [], null, '+=1');
    });
  }

  receivedRequestCountdown() {
    this.opponentRequestedCountdown = true;
    this.requestCountdown();
  }

  requestCountdown() {
    if (this.playerRequestedCountdown && this.opponentRequestedCountdown) {
      this.countdown();
    }
  }

  countdown() {
    // TODO why is this neccessary
    $('.opponent-joined').css('display', 'none');
    this.paddle.visible = true;
    this.paddleOpponent.visible = this.config.mode === MODE.MULTIPLAYER;
    this.sound.playLoop('bass');
    this.hud.scoreDisplay.show();
    this.hud.message.hideMessage(this.config.mode === MODE.MULTIPLAYER);
    setTransparency(this.table, 1);
    setTransparency(this.net, 1);

    this.config.state = STATE.COUNTDOWN;
    // countdown from 3, start game afterwards
    this.hud.countdown.showCountdown();
    let n = 2;
    const countdown = this.time.setInterval(() => {
      this.hud.countdown.setCountdown(n);
      n--;
      if (n < 0) {
        // stop the countdown
        this.time.clearInterval(countdown);
        this.hud.countdown.hideCountdown();
        // start game by adding ball
        if (this.config.mode === MODE.SINGLEPLAYER) {
          this.addBall();
          this.physics.initBallPosition();
        } else if (this.config.mode === MODE.MULTIPLAYER
            && !this.communication.isHost) {
          this.addBall();
          // if multiplayer, also send the other player a hit so the ball is synced
          this.communication.sendMiss({
            x: this.physics.ball.position.x,
            y: this.physics.ball.position.y,
            z: this.physics.ball.position.z,
          }, {
            x: this.physics.ball.velocity.x,
            y: this.physics.ball.velocity.y,
            z: this.physics.ball.velocity.z,
          }, true, true);
        }
      }
    }, 1000);
  }

  restartGame() {
    this.crosshair.visible = false;
    this.physics.speed = 1;
    this.resetScore();
    if (this.config.mode === MODE.SINGLEPLAYER) {
      this.countdown();
      this.emitter.emit(EVENT.RESTART_GAME, this.score);
      return;
    }

    // only restart if both players requested it
    if (this.opponentRequestedRestart && this.playerRequestedRestart) {
      this.emitter.emit(EVENT.RESTART_GAME, this.score);
      // reset
      this.playerRequestedRestart = false;
      this.opponentRequestedRestart = false;
      this.countdown();
    }
  }

  resetScore() {
    this.score.self = 0;
    this.score.opponent = 0;
    this.score.highest = 0;
    this.score.lives = this.config.startLives;
    // propagate to HUD
    this.hud.scoreDisplay.setSelfScore(0);
    this.hud.scoreDisplay.setOpponentScore(0);
    this.hud.scoreDisplay.setLives(this.score.lives);
  }

  setMultiplayer() {
    // prepare multiplayer mode
    this.config.mode = MODE.MULTIPLAYER;
    this.scene.remove(this.table);
    this.table = Table(this.scene, this.config);
    this.hud.message.showMessage();
    this.resetTimeoutDuration = 3000;
    this.hud.scoreDisplay.opponentScore.visible = true;
    this.hud.scoreDisplay.lifeGroup.visible = false;
    this.scene.getObjectByName('net-collider').visible = true;
    // add callbacks for received actions
    this.communication.setCallbacks({
      move: this.receivedMove.bind(this),
      hit: this.receivedHit.bind(this),
      miss: this.receivedMiss.bind(this),
      restartGame: this.receivedRestartGame.bind(this),
      requestCountdown: this.receivedRequestCountdown.bind(this),
    });
  }

  setSingleplayer() {
    // prepare singleplayer mode
    this.config.mode = MODE.SINGLEPLAYER;
    this.scene.remove(this.table);
    this.table = Table(this.scene, this.config);
    this.hud.message.hideMessage();
    this.resetTimeoutDuration = 1500;
    this.hud.scoreDisplay.opponentScore.visible = false;
    this.hud.scoreDisplay.lifeGroup.visible = true;
    this.scene.getObjectByName('net-collider').visible = false;
  }

  receivedMove(move) {
    // received a move from the opponent,
    // set his paddle to the position received
    const pos = mirrorPosition(move.position, this.config.tablePositionZ);
    const no = {
      x: this.paddleOpponent.position.x,
      y: this.paddleOpponent.position.y,
      z: this.paddleOpponent.position.z,
      rotationX: this.paddleOpponent.rotation.x,
      rotationY: this.paddleOpponent.rotation.y,
      rotationZ: this.paddleOpponent.rotation.z,
    };
    // show the opponent paddle slightly behind
    // the actual position to prevent the ball going
    // 'through' it
    TweenMax.to(no, 0.14, {
      x: pos.x,
      y: pos.y,
      z: pos.z - 0.1,
      rotationX: -move.rotation._x,
      rotationY: move.rotation._y,
      rotationZ: -move.rotation._z,
      onUpdate: () => {
        this.paddleOpponent.position.x = no.x;
        this.paddleOpponent.position.y = no.y;
        this.paddleOpponent.position.z = no.z;
        this.paddleOpponent.rotation.x = no.rotationX;
        this.paddleOpponent.rotation.y = no.rotationY;
        this.paddleOpponent.rotation.z = no.rotationZ;
      }
    });
  }

  receivedRestartGame() {
    this.opponentRequestedRestart = true;
    // try to restart game, only does if player also requested restart
    this.restartGame();
  }

  receivedHit(data, wasMiss=false) {
    this.time.clearTimeout(this.resetBallTimeout);
    // we might not have a ball yet
    if (!this.ball) {
      // this doesnt add a ball if it already exists so were safe to call it
      this.addBall();
    } else {
      this.sound.paddle(data.point);
    }
    if (!wasMiss) {
      // the received position will sometimes be slightly off from the position
      // of this players ball due to changes in latency. save the difference and
      // interpolate it until the ball is at our side again. this way the user
      // shouldnt notice any hard position changes
      this.ballPositionDifference = new Vector3().subVectors(
        this.physics.ball.position,
        mirrorPosition(data.point, this.config.tablePositionZ)
      );
      this.lastOpponentHitPosition = new Vector3().copy(
        mirrorPosition(data.point, this.config.tablePositionZ)
      );
      this.ballInterpolationAlpha = 1;
      TweenMax.to(this, 0.5, {
        ease: Power0.easeNone,
        ballInterpolationAlpha: 0,
      });
      this.physics.increaseSpeed();
    }
    this.physicsTimeStep = 1000;
    // received vectors are in the other users space
    // invert x and z velocity and mirror the point across the center of the table
    this.physics.ball.position.copy(mirrorPosition(data.point, this.config.tablePositionZ));
    this.physics.ball.velocity.copy(mirrorVelocity(data.velocity));
  }

  receivedMiss(data) {
    this.physics.speed = 1;
    this.ballPositionDifference = null;
    this.time.clearTimeout(this.resetBallTimeout);
    // opponent missed, update player score
    // and set game to be over if the score is high enough
    if (!data.isInit) {
      if (data.ballHasHitEnemyTable) {
        this.score.opponent++;
        this.hud.scoreDisplay.setOpponentScore(this.score.opponent);
        this.sound.playUI('miss');
      } else {
        this.score.self++;
        this.hud.scoreDisplay.setSelfScore(this.score.self);
        this.sound.playUI('point');
      }
    } else {
      this.addBall();
    }
    if (this.score.self >= this.config.POINTS_FOR_WIN
      || this.score.opponent >= this.config.POINTS_FOR_WIN) {
        this.emitter.emit(EVENT.GAME_OVER, this.score, this.config.mode);
    } else {
      this.physics.ball.angularVelocity.x = 0;
      this.physics.ball.angularVelocity.y = 0;
      this.physics.ball.angularVelocity.z = 0;
      // otherwise, the opponent that missed also resets the ball
      // and sends along its new position
      this.receivedHit(data, true);
      this.config.state = STATE.PLAYING;
    }
  }

  slowdownBall() {
    // if the ball is on the way to the opponent,
    // we slow it down so it will be on the opponents side
    // approximately at the time they actually hit it
    // NOTE we still only receive the hit half a roundtriptime later
    if (this.physics.ball.velocity.z > 0) {
      return;
    }
    const velocity = this.physics.ball.velocity.length();
    const dist = new Vector3().subVectors(this.ball.position, this.paddleOpponent.position).length();
    const eta = dist/velocity;
    const desirableEta = eta + (this.communication.latency / 1000);
    this.physicsTimeStep = 1000 * (desirableEta/eta) * 1;
  }

  restartPingpongTimeout() {
    // reset the ball position in case the ball is stuck at the net
    // or fallen to the floor
    this.time.clearTimeout(this.resetBallTimeout);
    if (this.config.state === STATE.GAME_OVER) {
      return;
    }
    this.resetBallTimeout = this.time.setTimeout(() => {
      if (this.config.mode === MODE.MULTIPLAYER) {
        this.physicsTimeStep = 1000;
        if (this.ballHasHitEnemyTable) {
          this.score.self++;
          this.hud.scoreDisplay.setSelfScore(this.score.self);
          this.sound.playUI('point');
        } else {
          this.score.opponent++;
          this.hud.scoreDisplay.setOpponentScore(this.score.opponent);
          this.sound.playUI('miss');
        }
        if (this.score.opponent >= this.config.POINTS_FOR_WIN
            || this.score.self >= this.config.POINTS_FOR_WIN) {
          // game is over
          // TODO maybe wait a little with this so players can enjoy their 11 points
          this.emitter.emit(EVENT.GAME_OVER, this.score, this.config.mode);
        } else {
          // the game goes on
          this.physics.initBallPosition();
        }

        this.communication.sendMiss({
          x: this.physics.ball.position.x,
          y: this.physics.ball.position.y,
          z: this.physics.ball.position.z,
        }, {
          x: this.physics.ball.velocity.x,
          y: this.physics.ball.velocity.y,
          z: this.physics.ball.velocity.z,
        }, this.ballHasHitEnemyTable);
        this.ballHasHitEnemyTable = false;
      } else {
        // singleplayer
        this.score.highest = Math.max(this.score.self, this.score.highest);
        this.score.self = 0;
        this.hud.scoreDisplay.setSelfScore(this.score.self);
        this.physics.initBallPosition();
        this.score.lives--;
        this.hud.scoreDisplay.setLives(this.score.lives);
        this.sound.playUI('miss');
        if (this.score.lives < 1) {
          this.emitter.emit(EVENT.GAME_OVER, this.score, this.config.mode);
        }
      }
      this.restartPingpongTimeout();
    }, this.resetTimeoutDuration);
  }

  ballPaddleCollision(point) {
    if (this.hitTween && this.hitTween.isActive()) {
      return;
    }
    this.physics.paddleCollision({body: this.physics.ball, target: this.paddle});
    this.ballHitAnimation();
    this.ballPositionDifference = null;
    // the ball collided with the players paddle
    this.restartPingpongTimeout();
    this.ballHasHitEnemyTable = false;
    this.sound.paddle(point);
    if (this.config.mode === MODE.SINGLEPLAYER) {
      this.score.self++;
      this.hud.scoreDisplay.setSelfScore(this.score.self);
      return;
    }
    this.slowdownBall();
    this.communication.sendHit({
      x: point.x,
      y: point.y,
      z: point.z,
    }, {
      x: this.physics.ball.velocity.x,
      y: this.physics.ball.velocity.y,
      z: this.physics.ball.velocity.z,
    });
  }

  ballTableCollision(body, target) {
    this.sound.table(body.position, this.physics.ball.velocity);
    if (target._name === 'table-2-player' && body.position.z < this.config.tablePositionZ) {
      this.ballHasHitEnemyTable = true;
    }
  }

  addBall() {
    this.config.state = STATE.PLAYING;
    if (this.ball) {
      this.ball.visible = true;
      this.physics.initBallPosition();
      this.restartPingpongTimeout();
      return;
    }
    this.ball = new Ball(this.scene, this.config);
    this.physics.addBall();
    this.restartPingpongTimeout();
  }

  updateControls() {
    if (this.controller1 && this.controller2) {
      this.controller1.update();
      this.controller2.update();
    }
    const pos = this.computePaddlePosition();
    if (pos) {
      this.ghostPaddlePosition.copy(pos);
    }
    if (this.controls && this.controlMode === 'VR') {
      // Update VR headset position and apply to camera.
      this.controls.update();
      if (this.camera.position.x === 0
        && this.camera.position.z === 0) {
          // no position sensor in the device, put it behind the table
          this.camera.position.z = 1;
      }
    }
    if (this.hitTween && this.hitTween.isActive()) {
      // interpolate between ball and paddle position during hit animation
      const newPos = new Vector3().lerpVectors(
        pos,
        this.lastHitPosition,
        this.paddleInterpolationAlpha
      );
      this.paddle.position.copy(newPos);
    } else if (pos) {
      this.paddle.position.copy(pos);
    }
    const rotation = this.computePaddleRotation(this.paddle.position);
    this.paddle.rotation.x = rotation.x;
    this.paddle.rotation.z = rotation.z;
    this.updateCamera();
  }

  updateCamera() {
    if (this.display && this.controlMode !== 'MOUSE') {
      // user controls camera with headset in vr mode
      return;
    }
    // backup original rotation
    const startRotation = new Euler().copy(this.camera.rotation);

    // look at the point at the middle position between the table center and paddle
    this.camera.lookAt(
      new Vector3().lerpVectors(
        this.ghostPaddlePosition,
        new Vector3(
          this.table.position.x,
          this.config.tableHeight + 0.3,
          this.table.position.z
        ),
        0.5
      )
    );
    // the rotation we want to end up with
    const endRotation = new Euler().copy(this.camera.rotation);
    // revert to original rotation and then we can tween it
    this.camera.rotation.copy(startRotation);
    if (this.cameraTween) {
      this.cameraTween.kill();
    }
    this.cameraTween = TweenMax.to(this.camera.rotation, 0.5, {
      x: endRotation.x,
      y: endRotation.y,
      z: endRotation.z,
      ease: Power4.easeOut,
    });
  }

  computePaddlePosition() {
    let paddlePosition = null;
    if (this.display && this.controlMode === 'VR') {
      let controller = null;
      if (this.controller1 && this.controller1.visible) {
        controller = this.controller1;
      } else if (this.controller2 && this.controller2.visible) {
        controller = this.controller2;
      }
      let intersects = [];
      if (controller) {
        // VIVE ETC
        // if we do have a controller, intersect the table with where the controller is facing
        const direction = new Vector3(0, 0, -1);
        direction.applyQuaternion(controller.getWorldQuaternion());
        direction.normalize();
        this.raycaster.set(controller.getWorldPosition(), direction);
        this.raycaster.far = 5;
        intersects = this.raycaster.intersectObject(this.tablePlane, false);
      } else {
        // CARDBOARD
        // if we dont have a controller, intersect the table
        // with where the camera is looking and place the paddle there
        // if we are in vr, position paddle below looking direction so we dont have
        // to look down at all times
        const rayYDirection = this.manager.mode === VR_MODES.VR ? -0.7 : -0.3;
        this.raycaster.setFromCamera(new Vector2(0, rayYDirection), this.camera);
        this.raycaster.far = 5;
        intersects = this.raycaster.intersectObject(this.tablePlane, false);
        if (intersects.length > 0) {
          intersects[0].point.x *= 1.5;
        }
      }
      if (intersects.length > 0) {
        paddlePosition =  intersects[0].point;
      }
    } else {
      // MOUSE
      if (this.pointerIsLocked) {
        paddlePosition =  {
          x: this.ghostPaddlePosition.x + 0.0015 * this.mouseMoveSinceLastFrame.x,
          y: this.config.tableHeight + 0.24,
          z: this.ghostPaddlePosition.z + 0.0015 * this.mouseMoveSinceLastFrame.y,
        };
      } else {
        paddlePosition = {
          x: 1.4 * this.mousePosition.x * this.config.tableWidth,
          y: this.config.tableHeight + 0.24,
          z: -this.config.tableDepth * 0.5 * (this.mousePosition.y + 0.5),
        };
      }
    }
    if (paddlePosition) {
      const x = cap(paddlePosition.x, this.config.tableWidth, -this.config.tableWidth);
      const z = cap(paddlePosition.z, this.config.tablePositionZ + 0.5, 0);
      const y = paddlePosition.y || this.config.tableHeight + 0.1 - z * 0.2;
      return {x, y, z};
    } else {
      return this.paddle.position.clone();
    }
  }

  computePaddleRotation(pos) {
    return {
      x: -((this.config.tablePositionZ + this.config.tableDepth / 2) - pos.z * 1),
      y: 0,
      z: cap(-pos.x, -Math.PI / 2, Math.PI / 2),
    };
  }

  updateBall() {
    if (this.ballPositionDifference) {
      // we interpolate between the actual (received) position and the position
      // the user would expect. after 500ms both positions are the same.
      const fauxPosition = new Vector3().lerpVectors(
        this.physics.ball.position,
        new Vector3().addVectors(
          this.physics.ball.position,
          this.ballPositionDifference
        ),
        this.ballInterpolationAlpha
      );
      this.ball.position.copy(fauxPosition);
      this.ball.quaternion.copy(this.physics.ball.quaternion);
    } else {
      this.ball.position.copy(this.physics.ball.position);
      this.ball.quaternion.copy(this.physics.ball.quaternion);
    }
  }

  ballHitAnimation() {
    if (!(this.hitTween && this.hitTween.isActive()) && this.hitAvailable) {
      this.hitAvailable = false;
      this.hitTween = new TimelineMax({
        onComplete: () => {this.hitAvailable = true;},
      });
      this.lastHitPosition = this.ball.position.clone();
      this.lastHitPosition.y = Math.max(this.lastHitPosition.y, this.config.tableHeight + 0.2);
      this.hitTween.to(this, 0.05, {
        paddleInterpolationAlpha: 1,
        ease: Power2.easeIn,
      });
      this.hitTween.to(this, 0.4, {
        ease: Power2.easeOut,
        paddleInterpolationAlpha: 0,
      });
    }
  }

  animate() {
    const timestamp = Date.now();
    const delta = Math.min(timestamp - this.lastRender, 500);
    this.totaltime += delta;
    this.fps.tick();

    if (this.ball) {
      const dist = new Vector3();
      dist.subVectors(this.ball.position, this.paddle.position);
      if (
        // ball is close enough to the paddle for a hit
        (dist.length() < 0.4
          && Math.abs(dist.x) < 0.2
          && Math.abs(dist.z) < 0.1
        || this.isMobile && dist.length() < 0.8
          && Math.abs(dist.x) < 0.3 
          && Math.abs(dist.z) < 0.1)
        // and ball is moving towards us, it could move away from us
        // immediately after the opponent reset the ball and it that case
        // we wouldnt want a hit
        && this.physics.ball.velocity.z > 0) {
        this.ballPaddleCollision(this.ball.position);
      }
    }

    if (this.config.state === STATE.PLAYING
      || this.config.state === STATE.COUNTDOWN
      || this.config.state === STATE.GAME_OVER) {
      this.updateControls();
    }

    if (this.config.state === STATE.PLAYING
      || this.config.state === STATE.COUNTDOWN
      || this.config.state === STATE.GAME_OVER) {

      if (this.ball && this.config.mode === MODE.MULTIPLAYER && !this.communication.isHost) {
        // for multiplayer testing
        // this.paddle.position.y = Math.max(this.config.tableHeight + 0.1, this.ball.position.y);
        // this.paddle.position.x = this.ball.position.x;
      }
      if (this.config.mode === MODE.MULTIPLAYER) {
        // send where the paddle has moved, if it has moved
        // every 5th frame is enough, this way we send less bytes down the line
        if (this.frameNumber % 5 === 0) {
          this.communication.sendMove(
            this.paddle.position,
            this.paddle.rotation
          );
        }
      }
    }

    if (this.config.state === STATE.PLAYING) {
      this.physics.step(delta / this.physicsTimeStep);
      this.updateBall();
      this.physics.predictCollisions(this.scene.getObjectByName('net-collider'), delta);
    }

    if (this.config.state === STATE.GAME_OVER) {
      // raycaster wants mouse from -1 to 1, not -0.5 to 0.5 like mousePosition is normalized
      let mouse = {};
      if (this.controlMode === 'VR' || this.isMobile) {
        const zCamVec = new Vector3(0, 0, -1);
        const position = this.camera.localToWorld(zCamVec);
        this.crosshair.position.set(position.x, position.y, position.z);
        mouse = {
          x: 0,
          y: 0,
        };
      } else {
        mouse = {
          x: this.mousePosition.x * 2,
          y: this.mousePosition.y * 2,
        };
      }
      this.raycaster.setFromCamera(mouse, this.camera);
      this.hud.message.intersect(this.raycaster, this.controlMode === 'MOUSE' && !this.isMobile);
    }

    if (DEBUG_MODE) {
      this.physicsDebugRenderer.update();
    }

    this.time.step();

    this.lastRender = timestamp;
    this.frameNumber++;
    this.mouseMoveSinceLastFrame.x = 0;
    this.mouseMoveSinceLastFrame.y = 0;

    // debug
    // if (this.frameNumber % 100 === 0) {
    //   console.log(this.renderer.info.render);
    // }

    // Render the scene through the manager.
    // this.manager.render(this.scene, this.camera, this.timestamp);
    this.renderer.render(this.scene, this.camera);
    if (this.display && 'requestAnimationFrame' in this.display && this.controlMode === 'VR') {
      this.display.requestAnimationFrame(this.animate.bind(this));
    } else {
      requestAnimationFrame(this.animate.bind(this));
    }
  }

  onResize(e) {
    this.effect.setSize(window.innerWidth, window.innerHeight, true);
    //this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
