import wrap from 'wordwrap';
import values from 'object.values';
import {Group, MeshBasicMaterial, TextGeometry, Mesh} from 'three';
import $ from 'zepto-modules';
import Button from './button';

const CHAR_LIMIT = 16;
const FONT_SIZE = 0.07;
const LINE_SPACING = 0.06;

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
    this.crazyGroup = new Group();
    this.scene.add(this.crazyGroup);
    this.buttons[config.rainbowText] = new Button(this.crazyGroup, this.font, config.rainbowText, 0, 2, this.emitter, 0.7 * 100, 0.2 * 100, 0.01 * 100, 0.04 * 100);
    this.buttons[config.rainbowText].buttonGroup.position.z = 200;
    this.buttons[config.rainbowText].buttonGroup.rotation.y = Math.PI;
  }

  setMessage(text, font = 'futura') {
    this.messageGroup.remove(...this.messageGroup.children);
    let splitText = [];
    if ($.isArray(text)) {
      splitText = text.reverse();
    } else {
      splitText = this.wrap(text).split('\n').reverse();
    }
    const material = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
    });
    let lineHeight = 0;
    splitText.forEach((split, index) => {
      const geometry = new TextGeometry(split, {
        font: font === 'futura' ? this.font : this.antique,
        size: font === 'futura' ? FONT_SIZE : 0.15,
        height: 0.001,
        curveSegments: 3,
      });
      geometry.computeBoundingBox();
      const message = new Mesh(geometry, material);
      message.geometry = geometry;
      message.position.x = -geometry.boundingBox.max.x / 2;
      message.position.y = index * (geometry.boundingBox.max.y + LINE_SPACING);
      this.messageGroup.add(message);
      lineHeight = geometry.boundingBox.max.y;
    });
    const height = splitText.length * (LINE_SPACING + lineHeight);
    this.messageGroup.position.y = this.config.tableHeight + 0.6 - height / 2;
    this.messageGroup.position.z = this.config.tablePositionZ + 0.5;
  }

  gameOver(score) {
    const multiplayer = score.self || score.opponent;
    this.messageGroup.remove(...this.messageGroup.children);
    const material = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
    });
    let text = '';
    if (multiplayer) {
      text = score.self > score.opponent ? 'YOU WON' : 'YOU LOST';
    } else {
      text = `${score.highest} ${score.highest === 1 ? 'PT' : 'PTS'}`;
    }
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
    this.buttons.exit = new Button(this.messageGroup, this.font, 'exit', 0.25, buttonsYPosition, this.emitter);
    this.buttons.restart = new Button(this.messageGroup, this.font, 'restart', -0.25, buttonsYPosition, this.emitter);

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
    if (this.buttons.exit) {
      this.messageGroup.remove(this.buttons.exit.buttonGroup);
      this.messageGroup.remove(this.buttons.restart.buttonGroup);
    }
  }

  intersect(raycaster, mouseControls) {
    const intersects = raycaster.intersectObjects(values(this.buttons).map(button => button.hitbox), false);
    if (intersects.length > 0 && !this.intersectedButton) {
      // eslint-disable-next-line
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
