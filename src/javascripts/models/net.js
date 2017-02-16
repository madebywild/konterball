import {
  Group,
  MeshBasicMaterial,
  Mesh,
  BoxGeometry,
  PlaneGeometry,
} from 'three';

export default (parent, config) => {
  const group = new Group();

  // only for intersecting when predicting collisions
  const colliderGroup = new Group();
  colliderGroup.name = 'net-collider';
  let geometry = new BoxGeometry(
    config.tableWidth,
    config.netHeight,
    config.netThickness
  );
  let material = new MeshBasicMaterial({
    color: 0x1c1a54,
    transparent: true,
    opacity: 0.2,
  });
  const net = new Mesh(geometry, material);
  net.name = 'net';
  colliderGroup.add(net);

  geometry = new BoxGeometry(
    config.tableWidth,
    0.01,
    config.netHeight * 2
  );
  const bottomMaterial = material.clone();
  bottomMaterial.visible = false;
  const bottomNetCollider = new Mesh(geometry, bottomMaterial);
  bottomNetCollider.position.y = -config.netHeight / 2;
  colliderGroup.add(bottomNetCollider);

  group.add(colliderGroup);

  geometry = new PlaneGeometry(
    config.tableWidth,
    config.netThickness
  );
  material = new MeshBasicMaterial({
    color: 0xffffff,
  });
  const topNet = new Mesh(geometry, material);
  topNet.position.y = config.netHeight / 2 + 0.001;
  topNet.rotation.x = -Math.PI / 2;
  group.add(topNet);

  group.position.z = config.tablePositionZ;
  group.position.y = config.tableHeight + config.netHeight / 2 + 0.01;

  parent.add(group);
  group.topNet = topNet;
  group.collider = net;
  return group;
};
