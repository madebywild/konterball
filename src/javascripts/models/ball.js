import {SphereGeometry, MeshBasicMaterial, Mesh} from 'three';

export default (scene, config) => {
  let geometry = new SphereGeometry(config.ballRadius, 16, 16);
  let material = new MeshBasicMaterial({
    color: config.colors.BALL,
  });

  let mesh = new Mesh(geometry, material);
  scene.add(mesh);
  mesh.castShadow = true;
  return mesh;
};
