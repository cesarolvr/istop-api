import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

// // Database
// import { createClient } from 'redis';
// const createRoom = async () => {
//   const client = createClient();
//   client.on('error', err => console.log('Redis Client Error', err));
//   await client.connect();
//   await client.set('active_rooms', 'value');
// }


const app = express();
const server = createServer(app);
const socket = new Server(server, {
  cors: {
    origin: "http://localhost:8000",
    methods: ["GET", "POST", "HEAD"],
  },
});

socket.on("connection", (e) => {
  const clientId = e.id
  socket.emit("connection_status", { connected: true });

  socket.on("create_room", (event) => {
    console.log('aaaaaabbb', event)
    // socket.join(event.name)
    // socket.to(clientId).emit("room_created", event.name);
  });

  socket.on("disconnect", () => {
    socket.emit("connection_status", { connected: false });
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
