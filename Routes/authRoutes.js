const express = require("express");
const { RegisterUserinfo, LoginUser, GetAllUser } = require("../Controller/userController");
const { isAuthenticatedUser } = require("../Middleware/auth");
const router = express.Router();

router.get("/me", isAuthenticatedUser);

router.post("/user/register", RegisterUserinfo);
router.post("/user/login", LoginUser);

router.get("/user/Alluser",GetAllUser)

module.exports = router;
