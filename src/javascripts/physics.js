import {MODE, EVENT} from './constants';
import {cap} from './util/helpers';
import Util from './webvr-manager/util';

export default class Physics {
  constructor(config, emitter) {
    // config
    this.config = config;
    this.emitter = emitter;

    this.world = null;
    this.ball = null;
    this.net = null;
    this.ground = null;
    this.paddle = null;
    this.ballNetContact = null;
    this.ballGroundContact = null;
    this.ballPaddleContact = null;
    this.raycaster = new THREE.Raycaster();
    this.isMobile = Util.isMobile();
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
    return;
    this.paddle = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(
        this.config.paddleSize,
        this.config.paddleSize,
        this.config.paddleThickness,
        10
      ),
      material: new CANNON.Material(),
    });
    this.paddle._name = 'PADDLE';
    this.paddle.position.set(0, 1, this.config.paddlePositionZ);
    this.paddle.collisionResponse = 0;
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
    this.table._name = 'table-2-player';
    this.table.addEventListener('collide', this.tableCollision.bind(this));
    this.world.add(this.table);

    this.upwardsTable = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.config.tableWidth / 2,
          this.config.tableHeight / 2,
          this.config.tableDepth / 4
        )
      ),
      material: new CANNON.Material(),
    });
    this.upwardsTable.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), Math.PI / 2);
    this.upwardsTable.position.z = this.config.tablePositionZ - this.config.tableHeight / 2;
    this.upwardsTable.position.y = this.config.tableHeight + this.config.tableDepth / 4;
    this.upwardsTable.collisionResponse = 0;
    this.upwardsTable.addEventListener('collide', this.tableCollision.bind(this));
    this.world.add(this.upwardsTable);
  }

  addBall() {
    if (this.ball) return;
    let ball = new CANNON.Body({
      mass: this.config.ballMass,
      shape: new CANNON.Sphere(this.config.ballRadius),
      material: new CANNON.Material(),
    });

    ball.linearDamping = 0.1;

    this.addContactMaterial(ball.material, this.table.material, 0.7, 0.3);
    this.addContactMaterial(ball.material, this.upwardsTable.material, 0.7, 0.3);

    ball.position.y = this.config.tableHeight / 2;
    ball.position.z = this.config.tablePositionZ;
    this.ball = ball;
    this.world.add(ball);
    this.initBallPosition();
  }

  paddleCollision(e) {
    this.emitter.emit(EVENT.BALL_PADDLE_COLLISION, e.body);

    let hitpointX = e.body.position.x - e.target.position.x;
    let hitpointY = e.body.position.y - e.target.position.y;
    // normalize to -1 to 1
    hitpointX = cap(hitpointX / this.config.paddleSize, -1, 1);
    hitpointY = cap(hitpointY / this.config.paddleSize, -1, 1);

    if (this.config.mode === MODE.MULTIPLAYER) {
      e.body.velocity.z = -3.5;
      // make aiming a little easier on mobile
      if (this.isMobile) {
        e.body.velocity.x = -hitpointX * e.body.velocity.z * 0.1;
      } else {
        e.body.velocity.x = -hitpointX * e.body.velocity.z * 0.4;
      }
      e.body.velocity.y = 2;
    } else {
      let distFromCenter = e.target.position.x / this.config.tableWidth * 0.5;
      e.body.velocity.z = -3.5;
      // make aiming a little easier on mobile
      if (this.isMobile) {
        e.body.velocity.x = (-distFromCenter * 1.2) - (hitpointX * e.body.velocity.z * 0.2);
      } else {
        e.body.velocity.x = (-distFromCenter * 1.2) - (hitpointX * e.body.velocity.z * 0.3);
      }
      e.body.velocity.y = 2;
    }
  }

  tableCollision(e) {
    this.emitter.emit(EVENT.BALL_TABLE_COLLISION, e.body, e.target);
  }

  setPaddlePosition(x, y, z) {
    this.paddle.position.set(x, y, z);
  }

  initBallPosition() {
    if (this.config.mode === MODE.SINGLEPLAYER) {
      this.ball.position.set(0, 1.4, this.config.tablePositionZ + 0.1);
      this.ball.velocity.x = this.config.ballInitVelocity * (0.5 - Math.random()) * 0.5;
      this.ball.velocity.y = this.config.ballInitVelocity * 0.0;
      this.ball.velocity.z = this.config.ballInitVelocity * 2;
      this.ball.angularVelocity.x = 0;
      this.ball.angularVelocity.y = 0;
      this.ball.angularVelocity.z = 0;
    } else {
      this.ball.position.set(0, 1.6, this.config.tablePositionZ - this.config.tableDepth * 0.3);
      this.ball.velocity.x = this.config.ballInitVelocity * (0.5 - Math.random()) * 0.5;
      this.ball.velocity.y = this.config.ballInitVelocity * 0.7;
      this.ball.velocity.z = this.config.ballInitVelocity * 2.5;
      this.ball.angularVelocity.x = 0;
      this.ball.angularVelocity.y = 0;
      this.ball.angularVelocity.z = 0;
    }
  }

  predictCollisions(ball, paddle, net) {
    // predict ball position in the next frame
    this.raycaster.set(this.ball.position.clone(), this.ball.velocity.clone().unit());
    // divide by 50 at 60fps so we dont accidentally miss the frame
    this.raycaster.far = this.ball.velocity.clone().length() / 50;

    let arr = this.raycaster.intersectObjects([paddle, net], true);
    if (arr.length) {
      if (arr[0].object.name === 'net-collider') {
        this.ball.position.copy(arr[0].point);
      } else {
        // this.paddleCollision({
        //   body: this.ball,
        //   target: this.paddle,
        // });
      }
    }
  }

  setMode(mode) {
    this.config.mode = mode;
  }

  step(delta) {
    this.world.step(delta);
  }
}
