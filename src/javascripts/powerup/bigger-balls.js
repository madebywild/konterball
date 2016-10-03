import TweenMax from 'gsap';

const SIZE = 0.1;

export default class {
  constructor(parent, config){
    this.powerup = null;

    let geometry = new THREE.BoxGeometry(SIZE, SIZE);
    let material = new THREE.MeshLambertMaterial({
      color: config.colors.WHITE,
      transparent: true,
      opacity: 0.5,
    });
    this.powerup = new THREE.Mesh(geometry, material);
    this.powerup.position.x = (0.5 - Math.random()) * config.boxWidth;
    this.powerup.position.y = Math.random() * config.boxHeight;
    this.powerup.position.z = config.boxPositionZ / 2 + (0.5 - Math.random()) * config.boxHeight;
    
    parent.add(this.powerup);
  }
};
