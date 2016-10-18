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
      transparent: true,
      opacity: 0.5,
    });
    let geometry = new THREE.TextGeometry('0', {
      font: this.font,
      size: 0.35,
      height: 0.001,
      curveSegments: 3,
    });
    geometry.computeBoundingBox();

    this.opponentScore = new THREE.Mesh(geometry, material);
    this.selfScore = new THREE.Mesh(geometry.clone(), material.clone());

    this.selfScore.rotation.y = Math.PI / 2;
    this.opponentScore.rotation.y = -Math.PI / 2;

    this.parent.add(this.selfScore);
    this.parent.add(this.opponentScore);

    this.setSelfScore(0);
    this.setOpponentScore(0);
    this.opponentScore.visible = this.config.mode === MODE.MULTIPLAYER;
  }

  setSelfScore(value) {
     this.selfScore.geometry.dynamic = true;

    this.selfScore.geometry = new THREE.TextGeometry('' + value, {
      font: this.font,
      size: 0.35,
      height: 0.001,
      curveSegments: 3,
    });
    this.selfScore.geometry.computeBoundingBox();
    this.selfScore.geometry.verticesNeedUpdate = true;


    this.selfScore.position.x = -this.config.tableWidth / 2;
    this.selfScore.position.y = this.config.tableHeight + 0.2;
    this.selfScore.position.z = this.config.tablePositionZ
      + this.config.tableDepth / 2.8
      + this.selfScore.geometry.boundingBox.max.x / 2;
  }

  setOpponentScore(value) {
    this.opponentScore.geometry = new THREE.TextGeometry('' + value, {
      font: this.font,
      size: 0.35,
      height: 0.001,
      curveSegments: 3,
    });
    this.opponentScore.geometry.computeBoundingBox();

    this.opponentScore.position.x = this.config.tableWidth / 2;
    this.opponentScore.position.y = this.config.tableHeight + 0.2;
    this.opponentScore.position.z = this.config.tablePositionZ
      - this.config.tableDepth / 4
      - this.opponentScore.geometry.boundingBox.max.x / 2;
  }
}
