// const ErrorHandler = require("../Utils/ErrorHandler");
// const catchAsyncError = require("./catchAsyncError");
// exports.isAuthenticatedUser = (catchAsyncError(async (req, res, next) => {
//     const userData = localStorage.getItem("userData");
//     if (!userData) return next(new ErrorHandler("Please login for accessing this feature", 401));
//     return res.status(200).json({
//         success: true,
//         message: userData
//     })
// }))

const ErrorHandler = require("../Utils/ErrorHandler");
const catchAsyncError = require("./catchAsyncError");
const jwt = require('jsonwebtoken');
const User = require('../Models/userModal'); 

exports.isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
    // Check for a token in the request headers
    const token = req.headers.authorization;

    if (!token) {
        return next(new ErrorHandler("Please login for accessing this feature", 401));
    }

    // If you need to retrieve user data based on the token, do it here
    // For example, decode the token or look it up in your database

    return res.status(200).json({
        success: true,
        message: "User is authenticated" // Placeholder message
    });
});



 exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password'); 
            
            next();
        } catch (error) {
            console.error("Token verification failed:", error);
            return res.status(401).json({ msg: "Not authorized, token failed" });
        }
    } else {
        return res.status(401).json({ msg: "Not authorized, no token" });
    }
};


