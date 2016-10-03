export default (parent, config, color) => {
  const paddleRadius = config.paddleSize * 0.6;
  let geometry = new THREE.CylinderGeometry(paddleRadius, paddleRadius, config.paddleThickness, 32);
  let material = new THREE.MeshBasicMaterial({
    color: color || config.colors.WHITE,
    transparent: true,
    opacity: 0.5,
  });
  let paddle = new THREE.Mesh(geometry, material);
  paddle.rotation.x = Math.PI / 2;
  paddle.name = 'paddle';
  paddle.castShadow = true;

  const gripLength = config.paddleSize * 0.3;
  geometry = new THREE.BoxGeometry(gripLength, config.paddleThickness, config.paddleSize * 0.2);
  geometry.translate(paddleRadius + gripLength / 2, 0, 0);
  let paddleGrip = new THREE.Mesh(geometry, material);
  paddleGrip.rotateY(-Math.PI / 4);
  paddle.add(paddleGrip);
  
  parent.add(paddle);
  return paddle;
};
