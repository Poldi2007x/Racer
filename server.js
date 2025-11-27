const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Wir senden die HTML Datei an den Browser
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

let players = {};

io.on('connection', (socket) => {
  console.log('Neuer Rennfahrer:', socket.id);

  // Neuer Spieler (zufällige Position start)
  players[socket.id] = {
    x: 300,
    y: 300,
    angle: 0,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
    name: "Racer " + socket.id.substr(0, 4)
  };

  // Sende alle aktuellen Spieler an den neuen
  socket.emit('currentPlayers', players);

  // Sag den anderen, dass ein Neuer da ist
  socket.broadcast.emit('newPlayer', { 
    id: socket.id, 
    player: players[socket.id] 
  });

  // Wenn ein Spieler sich bewegt
  socket.on('playerMovement', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].angle = data.angle;
      
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        x: players[socket.id].x,
        y: players[socket.id].y,
        angle: players[socket.id].angle
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Weg:', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

http.listen(3000, () => {
  console.log('Server läuft auf Port 3000');
});
