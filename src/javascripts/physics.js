import {PRESET, MODE} from './constants';

export default class Physics {
  constructor(config, ballPaddleCollisionCallback) {

    // config
    this.config = config;

    this.world = null;
    this.balls = [];
    this.net = null;
    this.ground = null;
    this.paddle = null;
    this.ballNetContact = null;
    this.ballGroundContact = null;
    this.ballPaddleContact = null;
    this.raycaster = new THREE.Raycaster();

    this.ballPaddleCollisionCallback = ballPaddleCollisionCallback;
  }

  setupWorld() {
    // world
    this.world = new CANNON.World();
    this.world.gravity.set(0, -this.config.gravity, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 20;
    this.setupBox();
    this.setupPaddle();
    this.setupNet();
  }

  setupGround() {
    // ground
    this.ground = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: new CANNON.Material(),
    });
    this.ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    this.world.add(this.ground);
  }

  setupNet() {
    // net
    this.net = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.config.boxWidth / 2,
          this.config.netHeight / 2,
          this.config.netThickness / 2
        )
      ),
      material: new CANNON.Material(),
    });
    this.net._name = 'NET';
    this.net.position.set(
      0,
      this.config.netHeight / 2,
      this.config.boxPositionZ
    );
    this.world.add(this.net);
  }

  setupPaddle() {
    // paddle
    this.paddle = new CANNON.Body({
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
    this.paddle._name = 'PADDLE';
    this.paddle.position.set(0, 1, this.config.paddlePositionZ);
    this.paddle.addEventListener('collide', this.paddleCollision.bind(this));
    this.world.add(this.paddle);
  }

  addContactMaterial(mat1, mat2, bounce, friction) {
     let contact = new CANNON.ContactMaterial(
      mat1,
      mat2,
      {friction: friction, restitution: bounce}
    );
    this.world.addContactMaterial(contact);
    return contact;
  }

  setupBox() {
    let wallWidth = 10;
    this.leftWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          wallWidth / 2,
          this.config.boxHeight / 2,
          this.config.boxDepth / 2
        )
      ),
      material: new CANNON.Material(),
    });
    this.leftWall.position.set(
      -this.config.boxWidth / 2 - wallWidth / 2,
      this.config.boxHeight / 2,
      this.config.boxPositionZ
    );
    this.world.add(this.leftWall);

    this.rightWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          wallWidth / 2,
          this.config.boxHeight / 2,
          this.config.boxDepth / 2
        )
      ),
      material: new CANNON.Material(),
    });
    this.rightWall.position.set(
      this.config.boxWidth / 2 + wallWidth / 2,
      this.config.boxHeight / 2,
      this.config.boxPositionZ
    );
    this.world.add(this.rightWall);

    this.bottomWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.config.boxWidth * 2,
          wallWidth / 2,
          this.config.boxDepth / 2
        )
      ),
      material: new CANNON.Material(),
    });
    this.bottomWall.position.set(
      0,
      -wallWidth / 2,
      this.config.boxPositionZ
    );
    this.world.add(this.bottomWall);

    this.topWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.config.boxWidth * 2,
          wallWidth / 2,
          this.config.boxDepth / 2
        )
      ),
      material: new CANNON.Material(),
    });
    this.topWall.position.set(
      0,
      this.config.boxHeight + wallWidth / 2,
      this.config.boxPositionZ
    );
    this.world.add(this.topWall);

    this.frontWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.config.boxWidth * 2,
          this.config.boxHeight * 2,
          wallWidth / 2
        )
      ),
      material: new CANNON.Material(),
    });
    this.frontWall.position.set(
      0,
      this.config.boxHeight / 2,
      this.config.boxPositionZ - this.config.boxDepth / 2 - wallWidth / 2
    );
    this.world.add(this.frontWall);
  }

  addBall(threeReference) {
    let ball = new CANNON.Body({
      mass: this.config.ballMass,
      shape: new CANNON.Sphere(this.config.ballRadius),
      material: new CANNON.Material(),
    });

    ball.threeReference = threeReference;
    ball._name = `ball-${this.balls.length}`;
    // TODO
    // newBall.linearDamping = 0.4;
    ball.linearDamping = 0;

    this.leftBounce = this.addContactMaterial(ball.material, this.leftWall.material, this.config.ballBoxBounciness, 0);
    this.topBounce = this.addContactMaterial(ball.material, this.topWall.material, this.config.ballBoxBounciness, 0);
    this.rightBounce = this.addContactMaterial(ball.material, this.rightWall.material, this.config.ballBoxBounciness, 0);
    this.bottomBounce = this.addContactMaterial(ball.material, this.bottomWall.material, this.config.ballBoxBounciness, 0);
    this.frontBounce = this.addContactMaterial(ball.material, this.frontWall.material, this.config.ballBoxBounciness, 0);
    this.addContactMaterial(ball.material, this.paddle.material, 1, 0);

    ball.position.y = this.config.boxHeight / 2;
    ball.position.z = this.config.boxPositionZ;
    this.balls.push(ball);
    this.world.add(ball);
    this.initBallPosition(ball);
  }

  setBallBoxBounciness(val) {
    this.leftBounce.restitution = val;
    this.topBounce.restitution = val;
    this.rightBounce.restitution = val;
    this.bottomBounce.restitution = val;
    this.frontBounce.restitution = val;
  }

  paddleCollision(e) {
    console.log(e.body);
    if (e.body._name.startsWith('ball')) {
      this.ballPaddleCollisionCallback(e.body.position, e.body);

      let hitpointX = e.body.position.x - e.target.position.x;
      let hitpointY = e.body.position.y - e.target.position.y;
      // normalize to -1 to 1
      hitpointX = hitpointX / (this.config.paddleSize / 2);
      hitpointY = hitpointY / (this.config.paddleSize / 2);
      // did we hit the edge of the paddle?
      if (hitpointX > 1 || hitpointX < -1 || hitpointY > 1 || hitpointY < -1) {
        return;
      }
      if (this.config.preset !== PRESET.PINGPONG) {
        // insane mode and normal mode
        e.body.velocity.x = hitpointX * e.body.velocity.z * 0.7;
        e.body.velocity.y = hitpointY * e.body.velocity.z * 0.7;
        e.body.velocity.z += 0.05;
      } else {
        // pingpong mode
        // adjust velocity
        // these values are heavily tweakable
        e.body.velocity.z = 3;
        e.body.velocity.x = hitpointX * 0.7;
        e.body.velocity.y = 3;
      }
    }
  }

  setPaddlePosition(x, y, z) {
    this.paddle.position.set(x, y, z);
  }

  initBallPosition(ball) {
    switch (this.config.preset) {
      case PRESET.NORMAL:
      case PRESET.INSANE:
        ball.position.set(0, this.config.boxHeight / 2, this.config.boxPositionZ);
        ball.velocity.x = this.config.ballInitVelocity * (0.5 - Math.random()) * 0.1;
        ball.velocity.y = this.config.ballInitVelocity * (0.5 - Math.random()) * 0.1;
        ball.velocity.z = this.config.ballInitVelocity * 2.0;
        ball.angularVelocity.x = 0;
        ball.angularVelocity.y = 0;
        ball.angularVelocity.z = 0;
        break;
      case PRESET.PINGPONG:
        ball.position.set(0, 1.6, this.config.boxPositionZ - this.config.boxDepth * 0.4);
        ball.velocity.x = this.config.ballInitVelocity * (0.5 - Math.random()) * 0.5;
        ball.velocity.y = this.config.ballInitVelocity * 1.0;
        ball.velocity.z = this.config.ballInitVelocity * 3.0;
        ball.angularVelocity.x = 0;
        ball.angularVelocity.y = 0;
        ball.angularVelocity.z = 0;
        break;
      default:
        break;
    }
  }

  predictCollisions(ball, paddle, net) {

    // predict ball position in the next frame
    this.raycaster.set(ball.position.clone(), ball.velocity.clone().unit());
    this.raycaster.far = ball.velocity.clone().length() / 50;

    // the raycaster only intersects visible objects, so if the net is invisible
    // in non-pingpong-mode, it wont get an intersection
    let arr = this.raycaster.intersectObjects([paddle, net]);
    if (arr.length) {
      ball.position.copy(arr[0].point);
    }
  }

  setMode(mode) {
    this.config.mode = mode;
  }

  step(delta) {
    this.world.step(delta);
  }
}
