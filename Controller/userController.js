const catchAsyncError = require("../Middleware/catchAsyncError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
 // Adjust the path as needed
const mongoose = require("mongoose");
const User = require("../Models/userModal");


exports.registerUser = catchAsyncError(async (req, res, next) => {
    const { name, email, password } = req.body;
    const user = await User.create({
        name, email, password
    })
    if (user) {
        res.status(201).json({
            success: true,
            user
        })
    }
})


exports.RegisterUserinfo = catchAsyncError(async (req, res, next) => {
    const { name, email, password } = req.body;
  
    if (password.length < 8) {
      return res.status(400).json({ msg: "Password needs at least 8 characters" });
    }
  
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(409).json({ msg: "User Already Exists" });
      }
  
      bcrypt.hash(password, 4, async (err, hash) => {
        if (err) {
          console.log("Error hashing password", err);
          return res.status(500).json({ msg: "Error in hashing password" });
        }
  
        try {
          const newUser = new User({
            name,
            email,
            password: hash,
          });
  
          await newUser.save();
          res.status(201).json({ msg: "User Registered Successfully", userinfo: newUser });
        } catch (error) {
          if (error instanceof mongoose.Error.ValidationError) {
            const errorMessages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ msg: "Validation error", errors: errorMessages });
          } else {
            console.error("Unexpected error:", error);
            return res.status(500).json({ msg: "Something went wrong, please try again later" });
          }
        }
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      return res.status(500).json({ msg: "Something went wrong, please try again later" });
    }
  });
  

exports.LoginUser = async (req, res, next) => {
    const { email, password } = req.body;

    // console.log("Request body:", req.body); // Log the request body

    try {
        // Find user by email
        let user = await User.findOne({ email }).select('+password'); // Ensure password is selected for comparison
        if (!user) {
            return res.status(401).json({ msg: "Invalid email or password" });
        }

        // Check if password is defined
        if (!password || !user.password) {
            return res.status(401).json({ msg: "Invalid email or password" });
        }

        // Compare provided password with hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ msg: "Invalid email or password" });
        }

        // Generate JWT token  { expiresIn: '1h' }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET,);

        // Send response with user details and token
        res.status(200).json({
            msg: "Logged in successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error("Error:", err); // Log the detailed error
        res.status(500).json({ msg: "Something went wrong, please try again later" });
    }
};


exports.GetAllUser = async (req, res, next) => {
  try {
    // Fetch all users
    let users = await User.find().select('-password'); // Exclude password field for security

    res.status(200).json({
      msg: "Users retrieved successfully",
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email
      }))
    });
  } catch (err) {
    console.error("Error:", err); // Log the detailed error
    res.status(500).json({ msg: "Something went wrong, please try again later" });
  }
};

