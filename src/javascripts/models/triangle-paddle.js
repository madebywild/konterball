export default (parent, config) => {
  let group = new THREE.Group();
  let geometry, material, mesh;

  geometry = new THREE.RingGeometry(config.paddleSize, config.paddleSize + 0.05, 1, 1);
  material = new THREE.MeshBasicMaterial({
    color: config.colors.WHITE,
  });

  mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);

  geometry = new THREE.RingGeometry(0.001, config.paddleSize, 1, 1);
  material = new THREE.MeshLambertMaterial({
    color: config.colors.WHITE,
    opacity: 0,
    transparent: true,
  });
  mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'paddleHitHighlight';
  group.add(mesh);

  group.name = 'paddle';
  parent.add(group);
  return group;
};
