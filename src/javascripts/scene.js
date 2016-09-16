import dat from 'dat-gui';
import TweenMax from 'gsap';
import {MODE} from './constants';
import Physics from './physics';
import Hud from './hud';
import SoundManager from './sound-manager';
import Communication from './communication';

const resetTimeout = 2000;
const resetTimeoutMultiball = 500;
const DEBUG_MODE = false;

export default class Scene {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.controller = null;
    this.effect = null;
    this.loader = null;
    this.skybox = null;
    this.display = null;
    this.manager = null;
    this.font = null;
    this.gamePad = null;
    this.controller1 = null;
    this.controller2 = null;
    this.raycaster = null;
    this.paddlePlane = null;
    this.controlMode = 'pan';
    this.controllerRay = null;
    this.points = 0;
    this.pointsDisplay = null;
    this.net = null;
    this.ballTexture = null;
    this.canvasDOM = document.querySelector('canvas');
    this.seconds = 0;
    this.tabActive = true;
    this.balls = [];
    this.gamemode = MODE.ONE_ON_ONE;
    this.ballResetTimeout = null;
    this.physicsDebugRenderer = null;
    this.pan = null;
    this.ballReference = null;


    this.frameNumber = 0;
    this.paddleHelpers = {
      top: null,
      left: null,
      right: null,
      bottom: null,
    };

    // config
    this.config = {
      mode: MODE.SINGLEPLAYER,
      gravity: 0,
      netHeight: 0.15,
      netThickness: 0.02,
      boxWidth: 3,
      boxDepth: 10,
      boxHeight: 2,
      paddleThickness: 0.04,
      paddleSize: 0.5,
      paddlePositionZ: -1,
      ballRadius: 0.03,
      ballMass: 0.001,
      ballPaddleFriction: 0.8,
      ballPaddleBounciness: 1,
      ballBoxBounciness: 1,
      ballInitVelocity: 1,
      paddleModel: 'box',
      boxPositionZ: -2.5,
      cameraHeight: 1,

      colors: {
        BLUE: 0x124888,
        BACKGROUND: 0x000000,
        DARK_BLUE: 0x143A61,
        WHITE: 0xFFFFFF,
        YELLOW: 0xFAFD58,
        RED: 0xD31515,
        LIGHT_RED: 0xE35C27,
        PINK: 0xFD9CA3,
        PONG_PADDLE: 0x8FFFBB,
        PONG_GREEN_1: 0x064042,
        PONG_GREEN_2: 0x0E5547,
        PONG_GREEN_3: 0x1E5F4B,
        PONG_GREEN_4: 0x17714D,
        PONG_GREEN_5: 0x08484A,
        PONG_GREEN_6: 0x136853,
        PONG_GREEN_7: 0x2B7B58,
        PONG_GREEN_8: 0x23995C,
        PONG_GREEN_9: 0x23B76D,
      },
    };

    this.physics = new Physics(this.config, this.ballPaddleCollision.bind(this));
    this.sound = new SoundManager();
    this.communication = new Communication({
      move: this.receivedMove.bind(this),
      hit: this.receivedHit.bind(this),
      miss: this.receivedMiss.bind(this),
    });

    // boxZBounds: -(this.boxSize.depth - 1),
    this.boxZBounds = 0;

    this.totaltime = 0;
    this.lastRender = 0;
  }

  setup() {
    this.setupThree();
    this.setupBoxSurroundings();
    this.setupVR();

    this.renderer.domElement.requestPointerLock = this.renderer.domElement.requestPointerLock
      || this.renderer.domElement.mozRequestPointerLock;
    this.renderer.domElement.onclick = () => {
      this.renderer.domElement.requestPointerLock();
    };

    this.physics.setupWorld();
    this.setupPaddle();
    this.setupPaddleHelpers();
    this.setupPaddleOpponent();
    this.hud = new Hud(this.scene, this.config);
    this.setupLights();
    this.setupPointsDisplay();
    this.setupControllers();
    this.setupPaddlePlane();
    //this.setupGUI();

    if (DEBUG_MODE) {
      this.physicsDebugRenderer = new THREE.CannonDebugRenderer(this.scene, this.physics.world);
    }

    requestAnimationFrame(this.animate.bind(this));


    this.camera.position.x = 6 * 10;
    this.camera.position.z = 3 * 10;
    this.camera.position.y = 3 * 10;
    this.camera.lookAt(new THREE.Vector3(0, 1, this.config.boxPositionZ));
    document.getElementById('start-singleplayer').addEventListener('click', this.introAnimation.bind(this));
  }

  setupVRControls() {
    // apply VR headset positional data to camera.
    this.controls = new THREE.VRControls(this.camera);
    this.controls.standing = true;
    this.controls.userHeight = this.config.cameraHeight;
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
    // Setup three.js WebGL renderer. Note: Antialiasing is a big performance hit.
    // Only enable it if you actually need to.
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(this.config.colors.BACKGROUND, 1);

    // thisend the canvas element created by the renderer to document body element.
    document.body.appendChild(this.renderer.domElement);

    // Create a three.js scene.
    this.scene = new THREE.Scene();

    // Create a three.js camera.
    this.camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.camera.position.y = this.config.cameraHeight;

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;

    this.loader = new THREE.TextureLoader();
  }

  setupBoxSurroundings() {
    // back box
    let geometry = new THREE.BoxGeometry(this.config.boxWidth, this.config.boxHeight, this.config.boxDepth / 2);
    let material = new THREE.MeshBasicMaterial({
      //color: 0x009900,
      vertexColors: THREE.FaceColors,
      side: THREE.DoubleSide,
    });

    let colors = [
      // left
      this.config.colors.PONG_GREEN_2,
      this.config.colors.PONG_GREEN_2,
      // right
      this.config.colors.PONG_GREEN_4,
      this.config.colors.PONG_GREEN_4,
      // top
      this.config.colors.PONG_GREEN_3,
      this.config.colors.PONG_GREEN_3,
      // bottom
      this.config.colors.PONG_GREEN_1,
      this.config.colors.PONG_GREEN_1,
      // back
      this.config.colors.PONG_GREEN_9,
      this.config.colors.PONG_GREEN_9,
    ];
    // delete front side
    delete geometry.faces[10];
    delete geometry.faces[11];
    geometry.faces = geometry.faces.filter(v => v);
    geometry.elementsNeedUpdate = true;
    geometry.faces.forEach((face, index) => {
      face.color.set(colors[index]);
    });

    this.skybox = new THREE.Mesh(geometry, material);
    this.skybox.position.z = this.config.boxPositionZ + this.config.boxDepth / 4;
    this.skybox.position.y = this.config.boxHeight / 2;
    this.scene.add(this.skybox);

    let shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.config.boxWidth, this.config.boxDepth),
      new THREE.ShadowMaterial()
    );
    shadowMesh.material.opacity = 0.4;
    shadowMesh.rotation.x = Math.PI / 2;
    shadowMesh.rotation.y = Math.PI;
    shadowMesh.position.y = 0.001;
    shadowMesh.receiveShadow = true;
    this.scene.add(shadowMesh);

    // front box
    geometry = new THREE.BoxGeometry(this.config.boxWidth, this.config.boxHeight, this.config.boxDepth / 2);
    material = new THREE.MeshBasicMaterial({
      vertexColors: THREE.FaceColors,
      side: THREE.DoubleSide,
    });

    colors = [
      // left
      this.config.colors.PONG_GREEN_6,
      this.config.colors.PONG_GREEN_6,
      // right
      this.config.colors.PONG_GREEN_8,
      this.config.colors.PONG_GREEN_8,
      // top
      this.config.colors.PONG_GREEN_7,
      this.config.colors.PONG_GREEN_7,
      // bottom
      this.config.colors.PONG_GREEN_5,
      this.config.colors.PONG_GREEN_5,
      // back
      this.config.colors.PONG_GREEN_9,
      this.config.colors.PONG_GREEN_9,
    ];
    // delete back side
    delete geometry.faces[8];
    delete geometry.faces[9];
    geometry.faces = geometry.faces.filter(v => v);
    geometry.elementsNeedUpdate = true;
    geometry.faces.forEach((face, index) => {
      face.color.set(colors[index]);
    });

    let frontBox = new THREE.Mesh(geometry, material);
    frontBox.position.z = this.config.boxPositionZ - this.config.boxDepth / 4;
    frontBox.position.y = this.config.boxHeight / 2;
    frontBox.receiveShadow = true;
    this.scene.add(frontBox);

    this.boxZBounds = -(this.boxDepth - 1);
  }

  setupPaddle() {
    let geometry = new THREE.RingGeometry(this.config.paddleSize - 0.03, this.config.paddleSize, 4, 1);
    geometry.rotateZ(Math.PI / 4);
    geometry.rotateY(0.001);
    geometry.scale(0.71, 0.71, 0.71);
    // let geometry = new THREE.BoxGeometry(this.config.paddleSize, this.config.paddleSize, this.config.paddleThickness);
    let material = new THREE.MeshBasicMaterial({
      color: this.config.colors.PONG_PADDLE,
    });
    this.paddle = new THREE.Mesh(geometry, material);
    this.paddle.name = 'paddle';
    this.paddle.castShadow = true;
    this.scene.add(this.paddle);

    this.paddleBoundingBox = new THREE.BoundingBoxHelper(this.paddle, 0xffffff);
    this.paddleBoundingBox.material.visible = false;
    this.scene.add(this.paddleBoundingBox);
  }

  setupPaddleOpponent() {
    let geometry = new THREE.RingGeometry(this.config.paddleSize - 0.03, this.config.paddleSize, 4, 1);
    geometry.rotateZ(Math.PI / 4);
    geometry.rotateY(0.001);
    geometry.scale(0.71, 0.71, 0.71);
    // let geometry = new THREE.BoxGeometry(this.config.paddleSize, this.config.paddleSize, this.config.paddleThickness);
    let material = new THREE.MeshBasicMaterial({
      color: this.config.colors.PONG_PADDLE,
    });
    this.paddleOpponent = new THREE.Mesh(geometry, material);
    this.paddleOpponent.name = 'paddle-enemy';
    this.scene.add(this.paddleOpponent);
    this.paddleOpponent.position.z = this.config.boxPositionZ + this.config.paddlePositionZ;
    this.paddleOpponent.position.y = 1;
  }

  setupNet() {
    let geometry = new THREE.BoxGeometry(
      this.config.tableWidth,
      this.config.netHeight,
      this.config.netThickness
    );
    let material = new THREE.MeshLambertMaterial({
      color: this.config.colors.WHITE,
      transparent: true,
      opacity: 0.5,
    });
    this.net = new THREE.Mesh(geometry, material);
    this.net.position.y = this.config.tableHeight + this.config.tableThickness + this.config.netHeight / 2;
    this.net.position.z = this.config.boxPositionZ;
    // TODO is this correct?
    this.net.castShadow = true;
    //this.net.position.z = -this.config.tableDepth / 4;
    this.scene.add(this.net);
  }

  setupPaddleHelpers() {
    let helperWidth = 0.03;
    let geometry = new THREE.PlaneGeometry(0.03, this.config.paddleSize);
    let material = new THREE.MeshLambertMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
    });
    this.paddleHelpers.top = new THREE.Mesh(geometry, material);
    this.paddleHelpers.top.position.z = this.config.paddlePositionZ;
    this.paddleHelpers.top.position.y = this.config.boxHeight - 0.01;
    this.paddleHelpers.top.rotation.x = Math.PI / 2;
    this.paddleHelpers.top.rotation.z = Math.PI / 2;
    this.scene.add(this.paddleHelpers.top);

    geometry = new THREE.PlaneGeometry(0.03, this.config.paddleSize);
    material = new THREE.MeshLambertMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
    });
    this.paddleHelpers.bottom = new THREE.Mesh(geometry, material);
    this.paddleHelpers.bottom.position.z = this.config.paddlePositionZ;
    this.paddleHelpers.bottom.position.y = 0.01;
    this.paddleHelpers.bottom.rotation.x = Math.PI / 2;
    this.paddleHelpers.bottom.rotation.z = Math.PI / 2;
    this.scene.add(this.paddleHelpers.bottom);

    geometry = new THREE.PlaneGeometry(0.03, this.config.paddleSize);
    material = new THREE.MeshLambertMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
    });
    this.paddleHelpers.left = new THREE.Mesh(geometry, material);
    this.paddleHelpers.left.position.z = this.config.paddlePositionZ;
    this.paddleHelpers.left.position.x = -this.config.boxWidth / 2 + 0.01;
    this.paddleHelpers.left.rotation.y = Math.PI / 2;
    this.scene.add(this.paddleHelpers.left);

    geometry = new THREE.PlaneGeometry(0.03, this.config.paddleSize);
    material = new THREE.MeshLambertMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
    });
    this.paddleHelpers.right = new THREE.Mesh(geometry, material);
    this.paddleHelpers.right.position.z = this.config.paddlePositionZ;
    this.paddleHelpers.right.position.x = this.config.boxWidth / 2 - 0.01;
    this.paddleHelpers.right.rotation.y = Math.PI / 2;
    this.scene.add(this.paddleHelpers.right);
  }

  setupGUI() {
    let gui = new dat.GUI();
    gui.remember(this);
    gui.add(this.config, 'ballRadius', 0.001, 0.4).onChange(val => {
      this.physics.config.ballRadius = val;
      this.config.ballRadius = val;
    });
    gui.add(this.config, 'ballInitVelocity', 0, 2);
    gui.add(this.config, 'gravity', 0, 15).onChange(val => this.physics.world.gravity.set(0, -val, 0));
    //gui.add(this.config, 'ballMass', 0.001, 1).onChange(val => {
    //  //this.physics.balls.forEach(ball => {ball.gravity = val;});
    //});
    // gui.add(this, 'ballTableFriction', 0, 1).onChange(val => this.ballTableContact.friction = val);
    gui.add(this.config, 'ballBoxBounciness', 0, 5).onChange(val => {
      //this.physics.ballTablePlayerContact.restitution = val;
      //this.physics.ballTableOpponent.restitution = val;
      this.physics.config.ballBoxBounciness = val;
    });
    // gui.add(this, 'ballPaddleFriction', 0, 1).onChange(val => this.ballPaddleContact.friction = val);
    gui.add(this.config, 'ballPaddleBounciness', 0, 5).onChange(val => this.physics.ballPaddleContact.restitution = val);
    gui.add(this.config, 'paddleModel', ['box', 'pan']).onChange(val => {
      this.switchPaddle(val);
    });
  }

  introAnimation() {
    let no = {
      fov: this.camera.fov,
    };
    let tl = new TimelineMax();
    tl.to('.intro', 0.4, {
      autoAlpha: 0,
    }, 0);
    const panDuration = 2;
    tl.to(no, panDuration, {
      fov: 75,
      ease: Power3.easeIn,
      onUpdate: () => {
        this.camera.fov = no.fov;
        this.camera.updateProjectionMatrix();
      },
    }, 0);
    tl.to(this.camera.position, panDuration, {
      x: 0,
      y: this.config.cameraHeight,
      z: 0,
      onUpdate: () => {
        this.camera.lookAt(new THREE.Vector3(0, 1, this.config.boxPositionZ));
      },
      onComplete: () => {
        this.setupVRControls();
        this.addBall();
      }
    }, 0);
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

  mirrorBallPosition(pos) {
    let z = pos.z;
    z -= Math.abs(z - this.config.boxPositionZ) * 2;
    return {
      x: pos.x, 
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
    this.physics.balls[0].position.copy(this.mirrorBallPosition(data.point));
    this.physics.balls[0].velocity.copy(this.mirrorBallVelocity(data.velocity));
  }

  receivedMiss(data) {
    //this.addBall();
  }

  resetBallTimeout() {
    // clearTimeout(this.ballResetTimeout);
    // this.ballResetTimeout = setTimeout(this.addBall.bind(this), resetTimeout);
  }

  ballPaddleCollision(point) {
    this.sound.hit(point);
    setTimeout(() => {
      // this.physics.balls[0].position.copy(this.mirrorBallPosition(this.physics.balls[0].position));
      // this.physics.balls[0].velocity.copy(this.mirrorBallVelocity(this.physics.balls[0].velocity));
      // return;
      this.communication.sendHit({
        x: point.x,
        y: point.y,
        z: point.z,
      }, {
        x: this.physics.balls[0].velocity.x,
        y: this.physics.balls[0].velocity.y,
        z: this.physics.balls[0].velocity.z,
      });
    }, 10);
    //this.resetBallTimeout();
  }

  switchPaddle(model) {
    if (model === 'pan') {
      if (!this.pan) {
        let loader = new THREE.OBJLoader();
        loader.setPath('/models/');
        loader.load('Pan.obj', object => {
          this.pan = object;
          this.pan.children.forEach(child => {
            child.material.side = THREE.DoubleSide;
            child.material.side = THREE.DoubleSide;
            child.material.side = THREE.DoubleSide;
            child.material.transparent = true;
            child.material.opacity = 0.5;
          });
          let panScale = 0.001;
          this.pan.scale.set(panScale, panScale, panScale);
          this.pan.position.set(0, 1.1, -1.2);
          this.pan.rotateX(Math.PI / 2);
          this.scene.add(object);
          this.paddle.visible = false;
        });
      } else {
        this.pan.visible = true;
      }
      this.paddle.visible = false;
    } else {
      this.pan.visible = false;
      this.paddle.visible = true;
    }
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

  setupLights() {
    let light = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(light);

    light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(0, 8, -4);
    this.scene.add(light);

    light.castShadow = true;
    light.shadow.mapSize.width = 1024 * 1;
    light.shadow.mapSize.height = 1024 * 1;
    light.shadow.bias = 0.01;
    light.shadow.camera.near = 3;
    light.shadow.camera.far = 12;

    light.shadow.camera.right = 2;
    light.shadow.camera.left = -2;
    light.shadow.camera.top = 1;
    light.shadow.camera.bottom = -8;

    // let ch = new THREE.CameraHelper(light.shadow.camera);
    // this.scene.add(ch);
  }

  setupPointsDisplay() {
    return;
    var fontloader = new THREE.FontLoader();
    fontloader.load('build/helvetiker_bold.typeface.js', font => {
      this.font = font;
      let material = new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        wireframe: true,
      });
      let geometry = new THREE.TextGeometry('0', {
        font: font,
        size: 1,
        height: 0.01,
        curveSegments: 1,
      });
      geometry.computeBoundingBox();
      this.pointsDisplay = new THREE.Mesh(geometry, material);
      this.pointsDisplay.position.x = -geometry.boundingBox.max.x / 2;
      this.pointsDisplay.position.y = 1;
      this.pointsDisplay.position.z = -5;
      this.scene.add(this.pointsDisplay);
    });
  }

  addBall() {
    this.sound.gameOver();
    // remove inactive balls
    this.physics.getInactiveBalls().forEach(i => {
      this.scene.remove(this.balls[i]);
      this.balls[i].removeFlag = true;
    });
    this.balls = this.balls.filter(x => !x.removeFlag);

    if (this.config.mode !== MODE.TOO_MANY_BALLS) {
      this.resetBallTimeout();
    }
    this.physics.addBall();
    if (this.balls.length > 0) return;

    // three object
    let geometry = new THREE.SphereGeometry(this.config.ballRadius, 16, 16);
    let material = new THREE.MeshBasicMaterial({
      color: this.config.colors.YELLOW,
      //map: this.ballTexture,
    });

    //this.balls.push(new THREE.Mesh(geometry, material));
    this.balls = [new THREE.Mesh(geometry, material)];
    this.balls[this.balls.length - 1].castShadow = true;
    this.scene.add(this.balls[this.balls.length - 1]);
  }

  setPoints(points) {
    this.points = points;
    //this.pointsDOMElement.innerHTML = this.points;
    if (this.font) {
      this.pointsDisplay.geometry = new THREE.TextGeometry("" + this.points, {
        font: this.font,
        size: 1,
        height: 0.2,
        curveSegments: 2,
      });
      this.pointsDisplay.geometry.computeBoundingBox();
      this.pointsDisplay.position.x = -this.pointsDisplay.geometry.boundingBox.max.x / 2;
    }
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
    this.paddleHelpers.top.position.x = this.paddle.position.x;
    this.paddleHelpers.bottom.position.x = this.paddle.position.x;
    this.paddleHelpers.left.position.y = this.paddle.position.y;
    this.paddleHelpers.right.position.y = this.paddle.position.y;
  }

  animate(timestamp) {
    let delta = Math.min(timestamp - this.lastRender, 500);
    this.totaltime += delta;

    if (!this.tabActive) {;
      requestAnimationFrame(this.animate.bind(this));
      return;
    }

    this.updateControls();

    this.updateHelpers();

    if (this.pan) {
      this.pan.rotateY(delta * 0.0003);
    }

    this.communication.sendMove(-this.paddle.position.x, this.paddle.position.y);

    this.paddleBoundingBox.update();

    this.physics.predictCollisions(this.paddleBoundingBox);
    this.physics.setBallPositions(this.balls);
    this.physics.step(delta / 1000);


    if (DEBUG_MODE) {
      this.physicsDebugRenderer.update();
    }

    if (this.physics.balls.length && this.physics.balls[0].position.z > 1) {
      this.addBall();

      let z = this.physics.balls[0].position.z;
      z -= Math.abs(z - this.config.boxPositionZ) * 2;

      this.communication.sendHit({
        x: this.physics.balls[0].position.x,
        y: this.physics.balls[0].position.y,
        z: this.physics.balls[0].position.z,
      }, {
        x: this.physics.balls[0].velocity.x,
        y: this.physics.balls[0].velocity.y,
        z: this.physics.balls[0].velocity.z,
      });
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
