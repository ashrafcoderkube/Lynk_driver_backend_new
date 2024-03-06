const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const multer = require('multer');
const jwt = require('../Utils/jwtToken');

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

router.get("/attachments", jwt.verifyToken, userController.getAttachments);
router.get("/getHomeData", jwt.verifyToken, userController.getHomeData);
router.post("/updatePassword", userController.updatePassword);
router.post("/update-attachments", jwt.verifyToken, upload.array("image", 3), userController.UploadImage);
router.post("/forgotpasswordemail", userController.forgotPasswordEmail);
router.post("/user-agreement", jwt.verifyToken, userController.userAgreement);
router.put("/profileUpdate", jwt.verifyToken, upload.single("profile_image"), userController.updateUserProfile);
router.post("/holidayEmail", jwt.verifyToken, userController.holidayEmail);
router.post("/deleteAccountEmail", jwt.verifyToken, userController.deleteAccountEmail);
router.get("/getUser", jwt.verifyToken, userController.getUserById);
router.post("/changePasswordEmail", jwt.verifyToken, userController.changePasswordEmail);
module.exports = router;