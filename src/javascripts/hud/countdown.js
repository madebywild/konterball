import * as THREE from 'three';
import TweenMax from 'gsap';

const FONT_SIZE = 0.7;

export default class Countdown {
  constructor(scene, config, font) {
    this.scene = scene;
    this.font = font;
    this.config = config;

    let material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });
    let geometry = new THREE.TextGeometry('3', {
      font: this.font,
      size: FONT_SIZE,
      height: 0.001,
      curveSegments: 3,
    });
    geometry.computeBoundingBox();
    this.countdown = new THREE.Mesh(geometry, material);
    this.countdown.position.x = -geometry.boundingBox.max.x / 2;
    this.countdown.position.y = this.config.tableHeight + 0.2;
    this.countdown.position.z = this.config.tablePositionZ;
    this.scene.add(this.countdown);
  }

  setCountdown(n) {
    let geometry = new THREE.TextGeometry(n, {
      font: this.font,
      size: FONT_SIZE,
      height: 0.001,
      curveSegments: 3,
    });
    geometry.computeBoundingBox();
    this.countdown.geometry = geometry;
    this.countdown.position.x = -geometry.boundingBox.max.x / 2;
    this.countdown.position.y = this.config.tableHeight + 0.2;
  }

  showCountdown() {
    this.setCountdown(3);
    this.countdown.visible = true;
  }

  hideCountdown() {
    this.countdown.visible = false;
  }
}
