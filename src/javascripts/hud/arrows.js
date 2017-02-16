import {MeshLambertMaterial, Mesh, Group, DoubleSide} from 'three';

export default (font, loader) => new Promise(resolve => {
  loader.load('arrows.obj', object => {
    const scale = 0.9;
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
    object.position.z = 280;
    object.position.y = 0;

    const group = new Group();
    group.add(object);
    resolve(group);
  });
});
