import {MeshLambertMaterial, Mesh, TextGeometry, Group, DoubleSide} from 'three';

export default (font, loader) => new Promise(resolve => {
  loader.load('arrows.obj', object => {
    const scale = 0.024;
    object.scale.set(scale, scale, scale);
    const material = new MeshLambertMaterial({
      color: 0xFFFFFF,
      side: DoubleSide,
    });
    object.traverse(child => {
      if (child instanceof Mesh) {
        child.material = material;
      }
    });
    object.position.z = 5;

    const geometry = new TextGeometry('Turn Around', {
      font,
      size: 0.15,
      height: 0.001,
      curveSegments: 3,
    });
    const turnAroundText = new Mesh(geometry, material);


    turnAroundText.geometry.computeBoundingBox();
    turnAroundText.geometry.verticesNeedUpdate = true;

    turnAroundText.position.x = turnAroundText.geometry.boundingBox.max.x / 2;
    turnAroundText.position.z = 7;
    turnAroundText.position.y = 0.2;
    turnAroundText.rotation.y = Math.PI;

    const group = new Group();
    group.add(object);
    group.add(turnAroundText);
    resolve(group);
  });
});
