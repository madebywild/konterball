import {SphereGeometry, MeshBasicMaterial, Mesh} from 'three';

export default scene => {
  const geometry = new SphereGeometry(0.01, 16, 16);
  const material = new MeshBasicMaterial({
    color: 0xFFFFFF,
  });
  const mesh = new Mesh(geometry, material);
  scene.add(mesh);
  return mesh;
};
