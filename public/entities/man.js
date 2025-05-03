// Man.js
export class Man extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, gameProperties) {
        const randomMan = `man${Phaser.Math.Between(1, 18)}`;
        super(scene, x, y, randomMan);

        this.scene = scene;
        this.gameProperties = gameProperties;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Calculate scale factor based on screen dimensions
        this.scaleFactor = Math.min(
            scene.sys.game.config.width / 800,
            scene.sys.game.config.height / 600
        );

        // Apply scaling to the sprite
        this.setScale(0.09 * this.scaleFactor);
        this.setOrigin(0.5, 1);
        this.body.setCollideWorldBounds(true);
        this.body.setVelocityY(0);
        this.body.setAllowGravity(true);
        this.body.setSize(this.width * 0.1, this.height * 1);
        this.body.setMass(1); // Man
        
        // Scale velocities based on screen size
        const maxVelocity = 50 * this.scaleFactor;
        this.body.setMaxVelocity(maxVelocity, maxVelocity);

        const scaledWidth = this.width * this.scaleX;
        this.halfWidth = scaledWidth / 2;
        this.gameWidth = scene.sys.game.config.width;

        this.maxHealth = 100;
        this.health = this.maxHealth;

        // Health bar graphics
        this.healthBarBackground = scene.add.graphics();
        this.healthBarForeground = scene.add.graphics();

        // Scale pacing speed with screen size
        this.pacingSpeed = 20 * this.scaleFactor;
        this.pacingDirection = 0; // 0 means not moving
        this.nextPacingDecisionTime = 0;
        this.currentBehavior = 'pacing'; // Default behavior is pacing
        this.behaviorDuration = 0; // Time until switching to a new behavior

        this.lastGorillaAliveZeroTime = null;
        this.lastAttackTime = 0;
        this.transitioning = false;  // Flag to prevent recursive behavior transitions
        this.isDead = false;
    }

    update(time) {
        if (this.isDead) return;
    
        // --- Handle Pause ---
        if (this.gameProperties.gameIsPaused) {
            if (!this._wasPaused) {
                // First frame of pause
                this._wasPaused = true;
    
                this.body.setVelocity(0, 0);
                this.body.allowGravity = false;
                this.body.moves = false; // Fully freeze physics
                this.anims.stop?.(); // Stop animations if present
    
                this.currentBehavior = 'paused';
            }
    
            this.updateHealthBar(); // Keep health bar updated
            return;
        } else if (this._wasPaused) {
            // First frame after unpausing
            this._wasPaused = false;
    
            this.body.allowGravity = true;
            this.body.moves = true;
    
            if (this.currentBehavior === 'paused') {
                this.newBehavior(); // Resume behavior
            }
        }
    
        // --- Normal Active Update ---
        this.updateHealthBar();
    
        if (this.transitioning) {
            return; // Don't do anything mid-behavior-switch
        }
    
        if (this.gameProperties.gameGorillasAlive > 0 && this.currentBehavior !== 'attacking') {
            this.newBehavior();
            return;
        }
    
        // Execute current behavior
        if (this.currentBehavior === 'pacing') {
            this.handlePacing(time);
        } else if (this.currentBehavior === 'attacking') {
            this.handleAttacking(time);
        } else if (this.currentBehavior === 'celebrating') {
            this.handleCelebrating(time);
        }
    
        // Clamp to world bounds if falling out
        if (
            this.body.x > this.gameProperties.gameWidth ||
            this.body.x < 0 ||
            this.body.y > this.gameProperties.gameHeight ||
            this.body.y < 0
        ) {
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
    
        // Show/hide health bars
        if (this.gameProperties.showHealthBars) {
            this.healthBarForeground.visible = true;
            this.healthBarBackground.visible = true;
        } else {
            this.healthBarForeground.visible = false;
            this.healthBarBackground.visible = false;
        }
    }

    updateHealthBar() {
        // Scale health bar size based on screen dimensions
        const barWidth = 40 * this.scaleFactor;
        const barHeight = 6 * this.scaleFactor;
        const x = this.x - barWidth / 2;
        const y = this.y - this.displayHeight - (10 * this.scaleFactor);
    
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
        if (this.gameProperties.gameIsPaused || this.isDead) return;

        if (this.transitioning) {
            return;  // Prevent recursive calls if already transitioning
        }

        this.transitioning = true;  // Set flag to indicate we are transitioning
        this.updateGameStatus(); // keep internal tracking updated
    
        const behaviors = [];
    
        // Attack if gorilla are alive, otherwise consider pacing
        if (this.gameProperties.gameGorillasAlive > 0) {
            behaviors.push('attacking');
        }
    
        const timeSinceZero = this.scene.time.now - (this.lastGorillaAliveZeroTime ?? -99999);
        if (this.lastGorillaAliveZeroTime !== null && timeSinceZero <= 5000) {
            behaviors.push('celebrating');
        }
    
        // If no gorillas alive, allow pacing behavior
        if (this.gameProperties.gameGorillasAlive === 0) {
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
        if (this.gameProperties.gameIsPaused || this.isDead) return;

        if (this.gameProperties.gameGorillasAlive > 0) {
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
                    //console.log('Man is choosing new behavior');
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
        this.x = Phaser.Math.Clamp(this.x, 30 * this.scaleFactor, this.gameProperties.gameWidth - (30 * this.scaleFactor));
        this.y = Phaser.Math.Clamp(this.y, 0, this.gameProperties.gameHeight - (15 * this.scaleFactor));
    }

    handleAttacking(time) {
        if (this.gameProperties.gameIsPaused || this.isDead) return;

        if (this.isDead) return;
        const gorillas = this.scene.gorillas.children.entries;
    
        if (gorillas.length === 0) {
            //console.log('No gorillas to attack.');
            this.newBehavior();
            return;
        }
    
        let closestGorilla = null;
        let closestDistance = Infinity;
    
        for (const gorilla of gorillas) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, gorilla.x, gorilla.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestGorilla = gorilla;
            }
        }
    
        if (closestGorilla) {
            // Scale attack distance thresholds based on screen size
            const horizontalThreshold = 50 * this.scaleFactor;
            const verticalThreshold = 80 * this.scaleFactor;
            const horizontalDistance = Math.abs(this.x - closestGorilla.x);
            const verticalDistance = Math.abs(this.y - closestGorilla.y);
        
            if (horizontalDistance <= horizontalThreshold && verticalDistance <= verticalThreshold) {
                this.body.setVelocityX(0); // Stop moving when close enough
        
                const manBounds = this.getBounds();
                const gorillaBounds = closestGorilla.getBounds();
        
                if (Phaser.Geom.Rectangle.Overlaps(manBounds, gorillaBounds)) {
                    if (time - this.lastAttackTime >= 1000) {
                        closestGorilla.takeDamage(5);

                        // Apply scaled knockback to the man
                        const knockbackDistance = Phaser.Math.Between(0, 40 * this.scaleFactor);
                        const knockbackDirection = this.x > closestGorilla.x ? -1 : 1;
                        const rawX = closestGorilla.x + (knockbackDistance * knockbackDirection);
                        const clampedX = Phaser.Math.Clamp(
                          rawX,
                          this.scene.physics.world.bounds.left + (5 * this.scaleFactor),
                          this.scene.physics.world.bounds.right - (5 * this.scaleFactor)
                        );
                        
                        this.scene.tweens.add({
                          targets: closestGorilla,
                          x: clampedX,
                          y: closestGorilla.y - Phaser.Math.Between(0, 20 * this.scaleFactor),
                          ease: 'Power2',
                          duration: 200,
                        });
        
                        this.scene.humanHitEmitter.emitParticleAt(
                            closestGorilla.x,
                            closestGorilla.y - closestGorilla.displayHeight / 2
                        );
        
                        const sounds = this.scene.humanPunchSounds;
                        const randomSound = Phaser.Utils.Array.GetRandom(sounds);
                        randomSound.play();
        
                        this.lastAttackTime = time;
                    }
                }
            } else {
                const direction = Math.sign(closestGorilla.x - this.x); // -1 or 1
                this.body.setVelocityX(direction * 100 * this.scaleFactor); // Rush toward the gorilla with scaled speed
                this.setFlipX(direction > 0); // Face the target
            }
        }
        
    
        // After behavior duration, stop and choose new behavior
        if (time > this.behaviorDuration) {
            //console.log('Man ends attack');
            this.body.setVelocityX(0); // Stop moving after attack duration
            this.newBehavior();
        }
        this.x = Phaser.Math.Clamp(this.x, 30 * this.scaleFactor, this.gameProperties.gameWidth - (30 * this.scaleFactor));
        this.y = Phaser.Math.Clamp(this.y, 0, this.gameProperties.gameHeight - (15 * this.scaleFactor));
    }

    handleCelebrating(time) {
        if (this.gameProperties.gameIsPaused || this.isDead) return;

        if (!this.nextJumpTime || time > this.nextJumpTime) {
            if (this.body.blocked.down) { // Only jump if on the ground
                this.setVelocityY(-300 * this.scaleFactor); // Scale jump height
                //console.log('Man jumps in celebration!');
            }
            this.nextJumpTime = time + 600; // Jump every 600ms
        }
    
        if (time > this.behaviorDuration) {
            //console.log('Man finishes celebrating and switches to new behavior');
            this.nextJumpTime = null;
            this.newBehavior();
        }
        this.x = Phaser.Math.Clamp(this.x, 30 * this.scaleFactor, this.gameProperties.gameWidth - (30 * this.scaleFactor));
        this.y = Phaser.Math.Clamp(this.y, 0, this.gameProperties.gameHeight - (15 * this.scaleFactor));
    }

    handlePaused(time) {
        //console.log('Man is paused!');
    }

    takeDamage(amount) {
        this.health -= amount;

        if (this.isDead) return; // already dead, do nothing

        if (this.health <= 0 && !this.isDead) {
            this.isDead = true;
            this.healthBarBackground.destroy();
            this.healthBarForeground.destroy();
            this.gameProperties.gameMenAlive--;
    
            const sounds = this.scene.humanDieSounds;
            const randomSound = Phaser.Utils.Array.GetRandom(sounds);
            randomSound.play();
    
            this.body.setVelocity(0, 0);
            this.body.setAllowGravity(false);
            this.body.enable = false;
    
            this.setDepth(10);
            this.setOrigin(0.5, 1);
    
            // Capture scene reference safely
            const scene = this.scene;
    
            const fallAngleDeg = Phaser.Math.RND.pick([
                Phaser.Math.Between(-110, -75),
                Phaser.Math.Between(75, 110)
            ]);
            const fallAngleRad = Phaser.Math.DegToRad(fallAngleDeg);
            const fallDistance = 80 * this.scaleFactor;
    
            scene.tweens.add({
                targets: this,
                rotation: fallAngleRad,
                y: this.y + fallDistance,
                duration: 600,
                ease: 'Back.easeOut',
                onComplete: () => {
                    // Check if the sprite still exists before using scene/time
                    if (this && this.active && scene && scene.time) {
                        scene.time.delayedCall(800, () => {
                            this.destroy();
                        });
                    }
                }
            });
        }
    }

    updateGameStatus() {
        if (this.gameProperties.gameGorillasAlive === 0 && this.lastGorillaAliveZeroTime === null) {
          this.lastGorillaAliveZeroTime = this.scene.time.now;
        } else if (this.gameProperties.gameGorillasAlive > 0) {
          this.lastGorillaAliveZeroTime = null;
        }
      }
}