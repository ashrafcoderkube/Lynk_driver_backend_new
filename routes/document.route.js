const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');

router.post("/", documentController.createDocs);
router.get("/", documentController.getDocs);

module.exports = router;