import TweenMax from 'gsap';
import {MODE} from '../constants';

const scoreSpacing = 0.3;

export default class ScoreDisplay {
  constructor(parent, config, font) {
    this.parent = parent;
    this.font = font;
    this.config = config;

    this.setupText();
  }

  setupText() {
    let material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    let geometry = new THREE.TextGeometry('0', {
      font: this.font,
      size: 0.5,
      height: 0.001,
      curveSegments: 3,
    });
    geometry.computeBoundingBox();

    this.opponentScore = new THREE.Mesh(geometry, material);
    this.selfScore = new THREE.Mesh(geometry.clone(), material.clone());

    this.parent.add(this.selfScore);
    this.parent.add(this.opponentScore);

    this.opponentScore.visible = this.config.mode === MODE.MULTIPLAYER;
  }

  resetScorePositions() {
    this.selfScore.position.set(0, 0, 0);
    this.selfScore.rotation.set(0, 0, 0);
    this.opponentScore.position.set(0, 0, 0);
    this.opponentScore.rotation.set(0, 0, 0);
  }

  setSelfScore(value) {
    this.selfScore.geometry = new THREE.TextGeometry('' + value, {
      font: this.font,
      size: 0.5,
      height: 0.001,
      curveSegments: 3,
    });
    this.selfScore.geometry.computeBoundingBox();

    this.selfScore.position.y = this.config.boxHeight / 2
      - this.selfScore.geometry.boundingBox.max.y / 2;
    this.selfScore.position.z = this.config.boxPositionZ
      + this.config.boxDepth / 4
      + this.selfScore.geometry.boundingBox.max.x / 2;
  }

  setOpponentScore(value) {
    this.opponentScore.geometry = new THREE.TextGeometry('' + value, {
      font: this.font,
      size: 0.5,
      height: 0.001,
      curveSegments: 3,
    });
  }
}
