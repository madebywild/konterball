export default (scene, config, color) => {
  let geometry = new THREE.SphereGeometry(config.ballRadius, 16, 16);
  let material = new THREE.MeshBasicMaterial({
    color: config.colors.BALL,
  });
  let mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return mesh;
};
