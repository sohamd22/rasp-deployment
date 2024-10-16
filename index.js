import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import bodyParser from 'body-parser';

import apiRouter from './api.js';
import { setConnectedClient, removeConnectedClient, emitToConnectedClient } from './utils/connectedClients.js';

import dotenv from "dotenv";
dotenv.config();

// Connect to MongoDB (make sure you have the connection string in your .env file)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Setup Express App
const app = express();
const server = createServer(app);

app.use(express.static('dist'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Use api routes
app.use('/api', apiRouter);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/dist/index.html'));
});

io.on('connection', (socket) => {
  const { userId } = socket.handshake.query;

  console.log(`User ${userId} connected.`);
  setConnectedClient(userId, socket);

  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected.`);
    removeConnectedClient(userId);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
