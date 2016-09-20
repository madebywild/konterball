export default (parent, config) => {
  // back box
  let geometry = new THREE.BoxGeometry(config.boxWidth, config.boxHeight, config.boxDepth);
  let material = new THREE.MeshBasicMaterial({
    //color: 0x009900,
    vertexColors: THREE.FaceColors,
    side: THREE.BackSide,
  });

  let box = new THREE.Mesh(geometry, material);
  box.position.z = config.boxPositionZ;
  box.position.y = config.boxHeight / 2;

  let boxhelper = new THREE.BoxHelper((box), 0xffffff);
  parent.add(boxhelper);
  return boxhelper;
};
