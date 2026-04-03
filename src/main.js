import './style.css'
import { GameEngine } from './engine.js'
import storyData from './data/story.json'

document.addEventListener('DOMContentLoaded', () => {
  const engine = new GameEngine(storyData, 'app');
  engine.init();
});
