export const MODE = {
  MULTIPLAYER: 'MULTIPLAYER',
  SINGLEPLAYER: 'SINGLEPLAYER',
};

export const STATE = {
  PRELOADER: 'PRELOADER',
  MODE_SELECTION: 'MODE_SELECTION',
  ROOM_URL_DISPLAY: 'ROOM_URL_DISPLAY',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
  COUNTDOWN: 'COUNTDOWN',
  PAUSED: 'PAUSED',
};

export const EVENT = {
  OPPONENT_CONNECTED: 'OPPONENT_CONNECTED',
  OPPONENT_DISCONNECTED: 'OPPONENT_DISCONNECTED',
  GAME_OVER: 'GAME_OVER',
  RESTART_GAME: 'RESTART_GAME',
  RESTART_BUTTON_PRESSED: 'RESTART_BUTTON_PRESSED',
  EXIT_BUTTON_PRESSED: 'EXIT_BUTTON_PRESSED',
  BALL_TABLE_COLLISION: 'BALL_TABLE_COLLISION',
  BALL_PADDLE_COLLISION: 'BALL_PADDLE_COLLISION',
  BALL_NET_COLLISION: 'BALL_NET_COLLISION',
  INIT_BALL: 'INIT_BALL',
  LOAD_PROGRESS: 'LOAD_PROGRESS',
};

export const ACTION = {
  MOVE: 'M',
  HIT: 'HIT',
  MISS: 'MISS',
  PING: 'PING',
  PONG: 'PONG',
  CONNECT: 'CONNECT',
  DISCONNECT: 'DISCONNECT',
  RESTART_GAME: 'RESTART_GAME',
  REQUEST_COUNTDOWN: 'REQUEST_COUNTDOWN',
};

export const INITIAL_CONFIG = {
  mode: MODE.SINGLEPLAYER,
  gravity: 6,
  netThickness: 0.02,
  tableWidth: 1.52,
  tableDepth: 2.74,
  tableHeight: 0.76,
  netHeight: 0.15,
  tablePositionZ: -2,
  tableThickness: 0.1,
  paddleThickness: 0.01,
  paddleSize: 0.16 / 1.5,
  get paddlePositionZ() {
    return this.tablePositionZ
      + this.tableDepth / 2
      + this.paddleThickness / 2;
  },
  ballRadius: 0.02,
  ballMass: 0.001,
  ballPaddleFriction: 0.8,
  ballPaddleBounciness: 1,
  ballBoxBounciness: 0.95,
  ballInitVelocity: 1,
  paddleModel: 'box',
  cameraHeight: 1.6,
  startLives: 5,
  state: STATE.PRELOADER,
  POINTS_FOR_WIN: 11,
  ROOM_CODE_LENGTH: 4,
  colors: {
    PINK_TABLE: 0xFAB0B1,
    PINK_TABLE_UPWARDS: 0xF9A3A4,
    BLUE_TABLE: 0x2B689C,
    GREEN_TABLE: 0x55CC8F,

    PINK_CLEARCOLOR: 0xf29191,
    GREEN_CLEARCOLOR: 0x1f8e61,
    BLUE_CLEARCOLOR: 0x0d375c,

    PADDLE_COLOR: 0xda2928,
    PADDLE_SIDE_COLOR: 0xc12425,
    PADDLE_WOOD_COLOR: 0xf1eee7,
    PADDLE_WOOD_SIDE_COLOR: 0xd8d5d2,

    BALL: 0xF9FC56,
  },
};
