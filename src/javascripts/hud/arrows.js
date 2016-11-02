import * as THREE from 'three';

export default (font, loader) => {
  return new Promise((resolve, reject) => {
    loader.load('arrows.obj', object => {
      const scale = 0.024;
      object.scale.set(scale, scale, scale);
      const material = new THREE.MeshLambertMaterial({
        color: 0xFFFFFF,
        side: THREE.DoubleSide,
      });
      object.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.material = material;
        }
      });
      object.position.z = 5;

      const geometry = new THREE.TextGeometry('Turn Around', {
        font: font,
        size: 0.15,
        height: 0.001,
        curveSegments: 3,
      });
      const turnAroundText = new THREE.Mesh(geometry, material);


      turnAroundText.geometry.computeBoundingBox();
      turnAroundText.geometry.verticesNeedUpdate = true;

      turnAroundText.position.x = turnAroundText.geometry.boundingBox.max.x / 2;
      turnAroundText.position.z = 7;
      turnAroundText.position.y = 0.2;
      turnAroundText.rotation.y = Math.PI;

      const group = new THREE.Group();
      group.add(object);
      group.add(turnAroundText);
      resolve(group);
    });
  });
};
