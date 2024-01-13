import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { v4 as uuidv4 } from "uuid";
import {InMemorySessionStore} from "./src/sessionStore"

const FRONT_URL = ["http://localhost:8000"];

const app = express();
app.use(cors());
const server = createServer(app);

//https://socket.io/docs/v4/using-multiple-nodes/#enabling-sticky-session
const io = new Server(server, {
  cors: {
    origin: FRONT_URL,
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
    credentials: true,
  },
});

const url = "redis://127.0.0.1:6379";
const pubClient = createClient({ url });
const subClient = pubClient.duplicate();

const initPubSub = async () => {
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
};

initPubSub();

const sessionStore = new InMemorySessionStore();

io.use((socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
    // find existing session
    const session = sessionStore.findSession(sessionID);
    if (session) {
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      socket.username = session.username;
    }
    return next();
  }
  // const username = socket.handshake.auth.username;
  // // if (!username) {
  // //   return next();
  // // }
  // create new session
  socket.sessionID = uuidv4();
  socket.userID = uuidv4();
  socket.username = username;
  return next();
});

io.on("connection", (socket) => {
  const clientId = socket.id;
  socket.emit("connection_status", { connected: true });

  socket.emit("auth", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  socket.on("create_room", (event) => {
    io.to(clientId).emit("room_created", event.name);
  });

  socket.on("request_to_join", ({ auth, roomName }) => {
    // const roomExists = io.of("/").adapter.rooms.has(roomName)
    // console.log('roomExists', roomExists, roomName)
    socket.join(roomName);
    io.to(roomName).emit("player_joined", { auth, roomName });
  });

  socket.on("disconnect", () => {
    socket.emit("connection_status", { connected: false });
  });
});

server.listen(3000, () => {
  console.log(`server running at http://localhost at port 3000`);
});
