import TweenMax from 'gsap';
import {INITIAL_CONFIG} from './constants';

export default class Button {
  constructor(parent, font, name, x, y) {
    this.font = font;
    this.parent = parent;
    this.name = name;
    this.button = null;
    this.text = null;

    this.buttonGroup = new THREE.Group();
    this.buttonWidth = 0.4;
    this.buttonHeight = 0.3;
    this.borderWidth = 0.02;
    this.makeButton(x, y);
    this.tween = null;
  }

  makeButton(x, y) {
    const borderColor = 0xFFFFFF;

    let material = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      side: THREE.DoubleSide,
      opacity: this.name === 'Normal Mode' ? 1 : 0.5,
      transparent: true,
    });
    let geometry = new THREE.PlaneGeometry(this.buttonWidth, this.borderWidth);
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = this.buttonHeight / 2 - this.borderWidth / 2;
    this.buttonGroup.add(mesh);

    geometry = new THREE.PlaneGeometry(this.buttonWidth, this.borderWidth);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = -this.buttonHeight / 2 + this.borderWidth / 2;
    this.buttonGroup.add(mesh);

    geometry = new THREE.PlaneGeometry(this.borderWidth, this.buttonHeight - this.borderWidth * 2);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = -this.buttonWidth / 2 + this.borderWidth / 2;
    this.buttonGroup.add(mesh);

    geometry = new THREE.PlaneGeometry(this.borderWidth, this.buttonHeight - this.borderWidth * 2);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = this.buttonWidth / 2 - this.borderWidth / 2;
    this.buttonGroup.add(mesh);



    geometry = new THREE.PlaneGeometry(this.buttonWidth, this.buttonHeight);
    material = new THREE.MeshBasicMaterial({color: 0x000000, transparent: true});
    this.hitbox = new THREE.Mesh(geometry, material);
    this.hitbox.position.z = -0.001;
    this.buttonGroup.add(this.hitbox);


    this.buttonGroup.position.x = x;
    this.buttonGroup.position.y = y;

    this.buttonGroup._name = this.name;

    this.setupText();
    this.parent.add(this.buttonGroup);
  }

  setupText() {
    let material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: this.name === 'Normal Mode' ? 1 : 0.5,
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
    this.text.position.z = 0.01;
    this.buttonGroup.add(this.text);
  }
}
