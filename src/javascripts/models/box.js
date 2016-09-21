export default (parent, config) => {
  let geometry = new THREE.BoxGeometry(config.boxWidth, config.boxHeight, config.boxDepth);
  let material = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
  });

  let box = new THREE.Mesh(geometry, material);
  box.position.z = config.boxPositionZ;
  box.position.y = config.boxHeight / 2;

  let boxhelper = new THREE.BoxHelper((box), 0xffffff);

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

  parent.add(centerLine);
  parent.add(boxhelper);

  return boxhelper;
};
