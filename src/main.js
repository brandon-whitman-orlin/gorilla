import './style.css';
import Phaser from 'phaser';

import { Gorilla } from '../public/entities/gorilla'; // Adjust path as needed
import { Man } from '../public/entities/man'; // Adjust path as needed
import { StartScene } from '../public/menus/StartMenu.js';
import { PauseScene } from '../public/menus/PauseMenu.js';
import { AboutScene } from '../public/menus/AboutMenu.js';

const gameProperties = {
  gameWidth: window.innerWidth-160,
  gameHeight: window.innerHeight-160,
  gameGravity: 1000,
  gameSpeed: 1,
  gameMenAlive: 0,
  gameGorillasAlive: 0,
  hasSpawnedMen: false,
  hasSpawnedGorillas: false,
  showHealthBars: false,
  gameSFXVolume: 100,
  gameMusicVolume: 100,
  gameIsPaused: false,
}

window.gameProperties = gameProperties; // ✅ Add this line
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

    this.load.audio('music', 'assets/sounds/music.mp3');

    this.load.audio('humanSpawnSound1', 'assets/sounds/human_spawn_1.mp3');
    this.load.audio('humanSpawnSound2', 'assets/sounds/human_spawn_2.mp3');
    this.load.audio('gorillaSpawnSound1', 'assets/sounds/gorilla_spawn_1.mp3');
    this.load.audio('gorillaSpawnSound2', 'assets/sounds/gorilla_spawn_2.mp3');


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

    this.load.audio('humanDieSound1', 'assets/sounds/human_die_1.mp3');
    this.load.audio('humanDieSound2', 'assets/sounds/human_die_2.mp3');
    this.load.audio('gorillaDieSound1', 'assets/sounds/gorilla_die_1.mp3');
    this.load.audio('gorillaDieSound2', 'assets/sounds/gorilla_die_2.mp3');

    this.load.image('gorillaHitParticle', 'assets/gorilla-fist.png');
    this.load.image('humanHitParticle', 'assets/human-fist.png');
  }

  create() {
    // Expose the scene globally for button access
    window.gameScene = this;

    this.gorillaPunchSounds = [
      this.sound.add('gorillaPunchSound1').setVolume(0.005 * gameProperties.gameSFXVolume),
      this.sound.add('gorillaPunchSound2').setVolume(0.005 * gameProperties.gameSFXVolume),
      this.sound.add('gorillaPunchSound3').setVolume(0.005 * gameProperties.gameSFXVolume),
    ];
  
    this.humanPunchSounds = [
      this.sound.add('humanPunchSound1').setVolume(0.005 * gameProperties.gameSFXVolume),
      this.sound.add('humanPunchSound2').setVolume(0.005 * gameProperties.gameSFXVolume),
      this.sound.add('humanPunchSound3').setVolume(0.005 * gameProperties.gameSFXVolume),
    ];

    this.gorillaCheerSounds = [
      this.sound.add('gorillaCheerSound1').setVolume(0.005 * gameProperties.gameSFXVolume),
      this.sound.add('gorillaCheerSound2').setVolume(0.005 * gameProperties.gameSFXVolume),
      this.sound.add('gorillaCheerSound3').setVolume(0.005 * gameProperties.gameSFXVolume),
    ];
  
    this.humanCheerSounds = [
      this.sound.add('humanCheerSound1').setVolume(0.005 * gameProperties.gameSFXVolume),
      this.sound.add('humanCheerSound2').setVolume(0.005 * gameProperties.gameSFXVolume),
      this.sound.add('humanCheerSound3').setVolume(0.005 * gameProperties.gameSFXVolume),
    ];

    this.humanSpawnSounds = [
      this.sound.add('humanSpawnSound1').setVolume(0.005 * gameProperties.gameSFXVolume),
      this.sound.add('humanSpawnSound2').setVolume(0.005 * gameProperties.gameSFXVolume),
    ];

    this.gorillaSpawnSounds = [
      this.sound.add('gorillaSpawnSound1').setVolume(0.005 * gameProperties.gameSFXVolume),
      this.sound.add('gorillaSpawnSound2').setVolume(0.005 * gameProperties.gameSFXVolume),
    ];

    this.humanDieSounds = [
      this.sound.add('humanDieSound1').setVolume(0.005 * gameProperties.gameSFXVolume),
      this.sound.add('humanDieSound2').setVolume(0.005 * gameProperties.gameSFXVolume),
    ];

    this.gorillaDieSounds = [
      this.sound.add('gorillaDieSound1').setVolume(0.005 * gameProperties.gameSFXVolume),
      this.sound.add('gorillaDieSound2').setVolume(0.005 * gameProperties.gameSFXVolume),
    ];

    this.music = this.sound.add('music', {
      volume: 0.005 * gameProperties.gameMusicVolume
      // volume: 0 * gameProperties.gameMusicVolume
  });
  
  // Set up a listener for when the music finishes playing
  this.music.on('complete', () => {
      // Wait 5 seconds (5000 milliseconds), then play the music again
      this.time.delayedCall(5000, () => {
          this.music.play();
      });
  });
  
  // Start playing the music initially
  this.music.play();
  

  // Updated particle emitter code with scaling
  this.scaleFactor = Math.min(
    this.sys.game.config.width / 800,
    this.sys.game.config.height / 600
  );

  this.gorillaHitEmitter = this.add.particles(
    0, 0,
    'gorillaHitParticle',
    {
        speed: { min: -100 * this.scaleFactor, max: 100 * this.scaleFactor },
        scale: { start: 0, end: 0.05 * this.scaleFactor },
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
        speed: { min: -100 * this.scaleFactor, max: 100 * this.scaleFactor },
        scale: { start: 0, end: 0.05 * this.scaleFactor },
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
    // this.physics.world.createDebugGraphic();

    // const graphics = this.add.graphics();
    // graphics.lineStyle(2, 0xff0000, 1); // red lines

    // // Line at x = 0
    // graphics.beginPath();
    // graphics.moveTo(10, 0);
    // graphics.lineTo(10, this.scale.height);
    // graphics.strokePath();

    // graphics.beginPath();
    // graphics.moveTo(gameProperties.gameWidth-10, 0);
    // graphics.lineTo(gameProperties.gameWidth-10, this.scale.height);
    // graphics.strokePath();
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
  scene: [StartScene, GameScene, PauseScene, AboutScene]
}

const game = new Phaser.Game(config);

// main.js
document.getElementById('btn-spawn-man').addEventListener('click', () => {
  // for (let i = 0; i < 100; i++) {
    const scene = window.gameScene;
    if (scene && scene.men) {
      const man = new Man(
        scene,
        Phaser.Math.Between(10, gameProperties.gameWidth-10),
        100,
        gameProperties        // <-- pass it here
      );
      scene.men.add(man);
      gameProperties.gameMenAlive++;
      gameProperties.hasSpawnedMen = true;

      const sounds = scene.humanSpawnSounds;
      const randomSound = Phaser.Utils.Array.GetRandom(sounds);
      randomSound.play();
      console.log('Man spawned');
    }
  // } 
});


document.getElementById('btn-spawn-gorilla').addEventListener('click', () => {
  const scene = window.gameScene;
  if (scene && scene.gorillas) {
    const gorilla = new Gorilla(
      scene,
      Phaser.Math.Between(10, gameProperties.gameWidth-10), // x
      100,                          // y
      gameProperties // Pass the entire gameProperties object
    );
    scene.gorillas.add(gorilla);
    gameProperties.gameGorillasAlive++; //ADDED THIS LINE
    gameProperties.hasSpawnedGorillas = true;

    const sounds = scene.gorillaSpawnSounds;
    const randomSound = Phaser.Utils.Array.GetRandom(sounds);
    randomSound.play();
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

document.getElementById('btn-show-health').addEventListener('click', function () {
  if (this.textContent === 'Show Health') {
    this.textContent = 'Hide Health';
    gameProperties.showHealthBars = true;
  } else {
    this.textContent = 'Show Health';
    gameProperties.showHealthBars = false;
  }
});

document.getElementById('btn-play').addEventListener('click', function () {
  const scene = window.gameScene;
  if (this.textContent === 'Play') {
    this.textContent = 'Pause';
    gameProperties.gameIsPaused = false;
    scene.scene.resume();
  } else {
    this.textContent = 'Play';
    gameProperties.gameIsPaused = true;
    scene.scene.launch('scene-pause');
    scene.scene.pause(gameProperties);
  }
});

document.getElementById('btn-about').addEventListener('click', function () {
  const scene = window.gameScene;
  if (scene) {
    gameProperties.gameIsPaused = true;
    scene.scene.launch('scene-about');
    scene.scene.pause('scene-game');
  }
});


// SFX Volume Slider
document.getElementById('sfx-volume').addEventListener('input', (event) => {
  const newVolume = parseInt(event.target.value, 10);
  gameProperties.gameSFXVolume = newVolume;

  // Update all SFX volumes
  const scene = window.gameScene;
  if (scene) {
    const volumeScale = 0.005 * newVolume;
    const updateVolume = (sounds) => {
      sounds?.forEach(sound => sound.setVolume(volumeScale));
    };
    
    updateVolume(scene.gorillaPunchSounds);
    updateVolume(scene.humanPunchSounds);
    updateVolume(scene.gorillaCheerSounds);
    updateVolume(scene.humanCheerSounds);
    updateVolume(scene.gorillaSpawnSounds);
    updateVolume(scene.humanSpawnSounds);
    updateVolume(scene.gorillaDieSounds);
    updateVolume(scene.humanDieSounds);
  }
});

// Music Volume Slider
document.getElementById('music-volume').addEventListener('input', (event) => {
  const newVolume = parseInt(event.target.value, 10);
  gameProperties.gameMusicVolume = newVolume;

  const scene = window.gameScene;
  if (scene?.music) {
    scene.music.setVolume(0.005 * newVolume);
  }
});

