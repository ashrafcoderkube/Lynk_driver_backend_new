
const {
  BASEURL,
  StatusEnum,
  StatusMessages,
  Messages,
  sendMail,
  getCurrentTime,
  checkDocumentsAndSendWhatsAppMessage,
  InitialReminder,
  SecondReminder,
  FinalReminder,
  MSGTimers
} = require("../Utils/Constant");
const jwt = require("../Utils/jwtToken");
const { validateEmail } = require("../Utils/Validations");

const userModel = require('../models/user.model');
const documentModel = require("../models/document.model");
const versionControlModel = require('../models/version_control.model');
const reportsModel = require('../models/reports.model');
const sequelize = require('sequelize');
const cronDoc = require("../models/cron.model");
module.exports = {

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide email address.' });
      } else if (!password) {
        res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide password.' });
      } else {
        if (validateEmail(req.body.email)) {
          // Check if user exists in the database
          const userData = await userModel.findOne({
            where: { email: email, is_deleted: 0 }
          });

          if (!userData) {
            res.status(StatusEnum.CREDENTIS_NOT_MATCHED).json({
              status: StatusEnum.CREDENTIS_NOT_MATCHED,
              message: Messages.Credentials_Not_Matched
            });
            return;
          } else {
            if (password != userData.password) {
              res.status(StatusEnum.CREDENTIS_NOT_MATCHED).json({
                status: StatusEnum.CREDENTIS_NOT_MATCHED,
                message: Messages.Credentials_Not_Matched
              });
            } else {
              // if (userData.type === "user") {
              const currenttime = getCurrentTime();

              // Update last login time in the database
              await userModel.update({
                last_login: currenttime
              }, {
                where: { user_id: userData.user_id }
              });

              // Retrieve the user with attached documents
              let data = await userModel.findOne({
                where: { user_id: userData.user_id },
                include: [{
                  as: 'attachment',
                  model: documentModel
                }]
              });
              data = JSON.parse(JSON.stringify(data));
              data.attachment.forEach(element => {
                switch (element?.document_name) {
                  case 'White Garda SPSV Licence':
                    element['document_message'] = 'This is your Form P.S.V 17. Please upload your most recent licence. Expired licences will not be accepted.'
                    break;
                  case 'SPSV Vehicle Licence':
                    element['document_message'] = 'Please upload your most recent SPSV Vehicle Licence (the certificate you receive when your car passes suitability). Expired licences will not be accepted.'
                    break;
                  case 'Insurance Cert':
                    element['document_message'] = 'Please upload only your most recent full Insurance Cert. Expired insurances or window disc will not be accepted.'
                    break;
                  default:
                    break;
                }
              });
              res.status(StatusEnum.SUCCESS).json({
                status: StatusEnum.SUCCESS,
                message: StatusMessages.LOGIN_SUCCESS,
                data: JSON.parse(JSON.stringify(data))
              });
            }
          }
        } else {
          res.status(StatusEnum.PATTERN_NOT_MATCH).json({
            status: StatusEnum.PATTERN_NOT_MATCH,
            data: Messages.Invalid_Email,
            message: StatusMessages.PATTERN_NOT_MATCH,
          });
        }
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  },
  register: async (req, res) => {
    try {
      const { email, first_name, last_name, password, mobile_no, spsv, country_code, device_type, type, profile_image } = req.body;

      if (!first_name) {
        res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({ message: "Please provide first name." })
      } else if (!last_name) {
        res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({ message: "Please provide last name." })
      } else if (!email) {
        res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({ message: "Please provide email." })
      } else if (!password) {
        res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({ message: "Please provide password." })
      } else if (!device_type) {
        res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({ message: "Please provide device type." })
      } else if (!type) {
        res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({ message: "Please provide type." })
      } else {
        if (type == 'user') {
          const existUser = await userModel.findOne({
            where: {
              [sequelize.Op.or]: {
                email: email,
                mobile_no: mobile_no
              }, is_deleted: 0
            }
          });
          if (existUser?.email == email) {
            res.status(StatusEnum.ALREADY_EXIST).json({
              status: StatusEnum.ALREADY_EXIST,
              data: Messages.Email_Already_Registered,
              message: StatusMessages.ALREADY_EXIST,
            });
          } else if (existUser?.mobile_no == mobile_no) {
            res.status(StatusEnum.ALREADY_EXIST).json({
              status: StatusEnum.ALREADY_EXIST,
              data: Messages.Phone_Number_Registered,
              message: StatusMessages.PHONENUMBER_ALREADY_EXIST,
            });
          } else {
            if (validateEmail(email)) {
              let Token = jwt.generateToken({ email: email, password: password }, jwt.secretKey());
              let new_user = await userModel.create({
                email: email.toLowerCase(),
                first_name: first_name,
                last_name: last_name,
                country_code: country_code ?? "",
                device_type: device_type,
                authToken: Token,
                password: password,
                mobile_no: mobile_no ?? "",
                spsv: spsv ?? "",
                type: type,
                profile_image: (req.file ? (BASEURL + req.file.path) : ""),
              });
              new_user = JSON.parse(JSON.stringify(new_user));
              // Create default documents
              const defaultDocs = [
                {
                  document_name: "White Garda SPSV Licence",
                  document_url: "",
                  user_id: new_user.user_id
                },
                {
                  document_name: "SPSV Vehicle Licence",
                  document_url: "",
                  user_id: new_user.user_id
                },
                {
                  document_name: "Insurance Cert",
                  document_url: "",
                  user_id: new_user.user_id
                },
              ];
              const createUserDocument = await documentModel.bulkCreate(defaultDocs);
              let user = await userModel.findOne({
                where: {
                  user_id: new_user.user_id
                },
                include: [{
                  required: false,
                  as: 'attachment',
                  model: documentModel
                }]
              });
              user = JSON.parse(JSON.stringify(user));

              let currentTime = new Date(); // Get the current date and time
              let timePlus15Minutes = new Date(currentTime.getTime() + MSGTimers.CheckDocuments);
              // Add 15 minutes
              await cronDoc.create({
                task_id: 1,
                task_name: "Check Documents and Send WhatsApp Message",
                task_time: timePlus15Minutes,
                user_id: new_user.user_id
              })

              // setTimeout(async () => {
              //   await checkDocumentsAndSendWhatsAppMessage(new_user.user_id)
              // }, 15 * 60 * 1000);

              currentTime = new Date(); // Get the current date and time
              let timePlus24Hours = new Date(currentTime.getTime() + MSGTimers.InitialReminder); // Add 24 Hours
              await cronDoc.create({
                task_id: 2,
                task_name: "InitialReminder",
                task_time: timePlus24Hours,
                user_id: new_user.user_id
              })

              // First reminder after 24 hours
              // setTimeout(async () => {
              //   let user_data = await userModel.findOne({ where: { user_id: new_user.user_id } });
              //   if (user_data?.document_uploaded == 0 || user_data?.is_iban_submitted == 0 || user_data?.agreement_verified == 0 || user_data?.clicked_to_app == 'No') {
              //     await InitialReminder(user_data.user_id);
              //   }
              // }, 24 * 60 * 60 * 1000); // 24 hours

              currentTime = new Date(); // Get the current date and time
              let timePlus72Hours = new Date(currentTime.getTime() + MSGTimers.SecondReminder); // Add 72 hours after 24-hour reminder
              await cronDoc.create({
                task_id: 3,
                task_name: "SecondReminder",
                task_time: timePlus72Hours,
                user_id: new_user.user_id
              })

              // Reminder after 72 hours (3 days after the 24-hour message)
              // setTimeout(async () => {
              //   let user_data = await userModel.findOne({ where: { user_id: new_user.user_id } });
              //   if (user_data?.document_uploaded == 0 || user_data?.is_iban_submitted == 0 || user_data?.agreement_verified == 0 || user_data?.clicked_to_app == 'No') {
              //     await SecondReminder(user_data.user_id); // 72-hour reminder
              //   }
              // }, (24 + 72) * 60 * 60 * 1000); // 72 hours after 24-hour reminder

              currentTime = new Date(); // Get the current date and time
              let timePlus7Days = new Date(currentTime.getTime() + MSGTimers.FinalReminder); // Add 7 Days after the 24-hour message
              await cronDoc.create({
                task_id: 4,
                task_name: "FinalReminder",
                task_time: timePlus7Days,
                user_id: new_user.user_id
              })

              // Reminder 7 days after the 24-hour message
              // setTimeout(async () => {
              //   let user_data = await userModel.findOne({ where: { user_id: new_user.user_id } });
              //   if (user_data?.document_uploaded == 0 || user_data?.is_iban_submitted == 0 || user_data?.agreement_verified == 0 || user_data?.clicked_to_app == 'No') {
              //     await FinalReminder(user_data.user_id); // 7-day reminder
              //   }
              // }, (24 * 60 * 60 * 1000) + (7 * 24 * 60 * 60 * 1000)); // 7 days after 24-hour reminder
              let data = await userModel.findOne({
                where: { user_id: new_user.user_id },
                include: [{
                  as: 'attachment',
                  model: documentModel
                }]
              });
              data = JSON.parse(JSON.stringify(data));
              data.attachment.forEach(element => {
                switch (element?.document_name) {
                  case 'White Garda SPSV Licence':
                    element['document_message'] = 'This is your Form P.S.V 17. Please upload your most recent licence. Expired licences will not be accepted.'
                    break;
                  case 'SPSV Vehicle Licence':
                    element['document_message'] = 'Please upload your most recent SPSV Vehicle Licence (the certificate you receive when your car passes suitability). Expired licences will not be accepted.'
                    break;
                  case 'Insurance Cert':
                    element['document_message'] = 'Please upload only your most recent full Insurance Cert. Expired insurances or window disc will not be accepted.'
                    break;
                  default:
                    break;
                }
              });
              res.status(StatusEnum.SUCCESS).json({
                status: StatusEnum.SUCCESS,
                message: StatusMessages.REGISTER_SUCCESS,
                data: JSON.parse(JSON.stringify(data)),
              });
            } else {
              res.status(StatusEnum.PATTERN_NOT_MATCH).json({
                status: StatusEnum.PATTERN_NOT_MATCH,
                message: StatusMessages.PATTERN_NOT_MATCH,
                data: Messages.Invalid_Email,
              });
            }
          }
        } else {
          const existUser = await userModel.findOne({
            where: { email: email, is_deleted: 0 }
          });
          if (existUser?.email == email) {
            res.status(StatusEnum.ALREADY_EXIST).json({
              status: StatusEnum.ALREADY_EXIST,
              data: Messages.Email_Already_Registered,
              message: StatusMessages.ALREADY_EXIST,
            });
          } else {
            if (validateEmail(email)) {
              let Token = jwt.generateToken({ email: email, password: password }, jwt.secretKey());
              let new_user = await userModel.create({
                email: email.toLowerCase(),
                first_name: first_name,
                last_name: last_name,
                country_code: country_code ?? "",
                device_type: device_type,
                authToken: Token,
                password: password,
                mobile_no: mobile_no ?? "",
                spsv: spsv ?? "",
                type: type,
                profile_image: (req.file ? (BASEURL + req.file.path) : ""),
              });
              new_user = JSON.parse(JSON.stringify(new_user));
              const isForgotPassword = false;

              const fullName = first_name + last_name;
              const title = "New Account Registered";
              const role = type;
              const subTitle1 = "We received a request for your new lynk admin account: " + fullName + " with " + role + " role.";
              const subTitle2 = "New Account Ready";
              const redirectUrl = "https://driverapp.lynk.ie/login";
              const isAdminRegister = false;
              const mail = await sendMail(new_user.user_id, email, fullName, new_user.user_id, subTitle2, redirectUrl, isForgotPassword, isAdminRegister);
              let data = await userModel.findOne({
                where: { user_id: new_user.user_id }
              });
              res.status(StatusEnum.SUCCESS).json({
                status: StatusEnum.SUCCESS,
                message: StatusMessages.REGISTER_SUCCESS,
                data: JSON.parse(JSON.stringify(data)),
              });
            } else {
              res.status(StatusEnum.PATTERN_NOT_MATCH).json({
                status: StatusEnum.PATTERN_NOT_MATCH,
                message: StatusMessages.PATTERN_NOT_MATCH,
                data: Messages.Invalid_Email,
              });
            }
          }
        }
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  },
  version: async (req, res) => {
    try {
      const version_control_data = await versionControlModel.findOne({
        where: { version_control_id: 1 }
      });

      if (!version_control_data) {
        res.status(StatusEnum.CREDENTIS_NOT_MATCHED).json({
          status: StatusEnum.CREDENTIS_NOT_MATCHED,
          message: Messages.Credentials_Not_Matched,
        });
      } else {
        res.status(StatusEnum.SUCCESS).json({
          status: StatusEnum.SUCCESS,
          message: StatusMessages.LOGIN_SUCCESS,
          data: JSON.parse(JSON.stringify(version_control_data)),
        });
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  },
  versionUpdate: async (req, res) => {
    try {
      const { android_version, android_is_force_update, android_message, ios_version, ios_is_force_update, ios_message } = req.body;

      await versionControlModel.update({
        android_version: android_version,
        android_is_force_update: android_is_force_update,
        android_message: android_message,
        ios_version: ios_version,
        ios_is_force_update: ios_is_force_update,
        ios_message: ios_message
      }, {
        where: { version_control_id: 1 }
      });
      const data = await versionControlModel.findOne({
        where: { version_control_id: 1 }
      });
      res.status(StatusEnum.SUCCESS).json({
        status: StatusEnum.SUCCESS,
        data: JSON.parse(JSON.stringify(data)),
        message: StatusMessages.LOGIN_SUCCESS,
      });
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  }
};
