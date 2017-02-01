import {Mesh, Line} from 'three';

module.exports = {
  cap: (value, cap1, cap2) => {
    if (cap1 > cap2) {
      return Math.max(cap2, Math.min(cap1, value));
    }
    return Math.max(cap1, Math.min(cap2, value));
  },

  rand: (min, max) => min + Math.floor(Math.random() * (max - min)),

  mirrorPosition: (pos, xAxis = 0) => {
    let z = pos.z;
    z -= (z - xAxis) * 2;
    return {
      x: -pos.x,
      y: pos.y,
      z,
    };
  },

  mirrorVelocity: vel => {
    return {
      x: -vel.x,
      y: vel.y,
      z: -vel.z,
    };
  },

  setTransparency: (object, transparency) => {
    object.traverse(child => {
      if (child instanceof Mesh) {
        child.material.transparent = transparency !== 1;
        child.material.opacity = transparency;
      }
      if (child instanceof Line) {
        child.material.transparent = transparency !== 1;
        child.material.opacity = transparency;
      }
    });
  },
};
