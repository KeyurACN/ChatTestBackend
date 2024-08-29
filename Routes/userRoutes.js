const express = require('express');
const { registerUser } = require('../Controller/userController');

const router = express.Router();

router.post("/signup",registerUser);

module.exports = router;