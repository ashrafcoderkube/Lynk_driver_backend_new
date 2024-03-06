'use strict'
const jwt = require('jsonwebtoken');
const Constant = require("./Constant")
const ENUM = Constant.StatusEnum;
const MESSAGES = Constant.StatusMessages;
// const tokenBlacklist = new Set();
// Generates a new JWT token
module.exports.generateToken = (payload, sKey) => {
  // let expiresIn = '365d'
  return jwt.sign(payload, sKey);
}

// Verifies a JWT token
module.exports.verifyToken = async (req, res, next) => {
  let token;
  let getToken = req.header('Authorization');

  if (getToken) {
    token = req.header('Authorization').split(' ')[1];
  } else {
    return res.status(ENUM.TOKEN_EXP).json({ status: ENUM.TOKEN_EXP, message: MESSAGES.NO_TOKEN });
  }

  // if (!token || tokenBlacklist.has(token)) {
  //   return res.status(StatusEnum.UNAUTHORIZED).json({
  //     status: StatusEnum.UNAUTHORIZED,
  //     message: StatusMessages.INVALID_TOKEN,
  //   });
  // }

  try {
    let decodedToken = jwt.verify(token, exports.secretKey());
    let expirationTimeMs = decodedToken.exp * 1000;
    req.user = decodedToken;
    console.log("requested user " + JSON.stringify(req.user));
    if (Date.now() > expirationTimeMs) {
      return res.status(ENUM.TOKEN_EXP).json({ status: ENUM.TOKEN_EXP, message: MESSAGES.TOKEN_EXP });
    }
    // const results = await Squery('SELECT * FROM users WHERE email = ? AND password = ? AND authToken = ?', [decodedToken.email, decodedToken.password , token]);

    // if (!results || results.length === 0) {
    //   return res.status(ENUM.TOKEN_EXP).json({ status: ENUM.TOKEN_EXP, message: MESSAGES.TOKEN_EXP });
    // }
    //let data = await  decodedToken.email
    next();
  } catch (error) {
    return res.status(ENUM.TOKEN_EXP).json({ status: ENUM.TOKEN_EXP, message: MESSAGES.INVALID_TOKEN });
  }
}

//seceret key
module.exports.secretKey = () => {
  return "abcdefghijklmnopqrstuvwxyz1234567890";
}

