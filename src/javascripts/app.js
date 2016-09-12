import dat from 'dat-gui';
import TweenMax from 'gsap';
import {MODE} from 'constants/modes';

const resetTimeout = 2000;
const DEBUG_MODE = false;

class PingPong {
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
    this.tableHalfPlayer = null;
    this.tableHalfEnemy = null;
    this.net = null;
    this.ballTexture = null;
    this.canvasDOM = document.querySelector('canvas');
    this.seconds = 0;
    this.tabActive = true;
    this.ballPaddleContact = null;
    this.balls = [];
    this.cameraHeight = 1.2;
    this.gamemode = MODE.ONE_ON_ONE;
    this.CCD_EPSILON = 0.2;
    this.ballResetTimeout = null;
    this.cannonDebugRenderer = null;
    this.pan = null;

    this.cannon = {
      world: null,
      balls: [],
      net: null,
      ground: null,
      paddlePlayer: null,
      paddleEnemy: null,
      tableHalfPlayer: null,
      tableHalfEnemy: null,
      ballNetContact: null,
      ballGroundContact: null,
      ballTablePlayerContact: null,
      ballTableEnemyContact: null,
    }

    // config
    this.config = {
      mode: MODE.ONE_ON_ONE,
      gravity: 8.7,
      tableDepth: 4,
      tableWidth: 2.2,
      tableHeight: 0.65,
      tableThickness: 0.05,
      tablePositionZ: -2.5,
      netHeight: 0.15,
      netThickness: 0.02,
      boxWidth: 8,
      boxDepth: 10,
      boxHeight: 4,
      paddleThickness: 0.04,
      paddleSize: 0.3,
      paddlePositionZ: -0.5,
      ballRadius: 0.03,
      ballMass: 0.001,
      ballTableFriction: 0.3,
      ballTableBounciness: 0.8,
      ballPaddleFriction: 0.8,
      ballPaddleBounciness: 0.98,
      ballInitVelocity: 1.5,
      colors: {
        BLUE: 0x124888,
        BACKGROUND_BLUE: 0x2D68A4,
        DARK_BLUE: 0x143A61,
        WHITE: 0xFFFFFF,
        YELLOW: 0xFAFD58,
        RED: 0xD31515,
        LIGHT_RED: 0xE35C27,
        PINK: 0xFD9CA6,
        // moodboard color swatch
        // yellow: 0xFAFB65,
        // cyan: 0x22CED9,
        // black: 0x000000,
        // pink: 0xFD9CA5,
        // white: 0xF1EEE7,
        // green: 0x2EB66F,
        // brown: 0xC46F65,
      },
    };

    // this.physics = new Physics(this.config);

    // boxZBounds: -(this.boxSize.depth - 1),
    this.boxZBounds = 0;

    this.totaltime = 0;
    this.lastRender = 0;
  }

  setup() {
    // Setup three.js WebGL renderer. Note: Antialiasing is a big performance hit.
    // Only enable it if you actually need to.
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x499BEE, 1);

    // thisend the canvas element created by the renderer to document body element.
    document.body.appendChild(this.renderer.domElement);

    // Create a three.js scene.
    this.scene = new THREE.Scene();

    // Create a three.js camera.
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;

    // apply VR headset positional data to camera.
    this.controls = new THREE.VRControls(this.camera);
    this.controls.standing = true;
    this.controls.userHeight = this.cameraHeight;

    // apply VR stereo rendering to renderer.
    this.effect = new THREE.VREffect(this.renderer);
    this.effect.setSize(window.innerWidth, window.innerHeight);


    this.loader = new THREE.TextureLoader();

    let geometry = new THREE.PlaneGeometry(100, 100);
    let material = new THREE.MeshPhongMaterial({
      color: this.config.colors.BACKGROUND_BLUE,
      side: THREE.DoubleSide,
    });

    // Align the skybox to the floor (which is at y=0).
    this.skybox = new THREE.Mesh(geometry, material);
    //this.skybox.position.y = this.config.boxSize.height/2;
    //this.skybox.position.z = -this.config.boxSize.depth/2 + 1;
    this.skybox.rotation.x = Math.PI / 2;
    this.skybox.receiveShadow = true;

    this.scene.add(this.skybox);

    // For high end VR devices like Vive and Oculus, take into account the stage
    // parameters provided.

    // Create a VR manager helper to enter and exit VR mode.
    let params = {
      hideButton: false, // Default: false.
      isUndistorted: false // Default: false.
    };

    this.manager = new WebVRManager(this.renderer, this.effect, params);

    window.addEventListener('resize', this.onResize.bind(this), true);
    window.addEventListener('vrdisplaypresentchange', this.onResize.bind(this), true);
    setTimeout(() => {
      this.addBall();
    }, 1000);

    this.boxZBounds = -(this.boxDepth - 1);

    this.renderer.domElement.requestPointerLock = this.renderer.domElement.requestPointerLock ||
      this.renderer.domElement.mozRequestPointerLock;
    this.renderer.domElement.onclick = () => {
      this.renderer.domElement.requestPointerLock();
    };

    this.loadPan();
    
    this.setupCannon();
    this.setupScene();

    if (DEBUG_MODE) {
      this.cannonDebugRenderer = new THREE.CannonDebugRenderer( this.scene, this.cannon.world );
    }

    this.setupLights();
    this.setupPointsDisplay();
    this.setupControllers();
    this.setupPaddlePlane();
    this.setupGUI();
    requestAnimationFrame(this.animate.bind(this));
  }

  setupGUI() {
    let gui = new dat.GUI();
    gui.remember(this);
    gui.add(this, 'gamemode', [MODE.ONE_ON_ONE, MODE.AGAINST_THE_WALL, MODE.HIT_THE_TARGET]).onChange(val => {
      if (val !== this.config.mode) {
        this.setMode(val);
      }
    });
    gui.add(this.config, 'ballRadius', 0.001, 0.4);
    gui.add(this.config, 'ballInitVelocity', 0, 2);
    gui.add(this.config, 'gravity', 0.5, 15).onChange(val => this.cannon.world.gravity.set(0, -val, 0));
    //gui.add(this.config, 'ballMass', 0.001, 1).onChange(val => {
    //  //this.cannon.balls.forEach(ball => {ball.gravity = val;});
    //});
    // gui.add(this, 'ballTableFriction', 0, 1).onChange(val => this.ballTableContact.friction = val);
    gui.add(this.config, 'ballTableBounciness', 0, 5).onChange(val => {
      this.cannon.ballTablePlayerContact.restitution = val
      this.cannon.ballTableEnemyContact.restitution = val
    });
    // gui.add(this, 'ballPaddleFriction', 0, 1).onChange(val => this.ballPaddleContact.friction = val);
    gui.add(this.config, 'ballPaddleBounciness', 0, 5).onChange(val => this.ballPaddleContact.restitution = val);
  }

  loadPan() {
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
  }

  setupCannon() {
    // world
    this.cannon.world = new CANNON.World();
    this.cannon.world.gravity.set(0, -this.config.gravity, 0);
    this.cannon.world.broadphase = new CANNON.NaiveBroadphase();
    this.cannon.world.solver.iterations = 20;

    // ground
    this.cannon.ground = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: new CANNON.Material(),
    });
    this.cannon.ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    this.cannon.ground.addEventListener("collide", this.groundCollision.bind(this));
    this.cannon.world.add(this.cannon.ground);

    // table
    this.cannon.tableHalfPlayer = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.config.tableWidth / 2,
          this.config.tableThickness / 2,
          this.config.tableDepth / 4
        )
      ),
      material: new CANNON.Material(),
    });
    this.cannon.tableHalfPlayer._name = 'TABLE_HALF_PLAYER';
    this.cannon.tableHalfPlayer.position.set(
      0,
      this.config.tableHeight + this.config.tableThickness / 2,
      this.config.tablePositionZ + this.config.tableDepth / 4
    );
    this.cannon.world.add(this.cannon.tableHalfPlayer);

    this.cannon.tableHalfEnemy = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.config.tableWidth / 2,
          this.config.tableThickness / 2,
          this.config.tableDepth / 4
        )
      ),
      material: new CANNON.Material(),
    });
    this.cannon.tableHalfEnemy._name = 'TABLE_HALF_ENEMY';
    this.cannon.tableHalfEnemy.position.set(
      0,
      this.config.tableHeight + this.config.tableThickness / 2,
      this.config.tablePositionZ - this.config.tableDepth / 4
    );
    this.cannon.world.add(this.cannon.tableHalfEnemy);

    // net
    this.cannon.net = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.config.tableWidth / 2,
          this.config.netHeight / 2,
          this.config.netThickness / 2
        )
      ),
      material: new CANNON.Material(),
    });
    this.cannon.net._name = 'NET';
    this.cannon.net.position.set(
      0,
      this.config.tableHeight + this.config.tableThickness + this.config.netHeight / 2,
      this.config.tablePositionZ
    );
    this.cannon.world.add(this.cannon.net);

    // paddle
    this.cannon.paddlePlayer = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.config.paddleSize / 2,
          this.config.paddleSize / 2,
          this.config.paddleThickness / 2
        )
      ),
      material: new CANNON.Material(),
    });
    this.cannon.paddlePlayer._name = 'PADDLE';
    this.cannon.paddlePlayer.position.set(0, 1, this.config.paddlePositionZ);
    this.cannon.paddlePlayer.addEventListener("collide", this.paddleCollision.bind(this));
    this.cannon.world.add(this.cannon.paddlePlayer);
  }

  setMode(nextMode) {
    // revert alterations made by modes
    if (this.config.mode === MODE.HIT_THE_TARGET) {
      this.tableHalfEnemy.geometry.dispose();
      this.tableHalfPlayer.geometry.dispose();
      this.setupTable();
      this.net.visible = true;
    }

    if (this.config.mode === MODE.AGAINST_THE_WALL || nextMode === MODE.AGAINST_THE_WALL) {
      let targetColor = new THREE.Color(nextMode === MODE.AGAINST_THE_WALL ? this.config.colors.PINK : this.config.colors.BLUE);
      let no = {
        rotation: 0,
        bouncyness: this.config.tableBouncyNess,
        r: this.tableHalfEnemy.material.color.r,
        g: this.tableHalfEnemy.material.color.g,
        b: this.tableHalfEnemy.material.color.b,
      };
      //this.tableHalfEnemy.geometry.translate(0, -this.config.tableHeight / 2, -this.config.tableDepth / 4);
      //// let translationMatrix = new THREE.Matrix4().makeTranslation(0, -this.config.tableHeight / 2, -this.config.tableDepth / 4);
      //// this.tableHalfEnemy.geometry.applyMatrix(translationMatrix);
      //this.tableHalfEnemy.position.y += this.config.tableHeight / 2;
      //this.tableHalfEnemy.position.z += this.config.tableDepth / 4;
      let originMatrix = this.tableHalfEnemy.matrix.clone()

      TweenMax.to(no, 1.2, {
        rotation: this.config.mode === MODE.AGAINST_THE_WALL ? -Math.PI / 2 : (nextMode === MODE.AGAINST_THE_WALL ? Math.PI / 2 : 0),
        bouncyness: 0,
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        onUpdate: () => {
          let transformMatrix = originMatrix.clone()
          transformMatrix.multiply(new THREE.Matrix4().makeTranslation(0, +this.config.tableThickness / 2, +this.config.tableDepth / 4))
          transformMatrix.multiply(new THREE.Matrix4().makeRotationX(no.rotation))
          transformMatrix.multiply(new THREE.Matrix4().makeTranslation(0, -this.config.tableThickness / 2, -this.config.tableDepth / 4))
            //.makeRotationX(no.rotation)
      
          this.tableHalfEnemy.matrix = transformMatrix;
          // this.tableHalfEnemy.rotation.x = no.rotation;
          this.tableHalfEnemy.material.color.setRGB(no.r, no.g, no.b);
          //this.tableHalfEnemy.matrixWorldNeedsUpdate = true;
          this.tableHalfEnemy.matrixAutoUpdate = false;
          // this.cannon.ballTableEnemyContact = no.bouncyness;
          // this.cannon.ballTablePlayerContact = no.bouncyness;
          this.cannon.tableHalfEnemy.position.copy(this.tableHalfEnemy.getWorldPosition());
          this.cannon.tableHalfEnemy.quaternion.copy(this.tableHalfEnemy.getWorldQuaternion());
        },
        onComplete: () => {
          this.config.mode = nextMode;
        }
      });
    }
    if (nextMode === MODE.HIT_THE_TARGET) {
      let table1 = new ThreeBSP(new THREE.Mesh(this.tableHalfEnemy.geometry.clone()));
      let table2 = new ThreeBSP(new THREE.Mesh(this.tableHalfPlayer.geometry.clone()));
      let holes = [
        {x: -0.7, z: -0.7, r: 0.2},
        {x: +0.5, z: +0.5, r: 0.15},
        {x: -0.4, z: +0.47, r: 0.4},
        {x: +0.4, z: -0.7, r: 0.3},
      ]
      holes.forEach(hole => {
        let threeSphere = new THREE.Mesh(new THREE.CylinderGeometry(hole.r, hole.r, 1, 4));
        threeSphere.position.x = hole.x;
        threeSphere.position.z = hole.z;
        let csgSphere = new ThreeBSP(threeSphere);
        table1 = table1.subtract(csgSphere);

        threeSphere.position.x = -hole.x;
        threeSphere.position.z = hole.z;
        csgSphere = new ThreeBSP(threeSphere);
        table2 = table2.subtract(csgSphere);
      });
      this.net.visible = false;
      this.tableHalfEnemy.geometry.dispose();
      this.tableHalfPlayer.geometry.dispose();
      this.tableHalfEnemy.geometry = table1.toGeometry();
      this.tableHalfPlayer.geometry = table2.toGeometry();

      let vertices = [];
      let faces = [];
      this.tableHalfPlayer.geometry.vertices.forEach(vertex => {
        vertices.push(vertex.x);
        vertices.push(vertex.y);
        vertices.push(vertex.z);
      });
      this.tableHalfPlayer.geometry.faces.forEach(face => {
        faces.push(face.a);
        faces.push(face.b);
        faces.push(face.c);
      });
      let trimesh = new CANNON.Trimesh(vertices, faces);
      this.cannon.tableHalfPlayer.shapes = [];
      this.cannon.tableHalfPlayer.addShape(trimesh);

      vertices = [];
      faces = [];
      this.tableHalfEnemy.geometry.vertices.forEach(vertex => {
        vertices.push(vertex.x);
        vertices.push(vertex.y);
        vertices.push(vertex.z);
      });
      this.tableHalfEnemy.geometry.faces.forEach(face => {
        faces.push(face.a);
        faces.push(face.b);
        faces.push(face.c);
      });
      trimesh = new CANNON.Trimesh(vertices, faces);
      this.cannon.tableHalfEnemy.shapes = [];
      this.cannon.tableHalfEnemy.addShape(trimesh);
    }
    this.config.mode = nextMode;
  }

  groundCollision(e) {
    if (e.body.name === 'BALL') {
      // this.initBallPosition(e.body);
    }
  }

  paddleCollision(e) {
    if (e.body.name === 'BALL') {
      clearTimeout(this.ballResetTimeout);
      this.ballResetTimeout = setTimeout(this.addBall.bind(this), resetTimeout);
      let hitpointX = e.body.position.x - e.target.position.x;
      let hitpointY = e.body.position.y - e.target.position.y;
      // normalize to -1 to 1
      hitpointX = hitpointX / (this.config.paddleSize / 2);
      hitpointY = hitpointY / (this.config.paddleSize / 2);
      // did we hit the edge of the paddle?
      if (hitpointX > 1 || hitpointX < -1) return;
      if (hitpointY > 1 || hitpointY < -1) return;
      // these values are heavily tweakable
      e.body.velocity.x += hitpointX * 4;
      e.body.velocity.y = hitpointY * 0.7;
      if (this.config.mode === MODE.AGAINST_THE_WALL) {
        e.body.velocity.y = 5;
        e.body.velocity.z = 5;
      } else {
        e.body.velocity.y *= 2 * e.body.velocity.z;
        e.body.velocity.z *= 4;
      }
    }
  }

  setupScene() {
    // paddle
    let geometry = new THREE.BoxGeometry(this.config.paddleSize, this.config.paddleSize, this.config.paddleThickness);
    let material = new THREE.MeshLambertMaterial({
      color: this.config.colors.RED,
      transparent: true,
      opacity: 0.6,
    });
    this.paddle = new THREE.Mesh(geometry, material);
    this.paddle.name = 'paddle';
    this.paddle.castShadow = true;
    this.scene.add(this.paddle);

    this.setupTable();

    // net
    geometry = new THREE.BoxGeometry(
      this.config.tableWidth,
      this.config.netHeight,
      this.config.netThickness
    );
    material = new THREE.MeshLambertMaterial({
      color: this.config.colors.WHITE,
      transparent: true,
      opacity: 0.5,
    });
    this.net = new THREE.Mesh(geometry, material);
    this.net.position.y = this.config.tableThickness / 2 + this.config.netHeight / 2;
    // TODO is this correct?
    this.net.castShadow = true;
    this.net.position.z = -this.config.tableDepth / 4;
    this.tableHalfPlayer.add(this.net);
  }

  setupPaddlePlane() {
    this.raycaster = new THREE.Raycaster();

    let geometry = new THREE.PlaneGeometry(this.config.boxWidth, this.config.boxHeight);
    let material = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0});
    this.paddlePlane = new THREE.Mesh(geometry, material);
    this.paddlePlane.position.z = this.config.paddlePositionZ;
    this.paddlePlane.position.y = this.config.boxHeight / 2;
    // TODO find better way of doing this
    //this.paddlePlane.visible = false;
    this.scene.add(this.paddlePlane);
  }

  setupTable() {
    // table
    let geometry = new THREE.BoxGeometry(
      this.config.tableWidth,
      this.config.tableThickness,
      this.config.tableDepth / 2
    );
    let material = new THREE.MeshLambertMaterial({
      color: this.config.colors.BLUE,
    });
    this.tableHalfPlayer = new THREE.Mesh(geometry, material);
    this.tableHalfPlayer.position.set(
      0,
      this.config.tableHeight + this.config.tableThickness / 2,
      this.config.tablePositionZ + this.config.tableDepth / 4
    );
    this.tableHalfPlayer.receiveShadow = true;
    this.tableHalfPlayer.castShadow = true;
    this.scene.add(this.tableHalfPlayer);

    geometry = new THREE.BoxGeometry(
      this.config.tableWidth,
      this.config.tableThickness,
      this.config.tableDepth / 2
    );
    material = new THREE.MeshLambertMaterial({
      color: this.config.colors.BLUE,
    });
    this.tableHalfEnemy = new THREE.Mesh(geometry, material);
    this.tableHalfEnemy.position.set(
      0,
      this.config.tableHeight + this.config.tableThickness / 2,
      this.config.tablePositionZ - this.config.tableDepth / 4
    );
    this.tableHalfPlayer.receiveShadow = true;
    this.tableHalfPlayer.castShadow = true;
    this.scene.add(this.tableHalfEnemy);
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
            this.controller.material.map = loader.load( 'onepointfive_texture.png' );
            this.controller.material.specularMap = loader.load( 'onepointfive_spec.png' );

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
    let light = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(light);

    light = new THREE.DirectionalLight(0xffffff, 0.85);
    light.position.set(1, 2, 0);
    this.scene.add(light);

    light.castShadow = true;
    light.shadow.mapSize.width = 1024 * 2; 
    light.shadow.mapSize.height = 1024 * 2 ;
    light.shadow.bias = 0.01;
    light.shadow.camera.near = 0.4;
    light.shadow.camera.far = 2;
    light.shadow.camera.left = 0;

   // let ch = new THREE.CameraHelper(light.shadow.camera);
   // this.scene.add(ch);

  }

  setupPointsDisplay() {
    return;
    var fontloader = new THREE.FontLoader();
    fontloader.load('build/helvetiker_bold.typeface.js', function (font) {
      this.font = font;
      let material = new THREE.MeshBasicMaterial({
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
      this.pointsDisplay.position.x = -geometry.boundingBox.max.x/2
      this.pointsDisplay.position.y = 1;
      this.pointsDisplay.position.z = -5;
      // this.pointsDisplay.rotation.y = Math.PI / 2;
      this.scene.add(this.pointsDisplay);
    });
  }

  initBallPosition(ball) {
    clearTimeout(this.ballResetTimeout);
    this.ballResetTimeout = setTimeout(this.addBall.bind(this), resetTimeout);
    switch (this.config.mode) {
      case MODE.ONE_ON_ONE:
      case MODE.HIT_THE_TARGET:
        ball.position.set(0, 1, this.config.boxDepth * -0.8);
        ball.velocity.x = this.config.ballInitVelocity * (0.5 - Math.random()) * 0.2;
        ball.velocity.y = this.config.ballInitVelocity * 2.5;
        ball.velocity.z = this.config.ballInitVelocity * 6.0;
        ball.angularVelocity.x = 0;
        ball.angularVelocity.y = 0;
        ball.angularVelocity.z = 0;
        break;
      case MODE.AGAINST_THE_WALL:
        ball.position.set(0, 1.4, this.config.tablePositionZ + 0.01);
        ball.velocity.x = this.config.ballInitVelocity * (0.5 - Math.random()) * 0.1;
        ball.velocity.y = this.config.ballInitVelocity * -4;
        ball.velocity.z = this.config.ballInitVelocity * 2.0;
        ball.angularVelocity.x = 0;
        ball.angularVelocity.y = 0;
        ball.angularVelocity.z = 0;
        break;
      default:
        break;
    }
  }

  addBall() {
    // cannonball
    this.cannon.balls.push(new CANNON.Body({
      mass: this.config.ballMass,
      shape: new CANNON.Sphere(this.config.ballRadius),
      material: new CANNON.Material(),
    }));
    this.cannon.balls[this.cannon.balls.length - 1].name = 'BALL';
    this.cannon.balls[this.cannon.balls.length - 1].linearDamping = 0.4;
    this.cannon.balls[this.cannon.balls.length - 1].position.set(0, 4, 0);
    this.cannon.world.add(this.cannon.balls[this.cannon.balls.length - 1]);

    // contact materials
    this.ballGroundContact = new CANNON.ContactMaterial(
      this.cannon.ground.material,
      this.cannon.balls[this.cannon.balls.length - 1].material,
      {friction: 0.6, restitution: 0.7}
    );
    this.cannon.world.addContactMaterial(this.ballGroundContact);

    // ball - table
    // player
    this.cannon.ballTablePlayerContact = new CANNON.ContactMaterial(
      this.cannon.tableHalfPlayer.material,
      this.cannon.balls[this.cannon.balls.length - 1].material,
      {friction: this.config.ballTableFriction, restitution: this.config.ballTableBounciness}
    );
    this.cannon.world.addContactMaterial(this.cannon.ballTablePlayerContact);

    // enemy
    this.cannon.ballTableEnemyContact = new CANNON.ContactMaterial(
      this.cannon.tableHalfEnemy.material,
      this.cannon.balls[this.cannon.balls.length - 1].material,
      {friction: this.config.ballTableFriction, restitution: this.config.ballTableBounciness}
    );
    this.cannon.world.addContactMaterial(this.cannon.ballTableEnemyContact);

    // ball - paddle
    this.cannon.ballPaddleContact = new CANNON.ContactMaterial(
      this.cannon.paddlePlayer.material,
      this.cannon.balls[this.cannon.balls.length - 1].material,
      {friction: this.config.ballPaddleFriction, restitution: this.config.ballPaddleBounciness}
    );
    this.cannon.world.addContactMaterial(this.cannon.ballPaddleContact);

    // ball - net
    this.cannon.ballNetContact = new CANNON.ContactMaterial(
      this.cannon.net.material,
      this.cannon.balls[this.cannon.balls.length - 1].material,
      {friction: 0.5, restitution: 0.001}
    );
    this.cannon.world.addContactMaterial(this.cannon.ballNetContact);

    // three object
    let geometry = new THREE.SphereGeometry(this.config.ballRadius, 16, 16);
    let material = new THREE.MeshBasicMaterial({
      color: this.config.colors.YELLOW,
      //map: this.ballTexture,
    });

    this.balls.push(new THREE.Mesh(geometry, material));
    this.balls[this.balls.length - 1].castShadow = true;

    this.scene.add(this.balls[this.balls.length - 1]);
    this.initBallPosition(this.cannon.balls[this.cannon.balls.length - 1]);
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
      this.pointsDisplay.position.x = -this.pointsDisplay.geometry.boundingBox.max.x/2
    }
  }

  animate(timestamp) {
    let delta = Math.min(timestamp - this.lastRender, 500);
    this.totaltime += delta;

    if (!this.tabActive) {;
      requestAnimationFrame(this.animate.bind(this));
      return;
    }

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
          this.raycaster.setFromCamera( new THREE.Vector2(0, 0), this.camera );
          this.raycaster.far = 2;
          let intersects = this.raycaster.intersectObjects([this.paddlePlane], false);

          if (intersects.length > 0) {
            let intersectionPoint = intersects[0].point;
            let posX =  intersectionPoint.x * 3;
            let posY = this.cameraHeight + (this.cameraHeight - intersectionPoint.y) * -3;
            this.paddle.position.x = posX;
            this.paddle.position.y = posY
            this.paddle.position.z = this.config.paddlePositionZ + 0.03;
            this.cannon.paddlePlayer.position.x = posX;
            this.cannon.paddlePlayer.position.y = posY;
            this.cannon.paddlePlayer.position.z = this.config.paddlePositionZ + 0.03;

            if (this.pan) {
              this.pan.position.x = posX;
              this.pan.position.y = posY;
              this.pan.position.z = this.config.paddlePositionZ + 0.08;
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
            this.paddle.position.x = intersectionPoint.x;
            this.paddle.position.y = intersectionPoint.y;
            this.paddle.position.z = this.config.paddlePositionZ + 0.03;
            this.cannon.paddlePlayer.position.set(intersectionPoint.x, intersectionPoint.y, this.config.paddlePositionZ + 0.03);
          }
        }
      }
    }

    // predict ball position in the next frame (continous collision detection)
    for (let i = 0; i < this.balls.length; i++) {
      if (this.cannon.balls[i].velocity.length() > 2) {
        this.raycaster.set(this.cannon.balls[i].position.clone(), this.cannon.balls[i].velocity.clone().unit());
        this.raycaster.far = this.cannon.balls[i].velocity.clone().length() / 50;
        //this.raycaster.far = 0.3;
        let arr = this.raycaster.intersectObjects([this.paddle, this.net, this.tableHalfPlayer, this.tableHalfEnemy]);
        if (arr.length) {
          this.cannon.balls[i].position.copy(arr[0].point);
        }
      }
      this.balls[i].position.copy(this.cannon.balls[i].position);
      this.balls[i].quaternion.copy(this.cannon.balls[i].quaternion);
    }

    if (this.pan) {
      this.pan.rotateY(delta * 0.0003);
    }

    this.cannon.world.step(delta / 1000);
    if (DEBUG_MODE) {
      this.cannonDebugRenderer.update();
    }

    // Update VR headset position and apply to camera.
    this.controls.update();

    // Render the scene through the manager.
    this.lastRender = timestamp;

    this.manager.render(this.scene, this.camera, this.timestamp);

    requestAnimationFrame(this.animate.bind(this));
  }

  onResize(e) {
    this.effect.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}

let p = new PingPong();
p.setup();
