import {MODE} from '../constants';
import * as THREE from 'three';

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

  const tableDepth = config.mode === MODE.MULTIPLAYER ? config.tableDepth : config.tableDepth / 2;

  geometry = new THREE.BoxGeometry(config.tableWidth, config.tableThickness, tableDepth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 - config.tableThickness / 2;
  if (config.mode === MODE.SINGLEPLAYER) {
    mesh.position.z = config.tableDepth / 4;
  }
  mesh.name = 'table';
  mesh.receiveShadow = true;
  group.add(mesh);

  let upwardsTableGroup = new THREE.Group();
  const upwardsTableHeight = config.tableDepth * 0.37;
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
  const lineGroup = new THREE.Group();

  material = new THREE.MeshLambertMaterial({
    color: 0xFFFFFF
  });
  geometry = new THREE.BoxGeometry(lineWidth, epsilon, tableDepth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 + epsilon;
  mesh.position.x = -config.tableWidth / 2 + lineWidth / 2;
  mesh.receiveShadow = true;
  lineGroup.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, epsilon, tableDepth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 + epsilon;
  mesh.position.x = config.tableWidth / 2 - lineWidth / 2;
  mesh.receiveShadow = true;
  lineGroup.add(mesh);

  geometry = new THREE.BoxGeometry(config.tableWidth - lineWidth * 2, epsilon, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 + epsilon;
  mesh.position.z = tableDepth / 2 - lineWidth / 2;
  mesh.receiveShadow = true;
  lineGroup.add(mesh);

  geometry = new THREE.BoxGeometry(config.tableWidth - lineWidth * 2, epsilon, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 + epsilon;
  mesh.position.z = -tableDepth / 2 + lineWidth / 2;
  mesh.receiveShadow = true;
  lineGroup.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, 0.001, tableDepth - lineWidth * 2);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableHeight / 2 + epsilon;
  mesh.receiveShadow = true;
  lineGroup.add(mesh);

  if (config.mode === MODE.SINGLEPLAYER) {
    lineGroup.position.z = config.tableDepth / 4;
  }

  group.add(lineGroup);

  // lines for the upwards tilted table
  material = new THREE.MeshLambertMaterial({
    color: 0xDDDDDD,
  });
  geometry = new THREE.BoxGeometry(config.tableWidth - lineWidth * 2, epsilon, lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableThickness / 2 + epsilon;
  mesh.position.z = -upwardsTableHeight / 2 + lineWidth / 2;
  mesh.receiveShadow = true;
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
  mesh.receiveShadow = true;
  upwardsTableGroup.add(mesh);

  geometry = new THREE.BoxGeometry(lineWidth, 0.001, upwardsTableHeight - lineWidth);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = config.tableThickness / 2 + epsilon;
  mesh.position.z = lineWidth / 2;
  mesh.receiveShadow = true;
  upwardsTableGroup.add(mesh);

  parent.add(group);

  return group;
};
