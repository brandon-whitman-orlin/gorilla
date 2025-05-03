import Phaser from 'phaser';

export class StartScene extends Phaser.Scene {
  constructor() {
    super('scene-start');
  }

  create() {
    // Show the start menu
    const startMenu = document.getElementById('startMenu');
    if (startMenu) {
      startMenu.style.display = 'flex'; // or 'block', depending on layout
    }

    // Wire up the start button from HTML
    const startButton = document.getElementById('btn-start');
    if (startButton) {
      startButton.onclick = () => {
        // Hide start menu
        startMenu.style.display = 'none';

        // Show game UI
        const uiDiv = document.getElementById('ui');
        if (uiDiv) {
            uiDiv.style.display = window.innerWidth <= 300 ? 'grid' : 'flex';
          }

        // Start the game scene
        this.scene.start('scene-game');
      };
    }
  }
}
