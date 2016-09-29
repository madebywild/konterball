import TweenMax from 'gsap';
import {MODE, PRESET} from '../constants';

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
    this.opponentScore.rotation.x = -Math.PI / 2;
    this.opponentScore.rotation.z = Math.PI / 2;
    this.opponentScore.position.x = -this.config.boxWidth / 2
      + geometry.boundingBox.max.y + 0.2;
    this.opponentScore.position.z = this.config.boxPositionZ - scoreSpacing;

    this.selfScore = new THREE.Mesh(geometry.clone(), material.clone());
    this.selfScore.rotation.x = -Math.PI / 2;
    this.selfScore.rotation.z = Math.PI / 2;
    this.selfScore.position.x = -this.config.boxWidth / 2
      + geometry.boundingBox.max.y + 0.2;
    this.selfScore.position.z = this.config.boxPositionZ
      + geometry.boundingBox.max.x + scoreSpacing;

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

  presetChange(preset) {
    if (preset === PRESET.PINGPONG) {
      // position at floor center to the left
      this.resetScorePositions();
      this.selfScore.material.color.set(this.config.colors.PADDLE_COLOR_PINGPONG);
      this.selfScore.rotation.y = Math.PI / 2;
      this.selfScore.position.x = -this.config.boxWidth / 2;
      this.selfScore.geometry.computeBoundingBox();
      this.selfScore.position.y = this.config.boxHeight / 2
        - this.selfScore.geometry.boundingBox.max.y / 2;
      this.selfScore.position.z = this.config.boxPositionZ
        + this.config.boxDepth / 4
        + this.selfScore.geometry.boundingBox.max.x / 2;

      this.opponentScore.material.color.set(
        this.config.colors.OPPONENT_PADDLE_COLOR_PINGPONG
      );
      this.opponentScore.rotation.y = -Math.PI / 2;
      this.opponentScore.position.x = this.config.boxWidth / 2;
      this.opponentScore.geometry.computeBoundingBox();
      this.opponentScore.position.y = this.config.boxHeight / 2
        - this.opponentScore.geometry.boundingBox.max.y / 2;
      this.opponentScore.position.z = this.config.boxPositionZ
        - this.config.boxDepth / 4
        - this.opponentScore.geometry.boundingBox.max.x / 2;

    } else if (preset === PRESET.NORMAL || preset === PRESET.INSANE) {
      // position at left and right walls
      this.resetScorePositions();
      this.selfScore.material.color.set(this.config.colors.WHITE);
      this.selfScore.rotation.x = -Math.PI / 2;
      this.selfScore.rotation.z = Math.PI / 2;
      this.selfScore.geometry.computeBoundingBox();
      this.selfScore.position.x = -this.config.boxWidth / 2
        + this.selfScore.geometry.boundingBox.max.y + 0.2;
      this.selfScore.position.z = this.config.boxPositionZ
        + this.selfScore.geometry.boundingBox.max.x + scoreSpacing;
      this.selfScore.position.y = 0;

      this.opponentScore.material.color.set(this.config.colors.WHITE);
      this.opponentScore.rotation.x = -Math.PI / 2;
      this.opponentScore.rotation.z = Math.PI / 2;
      this.opponentScore.geometry.computeBoundingBox();
      this.opponentScore.position.x = -this.config.boxWidth / 2
        + this.opponentScore.geometry.boundingBox.max.y + 0.2;
      this.opponentScore.position.z = this.config.boxPositionZ
        - this.opponentScore.geometry.boundingBox.max.x - scoreSpacing;
      this.opponentScore.position.y = 0;
    }
  }

  setSelfScore(value) {
    this.selfScore.geometry = new THREE.TextGeometry('' + value, {
      font: this.font,
      size: 0.5,
      height: 0.001,
      curveSegments: 3,
    });
    this.selfScore.geometry.computeBoundingBox();
    if (this.config.preset === PRESET.PINGPONG) {
      this.selfScore.position.y = this.config.boxHeight / 2
        - this.selfScore.geometry.boundingBox.max.y / 2;
      this.selfScore.position.z = this.config.boxPositionZ
        + this.config.boxDepth / 4
        + this.selfScore.geometry.boundingBox.max.x / 2;
    } else {
      this.selfScore.position.z = this.config.boxPositionZ
        + this.selfScore.geometry.boundingBox.max.x
        + scoreSpacing;
    }
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
