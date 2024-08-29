const catchAsyncError = require("../Middleware/catchAsyncError");
const Chat = require("../Models/chatModel");
const User = require("../Models/userModal");
const ErrorHandler = require("../Utils/ErrorHandler");

exports.accessChat = catchAsyncError(async (req, res, next) => {
    const { userId } = req.body; // Expecting userId from the request body this user who is joining

    const loggedInUserId = req.user._id; // Get logged-in user ID from req.user

    //   console.log("req",req)
    //     freinds 
    //   console.log("userId",userId)
    //   console.log("loggedInUserId",loggedInUserId)
    // loggedInUser who logged user side means you only

    // Check for existing chat
    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: loggedInUserId } } },
            { users: { $elemMatch: { $eq: userId } } }
        ]
    }).populate("users", "-password").populate("latestMessage");

    isChat = await User.populate(isChat, {
        path: 'latestMessage.sender',
        select: "name email",
    });

    if (isChat.length > 0) {
        res.send(isChat[0]);
    } else {
        var chatData = {
            chatName: "sender", // You may want to set this based on some logic
            isGroupChat: false,
            users: [loggedInUserId, userId] // Use dynamic user IDs
        };

        try {
            const createdChat = await Chat.create(chatData);
            const FullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", "-password");
            res.status(200).send(FullChat);
        } catch (error) {
            return next(new ErrorHandler("Error occurred", 500));
        }
    }
});

//  that  chats who logged in user is Created chats connection so that we can see here 

exports.fetchChats = catchAsyncError(async (req, res, next) => {
    try {
        const loggedInUserId = req.user._id; // Get logged-in user ID from req.user

        //  console.log("====loggeduserid=====",loggedInUserId)

        const results = await Chat.find({ users: { $elemMatch: { $eq: loggedInUserId } } })
            .populate("users", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 });

        const populatedResults = await User.populate(results, {
            path: "latestMessage.sender",
            select: "name email",
        });

        // res.status(200).send(populatedResults);
        res.status(200).json(populatedResults);
    } catch (error) {
        return next(new ErrorHandler("Error occurred", 500));
    }
});

const Message = require('../Models/messageModel');


exports.fetchMessages = catchAsyncError(async (req, res, next) => {
    const chatId = req.params.chatId; // Assuming chat ID is passed as a parameter

    const loggedInUserId = req.user._id; // Get logged-in user ID

    try {
        // Fetch messages for the given chat
        const messages = await Message.find({ chat: chatId })
            .populate('sender', 'name email') // Populate sender details
            .populate('chat');

        // Add a flag to identify if the message is sent by the logged-in user
        const formattedMessages = messages.map(message => ({
            _id: message._id,
            content: message.content,
            sender: {
                id: message.sender._id,
                name: message.sender.name,
                email: message.sender.email
            },
            isYourMessage: message.sender._id.toString() === loggedInUserId.toString(), // Flag to identify your messages
            createdAt: message.createdAt
        }));

        res.status(200).json({
            success: true,
            messages: formattedMessages
        });
    } catch (error) {
        return next(new ErrorHandler("Error fetching messages", 500));
    }
});

