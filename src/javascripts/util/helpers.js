import {Mesh, Line} from 'three';

module.exports = {
  // cuts a number of so its not smaller/bigger than the bounds
  cap: (value, cap1, cap2) => {
    if (cap1 > cap2) {
      return Math.max(cap2, Math.min(cap1, value));
    }
    return Math.max(cap1, Math.min(cap2, value));
  },

  // random number between two numbers
  rand: (min, max) => min + Math.floor(Math.random() * (max - min)),

  // mirrors a vector along a the x axis
  mirrorPosition: (pos, xAxis = 0) => {
    let z = pos.z;
    z -= (z - xAxis) * 2;
    return {
      x: -pos.x,
      y: pos.y,
      z,
    };
  },

  // mirrors a velocity
  mirrorVelocity: vel => {
    return {
      x: -vel.x,
      y: vel.y,
      z: -vel.z,
    };
  },

  // set the transparency of an object and all its children
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
