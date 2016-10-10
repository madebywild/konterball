import {MODE} from './constants';

export default class Physics {
  constructor(config, ballPaddleCollisionCallback) {

    // config
    this.config = config;

    this.world = null;
    this.ball = null;
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
    this.world = new CANNON.World();
    this.world.gravity.set(0, -this.config.gravity, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 20;
    this.setupTable();
    this.setupPaddle();
    this.setupNet();
    this.setupGround();
  }

  setupGround() {
    this.ground = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: new CANNON.Material(),
    });
    this.ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    this.world.add(this.ground);
  }

  setupNet() {
    this.net = new CANNON.Body({
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
    this.net._name = 'NET';
    this.net.position.set(
      0,
      this.config.tableHeight + this.config.netHeight / 2,
      this.config.tablePositionZ
    );
    this.world.add(this.net);
  }

  setupPaddle() {
    this.paddle = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(this.config.paddleSize, this.config.paddleSize, this.config.paddleThickness, 10),
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

  setupTable() {
    this.table = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.config.tableWidth / 2,
          this.config.tableHeight / 2,
          this.config.tableDepth / 2
        )
      ),
      material: new CANNON.Material(),
    });
    this.table.position.y = this.config.tableHeight / 2;
    this.table.position.z = this.config.tablePositionZ;
    this.world.add(this.table);
  }

  addBall(threeReference) {
    let ball = new CANNON.Body({
      mass: this.config.ballMass,
      shape: new CANNON.Sphere(this.config.ballRadius),
      material: new CANNON.Material(),
    });

    ball.threeReference = threeReference;
    ball._name = threeReference.name;
    ball.linearDamping = 0.1;

    this.addContactMaterial(ball.material, this.paddle.material, 0.99, 0.7);
    this.addContactMaterial(ball.material, this.table.material, 0.7, 0.3);

    ball.position.y = this.config.tableHeight / 2;
    ball.position.z = this.config.tablePositionZ;
    this.ball = ball;
    this.world.add(ball);
    this.initBallPosition(ball);
    return ball;
  }

  setBallBoxBounciness(val) {
    this.leftBounce.restitution = val;
    this.topBounce.restitution = val;
    this.rightBounce.restitution = val;
    this.bottomBounce.restitution = val;
    this.frontBounce.restitution = val;
  }

  paddleCollision(e) {
    this.ballPaddleCollisionCallback(e.body.position, e.body);
    console.log('collision');

    let hitpointX = e.body.position.x - e.target.position.x;
    let hitpointY = e.body.position.y - e.target.position.y;
    // normalize to -1 to 1
    hitpointX = hitpointX / (this.config.paddleSize / 2);
    hitpointY = hitpointY / (this.config.paddleSize / 2);

    e.body.velocity.z = 5;
    e.body.velocity.x = hitpointX * e.body.velocity.z * 0.7;
    e.body.velocity.y = 1 + hitpointY * e.body.velocity.z * 0.5;
  }

  setPaddlePosition(x, y, z) {
    this.paddle.position.set(x, y, z);
  }

  initBallPosition() {
    this.ball.position.set(0, 1.6, this.config.tablePositionZ - this.config.tableDepth * 0.3);
    this.ball.velocity.x = this.config.ballInitVelocity * (0.5 - Math.random()) * 0.5;
    this.ball.velocity.y = this.config.ballInitVelocity * 1.0;
    this.ball.velocity.z = this.config.ballInitVelocity * 2.5;
    this.ball.angularVelocity.x = 0;
    this.ball.angularVelocity.y = 0;
    this.ball.angularVelocity.z = 0;
  }

  predictCollisions(ball, paddle, net) {
    // predict ball position in the next frame
    this.raycaster.set(this.ball.position.clone(), this.ball.velocity.clone().unit());
    this.raycaster.far = this.ball.velocity.clone().length() / 50;

    let arr = this.raycaster.intersectObjects([paddle, net]);
    if (arr.length) {
      this.ball.position.copy(arr[0].point);
    }
  }

  setMode(mode) {
    this.config.mode = mode;
  }

  step(delta) {
    this.world.step(delta);
  }
}
