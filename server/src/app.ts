import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import Code from "./models/codeModel";

const app = express();

// middleware:
app.use(cors({origin:"*"}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const httpServer = createServer(app);
const socketServer = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// mongodb and app connection:
mongoose
  .connect(process.env.MONGO_URI || "")
  .then(() => {
    console.log("MongoDB connection successfully established");
    try {
      app.listen(process.env.APP_PORT, () => {
        console.log(
          `Express Server is running on port ${process.env.APP_PORT}`
        );
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

// Socket Server:
socketServer.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // On choosing a code-block you join it's room
  socket.on("joinRoom", async (title) => {
    const socketsList = await socketServer.in(title).allSockets();
    if (socketsList.size === 0) {
      socket.emit("isMentor", true);
      console.log(`Mentor Connected on room - ${title}`);
    } else {
      socket.emit("isMentor", false);
      console.log(`Student Connected on room - ${title}`);
      socket.to(title).emit("studentEnterCodeBlock", socket.id);
    }
    socket.join(title);
  });

  // On receiving a change in the student's code, send it to the mentor
  socket.on("sendStudentCode", ({ code, room }) => {
    socket.to(room).emit("receiveStudentCode", { code, studentId: socket.id });
  });

  // On receiving student's submission , send it's status to the mentor
  socket.on("studentSubmission", ({ submissionStatus, room }) => {
    socket
      .to(room)
      .emit("studentSubmissionStatus", {
        submissionStatus,
        studentId: socket.id,
      });
  });

  // On receiving a student left the room, send his id to the mentor
  socket.on("studentLeftCodeBlock", ({ room, studentId }) => {
    console.log("studentLeftCodeBlock.....");
    socket.to(room).emit("studentLeftRoom", studentId);
  });

  // Event handler for disconnection
  socket.on("disconnect", () => {
    console.log(`User Disconnected`);
  });
});

httpServer.listen(process.env.SOCKET_PORT, () => {
  console.log(`Socket Server is running on port ${process.env.SOCKET_PORT}`);
});
