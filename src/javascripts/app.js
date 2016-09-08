export default class Pong {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
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
    this.objectsHeight = 0.2;
    this.paddleSize = 1.5;
    this.controlMode = 'pan';
    this.controllerRay = null;
    this.points = 0;
    this.pointsDisplay = null;

    // world size
    this.boxSize = {
      width: 8,
      depth: 10,
      height: 4,
    };

    // boxZBounds = -(this.boxSize.depth - 1),
    this.boxZBounds = 0;

    this.totaltime = 0;
    // Request animation frame loop function
    this.lastRender = 0;
    this.velocity = {
      x: 0,
      y: 0,
      z: 0.006,
      factorX: 0.005,
      factorY: 0.005,
    };
  }

  setup() {
    // Setup three.js WebGL renderer. Note: Antialiasing is a big performance hit.
    // Only enable it if you actually need to.
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Append the canvas element created by the renderer to document body element.
    document.body.appendChild(this.renderer.domElement);

    // Create a three.js scene.
    this.scene = new THREE.Scene();

    // Create a three.js camera.
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

    // Apply VR headset positional data to camera.
    this.controls = new THREE.VRControls(this.camera);
    this.controls.standing = true;
    this.controls.userHeight = this.boxSize.height / 2;

    // Apply VR stereo rendering to renderer.
    this.effect = new THREE.VREffect(this.renderer);
    this.effect.setSize(window.innerWidth, window.innerHeight);

    this.setupLights();

    this.loader = new THREE.TextureLoader();
    this.loader.load('images/box.png', this.onTextureLoaded.bind(this));

    // Create a VR manager helper to enter and exit VR mode.
    let params = {
      hideButton: false, // Default: false.
      isUndistorted: false // Default: false.
    };

    this.manager = new WebVRManager(this.renderer, this.effect, params);

    // Create 3D objects.
    let geometry = new THREE.BoxGeometry(this.paddleSize, this.paddleSize, this.objectsHeight);
    let material = new THREE.MeshPhongMaterial({
      color: 0xee00ee,
      shininess: 39,
      transparent: true,
      opacity: 0.4,
    });
    this.paddle = new THREE.Mesh(geometry, material);

    // Position cube mesh to be right in front of you.
    this.paddle.position.set(0, this.objectsHeight / 2, -1.5);

    // Add paddle mesh to your three.js scene
    this.scene.add(this.paddle);

    geometry = new THREE.SphereGeometry(this.objectsHeight / 2, 16, 16);
    material = new THREE.MeshPhongMaterial({
      color: 0x00ee00,
      shininess: 10,
    });

    this.ball = new THREE.Mesh(geometry, material);

    this.scene.add(this.ball);
    this.initBallPosition();

    window.addEventListener('resize', this.onResize, true);
    window.addEventListener('vrdisplaypresentchange', this.onResize, true);

    this.boxZBounds = -(this.boxSize.depth - 1),

    this.renderer.domElement.requestPointerLock = this.renderer.domElement.requestPointerLock ||
      this.renderer.domElement.mozRequestPointerLock;
    this.renderer.domElement.onclick = () => {
      this.renderer.domElement.requestPointerLock();
    };

    navigator.getVRDisplays().then(displays => {
      if (displays) {
        this.display = displays[0];
        console.log(displays[0]);
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
          loader.load('vr_controller_vive_1_5.obj', function ( object ) {

            var loader = new THREE.TextureLoader();
            loader.setPath('/models/');

            var controller = object.children[ 0 ];
            controller.material.map = loader.load( 'onepointfive_texture.png' );
            controller.material.specularMap = loader.load( 'onepointfive_spec.png' );

            this.controller1.add(object.clone());
            this.controller2.add(object.clone());

          });
        }
      }
    });

    window.addEventListener("gamepadconnected", this.gamePadsConnected);

    this.setupPointsDisplay();
    this.setupControllers();


    this.raycaster = new THREE.Raycaster();
    geometry = new THREE.PlaneGeometry(this.boxSize.width, this.boxSize.height);
    material = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0});
    this.paddlePlane = new THREE.Mesh(geometry, material);
    this.paddlePlane.position.z = -1.5;
    this.paddlePlane.position.y = this.boxSize.height / 2;
    //this.paddlePlane.visible = false;
    this.scene.add(this.paddlePlane);
  }

  setupControllers() {
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
  }

  setupLights() {
    let light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(-3, this.boxSize.height*0.8, this.boxSize.depth / 2  );
    this.scene.add(light);

    light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(3, this.boxSize.height*0.8, 0  );
    this.scene.add(light);
  }

  gamePadsConnected() {
    console.log('gamepad');
    console.log(navigator.getGamepads());
    return;
    if (this.gamePad) return;
    this.gamePad = navigator.getGamepads()[0];
    console.log('gamepad recognized');
    console.log(this.gamePad);
  }

  setupPointsDisplay() {
    var fontloader = new THREE.FontLoader();
    fontloader.load( 'lib/helvetiker_bold.typeface.js', font => {
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

  onTextureLoaded(texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(this.boxSize.width, this.boxSize.depth);

    let geometry = new THREE.BoxGeometry(this.boxSize.width, this.boxSize.height, this.boxSize.depth);
    let material = new THREE.MeshPhongMaterial({
      map: texture,
      color: 0x01BE00,
      side: THREE.BackSide
    });

    // Align the skybox to the floor (which is at y=0).
    this.skybox = new THREE.Mesh(geometry, material);
    this.skybox.position.y = this.boxSize.height/2;
    this.skybox.position.z = -this.boxSize.depth/2 + 1;

    this.scene.add(this.skybox);

    // For high end VR devices like Vive and Oculus, take into account the stage
    // parameters provided.

    // Kick off animation loop
    requestAnimationFrame(this.animate.bind(this));
    //this.setupStage();
  }

  initBallPosition() {
    this.ball.position.set(0, this.boxSize.height / 2, this.boxSize.depth * -0.8);
    this.velocity.x = (Math.random() - 0.5) * 0.0001;
    this.velocity.y = (Math.random() - 0.5) * 0.0001;
    this.velocity.z = 0.005;
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
    this.lastRender = timestamp;

    if (this.display) {
      let pose = this.display.getPose();
      if (pose) {
        if (this.controlMode === 'pan') {
          // this.setPaddlePosition(-8 * pose.orientation[1] + this.paddleInaccuracy);
          
          this.raycaster.setFromCamera( new THREE.Vector2(0, 0), this.camera );
          let intersects = this.raycaster.intersectObjects([this.paddlePlane], false);

          if (intersects.length > 0) {
            let intersectionPoint = intersects[0].point;
            this.paddle.position.x = intersectionPoint.x * 3;
            this.paddle.position.y = this.boxSize.height / 2 + (this.boxSize.height / 2 - intersectionPoint.y) * -3;

          }
        } else if (this.controlMode === 'move') {
          let controller = null;
          if (this.controller1.visible) {
            controller = this.controller1;
          } else if (this.controller2.visible) {
            controller = this.controller2;
          }
          if (controller) {
            let direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(controller.getWorldQuaternion());
            direction.normalize();
            this.raycaster.set(controller.getWorldPosition(), direction );
            let intersects = this.raycaster.intersectObject(this.paddlePlane, false);
            if (intersects.length > 0) {
              let intersectionPoint = intersects[0].point;
              this.paddle.position.x = intersectionPoint.x;
              this.paddle.position.y = intersectionPoint.y;
            }
          }
        }
      }
    }

    this.ball.position.x += this.velocity.x * delta;
    this.ball.position.y += this.velocity.y * delta;
    this.ball.position.z += this.velocity.z * delta;

    if (this.ball.position.z > this.paddle.position.z - this.objectsHeight) {
      // ball is in the hit zone
      if    (this.ball.position.x > this.paddle.position.x - this.paddleSize / 2 - this.objectsHeight / 2 
          && this.ball.position.x < this.paddle.position.x + this.paddleSize / 2 + this.objectsHeight / 2
          && this.ball.position.y > this.paddle.position.y - this.paddleSize / 2 - this.objectsHeight / 2 
          && this.ball.position.y < this.paddle.position.y + this.paddleSize / 2 + this.objectsHeight / 2
      ) {
        // hit
        this.velocity.z *= -1;
        this.ball.position.z += this.velocity.z;

        this.velocity.z += Math.sign(this.velocity.z) * 0.001;

        this.velocity.x = (this.ball.position.x - this.paddle.position.x) * this.velocity.factorX;
        this.velocity.y = (this.ball.position.y - this.paddle.position.y) * this.velocity.factorY;
        this.setPoints(this.points + 1);
      } else {
        // miss, lost
        this.initBallPosition();
        this.setPoints(0);
      }
    }

    // front wall hit
    if (this.ball.position.z - this.objectsHeight/2 < this.boxZBounds) {
      this.velocity.z *= -1;
      this.ball.position.z += this.velocity.z;
    }

    // top/bottom wall hit
    if (this.ball.position.y - this.objectsHeight/2 < this.skybox.position.y - this.boxSize.height/2
     || this.ball.position.y + this.objectsHeight/2 > this.skybox.position.y + this.boxSize.height/2) {
      this.velocity.y *= -1;
      this.ball.position.y += this.velocity.y;
    }

    // side wall hit
    if (this.ball.position.x - this.objectsHeight/2 < -this.boxSize.width/2
        || this.ball.position.x + this.objectsHeight/2 > this.boxSize.width/2) {
      this.velocity.x *= -1;
      this.ball.position.x += this.velocity.x;
    }

    // Update VR headset position and apply to camera.
    this.controls.update();

    // Render the scene through the manager.
    this.manager.render(this.scene, this.camera, this.timestamp);

    requestAnimationFrame(this.animate.bind(this));
  }

  setPaddlePosition(x) {
    this.paddle.position.x = Math.min(
      this.boxSize.width / 2 - this.paddleSize / 2,
      Math.max(
        x,
        -this.boxSize.width / 2 + this.paddleSize / 2
      )
    );
    this.paddle.position.z = this.controlMode == 'pan' ? -1.5 : -3;
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
          console.log('set stage');
          this.setStageDimensions(display.stageParameters);
        }
      }
    });
  }

  setStageDimensions(stage) {
    // TODO probably just ignore this, stage would be too small anyway
    console.log(stage);
    return;
    // Make the skybox fit the stage.
    let material = this.skybox.material;
    this.scene.remove(this.skybox);

    // Size the skybox according to the size of the actual stage.
    let geometry = new THREE.BoxGeometry(stage.sizeX, this.boxSize.width, stage.sizeZ);
    this.skybox = new THREE.Mesh(geometry, material);

    // Place it on the floor.
    this.skybox.position.y = this.boxSize/2;
    this.scene.add(this.skybox);

    // Place the cube in the middle of the scene, at user height.
    this.paddle.position.set(0, this.controls.userHeight, 0);
  }
}

var p = new Pong();
p.setup();
