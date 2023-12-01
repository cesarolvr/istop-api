import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
app.use(cors());
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:8000",
    methods: ["GET", "POST", "HEAD"],
  },
});

io.on("connection", (socket) => {
  const clientId = socket.id;
  socket.emit("connection_status", { connected: true });

  socket.on("create_room", (event) => {
    socket.join(event.name);
    io.to(clientId).emit("room_created", event.name);
  });

  socket.on("request_to_join", ({ auth, roomName }) => {
    socket.join(roomName);
    io.to(roomName).emit("player_joined", { auth, roomName });
  });

  socket.on("disconnect", () => {
    socket.emit("connection_status", { connected: false });
  });
});

const getActiveRooms = () => {
  const rooms = io.sockets.adapter.rooms
  console.log(io.sockets.adapter.rooms)
  const roomsList = Object.keys(rooms)
  return  roomsList;
};

app.get("/active-rooms", (req, res) => {
  const rooms = getActiveRooms();
  res.json(rooms);
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
