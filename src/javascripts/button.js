export default class Button {
  constructor(group, font, name, x, y) {
    this.font = font;
    this.group = group;
    this.name = name;
    this.button = null;
    this.text = null;

    this.buttonGroup = new THREE.Group();
    this.buttonWidth = 0.5;
    this.buttonHeight = 0.2;
    this.makeButton(x, y);
  }

  makeButton(x, y) {
    let geometry = new THREE.PlaneGeometry(this.buttonWidth, this.buttonHeight);
    let material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      opacity: 0.3,
      transparent: true,
    });
    this.button = new THREE.Mesh(geometry, material);
    this.buttonGroup.add(this.button);


    this.buttonGroup.position.x = x;
    this.buttonGroup.position.y = y;

    this.setupText();
    this.group.add(this.buttonGroup);
  }

  setupText() {
    let material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });
    let geometry = new THREE.TextGeometry(this.name, {
      font: this.font,
      size: 0.03,
      height: 0.001,
      curveSegments: 3,
    });
    geometry.computeBoundingBox();
    this.text = new THREE.Mesh(geometry, material);
    this.text.position.x = -geometry.boundingBox.max.x / 2;
    this.text.position.y = -geometry.boundingBox.max.y / 2;
    this.buttonGroup.add(this.text);
  }
}
