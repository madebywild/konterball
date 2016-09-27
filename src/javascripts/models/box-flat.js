export default (parent, config) => {
  let geometry = null;
  let mesh = null;
  let material = null;
  let group = new THREE.Group();

  const lineWidth = 0.05;

  material = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
  });
  // front frame
  geometry = new THREE.BoxGeometry(config.boxWidth + lineWidth * 2, lineWidth, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.boxHeight + lineWidth / 2;
  mesh.position.z = config.boxPositionZ + config.boxDepth / 2;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(config.boxWidth + lineWidth * 2, lineWidth, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -lineWidth / 2;
  mesh.position.z = config.boxPositionZ + config.boxDepth / 2;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, config.boxHeight, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = config.boxPositionZ + config.boxDepth / 2;
  mesh.position.x = -config.boxWidth / 2 - lineWidth / 2;
  mesh.position.y = config.boxHeight / 2;
  mesh.rotation.y = Math.PI / 2;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, config.boxHeight, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = config.boxPositionZ + config.boxDepth / 2;
  mesh.position.x = config.boxWidth / 2 + lineWidth / 2;
  mesh.position.y = config.boxHeight / 2;
  mesh.rotation.y = Math.PI / 2;
  group.add(mesh);

  // back frame
  geometry = new THREE.BoxGeometry(config.boxWidth + lineWidth * 2, lineWidth, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.boxHeight + lineWidth / 2;
  mesh.position.z = config.boxPositionZ - config.boxDepth / 2;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(config.boxWidth + lineWidth * 2, lineWidth, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -lineWidth / 2;
  mesh.position.z = config.boxPositionZ - config.boxDepth / 2;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, config.boxHeight, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = config.boxPositionZ - config.boxDepth / 2;
  mesh.position.x = -config.boxWidth / 2 - lineWidth / 2;
  mesh.position.y = config.boxHeight / 2;
  mesh.rotation.y = Math.PI / 2;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, config.boxHeight, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = config.boxPositionZ - config.boxDepth / 2;
  mesh.position.x = config.boxWidth / 2 + lineWidth / 2;
  mesh.position.y = config.boxHeight / 2;
  mesh.rotation.y = Math.PI / 2;
  group.add(mesh);

  // connector frame
  geometry = new THREE.BoxGeometry(lineWidth, lineWidth, config.boxDepth - lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = config.boxPositionZ;
  mesh.position.y = config.boxHeight + lineWidth / 2;
  mesh.position.x = -config.boxWidth / 2 - lineWidth / 2;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, lineWidth, config.boxDepth - lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = config.boxPositionZ;
  mesh.position.y = config.boxHeight + lineWidth / 2;
  mesh.position.x = config.boxWidth / 2 + lineWidth / 2;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, lineWidth, config.boxDepth - lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = config.boxPositionZ;
  mesh.position.x = -config.boxWidth / 2 - lineWidth / 2;
  mesh.position.y = -lineWidth / 2;
  group.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, lineWidth, config.boxDepth - lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = config.boxPositionZ;
  mesh.position.x = config.boxWidth / 2 + lineWidth / 2;
  mesh.position.y = -lineWidth / 2;
  group.add(mesh);

  // centered line
  geometry = new THREE.Geometry();
  // bottom left -> top left
  geometry.vertices.push(new THREE.Vector3(-config.boxWidth / 2, 0, 0));
  geometry.vertices.push(new THREE.Vector3(-config.boxWidth / 2, config.boxHeight, 0));
  // top left -> top right
  geometry.vertices.push(new THREE.Vector3(config.boxWidth / 2, config.boxHeight, 0));
  // top right -> bottom right
  geometry.vertices.push(new THREE.Vector3(config.boxWidth / 2, 0, 0));
  // bottom left -> bottom right
  geometry.vertices.push(new THREE.Vector3(-config.boxWidth / 2, 0, 0));

  material = new THREE.LineDashedMaterial({
    color: 0xFFFFFF,
    dashSize: 0.05,
    gapSize: 0.05,
  });
  let centerLine = new THREE.Line(geometry, material);
  geometry.computeLineDistances();
  centerLine.position.z = config.boxPositionZ;
  centerLine.name = 'centerLine';
  group.add(centerLine);

  material = new THREE.LineBasicMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.5,
  });
  let ballHelperLine = new THREE.Line(geometry.clone(), material);
  ballHelperLine.name = 'ballHelperLine';
  group.add(ballHelperLine);

  parent.add(group);
  return group;
};
