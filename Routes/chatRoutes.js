const express = require('express');
const { accessChat, fetchChats, fetchMessages } = require('../Controller/chatControllers');
const { protect } = require('../Middleware/auth');
const router = express.Router();


// create or access new chat .

router.post("/createchat", protect, accessChat); // create or access new chat.

router.get("/Allchats", protect, fetchChats); // fetching all the chats for a user.

router.get("/message/:chatId",protect,fetchMessages)

module.exports = router;