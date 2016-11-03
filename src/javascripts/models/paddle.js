import {MeshLambertMaterial, Vector3, DoubleSide} from 'three';

export default (objLoader, config, parent) => {
  return new Promise((resolve, reject) => {
    objLoader.load('paddle.obj', object => {
      const scale = 0.024;
      object.scale.set(scale, scale, scale);
      const redMaterial = new MeshLambertMaterial({
        color: config.colors.PADDLE_COLOR,
        side: DoubleSide,
      });
      const woodMaterial = new MeshLambertMaterial({
        color: config.colors.PADDLE_WOOD_COLOR,
        side: DoubleSide,
      });
      object.traverse(function(child) {
        if (child.isMesh) {
          if (child.name === 'Cap_1' || child.name === 'Cap_2' || child.name === 'Extrude') {
            child.material = redMaterial;
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
};
