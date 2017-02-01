import {SphereGeometry, MeshBasicMaterial, Mesh} from 'three';

export default (scene, config) => {
  const geometry = new SphereGeometry(config.ballRadius, 16, 16);
  const material = new MeshBasicMaterial({
    color: config.colors.BALL,
  });

  const mesh = new Mesh(geometry, material);
  scene.add(mesh);
  mesh.castShadow = true;
  return mesh;
};
