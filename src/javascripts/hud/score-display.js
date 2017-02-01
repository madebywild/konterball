import {MeshBasicMaterial, TextGeometry, Mesh, Group, CircleGeometry, DoubleSide} from 'three';
import {MODE} from '../constants';

export default class ScoreDisplay {
  constructor(parent, config, font) {
    this.parent = parent;
    this.font = font;
    this.config = config;
    this.lives = [];

    this.setupText();
  }

  setupText() {
    let material = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
    });
    let geometry = new TextGeometry('0', {
      font: this.font,
      size: 0.35,
      height: 0.001,
      curveSegments: 3,
    });
    geometry.computeBoundingBox();

    this.opponentScore = new Mesh(geometry, material);
    this.selfScore = new Mesh(geometry.clone(), material.clone());

    this.selfScore.rotation.y = Math.PI / 2;
    this.opponentScore.rotation.y = -Math.PI / 2;

    this.parent.add(this.selfScore);
    this.parent.add(this.opponentScore);

    this.setSelfScore(0);
    this.setOpponentScore(0);
    this.opponentScore.visible = this.config.mode === MODE.MULTIPLAYER;

    this.lifeGroup = new Group();
    for (let i = 0; i < this.config.startLives; i += 1) {
      geometry = new CircleGeometry(0.025, 32);
      material = new MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        side: DoubleSide,
        opacity: 1,
      });
      const life = new Mesh(geometry, material);
      life.position.x = i * 0.12;
      this.lives.push(life);
      this.lifeGroup.add(life);
    }
    this.lifeGroup.position.z = -1.4;
    this.lifeGroup.position.y = this.config.tableHeight + 0.24;
    this.lifeGroup.position.x = this.config.tableWidth / 2;
    this.lifeGroup.rotation.y = Math.PI / 2;
    this.lifeGroup.rotation.x = Math.PI;
    this.lifeGroup.visible = this.config.mode === MODE.SINGLEPLAYER;

    this.parent.add(this.lifeGroup);
  }

  setSelfScore(value) {
    this.selfScore.geometry.dynamic = true;

    this.selfScore.geometry = new TextGeometry(`${value}`, {
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
    this.opponentScore.geometry = new TextGeometry(`${value}`, {
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
      - this.opponentScore.geometry.boundingBox.max.x / 2 + 0.2;
  }

  setLives(value) {
    this.lives.forEach((life, index) => {
      life.material.opacity = value > index ? 1 : 0.3;
    });
  }

  hide() {
    this.opponentScore.visible = false;
    this.selfScore.visible = false;
    this.lives.forEach(life => {life.visible = false;});
  }

  show(multiplayer) {
    this.opponentScore.visible = multiplayer;
    this.selfScore.visible = true;
    this.lives.forEach(life => {life.visible = !multiplayer;});
  }
}
