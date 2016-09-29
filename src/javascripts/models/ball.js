export default (config, color) => {
  let geometry = new THREE.SphereGeometry(config.ballRadius, 16, 16);
  let material = new THREE.MeshBasicMaterial({
    color: color || config.colors.WHITE,
  });

  return new THREE.Mesh(geometry, material);
};
