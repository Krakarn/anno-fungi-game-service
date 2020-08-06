import 'ws';
import * as socketIo from 'socket.io';
import { v1 as uuid } from 'uuid';
import { IGameInstance, IClient } from './state';
import { ProcessClientMessageMap } from './messages/client';
import { createGame, joinGame, applyEffect } from './game';
import { createMessageHandler } from './messages';

const PORT = 8079;

export const run = (port: number = PORT) => {
  const games: IGameInstance[] = [];
  const connections: IClient[] = [];

  const io = socketIo.listen(port);
  console.log(`server listening at port ${port}`);

  io.sockets.on('connection', socket => {
    const client: IClient = {
      id: uuid(),
      socket,
    };

    let game: IGameInstance;

    console.log(`client with id ${client.id} has connected`);

    const processClientMessageMap: ProcessClientMessageMap = {
      'create-game': message => {
        createGame(io, games, uuid());
      },
      'join-game': message => {
        joinGame(games, game, client, ticket);
      },
      'apply-effect': message => {
        applyEffect(game, client, message.data.cardId);
      },
    };

    const processClientMessage = createMessageHandler(
      processClientMessageMap,
    );

    Object.keys(processClientMessageMap).forEach(type =>
      socket.on(type, processClientMessage)
    );
  });
};
