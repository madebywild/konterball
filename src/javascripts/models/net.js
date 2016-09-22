export default (parent, config) => {
  let geometry = new THREE.BoxGeometry(
    config.boxWidth,
    config.netHeight,
    config.netThickness
  );
  let material = new THREE.MeshBasicMaterial({
    color: config.colors.WHITE,
    transparent: true,
    opacity: 0.5,
  });

  let net = new THREE.Mesh(geometry, material);
  net.position.y = config.netHeight / 2;
  net.position.z = config.boxPositionZ;
  // TODO is this correct?
  //this.net.position.z = -this.config.tableDepth / 4;
  parent.add(net);
  return net;
};
