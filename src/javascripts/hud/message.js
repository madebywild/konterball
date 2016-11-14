import wrap from 'wordwrap';
import {Group, MeshBasicMaterial, FontLoader, TextGeometry, Mesh} from 'three';
import $ from 'jquery';
import Button from './button';
import values from 'object.values';

const CHAR_LIMIT = 16;
const FONT_SIZE = 0.07;
const LINE_SPACING = 0.1;

export default class Message {
  constructor(scene, config, font, antique, emitter) {
    this.emitter = emitter;
    this.scene = scene;
    this.font = font;
    this.config = config;
    this.wrap = wrap(CHAR_LIMIT);
    this.buttons = {};
    this.antique = antique;
    this.messageGroup = new Group();
    this.intersectedButton = null;
    this.scene.add(this.messageGroup);
    this.setMessage('waiting');
    this.showMessage();
  }

  setMessage(text) {
    this.messageGroup.remove(...this.messageGroup.children);
    let splitText = [];
    if ($.isArray(text)) {
      splitText = text.reverse();
    } else {
      splitText = this.wrap(text).split('\n').reverse();
    }
    let material = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
    });
    let lineHeight = 0;
    splitText.forEach((text, index) => {
      let geometry = new TextGeometry(text, {
        font: this.font,
        size: FONT_SIZE,
        height: 0.001,
        curveSegments: 3,
      });
      geometry.computeBoundingBox();
      let message = new Mesh(geometry, material);
      message.geometry = geometry;
      message.position.x = -geometry.boundingBox.max.x / 2;
      message.position.y = index * (geometry.boundingBox.max.y + LINE_SPACING);
      this.messageGroup.add(message);
      lineHeight = geometry.boundingBox.max.y;
    });
    let height = splitText.length * (LINE_SPACING + lineHeight);
    this.messageGroup.position.y = this.config.tableHeight + height / 2 + 0.4;
    this.messageGroup.position.z = this.config.tablePositionZ + 0.5;
  }

  gameOver(score) {
    const multiplayer = score.self || score.opponent;
    this.messageGroup.remove(...this.messageGroup.children);
    let material = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
    });
    const text = multiplayer ? (score.self > score.opponent ? 'YOU WON' : 'YOU LOST') : `${score.highest} ${score.highest === 1 ? 'PT' : 'PTS'}`;
    let geometry = new TextGeometry(text, {
      font: this.antique,
      size: FONT_SIZE * (multiplayer ? 2.5 : 3.5),
      height: 0.001,
      curveSegments: 3,
    });
    geometry.computeBoundingBox();
    const gameOverText = new Mesh(geometry, material);
    gameOverText.position.x = -geometry.boundingBox.max.x / 2;
    gameOverText.position.y = multiplayer ? 0.25 : 0.1;
    this.messageGroup.add(gameOverText);

    const buttonsYPosition = multiplayer ? -0.15 : -0.1;
    this.buttons.exit = new Button(this.messageGroup, this.font, 'exit', -0.6, buttonsYPosition, this.emitter);
    this.buttons.restart = new Button(this.messageGroup, this.font, 'restart', -0.2, buttonsYPosition, this.emitter);
    this.buttons.google = new Button(this.messageGroup, this.font, 'google', 0.15, buttonsYPosition, this.emitter);
    this.buttons.facebook = new Button(this.messageGroup, this.font, 'facebook', 0.4, buttonsYPosition, this.emitter);
    this.buttons.twitter = new Button(this.messageGroup, this.font, 'twitter', 0.65, buttonsYPosition, this.emitter);

    if (multiplayer) {
      geometry = new TextGeometry(`You: ${score.self} Opponent: ${score.opponent}`, {
        font: this.font,
        size: FONT_SIZE,
        height: 0.001,
        curveSegments: 3,
      });
      geometry.computeBoundingBox();
      const scoreText = new Mesh(geometry, material);
      scoreText.position.x = -geometry.boundingBox.max.x / 2;
      scoreText.position.y = 0.07;
      this.messageGroup.add(scoreText);
    }
    this.messageGroup.position.y = this.config.tableHeight + 0.3;
  }

  showMessage() {
    this.messageGroup.visible = true;
  }

  hideMessage() {
    this.messageGroup.visible = false;
  }

  intersect(raycaster, mouseControls) {
    const intersects = raycaster.intersectObjects(values(this.buttons).map(button => button.hitbox), false);
    if (intersects.length > 0 && !this.intersectedButton) {
      this.intersectedButton = intersects[0].object._name;
      if (!mouseControls) {
        this.buttons[this.intersectedButton].enter();
      } else {
        this.buttons[this.intersectedButton].mouseEnter();
      }
    } else if (intersects.length === 0 && this.intersectedButton) {
      if (!mouseControls) {
        this.buttons[this.intersectedButton].leave();
      } else {
        this.buttons[this.intersectedButton].mouseLeave();
      }
      this.intersectedButton = null;
    }
  }

  click() {
    if (this.intersectedButton) {
      this.buttons[this.intersectedButton].emit();
      this.intersectedButton = null;
    }
  }
}
