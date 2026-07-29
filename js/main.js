import { Game } from './Game.js';

let gameInstance = null;

function initGame() {
  if (!gameInstance) {
    gameInstance = new Game();
    window.game = gameInstance;
    gameInstance.start();
  }
}

// Global F12 Console Command (Guaranteed Instant Activation)
window.ac = function() {
  if (window.game) {
    if (!window.game.player || window.game.state !== 'PLAYING') {
      window.game.startGame('ArenaCloser', '#ffe869');
    }
    window.game.spawnAC();
    return '🟡 ARENA CLOSER ACTIVATED!';
  }
  return 'Initializing Arena Closer...';
};

window.spawnAC = window.ac;

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
