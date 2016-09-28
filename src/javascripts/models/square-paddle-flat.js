export default (parent, config) => {
  let group = new THREE.Group();
  let geometry, material, mesh;
  material = new THREE.MeshBasicMaterial({
    color: config.colors.PONG_PADDLE,
  });

  // top
  geometry = new THREE.BoxGeometry(config.paddleSize, config.paddleThickness, config.paddleThickness);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.paddleSize / 2 - config.paddleThickness / 2;
  group.add(mesh);

  // bottom
  geometry = new THREE.BoxGeometry(config.paddleSize, config.paddleThickness, config.paddleThickness);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -config.paddleSize / 2 + config.paddleThickness / 2;
  group.add(mesh);

  // left
  geometry = new THREE.BoxGeometry(config.paddleThickness, config.paddleSize - config.paddleThickness * 2, config.paddleThickness);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = -config.paddleSize / 2 + config.paddleThickness / 2;
  group.add(mesh);

  // right
  geometry = new THREE.BoxGeometry(config.paddleThickness, config.paddleSize - config.paddleThickness * 2, config.paddleThickness);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = config.paddleSize / 2 - config.paddleThickness / 2;
  group.add(mesh);

  group.name = 'paddle';
  parent.add(group);
  return group;
};
