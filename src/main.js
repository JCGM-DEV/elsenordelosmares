import { GameEngine } from './engine.js'
import storyData from './data/story.json'

function init() {
  try {
    const engine = new GameEngine(storyData, 'app');
    engine.init();
  } catch (err) {
    console.error('Game initialization failed:', err);
    // Let the failsafe in index.html handle the UI if this fails
  }
}

document.addEventListener('DOMContentLoaded', init);
