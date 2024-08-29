const { sendMessage, allMessages, deleteMessage, uploadFile, getFile, getSingleMessage, reactMessage, getMessagesForChat, getAllMessagesForUser } = require('../Controller/messagesController');

const express = require('express');
const upload = require('../Middleware/upload');
const { protect } = require('../Middleware/auth');
const router = express.Router();



// For sending message 
router.post("/message", protect, sendMessage);

// Reply by user2 to message

router.post("/message/reply", protect, sendMessage);


// For getting all the messages from all particular Chatid 

router.get("/chat/:chatId", protect, allMessages);


// get  All message for particular chat id
router.get("/messagechat/:chatId", protect, getMessagesForChat);


// get  All message for particular user id
router.get("/messages/user/:userId", protect, getAllMessagesForUser);


// For getting a single message 

router.get("/message/:id", getSingleMessage);







// For deleting a message 
router.delete("/message/:id", deleteMessage);
// router.delete("/message", deleteMessage);
// react a message

router.post("/message/react", reactMessage);

// For uploading file

router.post("/file/upload", upload.single("file"), uploadFile);

// For accessing file from browser

router.get("/file/:filename", getFile);

module.exports = router;