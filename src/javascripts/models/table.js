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
  mesh.name = 'table';
  mesh.receiveShadow = true;
  group.add(mesh);
  group.position.y = config.tableHeight / 2;
  group.position.z = config.tablePositionZ;

  // put the lines slightly above the table to combat z-fighting
  const epsilon = 0.001;
  const lineWidth = 0.03;
  // lines
  material = new THREE.MeshLambertMaterial({
    color: 0xFFFFFF
  });
  geometry = new THREE.BoxGeometry(lineWidth, 0.001, config.tableDepth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 + epsilon;
  mesh.position.x = -config.tableWidth / 2 + lineWidth / 2;
  mesh.receiveShadow = true;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, 0.001, config.tableDepth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 + epsilon;
  mesh.position.x = config.tableWidth / 2 - lineWidth / 2;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(config.tableWidth - lineWidth * 2, 0.001, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 + epsilon;
  mesh.position.z = config.tableDepth / 2 - lineWidth / 2;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(config.tableWidth - lineWidth * 2, 0.001, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 + epsilon;
  mesh.position.z = -config.tableDepth / 2 + lineWidth / 2;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, 0.001, config.tableDepth - lineWidth * 2);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 + epsilon;
  group.add(mesh);

  parent.add(group);

  return group;
};
