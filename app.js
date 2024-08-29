const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const ErrorHandler = require('./Middleware/error');

const app = express();

app.use(express.json());

dotenv.config({
    path: "./config/.env"
});

// Importing Routes
const authRoute = require('./Routes/authRoutes');
const chatRoute = require('./Routes/chatRoutes');
const userRoute = require('./Routes/userRoutes');
const messageRoute = require('./Routes/messageRoutes')


// Middlewares
app.use("/api/v1", authRoute);
app.use("/api/v1", chatRoute);
app.use("/api/v1", userRoute);
app.use("/api/v1", messageRoute);

app.use(cors());
app.use(ErrorHandler);
module.exports = app;