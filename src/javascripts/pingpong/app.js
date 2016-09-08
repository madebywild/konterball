import dat from 'dat-gui';
import Physics from 'physics';

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
    this.table = null;
    this.net = null;
    this.ballTexture = null;
    this.canvasDOM = document.querySelector('canvas');
    this.seconds = 0;
    this.ballGroundContact = null;
    this.ballTableContact = null;
    this.tabActive = true;
    this.ballPaddleContact = null;
    this.ball = null;
    this.cameraHeight = 1.2;
    this.lastPaddlePosition = null;
    this.ammo = {
      world: null,
      ball: null,
      transform: null,
      ballInitMotionState: null,
    };

    this.CCD_EPSILON = 0.2;

    this.cannon = {
      world: null,
      ball: null,
      net: null,
      ground: null,
      paddlePlayer: null,
      paddleEnemy: null,
      table: null,
    }

    // config
    this.config = {
      gravity: 8.7,
      tableDepth: 4,
      tableWidth: 2.2,
      tableHeight: 0.7,
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
    }
    this.colors = {
      BLUE: 0x124888,
      BACKGROUND_BLUE: 0x2D68A4,
      DARK_BLUE: 0x143A61,
      WHITE: 0xFFFFFF,
      YELLOW: 0xFAFD58,
      RED: 0xD31515,
      LIGHT_RED: 0xE35C27,
      // moodboard color swatch
      // yellow: 0xFAFB65,
      // cyan: 0x22CED9,
      // black: 0x000000,
      // pink: 0xFD9CA5,
      // white: 0xF1EEE7,
      // green: 0x2EB66F,
      // brown: 0xC46F65,
    };

    this.physics = new Physics(this.config);

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

    // thisly VR headset positional data to camera.
    this.controls = new THREE.VRControls(this.camera);
    this.controls.standing = true;
    this.controls.userHeight = this.cameraHeight;

    // thisly VR stereo rendering to renderer.
    this.effect = new THREE.VREffect(this.renderer);
    this.effect.setSize(window.innerWidth, window.innerHeight);


    this.loader = new THREE.TextureLoader();

    let geometry = new THREE.PlaneGeometry(100, 100);
    let material = new THREE.MeshPhongMaterial({
      color: this.colors.BACKGROUND_BLUE,
      side: THREE.DoubleSide,
    });

    // Align the skybox to the floor (which is at y=0).
    this.skybox = new THREE.Mesh(geometry, material);
    //this.skybox.position.y = this.config.boxSize.height/2;
    //this.skybox.position.z = -this.config.boxSize.depth/2 + 1;
    this.skybox.rotation.x = Math.PI / 2;

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
    setInterval(() => {
      this.initBallPosition();
    }, 2000);

    this.boxZBounds = -(this.boxDepth - 1);

    this.renderer.domElement.requestPointerLock = this.renderer.domElement.requestPointerLock ||
      this.renderer.domElement.mozRequestPointerLock;
    this.renderer.domElement.onclick = () => {
      this.renderer.domElement.requestPointerLock();
    };

    
    geometry = new THREE.SphereGeometry(this.ballRadius, 16, 16);
    material = new THREE.MeshBasicMaterial({
      color: this.colors.YELLOW,
      //map: this.ballTexture,
    });

    this.ball = new THREE.Mesh(geometry, material);
    this.ball.castShadow = true;

    this.scene.add(this.ball);

    this.setupCannon();
    this.setupAmmo();
    this.setupScene();
    this.setupLights();
    this.setupPointsDisplay();
    this.setupControllers();
    this.setupPaddlePlane();
    //this.setupStage();
    this.setupGUI();
    requestAnimationFrame(this.animate.bind(this));
  }

  setupGUI() {
    let gui = new dat.GUI();
    gui.remember(this);
    gui.add(this, 'ballRadius', 0.001, 0.4);
    gui.add(this, 'gravity', 0.5, 15).onChange(val => this.cannon.world.gravity.set(0, -val, 0));
    gui.add(this, 'ballMass', 0.001, 1).onChange(val => {
      //this.cannon.balls.forEach(ball => {ball.gravity = val;});
    });
    // gui.add(this, 'ballTableFriction', 0, 1).onChange(val => this.ballTableContact.friction = val);
    gui.add(this, 'ballTableBounciness', 0, 5).onChange(val => this.ballTableContact.restitution = val);
    // gui.add(this, 'ballPaddleFriction', 0, 1).onChange(val => this.ballPaddleContact.friction = val);
    gui.add(this, 'ballPaddleBounciness', 0, 5).onChange(val => this.ballPaddleContact.restitution = val);
    gui.add(this, 'ballInitVelocity', 0, 2);
  }

  setupCannon() {
    // world
    this.cannon.world = new CANNON.World();
    // this.cannon.world.gravity.set(0, -9.82, 0);
    this.cannon.world.gravity.set(0, -this.gravity, 0);
    this.cannon.world.broadphase = new CANNON.NaiveBroadphase();
    this.cannon.world.solver.iterations = 20;

    // ground
    this.cannon.ground = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: new CANNON.Material(),
    });
    this.cannon.ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    this.cannon.world.add(this.cannon.ground);

    // table
    this.cannon.table = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.tableWidth / 2,
          this.tableHeight / 2,
          this.tableDepth / 2
        )
      ),
      material: new CANNON.Material(),
    });
    this.cannon.table._name = 'TABLE';
    this.cannon.table.position.set(
      0,
      this.tableHeight / 2,
      this.tablePositionZ
    );
    this.cannon.world.add(this.cannon.table);

    // net
    this.cannon.net = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.tableWidth / 2,
          this.netHeight / 2,
          this.netThickness / 2
        )
      ),
      material: new CANNON.Material(),
    });
    this.cannon.net._name = 'NET';
    this.cannon.net.position.set(
      0,
      this.tableHeight + this.netHeight / 2,
      this.tablePositionZ
    );
    this.cannon.world.add(this.cannon.net);

    // paddle
    this.cannon.paddlePlayer = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.paddleSize / 2,
          this.paddleSize / 2,
          this.paddleThickness / 2
        )
      ),
      material: new CANNON.Material(),
    });
    this.cannon.paddlePlayer._name = 'PADDLE';
    this.cannon.paddlePlayer.position.set(0, 1, this.paddlePositionZ);
    this.cannon.paddlePlayer.addEventListener("collide", this.paddleCollision.bind(this));
    this.cannon.world.add(this.cannon.paddlePlayer);
  }

  setupAmmo() {
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    let overlappingPairCache = new Ammo.btDbvtBroadphase();
    let solver = new Ammo.btSequentialImpulseConstraintSolver();

    this.ammo.world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    this.ammo.world.setGravity(new Ammo.btVector3(0, -this.gravity, 0));

    // add ground
    let groundShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 50, 50));
    let groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, -50, 0));

    let localInertia = new Ammo.btVector3(0, 0, 0);
    let myMotionState = new Ammo.btDefaultMotionState(groundTransform);
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(0, myMotionState, groundShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);
    body.setRestitution(0.7);
    this.ammo.world.addRigidBody(body);


    // add table
    let tableShape = new Ammo.btBoxShape(new Ammo.btVector3(this.tableWidth, this.tableHeight, this.tableDepth));
    let tableTransform = new Ammo.btTransform();
    tableTransform.setIdentity();
    tableTransform.setOrigin(new Ammo.btVector3(0, 0, 0));

    localInertia = new Ammo.btVector3(0, 0, 0);
    myMotionState = new Ammo.btDefaultMotionState(tableTransform);
    rbInfo = new Ammo.btRigidBodyConstructionInfo(0, myMotionState, tableShape, localInertia);
    body = new Ammo.btRigidBody(rbInfo);
    body.setRestitution(0.7);
    this.ammo.world.addRigidBody(body);


    // add ball
    let ballShape = new Ammo.btSphereShape(this.ballRadius);
    let startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(0, 1, -8));

    localInertia = new Ammo.btVector3(0, 0, 0);
    ballShape.calculateLocalInertia(this.ballMass, localInertia);
    this.ammo.initMotionState = new Ammo.btDefaultMotionState(startTransform);
    rbInfo = new Ammo.btRigidBodyConstructionInfo(this.ballMass, this.ammo.initMotionState, ballShape, localInertia);
    this.ammo.ball = new Ammo.btRigidBody(rbInfo);
    this.ammo.ball.setDamping(0.4, 0);
    this.ammo.ball.setRestitution(0.9);
    this.ammo.world.addRigidBody(this.ammo.ball);


    // add paddle

    this.ammo.trans = new Ammo.btTransform();

    this.initBallPosition();
  }

  paddleCollision(e) {
    console.log('----------------------------------');
    console.log('COLLISION:');
    console.log(e);
    console.log('----------------------------------');
    if (e.body.name === 'BALL' && !this.controller1 && !this.controller2) {
      let hitpointX = e.body.position.x - e.target.position.x;
      let hitpointY = e.body.position.y - e.target.position.y;
      // normalize to -1 to 1
      hitpointX = hitpointX / (this.paddleSize / 2);
      hitpointY = hitpointY / (this.paddleSize / 2);
      // did we hit the edge of the paddle?
      if (hitpointX > 1 || hitpointX < -1) return;
      if (hitpointY > 1 || hitpointY < -1) return;
      // these values are heavily tweakable
      e.body.velocity.x += hitpointX * 4;
      e.body.velocity.y = hitpointY * 0.7;
      e.body.velocity.y *= 2 * e.body.velocity.z;
      e.body.velocity.z *= 4;
    }
  }

  setupScene() {
    // Create 3D objects.
    let geometry = new THREE.BoxGeometry(this.paddleSize, this.paddleSize, this.paddleThickness);
    let material = new THREE.MeshLambertMaterial({
      color: this.colors.RED,
      transparent: true,
      opacity: 0.6,
    });
    this.paddle = new THREE.Mesh(geometry, material);
    this.paddle.name = 'paddle';

    // Position cube mesh to be right in front of you.
    //this.paddle.position.set(0, this.config.paddle.thickness / 2, this.config.paddle.positionZ);

    geometry = new THREE.BoxGeometry(
      this.tableWidth,
      this.tableHeight,
      this.tableDepth
    );
    material = new THREE.MeshLambertMaterial({
      color: this.colors.BLUE,
    });
    this.table = new THREE.Mesh(geometry, material);
    this.table.position.set(
      0,
      this.tableHeight / 2,
      this.tablePositionZ
    );
    this.table.receiveShadow = true;
    this.scene.add(this.table);

    geometry = new THREE.BoxGeometry(
      this.tableWidth,
      this.netHeight,
      this.netThickness
    );
    material = new THREE.MeshLambertMaterial({
      color: this.colors.WHITE,
      transparent: true,
      opacity: 0.5,
    });
    this.net = new THREE.Mesh(geometry, material);
    this.net.position.y = this.tableHeight / 2 + this.netHeight / 2;
    this.table.add(this.net);
  }

  setupPaddlePlane() {
    this.raycaster = new THREE.Raycaster();

    let geometry = new THREE.PlaneGeometry(this.boxWidth, this.boxHeight);
    let material = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0});
    this.paddlePlane = new THREE.Mesh(geometry, material);
    this.paddlePlane.position.z = this.paddlePositionZ;
    this.paddlePlane.position.y = this.boxHeight / 2;
    //this.paddlePlane.visible = false;
    this.scene.add(this.paddlePlane);
  }

  setupControllers() {
    navigator.getVRDisplays().then(displays => {
      if (displays) {
        this.display = displays[0];
        if (displays[0].capabilities && displays[0].capabilities.hasPosition) {
          console.log("vive loaded");
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

            // Add paddle mesh to your three.js scene
            this.paddle.translateZ(-0.1);
            this.paddle.rotateX(1.7);
            this.controller.add(this.paddle);

            this.controller1.add(object.clone());
            this.controller2.add(object.clone());
          });
        } else {
          this.scene.add(this.paddle);
        }
      } else {
        this.scene.add(this.paddle);
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
    //light.shadow.bias = 0.001;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 6;
    light.shadow.camera.left = 0;

    // let ch = new THREE.CameraHelper(light.shadow.camera);
    // this.scene.add(ch);

    light = new THREE.PointLight(0xffffff, 0);
    light.position.set(0, 6, this.table.position.z);
    this.scene.add(light);
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

  initBallPosition() {

    let startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(0, 1, -8));
    let myMotionState = new Ammo.btDefaultMotionState(startTransform);
    this.ammo.ball.setMotionState(myMotionState);

    this.ammo.ball.setLinearVelocity(new Ammo.btVector3(
      this.ballInitVelocity * (0.5 - Math.random()) * 0.2,
      this.ballInitVelocity * 2.5,
      this.ballInitVelocity * 6.0
    ));

    this.ammo.ball.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
  }


  addBall() {
    /*
    // cannonball
    this.cannon.balls.push(new CANNON.Body({
      mass: this.ballMass,
      shape: new CANNON.Sphere(this.ballRadius),
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

    this.ballTableContact = new CANNON.ContactMaterial(
      this.cannon.table.material,
      this.cannon.balls[this.cannon.balls.length - 1].material,
      {friction: this.ballTableFriction, restitution: this.ballTableBounciness}
    );
    this.cannon.world.addContactMaterial(this.ballTableContact);

    this.ballPaddleContact = new CANNON.ContactMaterial(
      this.cannon.paddlePlayer.material,
      this.cannon.balls[this.cannon.balls.length - 1].material,
      {friction: this.ballPaddleFriction, restitution: this.ballPaddleBounciness}
    );
    this.cannon.world.addContactMaterial(this.ballPaddleContact);

    this.ballNetContact = new CANNON.ContactMaterial(
      this.cannon.net.material,
      this.cannon.balls[this.cannon.balls.length - 1].material,
      {friction: 0.5, restitution: 0.001}
    );
    this.cannon.world.addContactMaterial(this.ballNetContact);
    */

    /*
    // three object
    let geometry = new THREE.SphereGeometry(this.ballRadius, 16, 16);
    let material = new THREE.MeshBasicMaterial({
      color: this.colors.YELLOW,
      //map: this.ballTexture,
    });

    this.balls.push(new THREE.Mesh(geometry, material));
    this.balls[this.balls.length - 1].castShadow = true;

    this.scene.add(this.balls[this.balls.length - 1]);
    this.initBallPosition(this.cannon.balls[this.cannon.balls.length - 1]);
    */
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
          // this.setPaddlePosition(-8 * pose.orientation[1] + this.paddleInaccuracy);
          
          this.raycaster.setFromCamera( new THREE.Vector2(0, 0), this.camera );
          this.raycaster.far = 2;
          let intersects = this.raycaster.intersectObjects([this.paddlePlane], false);

          if (intersects.length > 0) {
            let intersectionPoint = intersects[0].point;
            let posX =  intersectionPoint.x * 3;
            let posY = this.cameraHeight + (this.cameraHeight - intersectionPoint.y) * -3;
            this.paddle.position.x = posX;
            this.paddle.position.y = posY
            this.paddle.position.z = this.paddlePositionZ;
            this.cannon.paddlePlayer.position.x = posX;
            this.cannon.paddlePlayer.position.y = posY;
            // this.cannon.paddlePlayer.position.set(
            //   intersectionPoint.x,
            //   intersectionPoint.y,
            //   this.config.paddle.positionZ
            // );
          }
        } else if (this.controlMode === 'move') {
          //console.log(this.controller1);
          if (controller) {
            // line debugging
            // let direction = new THREE.Vector3(0, 0, -1);
            // direction.thislyQuaternion(controller.getWorldQuaternion());
            // var pt2 = controller.getWorldPosition();
            // pt2.add(direction);
            // this.controllerRay.geometry.vertices[0] = controller.getWorldPosition();
            // this.controllerRay.geometry.vertices[1] = pt2;
            // this.controllerRay.geometry.verticesNeedUpdate = true;
            // this.controllerRay.geometry.computeVertexNormals();

            /*
            let direction = new THREE.Vector3(0, 0, -1);
            direction.thislyQuaternion(controller.getWorldQuaternion());
            direction.normalize();
            this.raycaster.set(controller.getWorldPosition(), direction );
            let intersects = this.raycaster.intersectObject(this.paddlePlane, false);
            if (intersects.length > 0) {
              let intersectionPoint = intersects[0].point;
              // this.paddle.position.x = intersectionPoint.x;
              // this.paddle.position.y = intersectionPoint.y;
              this.cannon.paddlePlayer.position.set(intersectionPoint.x, intersectionPoint.y, -0.5);
              // //this.cannon.paddlePlayer.position.x = intersectionPoint.x;
              // this.cannon.paddlePlayer.position.y = intersectionPoint.y;
              // this.cannon.paddlePlayer.position.z = -3.5;
            }
            */
            // this.cannon.paddlePlayer.position.copy(controller.position);
            // this.cannon.paddlePlayer.quaternion.copy(controller.quaternion);



            // let paddleQuat = controller.quaternion;
            // let rotateQuat = new THREE.Quaternion();
            // rotateQuat.setFromEuler(new THREE.Euler(1.5, 0, 3, 'XYZ'));
            // paddleQuat.multiply(rotateQuat);
            // this.paddle.quaternion.copy(paddleQuat);
            // let paddlePos = controller.position.clone();
            // paddlePos.thislyMatrix4(this.controls.getStandingMatrix());
            // this.paddle.position.copy(paddlePos);

            // this.paddle.matrix = controller.matrix;
            // this.paddle.matrix.matrixWorldNeedsUpdate = true;


          }

          //this.setPaddlePosition(8 * pose.position[0]);
          // this.setPaddlePosition(-8 * this.controller1.quaternion[1]);
        }
      }
    }

    let paddle = null;
    if (controller) {
      paddle = controller.getObjectByName('paddle');
      if (paddle) {
        this.cannon.paddlePlayer.position.copy(paddle.getWorldPosition());
        this.cannon.paddlePlayer.quaternion.copy(paddle.getWorldQuaternion());
      }
    }


    /*
    // predict ball position in the next frame (continous collision detection)
    let collided = false;

    if (this.cannon.ball.velocity.length() > 7) {
      this.raycaster.set(this.cannon.ball.position.clone(), this.cannon.ball.velocity.clone().unit());
      this.raycaster.far = 0.3;
      // TODO add net here
      let arr = this.raycaster.intersectObjects([paddle ? paddle : this.paddle, this.net]);
      if (arr.length) {
        console.log("collision point");
        console.log(arr[0].point);
        this.cannon.ball.position.copy(arr[0].point);
        collided = true;
      }
    }
    if (controller && !collided && this.lastPaddlePosition) {
      let velocity = 100 * this.cannon.paddlePlayer.position.distanceTo(this.lastPaddlePosition);
      let velocity3d = this.cannon.paddlePlayer.position.vsub(this.lastPaddlePosition);
      if (velocity > 1) {
        // predict if position next frame will hit the ball
        // (cast ray from ball into direction of the paddle, look for intersections)
        this.raycaster.set(this.cannon.ball.position.clone(), velocity3d.clone().unit());
        this.raycaster.far = velocity3d.length();
        let arr = this.raycaster.intersectObjects([paddle ? paddle : this.paddle]);
        if (arr.length) {
          // TODO this doesnt really work. possibility:
          // https://www.npmjs.com/package/convex-minkowski-sum
          // http://threejs.org/examples/webgl_geometry_convex.html
          // use this to compute minkowski sum of a polygon thisroximation of the paddle
          // then intersect this form and the ball, if there is an intersection,
          // there was a contact between this and the last frame





          console.log('collision in the next frame detected');
          // this is not enough if the paddle moves faster than the ball,
          // which is to be expected for vive users.
          console.log("ball position");
          console.log(this.cannon.paddlePlayer.position);
          console.log("collision point");
          let r = Math.random();
          if (r < 0.33) {
            this.paddle.material.color.setHex(0xff0000);
          } else if (r < 0.66) {
            this.paddle.material.color.setHex(0x00ffff);
          } else {
            this.paddle.material.color.setHex(0x00ffff);
          }
          console.log(arr[0].point);
          this.cannon.ball.position.copy(arr[0].point);
          // this.cannon.paddlePlayer.position.copy(arr[0].point);
        }
      }
    }
    */

    // this.ball.position.copy(this.cannon.ball.position);
    // this.ball.quaternion.copy(this.cannon.ball.quaternion);

    // this.lastPaddlePosition = this.cannon.paddlePlayer.position.clone();
    // this.cannon.world.step(delta / 1000);





    this.ball.position.set(this.physics.getBallPosition());

    this.ammo.world.stepSimulation(delta/1000, 10);



    // Update VR headset position and thisly to camera.
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

  // Get the HMD, and if we're dealing with something that specifies
  // stageParameters, rearrange the scene.
  setupStage() {
    navigator.getVRDisplays().then(displays => {
      if (displays.length > 0) {
        display = displays[0];
        if (display.stageParameters) {
          this.setStageDimensions(display.stageParameters);
        }
      }
    });
  }

  setStageDimensions(stage) {
    // TODO probably just ignore this, stage would be too small anyway
    return;
    // Make the skybox fit the stage.
    let material = this.skybox.material;
    this.scene.remove(this.skybox);

    // Size the skybox according to the size of the actual stage.
    let geometry = new THREE.BoxGeometry(stage.sizeX, this.config.boxSize.width, stage.sizeZ);
    this.skybox = new THREE.Mesh(geometry, material);

    // Place it on the floor.
    this.skybox.position.y = this.config.boxSize/2;
    this.scene.add(this.skybox);

    // Place the cube in the middle of the scene, at user height.
    this.paddle.position.set(0, this.controls.userHeight, 0);
  }
}

let p = new PingPong();
p.setup();
