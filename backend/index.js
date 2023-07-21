const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
require("dotenv").config()

const { userJoin, getRoomUsers, getCurrentUser, userLeave } = require("./requirements/users")
const formateMessage = require("./requirements/messages")


io.on("connection", (socket) => {
    console.log("A New Client Joined")
    socket.on("joinRoom", ({ username, room }) => {
        const user = userJoin(socket.id, username, room)
        socket.join(user.room);

        socket.emit("message", formateMessage(boatName, "Welcome to Let's Chat App"))

        socket.broadcast.to(user.room).emit("message", formateMessage(boatName, `${user.username} has joined the chat`))

        io.to(user.room).emit("roomUsers", {
            room: user.room, users: getRoomUsers(user.room)
        })
    })

    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit("message", formateMessage(user.username, msg))
    });

    socket.on("disconnect", () => {
        const user = userLeave(socket.id)
        io.to(user.room).emit("message", formateMessage(boatName, `${user.username} has left the chat`))

        io.to(user.room).emit("roomUsers", {
            room: user.room, users: getRoomUsers(user.room)
        })
    })
});




server.listen(process.env.port, () => {
    console.log(`Server is running on http://localhost:${process.env.port}`);
});
