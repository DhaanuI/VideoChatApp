const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();

// home route
app.get("/", async (req, res) => {
    res.status(200).send("Welcome to Backend");
})

const server = http.createServer(app);
const io = socketIO(server);
require("dotenv").config()

const { userJoin, getRoomUsers, getCurrentUser, userLeave } = require("./requirements/users")
const formatMessage = require("./requirements/messages")

let serverName = "ChatAPP"

io.on("connection", (socket) => {
    // for Chat
    socket.on("joinRoom", ({ username, room }) => {
        const user = userJoin(socket.id, username, room)
        socket.join(user.room);

        socket.emit("message", formatMessage(serverName, "Welcome to Let's Chat App"))

        socket.broadcast.to(user.room).emit("message", formatMessage(serverName, `${user.username} has joined the chat`))

        io.to(user.room).emit("roomUsers", {
            room: user.room, users: getRoomUsers(user.room)
        })
    })

    // for Video
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.to(roomId).emit('user-connected', userId)
        socket.on('disconnect', () => {
            socket.emit('user-disconnected', userId)
        })
    })

    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit("message", formatMessage(user.username, msg))
    });

    socket.on("disconnect", () => {
        const user = userLeave(socket.id)
        io.to(user.room).emit("message", formatMessage(serverName, `${user.username} has left the chat`))

        io.to(user.room).emit("roomUsers", {
            room: user.room, users: getRoomUsers(user.room)
        })
    })
});




server.listen(process.env.port, () => {
    console.log(`Server is running on http://localhost:${process.env.port}`);
});
