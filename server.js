const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
});

// Define a schema for chat messages
const messageSchema = new mongoose.Schema({
    username: String,
    text: String,
    timestamp: { type: Date, default: Date.now },
});

// Create a model for chat messages
const Message = mongoose.model('Message', messageSchema);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for username submission
    socket.on('set username', async (username) => {
        socket.username = username;
        io.emit('chat message', {
            type: 'notification',
            text: `${username} has joined the chat!`
        });

        // Send chat history to the new user
        const messages = await Message.find().sort({ timestamp: 1 }).limit(50);
        socket.emit('chat history', messages);
    });

    // Listen for chat messages
    socket.on('chat message', async (msg) => {
        if (socket.username) {
            // Save the message to MongoDB
            const message = new Message({ username: socket.username, text: msg });
            await message.save();

            // Broadcast the message to all clients
            io.emit('chat message', {
                type: 'message',
                username: socket.username,
                text: msg,
                timestamp: message.timestamp,
            });
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        if (socket.username) {
            io.emit('chat message', {
                type: 'notification',
                text: `${socket.username} has left the chat.`
            });
        }
        console.log('A user disconnected:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});