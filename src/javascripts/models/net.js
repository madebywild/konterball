import {Group, MeshBasicMaterial, Mesh, GridHelper, BoxGeometry} from 'three';

export default (parent, config) => {
  let group = new Group();

  // only for intersecting when predicting collisions
  const colliderGroup = new Group();
  colliderGroup.name = 'net-collider';
  let geometry = new BoxGeometry(
    config.tableWidth,
    config.netHeight,
    config.netThickness
  );
  let material = new MeshBasicMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.2,
  });

  let net = new Mesh(geometry, material);
  net.castShadow = true;
  colliderGroup.add(net);

  geometry = new BoxGeometry(
    config.tableWidth,
    0.01,
    config.netHeight * 2
  );
  let bottomMaterial = material.clone();
  bottomMaterial.visible = false;
  let bottomNetCollider = new Mesh(geometry, bottomMaterial);
  bottomNetCollider.position.y = -config.netHeight / 2;
  colliderGroup.add(bottomNetCollider);

  group.add(colliderGroup);

  // actual net
  const griddivisions = 6;
  for (let i = 0; i < griddivisions; i++) {
    let grid = new GridHelper(config.netHeight / 2, 8, 0xFFFFFF, 0xFFFFFF);
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
