export default (parent, config) => {
  let geometry = null;
  let mesh = null;
  let material = null;
  let group = new THREE.Group();

  material = new THREE.MeshLambertMaterial({
    color: config.colors.BLUE_TABLE,
  });

  geometry = new THREE.BoxGeometry(config.tableWidth, config.tableHeight, config.tableDepth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2;
  mesh.position.z = config.tablePositionZ;
  group.add(mesh);


  parent.add(group);

  return group;
};
