export default (parent, config) => {
  let group = new THREE.Group();

  // dis only for intersecting when predicting collisions
  let geometry = new THREE.BoxGeometry(
    config.boxWidth,
    config.netHeight,
    config.netThickness
  );
  let material = new THREE.MeshBasicMaterial({
    color: config.colors.WHITE,
    transparent: true,
    opacity: 0.1,
  });

  let net = new THREE.Mesh(geometry, material);
  net.name = 'net-collider';
  group.add(net);

  // dis actual net
  const griddivisions = 6;
  for (let i = 0; i < griddivisions; i++) {
    let grid = new THREE.GridHelper(config.netHeight / 2, 8);
    grid.rotation.x = Math.PI / 2;
    grid.scale.x = (config.boxWidth / griddivisions) / config.netHeight;
    grid.position.x = (((i/griddivisions) * config.boxWidth) + (config.netHeight / 2) * grid.scale.x) - config.boxWidth / 2;
    group.add(grid);
  }
  group.position.z = config.boxPositionZ;
  group.position.y = config.netHeight / 2;
  parent.add(group);

  return group;
};
