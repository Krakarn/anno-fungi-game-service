import { GameContainer } from './src/engine/game-container';
import { getInitialState } from './src/engine/state';
import { run } from './src/api';

const gameContainer = new GameContainer(getInitialState([]));

console.log(gameContainer.getLatestState());

run();
