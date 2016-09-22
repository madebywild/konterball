import Button from './button';
import TweenMax from 'gsap';
import ScoreDisplay from './score-display';
import {PRESET_NAMES} from './constants';

export default class Hud {
  constructor(scene, config, emitter) {
    this.config = config;
    this.emitter = emitter;
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
    fontloader.load('fonts/atari-small.json', font => {
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

    this.buttons.push(new Button(this.container, this.font, 'Normal Mode', -0.7, 0));
    this.buttons.push(new Button(this.container, this.font, 'Ping Pong', 0, 0));
    this.buttons.push(new Button(this.container, this.font, 'Insane Mode', +0.7, -0));
    this.initialized = true;

    this.scoreDisplay = new ScoreDisplay(this.scene, this.font);
  }

  cameraRayUpdated(raycaster) {
    return;
    if (!this.initialized) return;
    let intersections = raycaster.intersectObjects(this.buttons.map(b => b.hitbox), false);
    if (intersections.length) {
      let button = intersections[0].object;
      if ((!this.activateTween || !this.activateTween.isActive())
          && !this.modeWasSelected
          && (!this.activeButton || this.activeButton.uuid !== button.uuid)
        ) {
        this.focusedButton = button;
        let no = {
          opacity: 0.5,
        };

        this.activateTween = TweenMax.to(no, 0.5, {
          opacity: 1,
          onUpdate: () => {
            button.parent.children.forEach(child => {
              // console.log('setting opacity: ' + no.opacity);
              child.material.opacity = no.opacity;
            });
          },
          onComplete: () => {
            if (this.activeButton) {
              this.activeButton.parent.children.forEach(child => {
                child.material.opacity = 1;
              });
            }
            this.activeButton = button;
            this.modeWasSelected = true;
            this.emitter.emit(EVENT.PRESET_CHANGED);
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
