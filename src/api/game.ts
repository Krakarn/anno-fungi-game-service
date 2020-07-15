import { IGameInstance, IClient, ITicket } from './state';
import { getInitialState } from '../engine/state';
import { GameContainer } from '../engine/game-container';
import { findCard } from '../engine/cards';

export const applyEffect = (
  game: IGameInstance,
  client: IClient,
  id: number,
): void => {
  const card = findCard(id);

  if (!card) {
    console.error(`card not found ${id}`);
    return;
  }

  const nextState = game.container.next(card.reducer);
  emitToGameClients(game, 'NEW_STATE', nextState);

  console.log(`client ${client.id} played card ${card.name}`);
};

export const joinGame = (
  games: IGameInstance[],
  game: IGameInstance,
  client: IClient,
  ticket: ITicket,
): void => {
  const foundGame = games.find(e => e.id === ticket.gameId);
  if (!ticket.deck) { return; }  // No deck
  if (!foundGame) { return; } // Game does not exist
  client.deck = ticket.deck;
  game = foundGame;
  if (game.clients.length >= game.capacity) { return; } // Game is full
  game.clients.push(client);
  console.log(`client ${client.id} joined game ${game.id}`);
  if (game.clients.length === game.capacity) {
    startGame(game);
  }
}

export const startGame = (game: IGameInstance): void => {
  // TODO: initialize decks etc.
  const playerAssets = game.clients.map(client => ({deckList: client.deck || []}));
  const initialGameState = getInitialState(playerAssets);
  game.container = new GameContainer(initialGameState);
  emitToGameClients(game, 'GAME_STARTED', game.container.getLatestState());
  console.log(`game ${game.id} has been started`);
}

export const createGame = (
  io: SocketIO.Server,
  games: IGameInstance[],
  id: string,
): void => {
  const game: IGameInstance = {
    id,
    capacity: 2,
    clients: [],
  };
  games.push(game);
  io.emit('GAME_CREATED_CONFIRM', id);
  console.log(`game ${id} created`);
}

export const emitToGameClients = (game: IGameInstance, event: string, data: any): void => {
  game.clients.forEach(client => client.socket.emit(event, data));
}
