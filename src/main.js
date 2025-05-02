import './style.css';
import Phaser from 'phaser';

import { Gorilla } from '../public/entities/gorilla'; // Adjust path as needed
import { Man } from '../public/entities/man'; // Adjust path as needed

const gameProperties = {
  gameWidth: 500,
  gameHeight: 500,
  gameGravity: 1000,
  gameSpeed: 1,
  gameMenAlive: 0,
  gameGorillasAlive: 0,
  hasSpawnedMen: false,
  hasSpawnedGorillas: false,
}

const rootStyles = getComputedStyle(document.documentElement);

class GameScene extends Phaser.Scene {
  constructor(){
    super("scene-game")

    this.didGorillasCheer = false;
    this.didHumansCheer = false;
  }

  preload() {
    this.load.image('gorilla', 'assets/gorilla.svg');
    for (let i = 1; i <= 18; i++) {
      this.load.svg(`man${i}`, `assets/men/man${i}.svg`);
    }
    this.load.audio('gorillaPunchSound1', 'assets/sounds/gorilla_punch_1.mp3');
    this.load.audio('gorillaPunchSound2', 'assets/sounds/gorilla_punch_2.mp3');
    this.load.audio('gorillaPunchSound3', 'assets/sounds/gorilla_punch_3.mp3');
    this.load.audio('humanPunchSound1', 'assets/sounds/human_punch_1.mp3');
    this.load.audio('humanPunchSound2', 'assets/sounds/human_punch_2.mp3');
    this.load.audio('humanPunchSound3', 'assets/sounds/human_punch_3.mp3');

    this.load.audio('gorillaCheerSound1', 'assets/sounds/gorilla_cheer_1.mp3');
    this.load.audio('gorillaCheerSound2', 'assets/sounds/gorilla_cheer_2.mp3');
    this.load.audio('gorillaCheerSound3', 'assets/sounds/gorilla_cheer_3.mp3');
    this.load.audio('humanCheerSound1', 'assets/sounds/human_cheer_1.mp3');
    this.load.audio('humanCheerSound2', 'assets/sounds/human_cheer_2.mp3');
    this.load.audio('humanCheerSound3', 'assets/sounds/human_cheer_3.mp3');

    this.load.image('gorillaHitParticle', 'assets/gorilla-fist.png');
    this.load.image('humanHitParticle', 'assets/human-fist.png');
  }

  create() {
    // Expose the scene globally for button access
    window.gameScene = this;

    this.gorillaPunchSounds = [
      this.sound.add('gorillaPunchSound1').setVolume(0.5),
      this.sound.add('gorillaPunchSound2').setVolume(0.5),
      this.sound.add('gorillaPunchSound3').setVolume(0.5),
    ];
  
    this.humanPunchSounds = [
      this.sound.add('humanPunchSound1').setVolume(0.5),
      this.sound.add('humanPunchSound2').setVolume(0.5),
      this.sound.add('humanPunchSound3').setVolume(0.5),
    ];

    this.gorillaCheerSounds = [
      this.sound.add('gorillaCheerSound1').setVolume(0.5),
      this.sound.add('gorillaCheerSound2').setVolume(0.5),
      this.sound.add('gorillaCheerSound3').setVolume(0.5),
    ];
  
    this.humanCheerSounds = [
      this.sound.add('humanCheerSound1').setVolume(0.5),
      this.sound.add('humanCheerSound2').setVolume(0.5),
      this.sound.add('humanCheerSound3').setVolume(0.5),
    ];

    this.gorillaHitEmitter = this.add.particles(
      0, 0,
      'gorillaHitParticle',
      {
        speed: { min: -100, max: 100 },
        scale: { start: 0, end: 0.05 },
        lifespan: 300,
        quantity: 1,
        gravityY: 0,
        frequency: -1   // <- disable all automatic emission
      }
    );

    this.humanHitEmitter = this.add.particles(
      0, 0,
      'humanHitParticle',
      {
        speed: { min: -100, max: 100 },
        scale: { start: 0, end: 0.05 },
        lifespan: 300,
        quantity: 1,
        gravityY: 0,
        frequency: -1   // <- disable all automatic emission
      }
    );

    this.gorillaHitEmitter.setDepth(10);
    this.humanHitEmitter.setDepth(10);

    // Get grass color from CSS and convert to Phaser color integer
    const grassColor = Phaser.Display.Color.HexStringToColor(
      getComputedStyle(document.documentElement).getPropertyValue('--grassColor').trim()
    ).color;
  
    // Ground dimensions and position
    const groundWidth = this.sys.game.config.width;
    const groundHeight = 20;
    const groundY = this.sys.game.config.height - groundHeight / 2;
  
    // Add a visible ground rectangle
    this.add.rectangle(
      groundWidth / 2,
      groundY,
      groundWidth,
      groundHeight,
      grassColor
    );
  
    // Add a physics-enabled ground object
    this.ground = this.physics.add.sprite(
      groundWidth / 2,
      groundY,
    );
    this.ground.displayWidth = groundWidth;
    this.ground.displayHeight = groundHeight;
    this.ground.setImmovable(true);
    this.ground.body.allowGravity = false;
    
    // Add bounce property to the ground
    this.ground.body.setBounce(1);
  
    // Add gorilla group for managing multiple gorillas
    this.gorillas = this.physics.add.group({
      bounceY: 0.2 //
    });

    // Add men group for managing multiple men
    this.men = this.physics.add.group({
      bounceY: 0.3 //
    });
  
    // Set collider between gorillas/men and the ground with a callback
    this.physics.add.collider(this.gorillas, this.ground, null, null, this);
    this.physics.add.collider(this.men, this.ground, null, null, this);
    this.physics.add.collider(this.gorillas, this.men);
    this.physics.add.collider(this.gorillas, this.gorillas);
    this.physics.add.collider(this.men, this.men);
    // this.physics.add.overlap(this.gorillas, this.men, (gorilla, man) => {
    //   const gTouching = gorilla.body.blocked.down || gorilla.body.touching.down;
    //   const mTouching = man.body.blocked.down || man.body.touching.down;
    
    //   if (gTouching && mTouching) {
    //     const dx       = man.x - gorilla.x;
    //     const hwG      = gorilla.displayWidth  * gorilla.scaleX / 2;
    //     const hwM      = man.displayWidth      * man.scaleX     / 2;
    //     const overlapX = hwG + hwM - Math.abs(dx);
    
    //     if (overlapX > 0) {
    //       const sep = overlapX / 2;
    //       const dir = dx > 0 ? 1 : -1;
    
    //       // Move apart horizontally
    //       gorilla.x -= dir * sep;
    //       man.x     += dir * sep;
    
    //       // Sync body position
    //       gorilla.body.position.x = gorilla.x - hwG;
    //       man.body.position.x     = man.x     - hwM;
    
    //       // Dampen horizontal velocity
    //       gorilla.body.velocity.x *= 2;
    //       man.body.velocity.x     *= 2;
    //     }
    //   }
    // });

    // Enable debug for seeing physics bodies
    this.physics.world.createDebugGraphic();
    this.physics.world.setBounds(0, 0, 500, 500);

    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xff0000, 1); // red lines

    // Line at x = 0
    graphics.beginPath();
    graphics.moveTo(10, 0);
    graphics.lineTo(10, this.scale.height);
    graphics.strokePath();

    graphics.beginPath();
    graphics.moveTo(490, 0);
    graphics.lineTo(490, this.scale.height);
    graphics.strokePath();
  }
  
  // In GameScene's update method:
  update(time, delta) {
    // Update all the gorillas and men in the groups
    this.gorillas.getChildren().forEach(gorilla => gorilla.update(time));
    this.men.getChildren().forEach(man => man.update(time));

    const numGorillas = this.gorillas.countActive(true);
  const numMen = this.men.countActive(true);

  // Gorilla cheer when all men are dead
  if (numMen === 0 && numGorillas > 0 && !this.didGorillasCheer && gameProperties.hasSpawnedMen) {
    Phaser.Utils.Array.GetRandom(this.gorillaCheerSounds).play();
    this.didGorillasCheer = true;
    this.didHumansCheer = false;
  }

  // Human cheer when all gorillas are dead
  if (numGorillas === 0 && numMen > 0 && !this.didHumansCheer && gameProperties.hasSpawnedGorillas) {
    Phaser.Utils.Array.GetRandom(this.humanCheerSounds).play();
    this.didHumansCheer = true;
    this.didGorillasCheer = false;
  }

  // Reset cheer state if both exist
  if (numGorillas > 0 && numMen > 0) {
    this.didGorillasCheer = false;
    this.didHumansCheer = false;
    }
  }
}

const config = {
  type:Phaser.WEBGL,
  width: gameProperties.gameWidth,
  height: gameProperties.gameHeight,
  backgroundColor: rootStyles.getPropertyValue('--skyColor'),
  canvas:gameCanvas,
  physics: {
    default:"arcade",
    arcade:{
      gravity:{ y: gameProperties.gameGravity },
      debug: false,
    }
  },
  scene:[GameScene]
}

const game = new Phaser.Game(config);

document.getElementById('btn-play').addEventListener('click', () => {
  console.log('Play button clicked');
  // Later: start or resume the game
});

// main.js
document.getElementById('btn-spawn-man').addEventListener('click', () => {
  for (let i = 0; i < 100; i++) {
    const scene = window.gameScene;
    if (scene && scene.men) {
      const man = new Man(
        scene,
        Phaser.Math.Between(50, 450),
        100,
        gameProperties        // <-- pass it here
      );
      scene.men.add(man);
      gameProperties.gameMenAlive++;
      gameProperties.hasSpawnedMen = true;
      console.log('Man spawned');
    }
  } 
});


document.getElementById('btn-spawn-gorilla').addEventListener('click', () => {
  const scene = window.gameScene;
  if (scene && scene.gorillas) {
    const gorilla = new Gorilla(
      scene,
      Phaser.Math.Between(50, 450), // x
      100,                          // y
      gameProperties // Pass the entire gameProperties object
    );
    scene.gorillas.add(gorilla);
    gameProperties.gameGorillasAlive++; //ADDED THIS LINE
    gameProperties.hasSpawnedGorillas = true;
    console.log('Gorilla spawned');
  } else {
    console.warn('GameScene not ready yet.');
  }
});

document.getElementById('btn-clear').addEventListener('click', () => {
  const scene = window.gameScene;
  scene.didGorillasCheer = false;
  scene.didHumansCheer = false;
  gameProperties.hasSpawnedMen = false;
  gameProperties.hasSpawnedGorillas = false;   
  if (scene && scene.gorillas && scene.men) {
    console.log('Clear button clicked');

    scene.gorillas.getChildren().slice().forEach(gorilla => {
      gorilla.healthBarForeground?.destroy();
      gorilla.healthBarBackground?.destroy();
      gorilla.destroy();
    });
    
    scene.men.getChildren().slice().forEach(man => {
      man.healthBarForeground?.destroy();
      man.healthBarBackground?.destroy();
      man.destroy();
    });

    gameProperties.gameMenAlive = 0;
    gameProperties.gameGorillasAlive = 0;

    // Optionally, you can reset counters or any other game state here if needed.
  } else {
    console.warn('GameScene not ready yet.');
  }
});