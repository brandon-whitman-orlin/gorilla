export class Gorilla extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, gameProperties) {
        super(scene, x, y, 'gorilla');

        this.scene = scene;
        
        this.gameProperties = gameProperties;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(0.1);
        this.setOrigin(0.5, 1);
        this.body.setCollideWorldBounds(true);
        this.body.setVelocityY(0);
        this.body.setAllowGravity(true);
        this.body.setSize(this.width * 0.75, this.height * 0.9);
        this.body.setMass(5); // Gorilla

        const scaledWidth = this.width * this.scaleX;
        this.halfWidth = scaledWidth / 2;
        this.gameWidth = scene.sys.game.config.width;

        this.maxHealth = 1000;
        this.health = this.maxHealth;

        // Health bar graphics
        this.healthBarBackground = scene.add.graphics();
        this.healthBarForeground = scene.add.graphics();

        this.pacingSpeed = 50;
        this.pacingDirection = 0; // 0 means not moving
        this.nextPacingDecisionTime = 0;
        this.currentBehavior = 'pacing'; // Default behavior is pacing
        this.behaviorDuration = 0; // Time until switching to a new behavior

        this.lastMenAliveZeroTime = null;
        this.lastAttackTime = 0;
        this.transitioning = false;  // Flag to prevent recursive behavior transitions
    }

    update(time) {
        this.updateHealthBar();

        if (this.transitioning) {
            return; // Do nothing if we are transitioning to another behavior
        }

        // 🧠 Immediately switch to attacking if a man is alive and not already attacking
        if (this.gameProperties.gameMenAlive > 0 && this.currentBehavior !== 'attacking') {
            this.newBehavior();
            return; // Wait for new behavior to take over
        }

        if (this.currentBehavior === 'pacing') {
            this.handlePacing(time);
        } else if (this.currentBehavior === 'attacking') {
            this.handleAttacking(time);
        } else if (this.currentBehavior === 'celebrating') {
            this.handleCelebrating(time);
        } else if (this.currentBehavior === 'paused') {
            // Do nothing
        }

        if (this.body.x > this.gameProperties.gameWidth || this.body.x < 0 || this.body.y > this.gameProperties.gameHeight || this.body.y < 0) {
            // console.log("Gorilla fell out of the world.")
            // this.healthBarBackground.destroy();
            // this.healthBarForeground.destroy();
            // this.gameProperties.gameGorillasAlive--;  // ✅ Correct access
            // this.destroy();
            if (this.body.x > this.gameProperties.gameWidth) {
                this.body.x = this.gameProperties.gameWidth;
            } else if (this.body.x < 0) {
                this.body.x = 0;
            } else if (this.body.y > this.gameProperties.gameHeight) {
                this.body.y = this.gameProperties.gameHeight;
            } else if (this.body.y < 0) {
                this.body.y = 0;
            }
        }
    }

    updateHealthBar() {
        const barWidth = 40;
        const barHeight = 6;
        const x = this.x - barWidth / 2;
        const y = this.y - this.displayHeight - 10;
    
        const healthRatio = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
    
        // Determine color based on health percentage
        let red, green;
        if (healthRatio > 0.5) {
            // Between Green (100%) and Yellow (50%)
            const t = (healthRatio - 0.5) * 2; // Normalize to 0–1
            red = Math.floor(255 * (1 - t));   // Red goes from 0 to 255
            green = 255;                       // Green stays at 255
        } else {
            // Between Yellow (50%) and Red (0%)
            const t = healthRatio * 2;         // Normalize to 0–1
            red = 255;                         // Red stays at 255
            green = Math.floor(255 * t);       // Green goes from 255 to 0
        }
    
        const color = (red << 16) | (green << 8); // Convert RGB to hex
    
        this.healthBarBackground.clear();
        this.healthBarBackground.fillStyle(0x000000, 0.5);
        this.healthBarBackground.fillRect(x, y, barWidth, barHeight);
    
        this.healthBarForeground.clear();
        this.healthBarForeground.fillStyle(color);
        this.healthBarForeground.fillRect(x, y, barWidth * healthRatio, barHeight);
    }

    newBehavior() {
         if (this.transitioning) {
            return;  // Prevent recursive calls if already transitioning
        }

        this.transitioning = true;  // Set flag to indicate we are transitioning
        this.updateGameStatus(); // keep internal tracking updated
    
        const behaviors = [];
    
        // Attack if men are alive, otherwise consider pacing
        if (this.gameProperties.gameMenAlive > 0) {
            behaviors.push('attacking');
        }
    
        const timeSinceZero = this.scene.time.now - (this.lastMenAliveZeroTime ?? -99999);
        if (this.lastMenAliveZeroTime !== null && timeSinceZero <= 5000) {
            behaviors.push('celebrating');
        }
    
        // If no men alive, allow pacing behavior
        if (this.gameProperties.gameMenAlive === 0) {
            behaviors.push('pacing');
        }

        //console.log(behaviors);
    
        const next = Phaser.Utils.Array.GetRandom(behaviors);
    
        const wasFacingRight = this.pacingDirection > 0;
        this.body.setVelocityX(0);
        this.pacingDirection = 0;
        this.setFlipX(wasFacingRight);
    
        this.nextPaceTime = null;
    
        //console.log('New behavior chosen:', next);
        this.currentBehavior = next;
    
        if (next === 'attacking' || next === 'celebrating') {
            this.behaviorDuration = this.scene.time.now + 3000;
        }
    
        switch (next) {
            case 'pacing':
                this.handlePacing(); break;
            case 'attacking':
                this.handleAttacking(this.scene.time.now); break;
            case 'celebrating':
                this.handleCelebrating(this.scene.time.now); break;
        }
        this.transitioning = false;  // Reset the flag once the transition is complete
    }

    handlePacing(time) {
        if (this.gameProperties.gameMenAlive > 0) {
            this.newBehavior(); // This will prioritize attacking
            return;
        }

        if (this.currentBehavior === 'attacking') {
          // Prevent pacing if attacking
          return;
        }
    
        const leftBoundary = this.halfWidth;
        const rightBoundary = this.gameWidth - this.halfWidth;
    
        if (!this.nextPaceTime || time > this.nextPaceTime) {
            const randomDelay = Phaser.Math.Between(500, 2000);
            this.nextPaceTime = time + randomDelay;
    
            const action = Phaser.Math.Between(0, 3);
    
            switch (action) {
                case 0:
                    this.body.setVelocityX(0);
                    this.pacingDirection = 0;
                    break;
                case 1:
                    this.pacingDirection = -1;
                    break;
                case 2:
                    this.pacingDirection = 1;
                    break;
                case 3:
                    //console.log('Gorilla is choosing new behavior');
                    this.newBehavior();
                    return;
            }
        }
    
        if (this.x <= leftBoundary) {
            this.x = leftBoundary;
            this.pacingDirection = 1;
        } else if (this.x >= rightBoundary) {
            this.x = rightBoundary;
            this.pacingDirection = -1;
        }
    
        if (this.pacingDirection !== 0) {
            this.body.setVelocityX(this.pacingSpeed * this.pacingDirection);
        }
    
        this.setFlipX(this.pacingDirection > 0);
        this.x = Phaser.Math.Clamp(this.x, 0, this.gameProperties.gameWidth);
        this.y = Phaser.Math.Clamp(this.y, 0, this.gameProperties.gameHeight - 15);
    }

    handleAttacking(time) {
        const men = this.scene.men.children.entries;
    
        if (men.length === 0) {
            //console.log('No men to attack.');
            this.newBehavior();
            return;
        }
    
        let closestMan = null;
        let closestDistance = Infinity;
    
        for (const man of men) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, man.x, man.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestMan = man;
            }
        }
    
        if (closestMan) {
            const horizontalDistance = Math.abs(this.x - closestMan.x);
            const verticalDistance = Math.abs(this.y - closestMan.y);
        
            if (horizontalDistance <= 40 && verticalDistance <= 80) {
                if (this.x > closestMan.x) {
                    this.setFlipX(-1); // Flip to face direction
                } else {
                    this.setFlipX(1); // Flip to face direction
                }
                this.body.setVelocityX(0); // Stop moving when too close
                //console.log('Gorilla reached the man.');
    
                // Get the Gorilla's and the Man's bounding boxes
                const gorillaBounds = this.getBounds();
                const manBounds = closestMan.getBounds();
    
                // Check if the bounds overlap
                if (Phaser.Geom.Rectangle.Overlaps(gorillaBounds, manBounds)) {
                    if (time - this.lastAttackTime >= 1000) { // 1000ms = 1 second
                        closestMan.takeDamage(50);

                        // Apply knockback to the man
                        const knockbackDistance = Phaser.Math.Between(25, 100);
                        const knockbackDirection = this.x > closestMan.x ? -1 : 1;
                        const rawX = closestMan.x + (knockbackDistance * knockbackDirection);
                        const clampedX = Phaser.Math.Clamp(
                          rawX,
                          this.scene.physics.world.bounds.left + 5,
                          this.scene.physics.world.bounds.right - 5
                        );
                        
                        this.scene.tweens.add({
                          targets: closestMan,
                          x: clampedX,
                          y: closestMan.y - Phaser.Math.Between(10, 70),
                          ease: 'Power2',
                          duration: 200,
                        });

                        // Particles
                        this.scene.gorillaHitEmitter.emitParticleAt(
                            closestMan.x,
                            closestMan.y - closestMan.displayHeight / 2
                        );
                                                  
                        // Attack sound
                        const sounds = this.scene.gorillaPunchSounds;
                        const randomSound = Phaser.Utils.Array.GetRandom(sounds);
                        randomSound.play();

                        //console.log('Gorilla deals 50 damage to the man!');
                        this.lastAttackTime = time; // Reset attack timer
                    }
                }
            } else {
                const direction = Math.sign(closestMan.x - this.x); // -1 or 1
                this.body.setVelocityX(direction * 100); // Rush toward the man
                this.setFlipX(direction > 0); // Flip to face direction
            }
        }
    
        // After behavior duration, stop and choose new behavior
        if (time > this.behaviorDuration) {
            //console.log('Gorilla ends attack');
            this.body.setVelocityX(0); // Stop moving after attack duration
            this.newBehavior();
        }
        this.x = Phaser.Math.Clamp(this.x, 0, this.gameProperties.gameWidth);
        this.y = Phaser.Math.Clamp(this.y, 0, this.gameProperties.gameHeight - 15);
    }

    handleCelebrating(time) {
        if (!this.nextJumpTime || time > this.nextJumpTime) {
            if (this.body.blocked.down) { // Only jump if on the ground
                this.setVelocityY(-300); // Adjust this value as needed
                //console.log('Gorilla jumps in celebration!');
            }
            this.nextJumpTime = time + 600; // Jump every 600ms
        }
    
        if (time > this.behaviorDuration) {
            //console.log('Gorilla finishes celebrating and switches to new behavior');
            this.nextJumpTime = null;
            this.newBehavior();
        }
        this.x = Phaser.Math.Clamp(this.x, 0, this.gameProperties.gameWidth);
        this.y = Phaser.Math.Clamp(this.y, 0, this.gameProperties.gameHeight - 15);
    }

    handlePaused(time) {
        //console.log('Gorilla is paused!');
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.healthBarBackground.destroy();
            this.healthBarForeground.destroy();
            this.gameProperties.gameGorillasAlive--;  // ✅ Correct access
            this.destroy();
        }
    }

    updateGameStatus() {
        if (this.gameProperties.gameMenAlive === 0 && this.lastMenAliveZeroTime === null) {
          this.lastMenAliveZeroTime = this.scene.time.now;
        } else if (this.gameProperties.gameMenAlive > 0) {
          this.lastMenAliveZeroTime = null;
        }
      }
}
