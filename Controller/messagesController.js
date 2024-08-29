const catchAsyncError = require("../Middleware/catchAsyncError");
const Chat = require("../Models/chatModel");
const Message = require("../Models/messageModel");
const User = require("../Models/userModal");
const ErrorHandler = require("../Utils/ErrorHandler");
const grid = require("gridfs-stream");
const mongoose = require("mongoose");

let gfs, gridFsBucket;
const conn = mongoose.connection;
conn.once("open", () => {
  gridFsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "fs",
  });
  gfs = grid(conn.db, mongoose.mongo);
  gfs.collection("fs");
});

//  latest

exports.sendMessage = catchAsyncError(async (req, res, next) => {
  const { chatId, content } = req.body;
  const userId = req.user._id; // Get the user ID from the authenticated user
  // Log incoming data
  // Validate input
  if (!chatId || !content) {
    return next(new ErrorHandler("Chat ID and content are required", 400));
  }
  // Check if the chat exists
  let chatExists;
  try {
    chatExists = await Chat.findById(chatId);
    // console.log("Chat Exists:", chatExists);
  } catch (error) {
    return next(new ErrorHandler("Invalid Chat ID", 400));
  }
  // If chat does not exist, create a new one
  if (!chatExists) {
    try {
      chatExists = await Chat.create({
        chatName: "New Chat",
        isGroupChat: false, // You can set this dynamically based on the use case
        users: [userId], // Add the sender to the chat
      });
      // console.log("New Chat Created:", chatExists);
    } catch (error) {
      console.error("Error creating new chat:", error);
      return next(new ErrorHandler("Error creating new chat", 500));
    }
  }

  // here Create a new message

  let message;
  try {
    message = await Message.create({
      sender: userId,
      content,
      chat: chatExists._id,
    });
    // console.log("Created Message:", message);
  } catch (error) {
    console.error("Error creating message:", error);
    return next(new ErrorHandler("Error creating message", 500));
  }

  // Update the Message/chat with the latest message in ChatID

  let updatedChat;
  try {
    updatedChat = await Chat.findByIdAndUpdate(
      chatExists._id,
      { latestMessage: message._id },
      { new: true }
    )
      .populate("users", "-password")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "name email",
        },
      });

    // console.log("Updated Chat:", updatedChat);
    if (!updatedChat) {
      return next(new ErrorHandler("Chat not found after update", 404));
    }
  } catch (error) {
    console.error("Error updating chat:", error);
    return next(new ErrorHandler("Error updating chat", 500));
  }

  // Send the updated chat object as the response
  res.status(200).json(updatedChat);
});

//  Reply message by user2

exports.replyToMessage = catchAsyncError(async (req, res, next) => {
  const { chatId, content, isReplyToMessageId } = req.body;
  const userId = req.user._id; // Get the user ID from the authenticated user

  // Validate input
  if (!chatId || !content) {
    return next(new ErrorHandler("Chat ID and content are required", 400));
  }

  // Check if the chat exists
  const chatExists = await Chat.findById(chatId);
  if (!chatExists) {
    return next(new ErrorHandler("Chat not found", 404));
  }

  // Create a new reply message
  const message = new Message({
    sender: userId,
    content,
    isReply: !!isReplyToMessageId, // Set this to true if replying to a specific message
    chat: chatExists._id,
  });

  // If replying to a specific message, associate the replyContent
  if (isReplyToMessageId) {
    const replyToMessage = await Message.findById(isReplyToMessageId);
    if (replyToMessage) {
      message.replyContent = replyToMessage.content; // Get the content of the message being replied to
    }
  }

  // Save the message to the database
  await message.save();

  // Update the chat with the latest message
  const updatedChat = await Chat.findByIdAndUpdate(
    chatExists._id,
    { latestMessage: message._id },
    { new: true }
  )
    .populate("users", "-password")
    .populate({
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "name email",
      },
    });

  // Send the updated chat object as the response
  res.status(200).json(updatedChat);
});

exports.uploadFile = catchAsyncError(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler("file not found", 404));
  }

  const url = "http://localhost:4000/api/v1";

  const imageUrl = `${url}/file/${req.file.filename}`;
  console.log("imgurl", imageUrl);
  return res.status(200).json(imageUrl);
});

exports.getFile = catchAsyncError(async (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const file = await gfs.files.findOne({ filename: req.params.filename });

    const readStream = gridFsBucket.openDownloadStream(file._id);
    readStream.pipe(res);
  } catch (error) {
    return next(new ErrorHandler("error occured while getting file", 500));
  }
});

exports.allMessages = catchAsyncError(async (req, res, next) => {
  const { chatId } = req.body;

  try {
    const messages = await Message.find({ chatId })
      .populate("sender", "name email")
      .populate("chat");

    res.json(messages);
  } catch (error) {
    return next(
      new ErrorHandler("Error occured while fetching all the messages", 500)
    );
  }
});

exports.getMessagesForChat = async (req, res) => {
  const { chatId } = req.params; // Get chatId from request params

  try {
    // Fetch all messages for the given chat ID
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name email") // Populate sender details
      .populate("chat"); // Populate chat details

    // If no messages are found
    if (!messages) {
      return res
        .status(404)
        .json({ success: false, message: "No messages found for this chat" });
    }

    // Send the fetched messages
    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//  for userrrs

exports.getAllMessagesForUser = async (req, res, next) => {
  const { userId } = req.params;
  //   console.log("userrid",userId)
  try {
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { chat: { $in: await Chat.find({ users: userId }) } },
      ],
    })
      .populate("sender", "name email")
      .populate("chat", "chatName isGroupChat users")
      .sort({ createdAt: -1 });

    if (!messages.length) {
      return res
        .status(404)
        .json({ success: false, msg: "No messages found for this user." });
    }

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      msg: "Something went wrong, please try again later.",
    });
  }
};

exports.getSingleMessage = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;

  const message = await Message.findOne({ _id: id });

  if (!message) {
    return next(new ErrorHandler("message is not found with this id", 404));
  }

  res.status(200).json({
    success: true,
    Result: message,
  });
});

exports.deleteMessage = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const result = await Message.updateOne(
    { _id: id },
    { $set: { isDeleted: true } }
  );
  if (result.modifiedCount !== 1) {
    return next(new ErrorHandler("message not found with this id", 404));
  }
  res.status(200).json({
    success: true,
    message: "message deleted successfully",
  });
});

exports.reactMessage = catchAsyncError(async (req, res, next) => {
  const { id, emoji } = req.body;

  const result = await Message.updateOne(
    { _id: id },
    { $set: { reaction: emoji } }
  );

  if (result.modifiedCount !== 1) {
    return next(new ErrorHandler("Message not found with this id", 404));
  }

  res.status(200).json({
    success: true,
    message: "Reacted on message successfully",
  });
});

exports.unreactMessage = catchAsyncError(async (req, res, next) => {});

// exports.sendMessage = catchAsyncError(async (req, res, next) => {
//   const { chatId, content } = req.body;
//   const { userId } = req.user._id; // Get the user ID from the authenticated user
//    console.log("===chatId====",chatId,content)
//    console.log("userId",userId)

//    if (!chatId || !content) {
//     return next(new ErrorHandler("Chat ID and content are required", 400));
//   }

//   const message = await Message.create({
//     sender: userId,
//     content,
//     chat: chatId,
//   });
//   // Update the chat with the latest message
//   const updatedChat = await Chat.findByIdAndUpdate(
//     chatId,
//     { latestMessage: message },
//     { new: true }
//   )
//     .populate("users", "-password")
//     .populate("latestMessage");
//   res.status(200).json(updatedChat);
// });
