import {MeshBasicMaterial, DoubleSide} from 'three';

export default (objLoader, config, parent) => new Promise(resolve => {
  objLoader.load('paddle.obj', object => {
    const scale = 0.024;
    object.scale.set(scale, scale, scale);
    const redMaterial = new MeshBasicMaterial({
      color: config.colors.PADDLE_COLOR,
      side: DoubleSide,
    });
    const redSideMaterial = new MeshBasicMaterial({
      color: config.colors.PADDLE_SIDE_COLOR,
      side: DoubleSide,
    });
    const woodMaterial = new MeshBasicMaterial({
      color: config.colors.PADDLE_WOOD_COLOR,
      side: DoubleSide,
    });
    const woodSideMaterial = new MeshBasicMaterial({
      color: config.colors.PADDLE_WOOD_SIDE_COLOR,
      side: DoubleSide,
    });
    object.traverse((child) => {
      if (child.isMesh) {
        if (child.name === 'Extrude') {
          child.material = redSideMaterial;
        } else if (child.name === 'Cap_1' || child.name === 'Cap_2') {
          child.material = redMaterial;
        } else if (child.name === 'Extrude.1') {
          child.material = woodSideMaterial;
        } else {
          child.material = woodMaterial;
        }
      }
      child.castShadow = true;
    });
    const paddle = object.clone();
    paddle.name = 'paddle';
    paddle.visible = true;
    paddle.castShadow = true;
    parent.add(paddle);

    const paddleOpponent = object.clone();
    paddleOpponent.name = 'paddleOpponent';
    paddleOpponent.position.z = config.tablePositionZ - config.tableDepth / 2;
    paddleOpponent.position.y = 1;
    paddleOpponent.visible = false;
    parent.add(paddleOpponent);
    resolve({paddle, paddleOpponent});
  });
});
