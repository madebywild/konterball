import {SphereGeometry, MeshBasicMaterial, Mesh} from 'three';

export default (scene, config) => {
  let geometry = new SphereGeometry(0.01, 16, 16);
  let material = new MeshBasicMaterial({
    color: 0xFFFFFF,
  });
  let mesh = new Mesh(geometry, material);
  scene.add(mesh);
  return mesh;
};
