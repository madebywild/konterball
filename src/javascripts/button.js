import TweenMax from 'gsap';
import {INITIAL_CONFIG} from './constants';

export default class Button {
  constructor(group, font, name, x, y) {
    this.font = font;
    this.group = group;
    this.name = name;
    this.button = null;
    this.text = null;

    this.buttonGroup = new THREE.Group();
    this.buttonWidth = 0.5;
    this.buttonHeight = 0.2;
    this.makeButton(x, y);
    this.tween = null;
  }

  makeButton(x, y) {
    let geometry = new THREE.PlaneGeometry(this.buttonWidth, this.buttonHeight);
    let material = new THREE.MeshPhongMaterial({
      color: INITIAL_CONFIG.colors.PONG_GREEN_2,
      side: THREE.DoubleSide,
      opacity: 0.3,
      transparent: true,
    });
    this.button = new THREE.Mesh(geometry, material);
    this.button._name = this.name;
    this.buttonGroup.add(this.button);

    this.buttonGroup.position.x = x;
    this.buttonGroup.position.y = y;

    this.setupText();
    this.group.add(this.buttonGroup);
  }

  setupText() {
    let material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: this.name == 'Crazy' || this.name == 'Tennis' ? 0.1 : 0.9,
    });
    let geometry = new THREE.TextGeometry(this.name, {
      font: this.font,
      size: 0.03,
      height: 0.001,
      curveSegments: 3,
    });
    geometry.computeBoundingBox();
    this.text = new THREE.Mesh(geometry, material);
    this.text.position.x = -geometry.boundingBox.max.x / 2;
    this.text.position.y = -geometry.boundingBox.max.y / 2;
    this.buttonGroup.add(this.text);
  }

  /*
  startActiveAnimation(onComplete) {
    this.tween = TweenMax.to(this.button.material, 2, {
      opacity: 1,
      onComplete: () => {
        onComplete();
      },
    });
  }

  resetActiveAnimation() {
    this.tween.kill();
    this.tween = null;
    this.button.material.opacity = 0.3;
  }
  */
}
