import wrap from 'wordwrap';
import {Group, MeshBasicMaterial, TextGeometry, Mesh} from 'three';
import $ from 'jquery';

const CHAR_LIMIT = 16;
const FONT_SIZE = 0.07;
const LINE_SPACING = 0.1;

export default class Message {
  constructor(scene, config, font) {
    this.scene = scene;
    this.font = font;
    this.config = config;
    this.wrap = wrap(CHAR_LIMIT);
    this.messageGroup = new Group();
    this.setMessage('waiting');
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
      opacity: 0.5,
    });
    let lineHeight = 0;
    splitText.forEach((text, index) => {
      let geometry = new TextGeometry(text, {
        font: this.font,
        size: FONT_SIZE,
        height: 0.001,
        curveSegments: 1,
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
    this.messageGroup.position.y = this.config.tableHeight + height / 2 + 0.2;
    this.messageGroup.position.z = this.config.tablePositionZ;
    this.scene.add(this.messageGroup);
  }

  showMessage() {
    this.messageGroup.visible = true;
  }

  hideMessage() {
    this.messageGroup.visible = false;
  }
}
