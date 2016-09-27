export default (parent, config) => {
  let geometry = null;
  let mesh = null;
  let material = null;
  let group = new THREE.Group();

  geometry = new THREE.BoxGeometry(config.boxWidth, config.boxHeight, config.boxDepth);
  material = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
  });

  // let box = new THREE.Mesh(geometry, material);
  // box.position.z = config.boxPositionZ;
  // box.position.y = config.boxHeight / 2;

  // let boxhelper = new THREE.BoxHelper((box), 0xffffff);
  // group.add(boxhelper);

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


  // material = new THREE.LineDashedMaterial({
  //   color: 0xFFFFFF,
  //   dashSize: 0.05,
  //   gapSize: 0.05,
  // });
  // let centerLine = new THREE.Line(geometry, material);
  // geometry.computeLineDistances();
  // centerLine.position.z = config.boxPositionZ;
  // group.add(centerLine);

  material = new THREE.LineBasicMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.5,
  });
  let ballHelperLine = new THREE.Line(geometry.clone(), material);
  ballHelperLine.name = 'ballHelperLine';
  group.add(ballHelperLine);

  let gridHelper = new THREE.GridHelper(config.boxWidth / 2, 4);
  gridHelper.position.z = config.boxPositionZ + config.boxDepth / 4;
  gridHelper.scale.z = (config.boxDepth / 2) / config.boxWidth;
  group.add(gridHelper);

  gridHelper = new THREE.GridHelper(config.boxWidth / 2, 4);
  gridHelper.position.z = config.boxPositionZ - config.boxDepth / 4;
  gridHelper.scale.z = (config.boxDepth / 2) / config.boxWidth;
  group.add(gridHelper);

  gridHelper = new THREE.GridHelper(config.boxWidth / 2, 4);
  gridHelper.position.z = config.boxPositionZ + config.boxDepth / 4;
  gridHelper.position.y = config.boxHeight;
  gridHelper.scale.z = (config.boxDepth / 2) / config.boxWidth;
  group.add(gridHelper);

  gridHelper = new THREE.GridHelper(config.boxWidth / 2, 4);
  gridHelper.position.z = config.boxPositionZ - config.boxDepth / 4;
  gridHelper.position.y = config.boxHeight;
  gridHelper.scale.z = (config.boxDepth / 2) / config.boxWidth;
  group.add(gridHelper);

  gridHelper = new THREE.GridHelper(config.boxHeight / 2, 4);
  gridHelper.position.x = -config.boxWidth / 2;
  gridHelper.position.y = config.boxHeight / 2;
  gridHelper.position.z = config.boxPositionZ + config.boxDepth / 4;
  gridHelper.rotation.z = Math.PI / 2;
  gridHelper.scale.z = (config.boxDepth / 2) / config.boxHeight;
  group.add(gridHelper);

  gridHelper = new THREE.GridHelper(config.boxHeight / 2, 4);
  gridHelper.position.x = -config.boxWidth / 2;
  gridHelper.position.y = config.boxHeight / 2;
  gridHelper.position.z = config.boxPositionZ - config.boxDepth / 4;
  gridHelper.rotation.z = Math.PI / 2;
  gridHelper.scale.z = (config.boxDepth / 2) / config.boxHeight;
  group.add(gridHelper);

  gridHelper = new THREE.GridHelper(config.boxHeight / 2, 4);
  gridHelper.position.x = config.boxWidth / 2;
  gridHelper.position.y = config.boxHeight / 2;
  gridHelper.position.z = config.boxPositionZ + config.boxDepth / 4;
  gridHelper.rotation.z = Math.PI / 2;
  gridHelper.scale.z = (config.boxDepth / 2) / config.boxHeight;
  group.add(gridHelper);

  gridHelper = new THREE.GridHelper(config.boxHeight / 2, 4);
  gridHelper.position.x = config.boxWidth / 2;
  gridHelper.position.y = config.boxHeight / 2;
  gridHelper.position.z = config.boxPositionZ - config.boxDepth / 4;
  gridHelper.rotation.z = Math.PI / 2;
  gridHelper.scale.z = (config.boxDepth / 2) / config.boxHeight;
  group.add(gridHelper);

  parent.add(group);
  return group;
};
