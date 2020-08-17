import { GameContainer } from './src/engine/game-container';
import { getInitialState } from './src/engine/state';
import { startGameServer } from './src/api';

const gameContainer = new GameContainer(getInitialState([]));

startGameServer();
