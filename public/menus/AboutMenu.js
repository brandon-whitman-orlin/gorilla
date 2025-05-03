import Phaser from 'phaser';

export class AboutScene extends Phaser.Scene {
  constructor() {
    super('scene-about');
  }

  create() {
    // Hide game UI
    const uiDiv = document.getElementById('ui');
    if (uiDiv) uiDiv.style.display = 'none';

    // Show about menu
    const aboutMenu = document.getElementById('aboutMenu');
    if (aboutMenu) aboutMenu.style.display = 'flex';

    // Wire up resume button from HTML
    const resumeButton = document.getElementById('btn-resume-2');
    if (resumeButton) {
        resumeButton.onclick = () => {
            // Hide about menu
            aboutMenu.style.display = 'none';
          
            // Resume the game
            gameProperties.gameIsPaused = false;
            this.scene.resume('scene-game'); // ✅ Corrected this line
            this.scene.stop();               // Stop the AboutScene
          
            // Show game UI again
            if (uiDiv) uiDiv.style.display = 'flex';
          
            // Reset about button label (if you have one)
            const playButton = document.getElementById('btn-play');
            if (playButton) {
              playButton.textContent = 'Pause';
            }
          };
    }
  }
}