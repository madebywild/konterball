export default (parent, config) {
  // TODO
  let geometry = new THREE.BoxGeometry(
    this.config.tableWidth,
    this.config.netHeight,
    this.config.netThickness
  );
  let material = new THREE.MeshLambertMaterial({
    color: this.config.colors.WHITE,
    transparent: true,
    opacity: 0.5,
  });
  this.net = new THREE.Mesh(geometry, material);
  this.net.position.y = this.config.tableHeight + this.config.tableThickness + this.config.netHeight / 2;
  this.net.position.z = this.config.boxPositionZ;
  // TODO is this correct?
  this.net.castShadow = true;
  //this.net.position.z = -this.config.tableDepth / 4;
  this.scene.add(this.net);
}
