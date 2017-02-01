import {
  DoubleSide,
  TextureLoader,
  PlaneGeometry,
  Mesh,
  MeshBasicMaterial,
  TextGeometry,
  Group,
} from 'three';
import {Power0, TimelineMax} from 'gsap';
import {EVENT} from '../constants';

const root = `${location.protocol}//${location.host}`;

export default class Button {
  constructor(parent, font, name, x, y, emitter) {
    this.font = font;
    this.emitter = emitter;
    this.parent = parent;
    this.name = name;
    this.button = null;
    this.text = null;
    this.loader = new TextureLoader();
    this.loader.setPath('/textures/');

    this.buttonGroup = new Group();
    if (this.name === 'restart') {
      this.buttonWidth = 0.4;
    } else if (this.name === 'exit') {
      this.buttonWidth = 0.3;
    } else {
      this.buttonWidth = 0.2;
    }
    this.buttonHeight = 0.2;
    this.borderWidth = 0.01;
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

    if (this.name !== 'exit' && this.name !== 'restart') {
      geometry = new PlaneGeometry(this.buttonWidth, this.buttonHeight);
      material = new MeshBasicMaterial({transparent: true, opacity: 1});
      this.logo = new Mesh(geometry, material);
      this.logo.position.z = -0.006;
      this.buttonGroup.add(this.logo);
    }

    geometry = new PlaneGeometry(this.buttonWidth, this.buttonHeight);
    material = new MeshBasicMaterial({transparent: true, opacity: 0});
    this.hitbox = new Mesh(geometry, material);
    this.hitbox.position.z = -0.001;
    // eslint-disable-next-line
    this.hitbox._name = this.name;
    this.buttonGroup.add(this.hitbox);

    this.buttonGroup.position.x = x;
    this.buttonGroup.position.y = y;


    switch (this.name) {
      case 'google':
        this.logo.material.map = this.loader.load('google.png');
        break;
      case 'facebook':
        this.logo.material.map = this.loader.load('facebook.png');
        break;
      case 'twitter':
        this.logo.material.map = this.loader.load('twitter.png');
        break;
      default:
        this.setupText();
    }
    this.parent.add(this.buttonGroup);
  }

  setupText() {
    const material = new MeshBasicMaterial({
      color: 0xffffff,
    });
    const geometry = new TextGeometry(this.name.toUpperCase(), {
      font: this.font,
      size: 0.04,
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
      case 'google': {
        let googleUrl = 'https://plus.google.com/share?url=';
        googleUrl += encodeURIComponent('http://pong.wild.plus');
        window.open(googleUrl);
        break;
      }
      case 'facebook': {
        let fbUrl = 'https://www.facebook.com/dialog/feed?';
        fbUrl += `&link=${encodeURIComponent(root)}`;
        fbUrl += '&app_id=674070926074386';
        window.open(fbUrl);
        break;
      }
      case 'twitter': {
        let twitterUrl = 'http://twitter.com/intent/tweet?status=';
        twitterUrl += encodeURIComponent(root);
        window.open(twitterUrl);
        break;
      }
      default: {
        // eslint-disable-next-line
        console.error('unknown button');
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
