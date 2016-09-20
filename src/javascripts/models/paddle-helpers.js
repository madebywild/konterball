export default (parent, config) {
  // TODO
  let helperWidth = 0.03;
  let geometry = new THREE.PlaneGeometry(0.03, this.config.paddleSize);
  let material = new THREE.MeshLambertMaterial({
    color: 0x00ff00,
    side: THREE.DoubleSide,
  });
  this.paddleHelpers.top = new THREE.Mesh(geometry, material);
  this.paddleHelpers.top.position.z = this.config.paddlePositionZ;
  this.paddleHelpers.top.position.y = this.config.boxHeight - 0.01;
  this.paddleHelpers.top.rotation.x = Math.PI / 2;
  this.paddleHelpers.top.rotation.z = Math.PI / 2;
  this.scene.add(this.paddleHelpers.top);

  geometry = new THREE.PlaneGeometry(0.03, this.config.paddleSize);
  material = new THREE.MeshLambertMaterial({
    color: 0x00ff00,
    side: THREE.DoubleSide,
  });
  this.paddleHelpers.bottom = new THREE.Mesh(geometry, material);
  this.paddleHelpers.bottom.position.z = this.config.paddlePositionZ;
  this.paddleHelpers.bottom.position.y = 0.01;
  this.paddleHelpers.bottom.rotation.x = Math.PI / 2;
  this.paddleHelpers.bottom.rotation.z = Math.PI / 2;
  this.scene.add(this.paddleHelpers.bottom);

  geometry = new THREE.PlaneGeometry(0.03, this.config.paddleSize);
  material = new THREE.MeshLambertMaterial({
    color: 0x00ff00,
    side: THREE.DoubleSide,
  });
  this.paddleHelpers.left = new THREE.Mesh(geometry, material);
  this.paddleHelpers.left.position.z = this.config.paddlePositionZ;
  this.paddleHelpers.left.position.x = -this.config.boxWidth / 2 + 0.01;
  this.paddleHelpers.left.rotation.y = Math.PI / 2;
  this.scene.add(this.paddleHelpers.left);

  geometry = new THREE.PlaneGeometry(0.03, this.config.paddleSize);
  material = new THREE.MeshLambertMaterial({
    color: 0x00ff00,
    side: THREE.DoubleSide,
  });
  this.paddleHelpers.right = new THREE.Mesh(geometry, material);
  this.paddleHelpers.right.position.z = this.config.paddlePositionZ;
  this.paddleHelpers.right.position.x = this.config.boxWidth / 2 - 0.01;
  this.paddleHelpers.right.rotation.y = Math.PI / 2;
  this.scene.add(this.paddleHelpers.right);
}
