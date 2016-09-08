import dat from 'dat-gui';

class PingPong {
  constructor() {
  }
}

let app = {
  renderer: null,
  scene: null,
  camera: null,
  controls: null,
  controller: null,
  effect: null,
  loader: null,
  skybox: null,
  display: null,
  manager: null,
  font: null,
  gamePad: null,
  controller1: null,
  controller2: null,
  raycaster: null,
  paddlePlane: null,
  controlMode: 'pan',
  controllerRay: null,
  points: 0,
  pointsDisplay: null,
  table: null,
  net: null,
  ballTexture: null,
  canvasDOM: document.querySelector('canvas'),
  seconds: 0,
  ballGroundContact: null,
  ballTableContact: null,
  tabActive: true,
  ballPaddleContact: null,
  balls: [],
  cameraHeight: 1.2,
  lastPaddlePosition: null,

  CCD_EPSILON: 0.2,

  cannon: {
    world: null,
    balls: [],
    net: null,
    ground: null,
    paddlePlayer: null,
    paddleEnemy: null,
    table: null,
  },

  // config
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
  colors: {
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
  },

  // boxZBounds: -(app.boxSize.depth - 1),
  boxZBounds: 0,

  totaltime: 0,
  lastRender: 0,

}

app.setup();
