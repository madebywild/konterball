import TweenMax from 'gsap';
import {MODE} from '../constants';

const scoreSpacing = 0.3;

export default class ScoreDisplay {
  constructor(parent, config, font) {
    this.parent = parent;
    this.font = font;
    this.config = config;

    this.group = new THREE.Group();
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
    this.opponentScore.position.x = scoreSpacing;

    this.selfScore = new THREE.Mesh(geometry.clone(), material);
    this.selfScore.position.x = -geometry.boundingBox.max.x - scoreSpacing;

    this.group.position.z = this.config.boxPositionZ;
    this.group.add(this.selfScore);
    this.group.add(this.opponentScore);

    this.opponentScore.visible = this.config.mode === MODE.MULTIPLAYER;

    this.group.rotation.x = -Math.PI / 2;
    this.group.rotation.z = Math.PI / 2;
    this.group.position.x = -this.config.boxWidth / 2 + geometry.boundingBox.max.y + 0.2;

    this.parent.add(this.group);
  }

  setSelfScore(value) {
    this.selfScore.geometry = new THREE.TextGeometry('' + value, {
      font: this.font,
      size: 0.5,
      height: 0.001,
      curveSegments: 3,
    });
    this.selfScore.geometry.computeBoundingBox();
    this.selfScore.position.x = -this.selfScore.geometry.boundingBox.max.x - scoreSpacing;
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
