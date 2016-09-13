export default class Physics {
  constructor(config) {

    // config
    // TODO 
    this.config = config;
  }

  setupAmmo() {
  }

  setupWorld() {
    // world
    this.cannon.world = new CANNON.World();
    this.cannon.world.gravity.set(0, -this.config.gravity, 0);
    this.cannon.world.broadphase = new CANNON.NaiveBroadphase();
    this.cannon.world.solver.iterations = 20;
    this.setupGround();
    this.setupTable();
    this.setupNet();
    this.setupPaddle();
  }

  setupGround(){
    // ground
    this.cannon.ground = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: new CANNON.Material(),
    });
    this.cannon.ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    this.cannon.world.add(this.cannon.ground);
  }

  setupTable() {
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
    this.cannon.tableHalfPlayer.addEventListener("collide", this.tableCollision.bind(this));
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
    this.cannon.tableHalfEnemy.addEventListener("collide", this.tableCollision.bind(this));
    this.cannon.world.add(this.cannon.tableHalfEnemy);
  }

  setupNet() {
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
  }

  setupPaddle() {
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


  initBallPosition() {
  }

  getBallPosition() {
  }

  step(delta) {
    this.world.stepSimulation(delta/1000, 10);
  }
}
