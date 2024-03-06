const adminController = require('../controllers/admin.controller');
const express = require('express');
const router = express.Router();
const jwt = require('../Utils/jwtToken');

router.get("/users", jwt.verifyToken, adminController.getAllUsers);
router.get("/admins", jwt.verifyToken, adminController.getAllAdmins);
router.put("/updateAgreement", jwt.verifyToken, adminController.updateAgreement);
router.get("/exportSearchedUser", jwt.verifyToken, adminController.exportSearchedUser);
router.get("/getHomeData", jwt.verifyToken, adminController.getHomeData);
router.delete("/deleteUser", jwt.verifyToken, adminController.deleteUsers);
router.get("/getLastTwoWeekUsers", jwt.verifyToken, adminController.getLastTwoWeekUsers);
router.get("/getAllReports", jwt.verifyToken, adminController.getAllReports);

//Leads routes
router.post("/addLeads", jwt.verifyToken, adminController.addLeads);
router.get("/getAllLeads", jwt.verifyToken, adminController.getAllLeads);
router.get("/getLeadsById", jwt.verifyToken, adminController.getLeadsById);
router.put("/updateLead", jwt.verifyToken, adminController.updateLead);
router.delete("/deleteLead", jwt.verifyToken, adminController.deleteLeads);

//Messages routes
router.post("/addMessageInLead", jwt.verifyToken, adminController.addMessageInLead);
router.get("/getAllMessages", jwt.verifyToken, adminController.getAllMessages);
router.put("/updateMessage", jwt.verifyToken, adminController.updateMessage);
router.delete("/deleteMessage", jwt.verifyToken, adminController.deleteMessage);

module.exports = router;