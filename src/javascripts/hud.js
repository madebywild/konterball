import Button from './button';

export default class Hud {
  constructor(scene, config) {
    this.config = config;
    this.scene = scene;
    this.gravity = 0;
    this.ballRadius = 0.03;
    this.ballPaddleBounciness = 1;
    this.ballBoxBounciness = 1;
    this.ballInitVelocity = 1;
    this.paddleModel = 'box';

    this.container = null;

    this.loadFont();
  }

  loadFont() {
    let fontloader = new THREE.FontLoader();
    fontloader.load('lib/helvetiker_bold.typeface.js', font => {
      this.font = font;
      this.setup();
    });
  }


  setup() {
    this.container = new THREE.Group();
    this.container.position.z = 1;
    this.container.position.y = 1;
    this.container.rotation.y = Math.PI;
    this.scene.add(this.container);

    this.button1 = new Button(this.container, this.font, 'Preset 1', -0.4, 0.3);
    this.button2 = new Button(this.container, this.font, 'Preset 2', -0.4, 0);
    this.button3 = new Button(this.container, this.font, 'Preset 3', -0.4, -0.3);
    this.button4 = new Button(this.container, this.font, 'Preset 4', +0.4, 0.3);
    this.button5 = new Button(this.container, this.font, 'Preset 5', +0.4, 0);
    this.button6 = new Button(this.container, this.font, 'Preset 6', +0.4, -0.3);
  }

}
