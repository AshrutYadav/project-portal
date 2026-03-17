const Message = require("./models/Message");

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
const authMiddleware = require("./middleware/authMiddleware");

app.use("/auth", require("./routes/authRoutes"));
app.use("/admin", require("./routes/adminRoutes"));
app.use("/domains", authMiddleware, require("./routes/domainRoutes"));
app.use("/projects", authMiddleware, require("./routes/projectRoutes"));
app.use("/tasks", authMiddleware, require("./routes/taskRoutes"));
app.use("/join", authMiddleware, require("./routes/joinRoutes"));
app.use("/suggestions", authMiddleware, require("./routes/suggestionRoutes"));
app.use("/messages", require("./routes/messageRoutes"));
app.use("/general-messages", require("./routes/generalMessageRoutes"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const jwt = require("jsonwebtoken");
const GeneralMessage = require("./models/GeneralMessage");

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("authenticate", (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
      socket.user = decoded; // { userId, collegeId, isAdmin }
      socket.emit("authenticated", { success: true });
    } catch (err) {
      socket.emit("unauthorized", { message: "Invalid token" });
    }
  });

  socket.on("joinProject", async ({ projectId }) => {
    if (!socket.user) {
      return socket.emit("unauthorized", { message: "Not authenticated" });
    }
    try {
      const Project = require("./models/Project");
      const project = await Project.findById(projectId);
      if (!project) return;

      const isMember = project.members.some(m => m.user && m.user.toString() === socket.user.userId);
      if (!isMember && !socket.user.isAdmin) {
        return socket.emit("unauthorized", { message: "Only members can join this chat" });
      }

      socket.join(`project_${projectId}`);
      console.log(`User joined project_${projectId}`);
    } catch (e) {
      console.error(e);
    }
  });

  socket.on("sendMessage", async ({ projectId, message }) => {
    if (!socket.user) {
      return socket.emit("unauthorized", { message: "Not authenticated" });
    }

    try {
      const Project = require("./models/Project");
      const project = await Project.findById(projectId);
      if (!project) return;

      const isMember = project.members.some(m => m.user && m.user.toString() === socket.user.userId);
      if (!isMember && !socket.user.isAdmin) {
        return socket.emit("unauthorized", { message: "Only members can send messages" });
      }

      const isMembership = project.members.find(m => m.user && m.user.toString() === socket.user.userId);
      let senderSuffix = isMembership ? isMembership.role : "Member";
      if (socket.user.isAdmin) senderSuffix = "Admin";

      const User = require("./models/User");
      const senderUser = await User.findById(socket.user.userId);
      const senderName = senderUser ? senderUser.name : "Unknown";

      let finalSenderStr = "";
      if (senderSuffix === "Admin") {
        finalSenderStr = `${socket.user.collegeId} - ${senderName} - Admin`;
      } else if (senderSuffix === "Lead") {
        finalSenderStr = `${socket.user.collegeId} - ${senderName} - Lead`;
      } else {
        finalSenderStr = `${socket.user.collegeId} - ${senderName}`;
      }

      // 1️⃣ Save to database using identity from socket
      const newMessage = await Message.create({
        projectId,
        user: socket.user.userId,
        sender: finalSenderStr,
        message,
      });

      // 2️⃣ Broadcast to room
      io.to(`project_${projectId}`).emit("receiveMessage", newMessage);

    } catch (error) {
      console.error(error);
    }
  });

  socket.on("joinGeneral", () => {
    socket.join("general");
    console.log("User joined general chat");
  });

  socket.on("sendGeneralMessage", async ({ message }) => {
    if (!socket.user) {
      return socket.emit("unauthorized", { message: "Not authenticated" });
    }

    try {
      const User = require("./models/User");
      const senderUser = await User.findById(socket.user.userId);
      const senderName = senderUser ? senderUser.name : "Unknown";

      const finalSenderStr = socket.user.isAdmin
        ? `${socket.user.collegeId} - ${senderName} - Admin`
        : `${socket.user.collegeId} - ${senderName}`;

      const newMessage = await GeneralMessage.create({
        user: socket.user.userId,
        sender: finalSenderStr,
        message,
      });
      io.to("general").emit("receiveGeneralMessage", newMessage);
    } catch (error) {
      console.error(error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("API is running...");
});

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
);

