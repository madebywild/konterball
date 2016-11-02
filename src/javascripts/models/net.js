import * as THREE from 'three';

export default (parent, config) => {
  let group = new THREE.Group();

  // dis only for intersecting when predicting collisions
  let geometry = new THREE.BoxGeometry(
    config.tableWidth,
    config.netHeight,
    config.netThickness
  );
  let material = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.1,
  });

  let net = new THREE.Mesh(geometry, material);
  net.name = 'net-collider';
  net.castShadow = true;
  group.add(net);

  // dis actual net
  const griddivisions = 6;
  for (let i = 0; i < griddivisions; i++) {
    let grid = new THREE.GridHelper(config.netHeight / 2, 8, 0x000000, 0x000000);
    grid.rotation.x = Math.PI / 2;
    grid.scale.x = (config.tableWidth / griddivisions) / config.netHeight;
    grid.position.x = (((i/griddivisions) * config.tableWidth) + (config.netHeight / 2) * grid.scale.x) - config.tableWidth / 2;
    group.add(grid);
  }
  group.position.z = config.tablePositionZ;
  group.position.y = config.tableHeight + config.netHeight / 2 + 0.01;
  parent.add(group);

  return group;
};
