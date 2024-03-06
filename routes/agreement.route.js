const agreementController = require('../controllers/agreement.controller');
const express = require('express');
const router = express.Router();
const jwt = require('../Utils/jwtToken');

router.post("/addAgreement", jwt.verifyToken, agreementController.createAgreements);
router.get("/getAgreements", jwt.verifyToken, agreementController.getAgreements);

module.exports = router;