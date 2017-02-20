import {Mesh, MeshBasicMaterial, TextGeometry} from 'three';

const FONT_SIZE = 0.4;

export default class Countdown {
  constructor(scene, config, font) {
    this.scene = scene;
    this.font = font;
    this.config = config;

    const material = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
    });
    const geometry = new TextGeometry('5', {
      font: this.font,
      size: FONT_SIZE,
      height: 0.001,
      curveSegments: 3,
    });
    geometry.computeBoundingBox();
    this.countdown = new Mesh(geometry, material);
    this.countdown.position.x = -geometry.boundingBox.max.x / 2;
    this.countdown.position.y = this.config.tableHeight + 0.2;
    this.countdown.position.z = this.config.tablePositionZ + 0.5;
    this.scene.add(this.countdown);
  }

  setCountdown(n) {
    const geometry = new TextGeometry(n, {
      font: this.font,
      size: FONT_SIZE,
      height: 0.001,
      curveSegments: 3,
    });
    geometry.computeBoundingBox();
    this.countdown.geometry = geometry;
    this.countdown.position.x = -geometry.boundingBox.max.x / 2;
    this.countdown.position.y = this.config.tableHeight + 0.4;
  }

  showCountdown() {
    this.setCountdown(5);
    this.countdown.visible = true;
  }

  hideCountdown() {
    this.countdown.visible = false;
  }
}
