const express = require('express');
const router = express.Router();
const documentController = require('../Controllers/document.controller');

router.post("/", documentController.createDocs);
router.get("/", documentController.getDocs);

module.exports = router;