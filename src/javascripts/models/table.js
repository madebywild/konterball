export default (parent, config) => {
  let geometry = null;
  let mesh = null;
  let material = null;
  let group = new THREE.Group();
  group.position.y = config.tableHeight / 2;
  group.position.z = config.tablePositionZ;

  material = new THREE.MeshLambertMaterial({
    color: config.colors.BLUE_TABLE,
  });

  geometry = new THREE.BoxGeometry(config.tableWidth, config.tableThickness, config.tableDepth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 - config.tableThickness / 2;
  mesh.name = 'table';
  mesh.receiveShadow = true;
  group.add(mesh);

  let upwardsTableGroup = new THREE.Group();
  const upwardsTableHeight = config.tableDepth / 3;
  upwardsTableGroup.name = 'upwardsTableGroup';
  upwardsTableGroup.visible = false;
  upwardsTableGroup.rotation.x = Math.PI / 2;
  upwardsTableGroup.position.y = config.tableHeight / 2 + upwardsTableHeight / 2;
  upwardsTableGroup.position.z = -config.tableThickness / 2;
  geometry = new THREE.BoxGeometry(config.tableWidth, config.tableThickness, upwardsTableHeight);
  material = new THREE.MeshLambertMaterial({
    color: config.colors.PINK_TABLE_UPWARDS,
  });
  mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  upwardsTableGroup.add(mesh);

  group.add(upwardsTableGroup);

  // lines
  // put the lines slightly above the table to combat z-fighting
  const epsilon = 0.001;
  const lineWidth = 0.03;

  material = new THREE.MeshLambertMaterial({
    color: 0xFFFFFF
  });
  geometry = new THREE.BoxGeometry(lineWidth, epsilon, config.tableDepth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 + epsilon;
  mesh.position.x = -config.tableWidth / 2 + lineWidth / 2;
  mesh.receiveShadow = true;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, epsilon, config.tableDepth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 + epsilon;
  mesh.position.x = config.tableWidth / 2 - lineWidth / 2;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(config.tableWidth - lineWidth * 2, epsilon, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 + epsilon;
  mesh.position.z = config.tableDepth / 2 - lineWidth / 2;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(config.tableWidth - lineWidth * 2, epsilon, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 + epsilon;
  mesh.position.z = -config.tableDepth / 2 + lineWidth / 2;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, 0.001, config.tableDepth - lineWidth * 2);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 + epsilon;
  group.add(mesh);

  // lines for the upwards tilted table
  geometry = new THREE.BoxGeometry(config.tableWidth - lineWidth * 2, epsilon, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableThickness / 2 + epsilon;
  mesh.position.z = -upwardsTableHeight / 2 + lineWidth / 2;
  upwardsTableGroup.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, epsilon, upwardsTableHeight);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableThickness / 2 + epsilon;
  mesh.position.x = -config.tableWidth / 2 + lineWidth / 2;
  mesh.receiveShadow = true;
  upwardsTableGroup.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, epsilon, upwardsTableHeight);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableThickness / 2 + epsilon;
  mesh.position.x = config.tableWidth / 2 - lineWidth / 2;
  upwardsTableGroup.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, 0.001, upwardsTableHeight - lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableThickness / 2 + epsilon;
  mesh.position.z = lineWidth / 2;
  upwardsTableGroup.add(mesh);

  parent.add(group);

  return group;
};
