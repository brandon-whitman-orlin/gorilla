import Phaser from 'phaser';

const funFacts = [
  {
    factStart: "Around 1,063 Gorillas exist in the wild",
    factBody: "There are two species of Gorilla (Eastern/Western), both of which are endangered."
  },
  {
    factStart: "We share around 98% of our DNA with gorillas",
    factBody: "This makes them especially vulnerable to human illnesses."
  },
  {
    factStart: "Gorillas are the biggest, most powerful living primate",
    factBody: "The average silverback gorilla can weigh up to 396.83 lbs (180kg), and measure over 5'5\" (170cm) tall on all fours."
  },
  {
    factStart: "Gorillas have 16 different types of call",
    factBody: "This includes short barks when they're alarmed or curious, and roaring/chest-beating to intimidate rivals."
  },
  {
    factStart: "Gorillas can live to over 40 years old",
    factBody: "Gorillas are considered \"infants\" until 3.5 years old, only reaching \"Adulthood\" at around 8 years."
  }
];

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('scene-pause');
  }

  create() {
    // Hide game UI
    const uiDiv = document.getElementById('ui');
    if (uiDiv) uiDiv.style.display = 'none';

    // Show pause menu
    const pauseMenu = document.getElementById('pauseMenu');
    if (pauseMenu) pauseMenu.style.display = 'flex';

    // 🔀 Pick a random fun fact
    const randomFact = Phaser.Utils.Array.GetRandom(funFacts);
    const factStartEl = document.querySelector('#funFact h4');
    const factBodyEl = document.querySelector('#funFact p');

    if (factStartEl) factStartEl.textContent = randomFact.factStart;
    if (factBodyEl) factBodyEl.textContent = randomFact.factBody;

    // Wire up resume button from HTML
    const resumeButton = document.getElementById('btn-resume');
    if (resumeButton) {
      resumeButton.onclick = () => {
        // Hide pause menu
        pauseMenu.style.display = 'none';

        // Show game UI again
        if (uiDiv) {
            uiDiv.style.display = window.innerWidth <= 300 ? 'grid' : 'flex';
          }

        // Resume game
        this.scene.stop(); // Stop PauseScene
        this.scene.resume('scene-game');

        // Reset pause button label
        const playButton = document.getElementById('btn-play');
        if (playButton) {
          playButton.textContent = 'Pause';
          window.gameProperties.gameIsPaused = false;
        }
      };
    }
  }
}
