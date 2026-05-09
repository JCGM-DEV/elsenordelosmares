import { GameEngine } from './engine.js'

async function init() {
  try {
    const response = await fetch('./src/data/story.json');
    if (!response.ok) throw new Error('Failed to load story data');
    const storyData = await response.json();
    
    const engine = new GameEngine(storyData, 'app');
    engine.init();
  } catch (err) {
    console.error('Game initialization failed:', err);
    // Let the failsafe in index.html handle the UI if this fails
  }
}

document.addEventListener('DOMContentLoaded', init);

