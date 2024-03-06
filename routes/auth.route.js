const authController = require('../controllers/auth.controller');
const express = require('express');
const router = express.Router();
const multer = require("multer");

// const storage = multer.diskStorage({
//     destination: (req, file, callback) => {
//         callback(null, "uploads");
//     },
//     filename: async (req, file, callback) => {
//         let type = await file.originalname.split(".").pop();
//         let randomString = await Math.floor(1000 + Math.random() * 9000);
//         callback(null, `file-${Date.now()}${randomString}.${type}`);
//     },
// });

// Create the multer middleware
// const upload = multer({ storage });

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, 'uploads/');
        },
        filename: (req, file, callback) => {
            const fileName = Date.now() + '-' + Math.round(Math.random() * 1e9);
            callback(null, file.fieldname + '-' + fileName + '.' + file.originalname.split('.').pop());
        },
    })
});

router.post("/register", upload.single("profile_image"), authController.register);
router.post("/login", authController.login);
router.get("/version_control", authController.version);
router.post("/version_control", authController.versionUpdate);

module.exports = router;