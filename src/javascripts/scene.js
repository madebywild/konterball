import TweenMax from 'gsap';
import {STATE, MODE, INITIAL_CONFIG, PRESET, EVENT} from './constants';
import Physics from './physics';
import Hud from './hud';
import SoundManager from './sound-manager';
import Communication from './communication';
import $ from 'jquery';

import Box from './models/box';
import SquarePaddle from './models/square-paddle';
import Paddle from './models/paddle';
import Net from './models/net';

const DEBUG_MODE = false;
const resetTimeoutDuration = 3000;

export default class Scene {
  constructor(emitter) {
    this.emitter = emitter;

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.controller = null;
    this.effect = null;
    this.loader = null;
    this.box = null;
    this.display = null;
    this.manager = null;
    this.gamePad = null;
    this.controller1 = null;
    this.controller2 = null;
    this.raycaster = null;
    this.paddlePlane = null;
    this.controlMode = 'pan';
    this.controllerRay = null;
    this.net = null;
    this.canvasDOM = document.querySelector('canvas');
    this.seconds = 0;
    this.tabActive = true;
    this.ball = null;
    this.physicsDebugRenderer = null;
    this.ballReference = null;
    this.resetBallTimeout = null;
    this.state = STATE.PRELOADER;

    this.paddleHelpers = {
      top: null,
      left: null,
      right: null,
      bottom: null,
    };
    this.playerRequestedRestart = false;
    this.opponentRequestedRestart = false;

    this.viewport = {
      width: $(document).width(),
      height: $(document).height(),
    };

    this.score = {
      self: 0,
      opponent: 0,
    };


    // config
    this.config = Object.assign({}, INITIAL_CONFIG);

    this.physics = new Physics(this.config, this.ballPaddleCollision.bind(this));
    this.sound = new SoundManager();

    // boxZBounds: -(this.boxSize.depth - 1),
    this.boxZBounds = 0;

    this.frameNumber = 0;
    this.totaltime = 0;
    this.lastRender = 0;
  }

  setup() {
    this.setupThree();
    this.box = Box(this.scene, this.config);
    this.setupVR();
    this.net = Net(this.scene, this.config);
    this.net.visible = false;

    this.renderer.domElement.requestPointerLock = this.renderer.domElement.requestPointerLock
      || this.renderer.domElement.mozRequestPointerLock;
    this.renderer.domElement.onclick = () => {
      this.renderer.domElement.requestPointerLock();
    };

    this.physics.setupWorld();
    this.physics.net.collisionResponse = 0;

    this.paddle = SquarePaddle(this.scene, this.config, this.config.colors.WHITE);
    this.paddleBoundingBox = new THREE.BoundingBoxHelper(this.paddle, 0xffffff);
    this.paddleBoundingBox.material.visible = false;
    this.scene.add(this.paddleBoundingBox);


    this.paddleOpponent = SquarePaddle(this.scene, this.config, this.config.colors.WHITE);
    this.paddleOpponent.position.z = this.config.boxPositionZ - this.config.boxDepth / 2;
    this.paddleOpponent.position.y = 1;
    this.paddleOpponent.visible = false;

    this.hud = new Hud(this.scene, this.config, this.emitter);
    this.setupPaddlePlane();
    this.setupLights();

    if (DEBUG_MODE) {
      this.physicsDebugRenderer = new THREE.CannonDebugRenderer(this.scene, this.physics.world);
    }

    this.emitter.on(EVENT.OPPONENT_CONNECTED, () => {
      this.paddleOpponent.visible = true;
    });
    this.emitter.on(EVENT.PRESET_CHANGED, e => {
      if (this.config.mode === MODE.MULTIPLAYER) {
        this.communication.sendPresetChange(e);
      }
      this.presetChange(e);
    });

    requestAnimationFrame(this.animate.bind(this));
  }

  presetChange(name) {
    if (this.config.preset === name) {
      return;
    }
    this.resetScore();
    this.hud.scoreDisplay.presetChange(name);
    if (name === PRESET.INSANE) {
    }
    if (name === PRESET.NORMAL) {
    }
    if (name === PRESET.PINGPONG) {
      // change paddle
      this.scene.remove(this.paddle);
      this.paddle = Paddle(this.scene, this.config, this.config.colors.PADDLE_COLOR_PINGPONG);

      // change opponent paddle
      if (this.config.mode === MODE.MULTIPLAYER) {
        this.scene.remove(this.paddleOpponent);
        this.paddleOpponent = Paddle(this.scene, this.config, this.config.colors.OPPONENT_PADDLE_COLOR_PINGPONG);
        this.paddleOpponent.visible = true;
        this.paddleOpponent.position.z = this.config.boxPositionZ - this.config.boxDepth / 2;
        this.paddleOpponent.position.y = 1;
        this.paddleOpponent.position.x = 0;
      } else {
        // TODO: also add this for multiplayer, but consider responsibilites:
        // the last player that hit the ball sets the timeout, and if nothing happens
        // after 3 seconds, he sends a ball reset

        // enable the ball to be reset after a certain amount of
        // time passed since the last time the player hit the ball
        this.resetPingpongTimeout();
      }
      // enable net-ball-collisions
      this.physics.net.collisionResponse = 1;
      // show net
      this.net.visible = true;
      // set gravity
      this.physics.world.gravity.set(0, -6, 0);
      // tweak bouncinesses

      this.physics.setBallBoxBouncyness(0.8);
    }

    // reset values set by presets
    if (this.config.preset === PRESET.PINGPONG) {
      // change paddle
      this.scene.remove(this.paddle);
      this.paddle = SquarePaddle(this.scene, this.config, this.config.colors.WHITE);

      // change opponent paddle
      if (this.config.mode === MODE.MULTIPLAYER) {
        this.scene.remove(this.paddleOpponent);
        this.paddleOpponent = SquarePaddle(this.scene, this.config, this.config.colors.WHITE);
        this.paddleOpponent.visible = true;
      }

      this.scene.remove(this.paddle);
      this.paddle = SquarePaddle(this.scene, this.config, this.config.colors.WHITE);
      // was pingpong, remove timeout
      clearTimeout(this.resetBallTimeout);
      // turn off net collisions
      this.physics.net.collisionResponse = 0;
      // hide net
      this.net.visible = false;
      // remove gravity
      this.physics.world.gravity.set(0, 0, 0);
      // reset bouncyness
      this.physics.setBallBoxBouncyness(this.config.ballBoxBouncyness);
    }
    if (this.config.preset === PRESET.INSANE) {
      // was insane mode, reset clear color
      this.renderer.setClearColor(0x000000);
    }
    // set preset
    this.config.preset = name;
    this.physics.config.preset = name;
  }

  setupVRControls() {
    // apply VR headset positional data to camera.
    this.controls = new THREE.VRControls(this.camera);
    this.controls.standing = true;
    this.controls.userHeight = this.config.cameraHeight;
    this.setupControllers();
  }

  setupVR() {
    // apply VR stereo rendering to renderer.
    this.effect = new THREE.VREffect(this.renderer);
    this.effect.setSize(window.innerWidth, window.innerHeight);

    // Create a VR manager helper to enter and exit VR mode.
    let params = {
      hideButton: false, // Default: false.
      isUndistorted: false // Default: false.
    };

    this.manager = new WebVRManager(this.renderer, this.effect, params);

    window.addEventListener('resize', this.onResize.bind(this), true);
    window.addEventListener('vrdisplaypresentchange', this.onResize.bind(this), true);
  }

  setupThree() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(this.config.colors.BACKGROUND, 1);

    document.body.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.scale.y = 0.01;

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    // position over the box
    this.camera.position.x = 0;
    this.camera.position.z = this.config.boxPositionZ;
    this.camera.position.y = 5;
    this.camera.up.set(-1, 0, 0);
    this.camera.lookAt(new THREE.Vector3(0, 1, this.config.boxPositionZ));

    this.loader = new THREE.TextureLoader();
  }

  startGame() {
    this.state = STATE.PLAYING;
    let no = {
      fov: this.camera.fov,
      upX: -1,
      upY: 0,
      scaleY: 0.01,
    };
    let tl = new TimelineMax();

    if (this.config.mode === MODE.MULTIPLAYER) {
      this.hud.scoreDisplay.opponentScore.visible = true;
      this.paddleOpponent.visible = true;
    }

    tl.to('.intro-wrapper', 0.4, {
      autoAlpha: 0,
    }, 0);

    const panDuration = 2;
    tl.to(no, panDuration, {
      fov: 75,
      upX: 0,
      upY: 1,
      scaleY: 1,
      ease: Power3.easeIn,
      onUpdate: () => {
        this.scene.scale.y = no.scaleY;
        this.camera.fov = no.fov;
        this.camera.up.set(no.upX, no.upY, 0);
        this.camera.updateProjectionMatrix();
      },
    }, 1);
    tl.to(this.camera.position, panDuration, {
      x: 0,
      y: this.config.cameraHeight,
      z: 0,
      onUpdate: () => {
        this.camera.lookAt(new THREE.Vector3(0, 1, this.config.boxPositionZ));
      },
      onComplete: () => {
        this.setupVRControls();
        this.countdown();
      }
    }, 1);
  }

  countdown() {
    let n = 2;
    let countdown = setInterval(() => {
      this.hud.countdown.setCountdown(n);
      n--;
      if (n < 0) {
        clearInterval(countdown);
        this.hud.countdown.hideCountdown();
        if (this.config.mode === MODE.SINGLEPLAYER) {
          this.addBall();
          this.physics.initBallPosition(this.physics.ball);
        } else if (this.config.mode === MODE.MULTIPLAYER && !this.communication.isHost) {
          this.addBall();
          this.physics.initBallPosition(this.physics.ball);
          // if multiplayer, also send the other player a hit so the ball is synced
          this.communication.sendHit({
            x: this.physics.ball.position.x,
            y: this.physics.ball.position.y,
            z: this.physics.ball.position.z,
          }, {
            x: this.physics.ball.velocity.x,
            y: this.physics.ball.velocity.y,
            z: this.physics.ball.velocity.z,
          });
        }
      }
    }, 1000);
  }

  restartGame() {
    if (this.opponentRequestedRestart && this.playerRequestedRestart) {
      this.emitter.emit(EVENT.RESTART_GAME, this.score);
      this.physics.initBallPosition(this.physics.ball);
      this.playerRequestedRestart = false;
      this.opponentRequestedRestart = false;
      this.resetScore();
      this.state = STATE.PLAYING;
    }
  }

  resetScore() {
    this.score.self = 0;
    this.score.opponent = 0;
    this.hud.scoreDisplay.setSelfScore(0);
    this.hud.scoreDisplay.setOpponentScore(0);
  }

  startMultiplayer() {
    this.config.mode = MODE.MULTIPLAYER;
    this.physics.frontWall.collisionResponse = 0;
    this.communication = new Communication({
      move: this.receivedMove.bind(this),
      hit: this.receivedHit.bind(this),
      miss: this.receivedMiss.bind(this),
      presetChange: this.receivedPresetChange.bind(this),
      restartGame: this.receivedRestartGame.bind(this),
    }, window.location.pathname.substr(1), this.emitter);
  }

  startSingleplayer() {
    this.config.mode = MODE.SINGLEPLAYER;
    this.startGame();
  }

  receivedMove(move) {
    let no = {
      x: this.paddleOpponent.position.x,
      y: this.paddleOpponent.position.y,
    };
    TweenMax.to(no, 0.14, {
      x: move.x,
      y: move.y,
      onUpdate: () => {
        this.paddleOpponent.position.x = no.x;
        this.paddleOpponent.position.y = no.y;
      }
    });
  }

  receivedRestartGame() {
    this.opponentRequestedRestart = true;
    // try to restart game, only does if player also requested restart
    this.restartGame();
  }

  mirrorBallPosition(pos) {
    let z = pos.z;
    z -= Math.abs(z - this.config.boxPositionZ) * 2;
    return {
      x: -pos.x, 
      y: pos.y,
      z: z,
    };
  }

  mirrorBallVelocity(vel) {
    return {
      x: -vel.x,
      y: vel.y,
      z: -vel.z,
    };
  }

  receivedHit(data) {
    // receved vectors are in the other users space
    // so invert x and z velocity and mirror the point across the center of the box
    this.addBall();
    this.physics.ball.position.copy(this.mirrorBallPosition(data.point));
    this.physics.ball.velocity.copy(this.mirrorBallVelocity(data.velocity));
  }

  receivedMiss(data) {
    this.score.self++;
    this.hud.scoreDisplay.setSelfScore(this.score.self);
    if (this.score.self >= this.config.POINTS_FOR_WIN) {
      this.emitter.emit(EVENT.GAME_OVER, this.score);
      this.physics.ball.velocity.x = 0;
      this.physics.ball.velocity.y = 0;
      this.physics.ball.velocity.z = 0;
    } else {
      this.receivedHit(data);
    }
  }

  receivedPresetChange(data) {
    this.presetChange(data.name);
  }

  resetPingpongTimeout() {
    if (this.config.mode !== MODE.MULTIPLAYER) {
      clearTimeout(this.resetBallTimeout);
      this.resetBallTimeout = setTimeout(() => {
        this.physics.initBallPosition(this.physics.ball);
      }, resetTimeoutDuration);
    }
  }

  ballIsInBox() {
    // add tolerance to be sure ball wont be reset if the ball is
    // 'inside' of a wall for a short period
    const E = 0.1;
    return this.physics.ball.position.z - E <= this.config.boxPositionZ + this.config.boxDepth / 2
        && this.physics.ball.position.z + E >= this.config.boxPositionZ - this.config.boxDepth / 2;
    return this.ball.position.x - E >= -this.config.boxWidth
        && this.ball.position.x + E <= this.config.boxWidth
        && this.ball.position.y - E >= 0
        && this.ball.position.y + E <= this.config.boxHeight
        && this.ball.position.z - E >= this.config.boxPositionZ - this.config.boxDepth / 2
        && this.ball.position.z + E <= this.config.boxPositionZ + this.config.boxDepth / 2;
  }

  ballPaddleCollision(point) {
    if (this.config.preset === PRESET.PINGPONG) {
      this.resetPingpongTimeout();
    }
    this.paddleCollisionAnimation();
    this.sound.hit(point);
    if (this.config.mode === MODE.SINGLEPLAYER) {
      this.score.self++;
      this.hud.scoreDisplay.setSelfScore(this.score.self);
    }
    if (this.config.mode !== MODE.MULTIPLAYER) return;
    setTimeout(() => {
      this.communication.sendHit({
        x: point.x,
        y: point.y,
        z: point.z,
      }, {
        x: this.physics.ball.velocity.x,
        y: this.physics.ball.velocity.y,
        z: this.physics.ball.velocity.z,
      });
    }, 10);
  }

  paddleCollisionAnimation() {
    if (!this.paddle.getObjectByName('paddleHitHighlight')) {
      return;
    }
    this.paddle.getObjectByName('paddleHitHighlight').material.opacity = 1;
    TweenMax.to(this.paddle.getObjectByName('paddleHitHighlight').material, 0.54, {
      opacity: 0,
      ease: Power2.easeOut,
    });

  }

  setupLights() {
    let light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.z = 1;
    light.position.y = 2;
    light.position.x = 1;
    this.scene.add(light);

    light = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(light);
  }

  setupPaddlePlane() {
    this.raycaster = new THREE.Raycaster();

    let geometry = new THREE.PlaneGeometry(this.config.boxWidth, this.config.boxHeight);
    let material = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0});
    this.paddlePlane = new THREE.Mesh(geometry, material);
    this.paddlePlane.position.z = this.config.paddlePositionZ;
    this.paddlePlane.position.y = this.config.boxHeight / 2;
    // TODO find better way of doing this
    // this.paddlePlane.visible = false;
    this.scene.add(this.paddlePlane);
  }

  setupControllers() {
    navigator.getVRDisplays().then(displays => {
      if (displays) {
        this.display = displays[0];
        if (displays[0].capabilities && displays[0].capabilities.hasPosition) {
          this.controlMode = 'move';
          // also check gamepads
          this.controller1 = new THREE.ViveController(0);
          this.controller1.standingMatrix = this.controls.getStandingMatrix();
          this.scene.add(this.controller1);
          this.controller2 = new THREE.ViveController(1);
          this.controller2.standingMatrix = this.controls.getStandingMatrix();
          this.scene.add(this.controller2);

          var loader = new THREE.OBJLoader();
          loader.setPath('/models/');
          loader.load('vr_controller_vive_1_5.obj', object => {
            var loader = new THREE.TextureLoader();
            loader.setPath('/models/');

            this.controller = object.children[ 0 ];
            this.controller.material.map = loader.load('onepointfive_texture.png');
            this.controller.material.specularMap = loader.load('onepointfive_spec.png');

            this.controller1.add(object.clone());
            this.controller2.add(object.clone());
          });
        }
      }
    });

    /* debug
    var material = new THREE.LineBasicMaterial({
      color: 0x00ffff,
    });
    var geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    );
    this.controllerRay = new THREE.Line(geometry, material);
    this.controllerRay.geometry.dynamic = true;
    this.scene.add(this.controllerRay);
    */
  }

  addBall() {
    if (this.ball) return;
    this.physics.addBall();

    // ball
    let geometry = new THREE.SphereGeometry(this.config.ballRadius, 16, 16);
    let material = new THREE.MeshBasicMaterial({
      color: this.config.colors.WHITE,
    });

    this.ball = new THREE.Mesh(geometry, material);
    this.scene.add(this.ball);
  }

  setPaddlePosition(x, y, z) {
    let newX = Math.min(
      this.config.boxWidth / 2 - this.config.paddleSize / 2,
      Math.max(
        x,
        -this.config.boxWidth / 2 + this.config.paddleSize / 2
      )
    );
    let newY = Math.min(
      this.config.boxHeight - this.config.paddleSize / 2,
      Math.max(
        y,
        this.config.paddleSize / 2
      )
    );
    if (newX === this.paddle.position.x && newY === this.paddle.position.y) {
      return;
    }
    this.paddle.position.x = newX;
    this.paddle.position.y = newY;
    this.paddle.position.z = this.config.paddlePositionZ;
    this.physics.setPaddlePosition(newX, newY, this.config.paddlePositionZ);
  }

  updateControls() {
    // TODO proper controller managment
    let controller = null;
    if (this.controller1 && this.controller1.visible) {
      controller = this.controller1;
    } else if (this.controller2 && this.controller2.visible) {
      controller = this.controller2;
    }

    // place paddle according to controller
    if (this.display) {
      let pose = this.display.getPose();
      if (pose) {
        if (!controller) {
          this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
          this.raycaster.far = 2;
          let intersects = this.raycaster.intersectObject(this.paddlePlane, false);
          if (intersects.length > 0) {
            let intersectionPoint = intersects[0].point;
            let posX =  intersectionPoint.x * 4;
            let posY = this.config.cameraHeight + (this.config.cameraHeight - intersectionPoint.y) * -4;
            this.setPaddlePosition(posX, posY, this.config.paddlePositionZ + 0.03);
            if (this.pan) {
              this.setPaddlePosition(posX, posY, this.config.paddlePositionZ + 0.08);
            }
          }
        } else if (this.controlMode === 'move' && controller) {
          let direction = new THREE.Vector3(0, 0, -1);
          direction.applyQuaternion(controller.getWorldQuaternion());
          direction.normalize();
          this.raycaster.set(controller.getWorldPosition(), direction);
          this.raycaster.far = 10;
          let intersects = this.raycaster.intersectObject(this.paddlePlane, false);
          if (intersects.length > 0) {
            let intersectionPoint = intersects[0].point;
            // this.paddle.position.x = intersectionPoint.x;
            // this.paddle.position.y = intersectionPoint.y;
            // this.paddle.position.z = this.config.paddlePositionZ + 0.03;
            this.setPaddlePosition(intersectionPoint.x, intersectionPoint.y, this.config.paddlePositionZ + 0.03);
          }
        }
      }
    }
  }

  updateHelpers() {
    if (!this.ball) return;
    let line = this.scene.getObjectByName('ballHelperLine');
    line.position.z = Math.min(
      Math.max(
        this.ball.position.z, this.config.boxPositionZ - this.config.boxDepth / 2
      ), this.config.boxPositionZ + this.config.boxDepth / 2
    );
    return;
    this.paddleHelpers.top.position.x = this.paddle.position.x;
    this.paddleHelpers.bottom.position.x = this.paddle.position.x;
    this.paddleHelpers.left.position.y = this.paddle.position.y;
    this.paddleHelpers.right.position.y = this.paddle.position.y;
  }

  animate(timestamp) {
    let delta = Math.min(timestamp - this.lastRender, 500);
    this.totaltime += delta;

    if (!this.tabActive) {
      requestAnimationFrame(this.animate.bind(this));
      return;
    }

    this.updateControls();
    if (this.ball && this.config.mode === MODE.MULTIPLAYER && !this.communication.isHost) {
      // for multiplayer testing
      //this.setPaddlePosition(this.ball.position.x, this.ball.position.y);
    }
    // raycaster position and direction is now either camera
    // or controller on vive
    this.hud.cameraRayUpdated(this.raycaster);

    this.updateHelpers();

    if (this.pan) {
      this.pan.rotateY(delta * 0.0003);
    }

    if (this.config.mode === MODE.MULTIPLAYER) {
      this.communication.sendMove(-this.paddle.position.x, this.paddle.position.y);
    }

    if (this.state === STATE.PLAYING) {
      this.paddleBoundingBox.update();
      this.physics.predictCollisions(this.paddleBoundingBox, this.scene.getObjectByName('net-collider'));

      this.physics.step(delta / 1000);

      if (this.ball) {
        this.physics.setBallPosition(this.ball);
      }
    }

    if (DEBUG_MODE) {
      this.physicsDebugRenderer.update();
    }

    if (this.physics.ball && !this.ballIsInBox()) {
      // player has missed the ball, reset position to center
      if (this.config.mode === MODE.MULTIPLAYER) {
        // TODO change this to a timeout
        if (this.physics.ball.position.z > this.config.boxPositionZ - this.config.boxDepth / 2 + 0.4) {
          this.score.opponent++;
          this.hud.scoreDisplay.setOpponentScore(this.score.opponent);
          this.communication.sendMiss({
            x: this.physics.ball.position.x,
            y: this.physics.ball.position.y,
            z: this.physics.ball.position.z,
          }, {
            x: this.physics.ball.velocity.x,
            y: this.physics.ball.velocity.y,
            z: this.physics.ball.velocity.z,
          });
          if (this.score.opponent < this.config.POINTS_FOR_WIN) {
            this.physics.initBallPosition(this.physics.ball);
          } else {
            this.emitter.emit(EVENT.GAME_OVER, this.score);
            this.state = STATE.GAME_OVER;
            this.physics.initBallPosition(this.physics.ball);
            this.physics.ball.velocity.x = 0;
            this.physics.ball.velocity.y = 0;
            this.physics.ball.velocity.z = 0;
          }
        }
      } else {
        // TODO do we need this?
        if (this.config.preset === PRESET.PINGPONG) {
          this.resetPingpongTimeout();
        }

        this.physics.initBallPosition(this.physics.ball);
        this.score.self = 0;
        this.hud.scoreDisplay.setSelfScore(this.score.self);
      }
    }

    if (this.config.preset === PRESET.INSANE) {
      this.renderer.setClearColor('hsl(' + this.frameNumber % 360 + ', 100%, 50%)');
    }

    // Update VR headset position and apply to camera.
    if (this.controls) {
      this.controls.update();
    }

    // Render the scene through the manager.
    this.lastRender = timestamp;

    this.manager.render(this.scene, this.camera, this.timestamp);

    this.frameNumber++;
    requestAnimationFrame(this.animate.bind(this));
  }

  onResize(e) {
    this.effect.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
