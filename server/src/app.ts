import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import Code from "./models/codeModel";

const app = express();
const httpServer = createServer(app);
const socketServer = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ADDRESS,
    methods: ["GET", "POST"],
  },
});
console.log(`Client Address : ${process.env.CLIENT_ADDRESS}`);

// middleware:
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.CLIENT_ADDRESS }));

// mongodb and app connection:
mongoose
  .connect(process.env.MONGO_URI || "")
  .then(() => {
    console.log("MongoDB connection successfully established");
    try {
      app.listen(process.env.APP_PORT, () => {
        console.log(`Express Server is running on port ${process.env.APP_PORT}`);
      });
    } catch (error) {
      console.error("Error starting the server:", error);
    }
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

app.get("/", (req, res) => {
  res.send("hello world");
});

// Get all codes
app.get("/codes", async (req, res) => {
  try {
    const codes = await Code.find();
    res.json(codes);
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
});

// Get a single code by its title
app.get("/code/:title", async (req, res) => {
  try {
    const code = await Code.findOne({ title: req.params.title });
    if (!code) {
      return res
        .status(404)
        .json({ message: `Code ${req.params.title} not found` });
    }
    res.json(code);
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
});

// Create a new code
app.post("/code", async (req, res) => {
  try {
    const newCode = new Code(req.body);
    const savedCode = await newCode.save();
    res.status(201).json(savedCode);
  } catch (error) {
    res.status(400).json({ errorMessage: error.message });
  }
});

// Define a variable to keep track of the number of connections
let connectedClientsCount = 0;
let firstClientId = null;

// Socket Server:
socketServer.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Increment the count of connected clients
  connectedClientsCount++;

  // Store the ID of the first client
  if (connectedClientsCount === 1) {
    firstClientId = socket.id;
    console.log(`Mentor Connected with ID: ${firstClientId}`)
  }

  // Inform the client if it's the first one or not
  socket.emit("isMentor", {
    isFirstClient: socket.id === firstClientId,
  });

  socket.on("joinRoom", (title) => {
    socket.join(title);
  });

  socket.on("sendCode", (data) => {
    socket.to(data.room).emit("receiveCode", data);
  });
});

// Event handler for disconnection
socketServer.on("disconnect", (socket) => {
  console.log(`User Disconnected: ${socket.id}`);

  // Decrement the count of connected clients
  connectedClientsCount--;

  // Update the first client ID if the first client disconnects
  if (socket.id === firstClientId) {
    firstClientId = null;
  }
});

httpServer.listen(process.env.SOCKET_PORT, () => {
  console.log(`Socket Server is running on port ${process.env.SOCKET_PORT}`);
});