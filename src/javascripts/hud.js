import Button from './button';
import TweenMax from 'gsap';
import {PRESET_NAMES} from './constants';

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
    this.activateTween = null;
    this.buttons = [];
    this.activeButton = null;
    this.focusedButton = null;

    this.font = null;
    this.container = null;
    this.initalized = false;
    this.modeWasSelected = false;

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

    this.buttons.push(new Button(this.container, this.font, PRESET_NAMES.STANDARD, -0.4, 0.3));
    this.buttons.push(new Button(this.container, this.font, PRESET_NAMES.HUGE_BALLS, -0.4, 0));
    this.buttons.push(new Button(this.container, this.font, PRESET_NAMES.CRAZY, -0.4, -0.3));
    this.buttons.push(new Button(this.container, this.font, PRESET_NAMES.TENNIS, +0.4, 0.3));
    this.buttons.push(new Button(this.container, this.font, PRESET_NAMES.GRAVITY, +0.4, 0));
    this.buttons.push(new Button(this.container, this.font, PRESET_NAMES.SLOWMOTION, +0.4, -0.3));
    this.initialized = true;
  }

  cameraRayUpdated(raycaster) {
    if (!this.initialized) return;
    let intersections = raycaster.intersectObjects(this.buttons.map(b => b.button), false);
    if (intersections.length) {
      let button = intersections[0].object;
      if (button._name === PRESET_NAMES.CRAZY || button._name === PRESET_NAMES.TENNIS) return;
      if ((!this.activateTween || !this.activateTween.isActive())
          && !this.modeWasSelected
          && (!this.activeButton || this.activeButton.uuid !== button.uuid)
        ) {
        this.focusedButton = button;
        this.activateTween = TweenMax.to(button.material, 0.5, {
          opacity: 1,
          onComplete: () => {
            if (this.activeButton) {
              this.activeButton.material.opacity = 0.3;
            }
            this.activeButton = button;
            this.modeWasSelected = true;
            let event = new Event('presetChange');
            event.preset = button._name;
            document.getElementsByTagName('body')[0].dispatchEvent(event);
          },
        });
      }
    } else {
      this.modeWasSelected = false;
      if (this.activateTween && this.activateTween.isActive()) {
        // kill tween and reset button states
        this.activateTween.kill();
        this.focusedButton.material.opacity = 0.3;
      }
    }
  }
}
