import 'ws';
import socketIo from 'socket.io';
import { v1 as uuid } from 'uuid';
import { IGameInstance, IClient, ITicket } from './state';
import { createGame, joinGame, applyEffect } from './game';
import { createMessageHandler, ProcessClientMessageMap, UpdateStateServerMessage } from 'anno-fungi-game-common';

import express from 'express';
import { createServer } from 'http';

const PORT = process.env.PORT || 8079;

const _theLog: string[] = [];

const log = (msg: string) => {
  console.log(`[${new Date().toUTCString()}] ${msg}`);
  _theLog.push(msg);
};

const registerConnection = (
  connection: IClient,
  connections: IClient[],
  otherConnections: Record<IClient['id'], IClient[]>,
) => {
  const otherConnectionsForConnectedClient = connections.slice();
  connections.push(connection);

  for (let id in otherConnections) {
    otherConnections[id].push(connection);
  }

  otherConnections[connection.id] = otherConnectionsForConnectedClient;

  log(`client with id ${connection.id} has connected`);
};

const registerDisconnection = (
  connection: IClient,
  connections: IClient[],
  otherConnections: Record<IClient['id'], IClient[]>,
) => {
  connections.splice(connections.indexOf(connection), 1);
  delete otherConnections[connection.id];

  for (let id in otherConnections) {
    otherConnections[id].splice(otherConnections[id].indexOf(connection), 1);
  }

  log(`client with id ${connection.id} has disconnected`);
};

const indexHtml = (connections: IClient[]) => `
<h1>Server running</h1>
<div>
  <h2>Connections</h2>
  <ul>${connections.map(c => `<li>${c.id}</li>`).join('')}</ul>
  <h2>Log</h2>
  <ul>${_theLog.map(entry => `<li>${entry}</li>`).join('')}</ul>
</div>
`.trim()
;

export const startGameServer = (port: string | number = PORT) => {
  log(`starting server { port: ${port} }`);

  const app = express();
  const http = createServer(app);
  const io = socketIo(http);

  const games: IGameInstance[] = [];
  const connections: IClient[] = [];
  const otherConnections: Record<IClient['id'], IClient[]> = {};

  let currentGameState: any = null;

  app.get('/', (req, res) => {
    res.send(indexHtml(connections));
    res.end();
  });

  http.listen(port, () => {
    log(`server listening at port ${port}`);
  });

  io.sockets.on('connection', socket => {
    const initialServerMessage: UpdateStateServerMessage = {
      type: 'update-state',
      data: { state: currentGameState },
    };
    socket.send(initialServerMessage);

    const client: IClient = {
      id: uuid(),
      socket,
    };

    registerConnection(client, connections, otherConnections);

    socket.on('disconnect', () => {
      registerDisconnection(client, connections, otherConnections);
    });

    let game: IGameInstance;
    const ticket: ITicket = { gameId: '', deck: [] };

    const processClientMessageMap: ProcessClientMessageMap = {
      'update-state': message => {
        const serverMessage: UpdateStateServerMessage = {
          type: 'update-state',
          data: { state: message.data.state },
        };

        currentGameState = message.data.state;

        log(`received update state message from ${client.id}; ${JSON.stringify(message.data.state)}`);

        otherConnections[client.id].forEach(c => c.socket.send(serverMessage));
      },
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

    socket.on('message', processClientMessage);
  });
};
