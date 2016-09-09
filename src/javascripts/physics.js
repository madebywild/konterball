export default class Physics {
  constructor(config) {
    world = null;
    ball = null;
    transform = null;
    ballInitMotionState = null;

    // config
    // TODO 
    this.config = config;
  }

  setupAmmo() {
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    let overlappingPairCache = new Ammo.btDbvtBroadphase();
    let solver = new Ammo.btSequentialImpulseConstraintSolver();

    this.world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    this.world.setGravity(new Ammo.btVector3(0, -this.config.gravity, 0));

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
    this.world.addRigidBody(body);


    // add table
    let tableShape = new Ammo.btBoxShape(new Ammo.btVector3(this.config.tableWidth, this.config.tableHeight, this.config.tableDepth));
    let tableTransform = new Ammo.btTransform();
    tableTransform.setIdentity();
    tableTransform.setOrigin(new Ammo.btVector3(0, 0, 0));

    localInertia = new Ammo.btVector3(0, 0, 0);
    myMotionState = new Ammo.btDefaultMotionState(tableTransform);
    rbInfo = new Ammo.btRigidBodyConstructionInfo(0, myMotionState, tableShape, localInertia);
    body = new Ammo.btRigidBody(rbInfo);
    body.setRestitution(0.7);
    this.world.addRigidBody(body);


    // add ball
    let ballShape = new Ammo.btSphereShape(this.config.ballRadius);
    let startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(0, 1, -8));

    localInertia = new Ammo.btVector3(0, 0, 0);
    ballShape.calculateLocalInertia(this.config.ballMass, localInertia);
    this.initMotionState = new Ammo.btDefaultMotionState(startTransform);

    rbInfo = new Ammo.btRigidBodyConstructionInfo(this.config.ballMass, this.initMotionState, ballShape, localInertia);
    this.ball = new Ammo.btRigidBody(rbInfo);
    this.ball.setDamping(0.4, 0);
    this.ball.setRestitution(0.9);
    this.world.addRigidBody(this.ball);

    this.trans = new Ammo.btTransform();

    this.initBallPosition();
  }


  initBallPosition() {

    let startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(0, 1, -8));
    let myMotionState = new Ammo.btDefaultMotionState(startTransform);
    this.ball.setMotionState(myMotionState);

    this.ball.setLinearVelocity(new Ammo.btVector3(
      this.config.ballInitVelocity * (0.5 - Math.random()) * 0.2,
      this.config.ballInitVelocity * 2.5,
      this.config.ballInitVelocity * 6.0
    ));

    this.ball.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
  }

  getBallPosition() {
    let trans = new Ammo.btTransform();

    this.ball.getMotionState().getWorldTransform(trans);
    console.log(trans.getOrigin().y());
    return {
      x: trans.getOrigin().x();
      y: trans.getOrigin().y();
      z: trans.getOrigin().z();
    }
  }

  step(delta) {
    this.world.stepSimulation(delta/1000, 10);
  }
}
