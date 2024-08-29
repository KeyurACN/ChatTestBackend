const app = require("./app");
const dotenv = require('dotenv');
const { connectDatabase } = require("./db/database");

// making configuration for .env file
dotenv.config({
    path: "./config/.env"
});

//Database Connection
connectDatabase();

const server = app.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
})

const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    }
});


io.on("connection", (socket) => {
    console.log('connected to socket.io');
    socket.on('setup', (userData) => {
        socket.join(userData._id);
        socket.emit('connected');
    });

    socket.on('join chat', (room) => {
        socket.join(room);
        console.log('user joined room' + room);
    })

    socket.on('typing', (room) => socket.in(room).emit('typing'));

    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

    socket.on("new message", (newMessageRecieved) => {
        console.log(newMessageRecieved);
        var chat = newMessageRecieved.chat;
        if (!chat.users) return console.log('chat.users not defined');

        chat.users.forEach(user => {
            if (user._id === newMessageRecieved.sender._id) return;

            socket.in(user._id).emit("message received", newMessageRecieved);
        });

    })
}) 
