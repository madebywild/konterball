import {
  DoubleSide,
  PlaneGeometry,
  Mesh,
  MeshBasicMaterial,
  TextGeometry,
  Group,
} from 'three';
import {Power0, TimelineMax} from 'gsap';
import {EVENT, INITIAL_CONFIG} from '../constants';

export default class Button {
  constructor(parent, font, name, x, y, emitter, width = 0.4, height = 0.2, borderWidth = 0.01, fontSize = 0.04) {
    this.font = font;
    this.emitter = emitter;
    this.parent = parent;
    this.name = name;
    this.button = null;
    this.text = null;
    this.fontSize = fontSize;

    this.buttonGroup = new Group();
    this.buttonGroup.name = name;
    this.buttonWidth = width;
    this.buttonHeight = height;
    this.borderWidth = borderWidth;
    this.makeButton(x, y);
    this.borderAnimation();
  }

  makeButton(x, y) {
    let material = new MeshBasicMaterial({
      color: 0xFFFFFF,
      side: DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    let geometry = new PlaneGeometry(this.buttonWidth, this.borderWidth);
    let mesh = new Mesh(geometry, material);
    mesh.position.y = this.buttonHeight / 2 - this.borderWidth / 2;
    this.buttonGroup.add(mesh);

    geometry = new PlaneGeometry(this.buttonWidth, this.borderWidth);
    mesh = new Mesh(geometry, material);
    mesh.position.y = -this.buttonHeight / 2 + this.borderWidth / 2;
    this.buttonGroup.add(mesh);

    geometry = new PlaneGeometry(this.borderWidth, this.buttonHeight - this.borderWidth * 2);
    mesh = new Mesh(geometry, material);
    mesh.position.x = -this.buttonWidth / 2 + this.borderWidth / 2;
    this.buttonGroup.add(mesh);

    geometry = new PlaneGeometry(this.borderWidth, this.buttonHeight - this.borderWidth * 2);
    mesh = new Mesh(geometry, material);
    mesh.position.x = this.buttonWidth / 2 - this.borderWidth / 2;
    this.buttonGroup.add(mesh);

    const animationGroup = new Group();
    material = new MeshBasicMaterial({
      color: 0xFFFFFF,
      side: DoubleSide,
    });
    geometry = new PlaneGeometry(this.buttonWidth, this.borderWidth);
    this.topAnimationBorder = new Mesh(geometry, material);
    geometry.translate(this.buttonWidth / 2, 0, 0);
    this.topAnimationBorder.position.x = -this.buttonWidth / 2;
    this.topAnimationBorder.position.y = this.buttonHeight / 2 - this.borderWidth / 2;
    this.topAnimationBorder.scale.x = 0.001;
    animationGroup.add(this.topAnimationBorder);

    geometry = new PlaneGeometry(this.buttonWidth, this.borderWidth);
    this.bottomAnimationBorder = new Mesh(geometry, material);
    geometry.translate(-this.buttonWidth / 2, 0, 0);
    this.bottomAnimationBorder.position.x = this.buttonWidth / 2;
    this.bottomAnimationBorder.position.y = -this.buttonHeight / 2 + this.borderWidth / 2;
    this.bottomAnimationBorder.scale.x = 0.001;
    animationGroup.add(this.bottomAnimationBorder);

    geometry = new PlaneGeometry(this.borderWidth, this.buttonHeight - this.borderWidth * 2);
    this.leftAnimationBorder = new Mesh(geometry, material);
    geometry.translate(0, this.buttonHeight / 2 - this.borderWidth, 0);
    this.leftAnimationBorder.position.y = -(this.buttonHeight / 2 - this.borderWidth);
    this.leftAnimationBorder.position.x = -this.buttonWidth / 2 + this.borderWidth / 2;
    this.leftAnimationBorder.scale.y = 0.001;
    animationGroup.add(this.leftAnimationBorder);

    geometry = new PlaneGeometry(this.borderWidth, this.buttonHeight - this.borderWidth * 2);
    this.rightAnimationBorder = new Mesh(geometry, material);
    geometry.translate(0, -(this.buttonHeight / 2 - this.borderWidth), 0);
    this.rightAnimationBorder.position.y = this.buttonHeight / 2 - this.borderWidth;
    this.rightAnimationBorder.position.x = this.buttonWidth / 2 - this.borderWidth / 2;
    this.rightAnimationBorder.scale.y = 0.001;
    animationGroup.add(this.rightAnimationBorder);
    animationGroup.position.z = 0.002;

    this.buttonGroup.add(animationGroup);

    geometry = new PlaneGeometry(this.buttonWidth, this.buttonHeight);
    material = new MeshBasicMaterial({transparent: true, opacity: 0});
    this.hitbox = new Mesh(geometry, material);
    this.hitbox.position.z = -0.001;
    // eslint-disable-next-line
    this.hitbox._name = this.name;
    this.buttonGroup.add(this.hitbox);

    this.buttonGroup.position.x = x;
    this.buttonGroup.position.y = y;

    this.setupText();
    this.parent.add(this.buttonGroup);
  }

  setupText() {
    const material = new MeshBasicMaterial({
      color: 0xffffff,
    });
    const geometry = new TextGeometry(this.name.toUpperCase(), {
      font: this.font,
      size: this.fontSize,
      height: 0.001,
      curveSegments: 3,
    });
    geometry.computeBoundingBox();
    this.text = new Mesh(geometry, material);
    this.text.position.x = -geometry.boundingBox.max.x / 2;
    this.text.position.y = -geometry.boundingBox.max.y / 2;
    this.text.position.z = 0.01;
    this.buttonGroup.add(this.text);
  }

  borderAnimation() {
    this.timeline = new TimelineMax({paused: true});
    const ease = Power0.easeNone;
    const duration = 2;
    const circumference = 2 * this.buttonWidth + 2 * this.buttonHeight;
    this.timeline.to(this.topAnimationBorder.scale, duration * (this.buttonWidth / circumference), {
      ease,
      x: 1,
    });
    this.timeline.to(this.rightAnimationBorder.scale, duration * (this.buttonHeight / circumference), {
      ease,
      y: 1,
    });
    this.timeline.to(this.bottomAnimationBorder.scale, duration * (this.buttonWidth / circumference), {
      ease,
      x: 1,
    });
    this.timeline.to(this.leftAnimationBorder.scale, duration * (this.buttonHeight / circumference), {
      ease,
      y: 1,
    });
    this.timeline.call(this.emit.bind(this));
  }

  setText(text) {
    const geometry = new TextGeometry(text.toUpperCase(), {
      font: this.font,
      size: this.fontSize,
      height: 0.001,
      curveSegments: 3,
    });
    geometry.computeBoundingBox();
    this.text.geometry = geometry;
    this.text.position.x = -geometry.boundingBox.max.x / 2;
    this.text.position.y = -geometry.boundingBox.max.y / 2;
    this.text.position.z = 0.01;
  }

  emit() {
    this.timeline.pause();
    this.timeline.seek(0);
    document.body.style.cursor = 'initial';
    switch (this.name) {
      case 'restart':
        this.emitter.emit(EVENT.RESTART_BUTTON_PRESSED);
        break;
      case 'exit':
        this.emitter.emit(EVENT.EXIT_BUTTON_PRESSED);
        break;
      case INITIAL_CONFIG.rainbowText:
        this.emitter.emit(EVENT.TOGGLE_RAINBOW_MODE);
        break;
      default: {
        console.warn('unknown button');
      }
    }
  }

  mouseEnter() {
    // hover effect
    document.body.style.cursor = 'pointer';
    this.rightAnimationBorder.scale.y = 1;
    this.leftAnimationBorder.scale.y = 1;
    this.topAnimationBorder.scale.x = 1;
    this.bottomAnimationBorder.scale.x = 1;
  }

  mouseLeave() {
    document.body.style.cursor = 'initial';
    this.rightAnimationBorder.scale.y = 0.001;
    this.leftAnimationBorder.scale.y = 0.001;
    this.topAnimationBorder.scale.x = 0.001;
    this.bottomAnimationBorder.scale.x = 0.001;
  }

  enter() {
    this.timeline.play(0);
  }

  leave() {
    this.timeline.pause();
    this.timeline.seek(0);
  }
}
