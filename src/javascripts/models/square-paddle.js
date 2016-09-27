export default (parent, config) => {
  let geometry = new THREE.RingGeometry(config.paddleSize - 0.03, config.paddleSize, 4, 1);
  geometry.rotateZ(Math.PI / 4);
  geometry.rotateY(0.001);
  geometry.scale(0.71, 0.71, 0.71);
  let material = new THREE.MeshBasicMaterial({
    color: config.colors.PONG_PADDLE,
  });
  let paddle = new THREE.Mesh(geometry, material);
  paddle.name = 'paddle';
  parent.add(paddle);
  return paddle;
};
