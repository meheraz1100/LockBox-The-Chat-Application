const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for username submission
    socket.on('set username', (username) => {
        socket.username = username;
        io.emit('chat message', {
            type: 'notification',
            text: `${username} has just joined the chat!`
        });
    });

    // Listen for chat messages
    socket.on('chat message', (msg) => {
        if (socket.username) {
            io.emit('chat message', {
                type: 'message',
                username: socket.username,
                text: msg
            });
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        if (socket.username) {
            io.emit('chat message', {
                type: 'notification',
                text: `${socket.username} has just left the chat.`
            });
        }
        console.log('A user disconnected:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});