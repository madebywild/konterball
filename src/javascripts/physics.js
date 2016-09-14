import {MODE} from 'constants/modes';

export default class Physics {
  constructor(config, ballPaddleCollisionCallback) {

    // config
    this.config = config;

    this.world = null;
    this.balls = [];
    this.net = null;
    this.ground = null;
    this.paddlePlayer = null;
    this.paddleEnemy = null;
    this.tableHalfPlayer = null;
    this.tableHalfEnemy = null;
    this.ballNetContact = null;
    this.ballGroundContact = null;
    this.ballTablePlayerContact = null;
    this.ballTableEnemyContact = null;
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
    // this.setupGround();
    this.setupBox();
    // this.setupTable();
    // this.setupNet();
    this.setupPaddle();
  }

  setupGround(){
    // ground
    this.ground = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: new CANNON.Material(),
    });
    this.ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    this.world.add(this.ground);
  }

  setupTable() {
    // table
    this.tableHalfPlayer = new CANNON.Body({
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
    this.tableHalfPlayer._name = 'TABLE_HALF_PLAYER';
    this.tableHalfPlayer.position.set(
      0,
      this.config.tableHeight + this.config.tableThickness / 2,
      this.config.tablePositionZ + this.config.tableDepth / 4
    );
    this.world.add(this.tableHalfPlayer);

    this.tableHalfEnemy = new CANNON.Body({
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
    this.tableHalfEnemy._name = 'TABLE_HALF_ENEMY';
    this.tableHalfEnemy.position.set(
      0,
      this.config.tableHeight + this.config.tableThickness / 2,
      this.config.tablePositionZ - this.config.tableDepth / 4
    );
    this.world.add(this.tableHalfEnemy);
  }

  setupNet() {
    // net
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
      this.config.tableHeight + this.config.tableThickness + this.config.netHeight / 2,
      this.config.tablePositionZ
    );
    this.world.add(this.net);
  }

  setupPaddle() {

    // paddle
    this.paddlePlayer = new CANNON.Body({
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
    this.paddlePlayer._name = 'PADDLE';
    this.paddlePlayer.position.set(0, 1, this.config.paddlePositionZ);
    this.paddlePlayer.addEventListener("collide", this.paddleCollision.bind(this));
    this.world.add(this.paddlePlayer);
  }

  addContactMaterial(mat1, mat2, bounce, friction) {
     let contact = new CANNON.ContactMaterial(
      mat1,
      mat2,
      {friction: friction, restitution: bounce}
    );
    this.world.addContactMaterial(contact);
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
      this.config.tablePositionZ
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
      this.config.tablePositionZ
    );
    this.world.add(this.rightWall);

    this.bottomWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.config.boxWidth / 2,
          wallWidth / 2,
          this.config.boxDepth / 2
        )
      ),
      material: new CANNON.Material(),
    });
    this.bottomWall.position.set(
      0,
      -wallWidth / 2,
      this.config.tablePositionZ
    );
    this.world.add(this.bottomWall);

    this.topWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.config.boxWidth / 2,
          wallWidth / 2,
          this.config.boxDepth / 2
        )
      ),
      material: new CANNON.Material(),
    });
    this.topWall.position.set(
      0,
      this.config.boxHeight + wallWidth / 2,
      this.config.tablePositionZ
    );
    this.world.add(this.topWall);

    this.frontWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.config.boxWidth / 2,
          this.config.boxHeight / 2,
          wallWidth / 2
        )
      ),
      material: new CANNON.Material(),
    });
    this.frontWall.position.set(
      0,
      this.config.boxHeight / 2,
      this.config.tablePositionZ - this.config.boxDepth / 2 - wallWidth / 2
    );
    this.world.add(this.frontWall);
  }

  getInactiveBalls() {
    let inactiveBalls = [];
    this.balls.forEach((ball, i) => {
      // if (ball.position.y < 0.3) {
      // TODO
      if (ball.position.z > 1) {
        inactiveBalls.push(i);
      }
    });
    return inactiveBalls;
  }

  addBall() {
    // remove inactive balls
    this.getInactiveBalls().forEach(i => {
      this.world.removeBody(this.balls[i]);
      this.balls[i].removeFlag = true;
    });
    this.balls = this.balls.filter(x => !x.removeFlag);

    this.balls.push(new CANNON.Body({
      mass: this.config.ballMass,
      shape: new CANNON.Sphere(this.config.ballRadius),
      material: new CANNON.Material(),
    }));

    let newBall = this.balls[this.balls.length - 1];
    newBall.name = 'BALL';
    // TODO
    // newBall.linearDamping = 0.4;
    newBall.linearDamping = 0;
    this.world.add(newBall);

    // // contact materials
    // this.ballGroundContact = new CANNON.ContactMaterial(
    //   this.ground.material,
    //   this.balls[this.balls.length - 1].material,
    //   {friction: 0.6, restitution: 0.7}
    // );
    // this.world.addContactMaterial(this.ballGroundContact);

    // // ball - table
    // // player
    // this.ballTablePlayerContact = new CANNON.ContactMaterial(
    //   this.tableHalfPlayer.material,
    //   this.balls[this.balls.length - 1].material,
    //   {friction: this.config.ballTableFriction, restitution: this.config.ballTableBounciness}
    // );
    // this.world.addContactMaterial(this.ballTablePlayerContact);

    // // enemy
    // this.ballTableEnemyContact = new CANNON.ContactMaterial(
    //   this.tableHalfEnemy.material,
    //   this.balls[this.balls.length - 1].material,
    //   {friction: this.config.ballTableFriction, restitution: this.config.ballTableBounciness}
    // );
    // this.world.addContactMaterial(this.ballTableEnemyContact);

    // // ball - paddle
    // this.ballPaddleContact = new CANNON.ContactMaterial(
    //   this.paddlePlayer.material,
    //   this.balls[this.balls.length - 1].material,
    //   {friction: this.config.ballPaddleFriction, restitution: this.config.ballPaddleBounciness}
    // );
    // this.world.addContactMaterial(this.ballPaddleContact);

    // // ball - net
    // this.ballNetContact = new CANNON.ContactMaterial(
    //   this.net.material,
    //   this.balls[this.balls.length - 1].material,
    //   {friction: 0.5, restitution: 0.001}
    // );
    // this.world.addContactMaterial(this.ballNetContact);

    this.addContactMaterial(newBall.material, this.leftWall.material, this.config.ballTableBounciness, 0);
    this.addContactMaterial(newBall.material, this.topWall.material, this.config.ballTableBounciness, 0);
    this.addContactMaterial(newBall.material, this.rightWall.material, this.config.ballTableBounciness, 0);
    this.addContactMaterial(newBall.material, this.bottomWall.material, this.config.ballTableBounciness, 0);
    this.addContactMaterial(newBall.material, this.frontWall.material, this.config.ballTableBounciness, 0);
    this.addContactMaterial(newBall.material, this.paddlePlayer.material, 1, 0);

    this.initBallPosition(newBall);
  }

  paddleCollision(e) {
    if (e.body.name === 'BALL') {

      this.ballPaddleCollisionCallback();

      let hitpointX = e.body.position.x - e.target.position.x;
      let hitpointY = e.body.position.y - e.target.position.y;
      // normalize to -1 to 1
      hitpointX = hitpointX / (this.config.paddleSize / 2);
      hitpointY = hitpointY / (this.config.paddleSize / 2);
      // did we hit the edge of the paddle?
      if (hitpointX > 1 || hitpointX < -1) return;
      if (hitpointY > 1 || hitpointY < -1) return;
      e.body.velocity.x = hitpointX * e.body.velocity.z * 0.7;
      e.body.velocity.y = hitpointY * e.body.velocity.z * 0.7;
      e.body.velocity.z += 0.1;
      return;

      // these values are heavily tweakable
      e.body.velocity.x += hitpointX * 4;
      e.body.velocity.y = hitpointY * 0.7;
      if (this.config.mode === MODE.AGAINST_THE_WALL) {
        e.body.velocity.y = 5;
        e.body.velocity.z = 5;
      } else if (this.config.mode === MODE.HIT_THE_TARGET) {
        e.body.velocity.y *= 2 * e.body.velocity.z;
        e.body.velocity.z = (hitpointY + 0.5) * 7;
      } else {
        e.body.velocity.y *= 2 * e.body.velocity.z;
        e.body.velocity.z *= 4;
      }
    }
  }

  setPaddlePosition(x, y, z) {
    this.paddlePlayer.position.set(x, y, z);
  }

  setBallPositions(balls) {
    this.balls.forEach((ball, index) => {
      balls[index].position.copy(ball.position);
      balls[index].quaternion.copy(ball.quaternion);
    });
  }

  initBallPosition(ball) {
    ball.position.set(0, this.config.boxHeight / 2, this.config.boxDepth * -0.5);
    ball.velocity.x = this.config.ballInitVelocity * (0.5 - Math.random()) * 0.01;
    ball.velocity.y = this.config.ballInitVelocity * (0.5 - Math.random()) * 0.01;
    ball.velocity.z = this.config.ballInitVelocity * 2.0;
    ball.angularVelocity.x = 0;
    ball.angularVelocity.y = 0;
    ball.angularVelocity.z = 0;
    return;
    switch (this.config.mode) {
      case MODE.ONE_ON_ONE:
        ball.position.set(0, 1, this.config.boxDepth * -0.8);
        ball.velocity.x = this.config.ballInitVelocity * (0.5 - Math.random()) * 0.2;
        ball.velocity.y = this.config.ballInitVelocity * 2.5;
        ball.velocity.z = this.config.ballInitVelocity * 6.0;
        ball.angularVelocity.x = 0;
        ball.angularVelocity.y = 0;
        ball.angularVelocity.z = 0;
        break;
      case MODE.TOO_MANY_BALLS:
        ball.position.set(0, 1, this.config.boxDepth * -0.8);
        ball.velocity.x = this.config.ballInitVelocity * (0.5 - Math.random()) * 0.5;
        ball.velocity.y = this.config.ballInitVelocity * 2.5;
        ball.velocity.z = this.config.ballInitVelocity * 6.0;
        ball.angularVelocity.x = 0;
        ball.angularVelocity.y = 0;
        ball.angularVelocity.z = 0;
        break;
      case MODE.HIT_THE_TARGET:
        ball.position.set(0, 1, this.config.boxDepth * -0.5);
        ball.velocity.x = this.config.ballInitVelocity * (0.5 - Math.random()) * 0.2;
        ball.velocity.y = this.config.ballInitVelocity * 2.5;
        ball.velocity.z = this.config.ballInitVelocity * 5.0;
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

  predictCollisions(paddle, net=null, tableHalfPlayer=null, tableHalfEnemy=null) {
    // predict ball position in the next frame (continous collision detection)
    for (let i = 0; i < this.balls.length; i++) {
      // TODO
      if (true || this.balls[i].position.y > 0.3) {
        this.raycaster.set(this.balls[i].position.clone(), this.balls[i].velocity.clone().unit());
        this.raycaster.far = this.balls[i].velocity.clone().length() / 50;

        // TODO add net
        let arr = this.raycaster.intersectObjects([paddle]);
        if (arr.length) {
          this.balls[i].position.copy(arr[0].point);
        }
        /*
        arr = this.raycaster.intersectObjects([tableHalfPlayer, tableHalfEnemy]);

        if (arr.length) {
          if (this.config.mode !== MODE.HIT_THE_TARGET) {
            this.balls[i].position.copy(arr[0].point);
          }
        }
        if (this.config.mode === MODE.HIT_THE_TARGET) {
          let localZ = this.balls[i].position.z - this.config.tablePositionZ;
          let ballIsOverHole = false;
          this.config.holes.forEach(hole => {
            if (Math.sqrt(Math.pow(this.balls[i].position.x - hole.x, 2) + Math.pow(localZ - hole.z, 2)) <= hole.r && this.balls[i].velocity.z < -0) {
              ballIsOverHole = true;
            }
          });
          this.balls[i].collisionResponse = !ballIsOverHole;
        }
        */
      }
    }
  }

  setMode(mode) {
    this.config.mode = mode;
  }

  step(delta) {
    this.world.step(delta);
  }

  getBallPosition() {
  }
}
