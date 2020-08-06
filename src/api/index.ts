import 'ws';
import socketIo from 'socket.io';
import { v1 as uuid } from 'uuid';
import { IGameInstance, IClient, ITicket } from './state';
import { ProcessClientMessageMap } from './messages/client';
import { createGame, joinGame, applyEffect } from './game';
import { createMessageHandler } from './messages';

import express from 'express';
import { createServer } from 'http';

const PORT = +(process.env.PORT || 8079);

export const startGameServer = (port: number = PORT) => {
  console.log(`starting server { port: ${port} }`);

  const app = express();
  const http = createServer(app);
  const io = socketIo(http);

  app.get('/', (req, res) => {
    res.send('<h1>Server running</h1>');
    res.end();
  });

  http.listen(port, () => {
    console.log(`server listening at port ${port}`);
  });

  const games: IGameInstance[] = [];
  const connections: IClient[] = [];

  io.sockets.on('connection', socket => {
    const client: IClient = {
      id: uuid(),
      socket,
    };

    let game: IGameInstance;
    const ticket: ITicket = { gameId: '', deck: [] };

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
