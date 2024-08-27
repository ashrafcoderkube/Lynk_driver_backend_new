const {
  BASEURL,
  StatusEnum,
  StatusMessages,
  Messages,
  sendMail,
  getCurrentTime,
  sendMailForIBAN,
  sendMailForHoliday,
  checkAgreementsAndSendWhatsAppMessage,
  checkiCabbiAndSendWhatsAppMessage,
  sendMailForDELETION
} = require("../Utils/Constant");
const { errorHandler } = require("../Utils/error");
const jwt = require("../Utils/jwtToken");
const {
  validateEmail,
  validatePhone,
  validateRequiredField,
  checkSocialType,
} = require("../Utils/Validations");

const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const documentModel = require("../models/document.model");
const jwt2 = require('jsonwebtoken');
const { Op } = require('sequelize');
module.exports = {
  getAttachments: async (req, res) => {
    try {
      const user_id = req.query.id;
      if (!user_id) {
        res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide user id.' });
      } else {
        let documentData = await documentModel.findAll({
          where: { user_id: user_id }
        });
        res.status(StatusEnum.SUCCESS).json({
          status: StatusEnum.SUCCESS,
          message: StatusMessages.SUCCESS,
          data: JSON.parse(JSON.stringify(documentData))
        });
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  },
  getHomeData: async (req, res) => {
    try {
      // Fetch all user agreements with user and version details
      const responseData = {
        show_app_information: true,
        show_app_video: true,
        show_lynk_procedures: true,
        show_faqs: true,
        show_get_in_touch: true,
        show_lynk_pricing: true,
        app_information: {
          app_icon:
            "https://drive.google.com/file/d/10rtfyqVuRGAcU4yh6VlAnv_ApAvI89jA/view?usp=sharing",
          app_icon_new: "https://driverapp.lynk.ie/api/uploads/icabbi_new.png",
          title: "Lynk's iCabbi driver app",
          description:
            "Use Lynk's iCabbi driver app to connect you with passengers",
          android_app_url:
            "https://play.google.com/store/apps/details?id=com.icabbi.driver.app&hl=en_US&gl=US",
          ios_app_url:
            "https://apps.apple.com/ie/app/icabbi-driver-app/id718845727",
          documents_description:
            "Once your documents have been approved, we will send your login details for this app.",
          is_android_icons: true,
        },
        app_video: {
          video_thumbnail:
            "https://drive.google.com/file/d/1gcaSKO7uk41IaFWxUbNRTwEEUkzqhNvc/view?usp=sharing",
          video_thumbnail_new:
            "https://driverapp.lynk.ie/api/uploads/video_thumbnail.jpg",
          app_video:
            "https://www.youtube.com/watch?v=WslHSFOaM94&feature=youtu.be",
          title: "Learn how to use Lynk’s iCabbi driver app",
          description:
            "Quick tutorial video: Accept Jobs, Refuse Jobs, Complete Booking and Price Fares.",
        },
        lynk_procedures: {
          icon: "https://drive.google.com/file/d/1WunsQ2Unl0bcfOiQ0oklVFAygKiEnwHp/view?usp=sharing",
          icon_new: "https://driverapp.lynk.ie/api/uploads/PDF_icon.png",
          title: "Lynk Procedures",
          description:
            "Simple Guidelines and Rules to follow so our customers get the best service possible. Please read to make sure you understand our procedures.",
          // link: "https://www.lynk.ie/wp-content/uploads/2023/11/Driver-Procedures-24.pdf",
          link: "https://www.lynk.ie/wp-content/uploads/2024/08/Driver-Procedures-24.pdf",
        },
        faqs: {
          icon: "https://drive.google.com/file/d/1pLlKbLhhAQJ79BNlvmVML25HMSlRC4B4/view?usp=sharing",
          icon_new: "https://driverapp.lynk.ie/api/uploads/faqs.png",
          title: "FAQs",
          description:
            "We have compiled our driver’s most common questions to improve your experience with our company!",
          view_faqs_text: "View FAQs",
          link: "https://www.lynk.ie/blog-drivers/driver-frequently-asked-questions/",
        },
        get_in_touch: {
          icon: "https://drive.google.com/file/d/1IzWemXM8H2RX6WBorMnYuB9co9QlMqGT/view?usp=sharing",
          icon_new: "https://driverapp.lynk.ie/api/uploads/get_in_touch.png",
          second_icon:
            "https://drive.google.com/file/d/1efhe2PwQqQvAmaF5lKsSRp03xGJSAZqX/view?usp=sharing",
          second_icon_new:
            "https://driverapp.lynk.ie/api/uploads/get_in_touch_2.png",
          title: "Get in Touch",
          description:
            "Call Us or Email Us with any questions you may have. Our team is here to help.",
          call_number: "0035314731333",
          email: "support@lynk.ie",
        },
        lynk_pricing: {
          icon: "https://drive.google.com/file/d/1KWLUwJ7QzsA-Znk3lPqSjMRVT3PU5gri/view?usp=sharing",
          icon_new: "https://driverapp.lynk.ie/api/uploads/lynk_pricing.png",
          title: "Lynk Pricing",
          sub_title: "First week",
          type: "FREE!",
          description:
            "All new drivers get their first week without paying freight. Get a feel for the app and quality of the work.",
          weekly_freight: "Weekly freight €85",
          free_case_card_hotel_fares: "Free Cash, Card and Hotel Fares *",
          for_freight_paying_drivers:
            "For freight paying drivers. Driver-device card payments are free.",
          account_fares_fee: "Account fares fee - 10% + €2",
        },
        rent_a_taxi: "https://form.jotformeu.com/90453759949374",
        driver_news: "https://www.lynk.ie/blog/",
        terms_and_conditions: "https://www.lynk.ie/terms-conditions/",
        privacy_policy: "https://www.lynk.ie/privacy-policy/",
      };

      res.status(StatusEnum.SUCCESS).json({
        status: StatusEnum.SUCCESS,
        data: responseData,
        message: "HomeData fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching home data:", error);
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },
  updatePassword: async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      if (!email) {
        res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide email address.' });
      } else if (!newPassword) {
        res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide password.' });
      } else {
        // const saltRounds = 10;
        // const salt = await bcrypt.genSalt(saltRounds);
        // const hashedPassword = await bcrypt.hash(newPassword, salt);
        // Find the user in the database by email
        const existUser = await userModel.findOne({
          where: { email: email }
        });
        // Check if the user exists
        if (!existUser) {
          res.status(StatusEnum.USER_NOT_FOUND).json({
            status: StatusEnum.USER_NOT_FOUND,
            message: StatusMessages.NOT_FOUND,
            data: Messages.User_Not_Found,
          });
        }
        // Update the user's password
        await userModel.update({
          password: newPassword
        }, {
          where: { email: email }
        });

        res.status(StatusEnum.SUCCESS).json({
          status: StatusEnum.SUCCESS,
          message: Messages.Password_Reset_Successful,
          data: Messages.Password_Reset_Successful,
        });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: "Internal Server Error",
      });
    }
  },
  // UploadImage: async (req, res) => {
  //   try {
  //     const userId = req.body.userId;
  //     const imageFiles = req.files;
  //     const docIds = req.body.docIds.split(", ");
  //     const isRegistered = req.body.isRegistered || "false";
  //     let imageDocs = [];

  //     for (let i = 0; i < docIds.length; i++) {
  //       const file = imageFiles[i];
  //       const docId = docIds[i];

  //       imageDocs.push({
  //         document_id: docId,
  //         document_url: BASEURL + file.path,
  //       });
  //     }

  //     let userDetails = await userModel.findOne({
  //       where: { user_id: userId }
  //     });
  //     userDetails = JSON.parse(JSON.stringify(userDetails));

  //     if (userDetails) {
  //       const fullName = userDetails.first_name + " " + userDetails.last_name;
  //       const title = "New Document Uploaded";
  //       const subTitle1 = "We received a new doc from this driver: " + fullName;

  //       const isForgotPassword = false;
  //       const isAdminRegister = false;
  //       for (const imageDoc of imageDocs) {
  //         let currentDoc = await documentModel.findOne({
  //           where: { document_id: imageDoc.document_id }
  //         });
  //         currentDoc = JSON.parse(JSON.stringify(currentDoc));
  //         const subTitle2 = currentDoc.document_name + " - " + fullName;
  //         sendMail(
  //           imageDoc.document_url,
  //           userDetails.email,
  //           fullName,
  //           userId,
  //           subTitle2,
  //           imageDoc.document_url,
  //           isForgotPassword,
  //           isAdminRegister
  //         );

  //         // Update the document URL in the docs table
  //         await documentModel.update({
  //           document_url: imageDoc.document_url
  //         }, {
  //           where: { document_id: imageDoc.document_id }
  //         });
  //       }

  //       // Update the document_uploaded flag in the users table
  //       if (req.body.document_uploaded === "false") {
  //         await userModel.update({
  //           document_uploaded: false
  //         }, {
  //           where: { user_id: userId }
  //         });
  //       } else {
  //         await userModel.update({
  //           document_uploaded: true
  //         }, {
  //           where: { user_id: userId }
  //         });
  //         // setTimeout(() => {
  //         //   checkAgreementsAndSendWhatsAppMessage(userId)
  //         // }, 15 * 60 * 1000);
  //       }
  //       const data = await userModel.findOne({
  //         where: { user_id: userId },
  //         include: [{
  //           as: 'attachment',
  //           model: documentModel
  //         }]
  //       });
  //       res.status(StatusEnum.SUCCESS).json({
  //         status: StatusEnum.SUCCESS,
  //         message: isRegistered === "true" ? StatusMessages.REGISTER_SUCCESS : StatusMessages.DOCUMENT_SUCCESS,
  //         data: JSON.parse(JSON.stringify(data)),
  //       });
  //     } else {
  //       res.status(StatusEnum.USER_NOT_FOUND).json({
  //         status: StatusEnum.USER_NOT_FOUND,
  //         message: Messages.User_Not_Found,
  //       });
  //       return;
  //     }
  //   } catch (error) {
  //     res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
  //       status: StatusEnum.INTERNAL_SERVER_ERROR,
  //       message: error.message,
  //     });
  //   }
  // },
  UploadImage: async (req, res) => {
    try {
      const { userId, docIds, isRegistered = "false", document_uploaded = "false" } = req.body;
      const imageFiles = req.files;
      const docIdArray = docIds.split(", ");
      const imageDocs = imageFiles.map((file, index) => ({
        document_id: docIdArray[index],
        document_url: BASEURL + file.path,
      }));

      let userDetails = await userModel.findOne({ where: { user_id: userId } });
      if (!userDetails) {
        return res.status(StatusEnum.USER_NOT_FOUND).json({
          status: StatusEnum.USER_NOT_FOUND,
          message: Messages.User_Not_Found,
        });
      }

      userDetails = userDetails.toJSON();
      const fullName = `${userDetails.first_name} ${userDetails.last_name}`;
      const emailPromises = [];
      const updatePromises = imageDocs.map(async (imageDoc) => {
        const currentDoc = await documentModel.findOne({ where: { document_id: imageDoc.document_id } });
        const subTitle2 = `${currentDoc.document_name} - ${fullName}`;

        emailPromises.push(sendMail(
          imageDoc.document_url,
          userDetails.email,
          fullName,
          userId,
          subTitle2,
          imageDoc.document_url,
          false,
          false
        ));

        return documentModel.update(
          { document_url: imageDoc.document_url },
          { where: { document_id: imageDoc.document_id } }
        );
      });

      await Promise.all(updatePromises);
      await Promise.all(emailPromises);

      await userModel.update(
        { document_uploaded: document_uploaded === "true" },
        { where: { user_id: userId } }
      );

      const data = await userModel.findOne({
        where: { user_id: userId },
        include: [{ as: 'attachment', model: documentModel }],
      });

      res.status(StatusEnum.SUCCESS).json({
        status: StatusEnum.SUCCESS,
        message: isRegistered === "true" ? StatusMessages.REGISTER_SUCCESS : StatusMessages.DOCUMENT_SUCCESS,
        data: data.toJSON(),
      });
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  },
  forgotPasswordEmail: async (req, res) => {
    try {
      let userEmail = req.body.email;

      if (validateEmail(userEmail.toLowerCase())) {
        const userData = await userModel.findOne({
          where: { email: userEmail }
        });
        // const results = await Squery("SELECT * FROM users WHERE email = ?", [
        //   userEmail,
        // ]);

        if (!userData) {
          res.status(StatusEnum.USER_NOT_FOUND).json({
            status: StatusEnum.NOT_FOUND,
            message: Messages.User_Not_Found,
          });
        } else {
          // if (results[0].is_deleted) {
          //   res.status(StatusEnum.BLOCKED_USER).json({
          //     status: StatusEnum.BLOCKED_USER,
          //     message: Messages.Account_Blocked,
          //   });
          //   return;
          // } else {
          // const userId = results[0]._id;
          // Set the expiration time to 5 minutes (300 seconds)
          const expirationTime = 300;

          // Create the token with the payload, secret key, and expiration time
          const token = jwt2.sign(
            { ForgotPassword: userData.user_id },
            "abcdefghijklmnopqrstuvwxyz1234567890",
            { expiresIn: expirationTime }
          );

          const userToken = token;
          // const dynamicLink = "https://driverapp.lynk.ie/newformpass?userEmail=" + encodeURIComponent(userEmail) + "&userToken=" + userToken + (userData.type == "user" ? "&type=0" : "&type=1") + "&task=isForgotPassword";
          const dynamicLink = "https://lynk-driver-admin.netlify.app/newformpass?userEmail=" + encodeURIComponent(userEmail) + "&userToken=" + userToken + (userData.type == "user" ? "&type=0" : "&type=1") + "&task=isForgotPassword";
          if (userEmail) {
            const title = "Reset Your Password";
            const subTitle1 = "We received a request to reset your password.";
            const subTitle2 = "Reset Your Password";
            const isForgotPassword = true;
            const isAdminRegister = false;
            sendMail(
              dynamicLink,
              userEmail,
              title,
              subTitle1,
              subTitle2,
              dynamicLink,
              isForgotPassword,
              isAdminRegister
            )
              .then((response) =>
                res.status(StatusEnum.SUCCESS).json({
                  status: StatusEnum.SUCCESS,
                  message: response.message,
                  data: dynamicLink,
                })
              )
              .catch((error) =>
                res.status(500).json({
                  success: false,
                  message: error.message,
                })
              );
          } else {
            res.status(StatusEnum.PATTERN_NOT_MATCH).json({
              status: StatusEnum.PATTERN_NOT_MATCH,
              data: Messages.Invalid_Id,
              message: StatusMessages.PATTERN_NOT_MATCH,
            });
          }
          // }
        }
      } else {
        res.status(StatusEnum.PATTERN_NOT_MATCH).json({
          status: StatusEnum.PATTERN_NOT_MATCH,
          message: StatusMessages.PATTERN_NOT_MATCH,
          data: Messages.Invalid_Email,
        });
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  },
  updateUserProfile: async (req, res) => {
    try {
      const { id, iban_code } = req.body;
      if (!id) {
        res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide the id.' });
      } else {
        let existUser = await userModel.findOne({
          where: { user_id: id }
        });
        existUser = JSON.parse(JSON.stringify(existUser));

        if (!existUser) {
          res.status(StatusEnum.USER_NOT_FOUND).json({
            status: StatusEnum.USER_NOT_FOUND,
            message: Messages.User_Not_Found,
          });
        } else if (req.body.iban_code) {
          const fullName = `${existUser.first_name} ${existUser.last_name}`;
          const subject = `IBAN received from ${fullName}`;
          const userId = existUser.user_id;
          const userEmail = existUser.email;
          const userSPSV = existUser.spsv;
          const dynamicLink = "https://driverapp.lynk.ie/driver/view/" + encodeURIComponent(userId);
          sendMailForIBAN(
            subject,
            req.body.iban_code,
            userId,
            fullName,
            userEmail,
            userSPSV,
            dynamicLink
          );
          await userModel.update({
            is_iban_submitted: true
          }, {
            where: { user_id: id }
          });
          setTimeout(() => {
            checkAgreementsAndSendWhatsAppMessage(userId)
          }, 15 * 60 * 1000);
          let data = await userModel.findOne({
            where: { user_id: id },
            include: [{
              as: 'attachment',
              model: documentModel
            }]
          });
          res.status(StatusEnum.SUCCESS).json({
            status: StatusEnum.SUCCESS,
            message: StatusMessages.PROFILE_UPDATE_SUCCESS,
            data: JSON.parse(JSON.stringify(data))
          });
        } else {
          const { first_name, last_name, country_code, device_type, mobile_no, clicked_to_app, spsv } = req.body;

          const updateUser = await userModel.update({
            first_name: first_name || existUser.first_name,
            last_name: last_name || existUser.last_name,
            country_code: country_code || existUser.country_code,
            device_type: device_type || existUser.device_type,
            mobile_no: mobile_no || existUser.mobile_no,
            clicked_to_app: clicked_to_app || existUser.clicked_to_app,
            spsv: spsv || existUser.spsv,
            profile_image: req.file ? BASEURL + req.file.path : existUser.profile_image
          }, {
            where: { user_id: id }
          });

          let data = await userModel.findOne({
            where: { user_id: id },
            include: [{
              as: 'attachment',
              model: documentModel
            }]
          });
          data = JSON.parse(JSON.stringify(data));

          if (req.file) {
            const fullName = data.first_name + " " + data.last_name;
            const title = "Profile Image Updated";
            const subTitle1 = "We received a new doc from this driver: " + fullName;
            const subTitle2 = "Profile Image Received - " + fullName;
            const isForgotPassword = false;
            const isAdminRegister = false;
            sendMail(
              data.profile_image,
              data.email,
              fullName,
              data.user_id,
              subTitle2,
              data.profile_image,
              isForgotPassword,
              isAdminRegister
            );
          }
          const fullName = data.first_name + " " + data.last_name;
          const subject = `Driver ${data.user_id} ${fullName} Profile Updated`;
          const userSPSV = data.spsv;
          const userPhone = data.mobile_no;
          const userEmail = data.email;
          const dynamicLink = "https://driverapp.lynk.ie/driver/view/" + encodeURIComponent(data.user_id);
          await sendMailForProfileUpdate(
            subject,
            data.user_id,
            fullName,
            userEmail,
            userSPSV,
            userPhone,
            dynamicLink
          );
          res.status(StatusEnum.SUCCESS).json({
            status: StatusEnum.SUCCESS,
            message: StatusMessages.PROFILE_UPDATE_SUCCESS,
            data: data,
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
  userAgreement: async (req, res) => {
    try {
      const { version, userId } = req.body;
      if (!version) {
        res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide the version.' });
      } else if (!userId) {
        res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide user id.' });
      } else {
        // Check if the user exists
        const user = await userModel.findOne({
          where: { user_id: userId }
        });
        if (user) {
          // Update the user's agreement details
          const userAgreementUpdate = await userModel.update({
            agreement_verified: true,
            agreement_version: version,
            agreement_signed: getCurrentTime()
          }, {
            where: { user_id: userId }
          });
          setTimeout(() => {
            checkiCabbiAndSendWhatsAppMessage(userId)
          }, 15 * 60 * 1000);

          let data = await userModel.findOne({
            where: { user_id: userId },
            include: [{
              as: 'attachment',
              model: documentModel
            }]
          });
          res.status(StatusEnum.SUCCESS).json({
            status: StatusEnum.SUCCESS,
            message: StatusMessages.AGREEMENT_SUCCESS,
            data: JSON.parse(JSON.stringify(data))
          });
        } else {
          res.status(StatusEnum.USER_NOT_FOUND).json({
            status: StatusEnum.USER_NOT_FOUND,
            message: Messages.User_Not_Found,
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
  holidayEmail: async (req, res) => {
    try {
      let userId = req.body.id;
      if (!req.body.id) {
        res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide the id.' });
      } else {
        if (userId) {
          let userData = await userModel.findOne({
            where: { user_id: userId }
          });
          userData = JSON.parse(JSON.stringify(userData));
          // const results = await Squery("SELECT * FROM users WHERE _id = ?", [
          //   userId,
          // ]);

          if (!userData) {
            res.status(StatusEnum.NOT_FOUND).json({
              status: StatusEnum.NOT_FOUND,
              message: Messages.User_Not_Found,
            });
          } else {
            const fullName = `${userData.first_name} ${userData.last_name}`;
            const subject = `Holiday Request from Driver ${userId} ${fullName}`;
            const userSPSV = userData.spsv;
            const userPhone = userData.mobile_no;
            const userEmail = userData.email;
            const currenttime = getCurrentTime();
            sendMailForHoliday(
              subject,
              userId,
              fullName,
              userEmail,
              userSPSV,
              userPhone,
              req.body.driver_no,
              req.body.from,
              req.body.to,
              req.body.reason,
              currenttime
            )
            //   .then((response) =>
            res.status(StatusEnum.SUCCESS).json({
              status: StatusEnum.SUCCESS,
              message: Messages.Holidays_Request_Submitted,
            })
            // )
            // .catch((error) =>
            //   res.status(500).json({
            //     success: false,
            //     message: error.message,
            //   })
            // );
            // return;
          }
        } else {
          //console.log("email:::--", userEmail)
          res.status(StatusEnum.PATTERN_NOT_MATCH).json({
            status: StatusEnum.PATTERN_NOT_MATCH,
            data: Messages.Invalid_Id,
            message: StatusMessages.PATTERN_NOT_MATCH,
          });
          return;
        }
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  },
  deleteAccountEmail: async (req, res) => {
    try {
      let userEmail = req.body.email;
      if (validateEmail(userEmail)) {
        let userData = await userModel.findOne({
          where: { email: userEmail }
        });
        userData = JSON.parse(JSON.stringify(userData));
        if (!userData) {
          res.status(StatusEnum.NOT_FOUND).json({
            status: StatusEnum.NOT_FOUND,
            message: Messages.User_Not_Found,
          });
        } else {
          const dynamicLink = "https://driverapp.lynk.ie/driver/view/" + encodeURIComponent(userData.user_id);
          if (userEmail) {
            const fullName = `${userData.first_name} ${userData.last_name}`;
            const subject = `Account Deletion Request from Driver ${userData.user_id} ${fullName}`;

            const userSPSV = userData.spsv;
            sendMailForDELETION(
              subject,
              userData.user_id,
              fullName,
              userEmail,
              userSPSV,
              dynamicLink
            )
            //   .then((response) =>
            res.status(StatusEnum.SUCCESS).json({
              status: StatusEnum.SUCCESS,
              data: dynamicLink,
              message: Messages.Deletion_Request_Submitted,
            })
            // )
            // .catch((error) =>
            //   res.status(500).json({
            //     success: false,
            //     message: error.message,
            //   })
            // );
          } else {
            res.status(StatusEnum.PATTERN_NOT_MATCH).json({
              status: StatusEnum.PATTERN_NOT_MATCH,
              message: StatusMessages.PATTERN_NOT_MATCH,
              data: Messages.Invalid_Email,
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
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  },
  getUserById: async (req, res) => {
    try {
      const userId = req.query.id;
      console.log("userId", userId);

      // Retrieve user data with attached documents
      let data = await userModel.findOne({
        where: { user_id: userId },
        include: [{
          as: 'attachment',
          model: documentModel
        }]
      });
      data = JSON.parse(JSON.stringify(data));
      // const userData = await Squery('SELECT * FROM users LEFT JOIN docs ON users._id = docs.user_id WHERE users._id = ?', [userId]);

      if (data) {
        let registrationComplete = "";
        const isDocumentUploaded = data.document_uploaded;
        const isAgreementVerified = data.agreement_verified;
        // Extract the attachment details
        if (isDocumentUploaded !== undefined && isAgreementVerified !== undefined) {
          if (isDocumentUploaded && isAgreementVerified) {
            registrationComplete = "Yes";
          } else if (!isDocumentUploaded) {
            registrationComplete = "No";
          } else if (!isAgreementVerified) {
            registrationComplete = "No";
          }
        } else {
          console.warn(
            "isDocumentUploaded or isAgreementVerified is not defined for user:",
            data
          );
        }
        // Extract the attachment details
        // const attachments = userData.map((doc) => ({
        //   _id: doc._id,
        //   doc_name: doc.doc_name,
        //   doc_url: doc.doc_url,
        //   createdAt: doc.createdAt,
        //   updatedAt: doc.updatedAt,
        // }));
        // console.log("attachments", attachments);
        // // Extract the user details
        // const user = {
        //   ...userData[0],
        //   attachment: attachments,
        //   registrationComplete: registrationComplete,
        // };
        // user._id = userId;
        // console.log("user", user);
        res.status(StatusEnum.SUCCESS).json({
          status: StatusEnum.SUCCESS,
          message: StatusMessages.SUCCESS,
          data: data
        });
      } else {
        res.status(StatusEnum.USER_NOT_FOUND).json({
          status: StatusEnum.USER_NOT_FOUND,
          message: Messages.User_Not_Found,
        });
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  },
  changePasswordEmail: async (req, res) => {
    try {
      let userEmail = req.body.email;

      if (validateEmail(userEmail)) {
        let userData = await userModel.findOne({
          where: { email: userEmail }
        });
        userData = JSON.parse(JSON.stringify(userData));
        // const results = await Squery("SELECT * FROM users WHERE email = ?", [
        //   userEmail,
        // ]);
        if (!userData) {
          res.status(StatusEnum.NOT_FOUND).json({
            status: StatusEnum.NOT_FOUND,
            message: Messages.User_Not_Found,
          });
        }
        //  else if(results[0].password != req.body.password){
        //     res.status(StatusEnum.PATTERN_NOT_MATCH).json({
        //         status: StatusEnum.PATTERN_NOT_MATCH,
        //         message: Messages.Password_Not_Natched,
        //       });
        //       return;
        // }
        else {

          // const userId = results[0]._id;

          const userToken = userData.authToken;
          // const dynamicLink = "https://driverapp.lynk.ie/newformpass?userEmail=" + encodeURIComponent(userEmail) + "&userToken=" + userToken + (userData.type == "user" ? "&type=0" : "&type=1") + "&task=isChangePassword";
          const dynamicLink = "https://lynk-driver-admin.netlify.app/newformpass?userEmail=" + encodeURIComponent(userEmail) + "&userToken=" + userToken + (userData.type == "user" ? "&type=0" : "&type=1") + "&task=isChangePassword";
          if (userEmail) {
            const title = "Reset Your Password";
            const subTitle1 = "We received a request to reset your password.";
            const subTitle2 = "Reset Your Password";
            const isForgotPassword = true;
            const isAdminRegister = false;
            sendMail(
              dynamicLink,
              userEmail,
              title,
              subTitle1,
              subTitle2,
              dynamicLink,
              isForgotPassword,
              isAdminRegister
            )
              .then((response) =>
                res.status(StatusEnum.SUCCESS).json({
                  status: StatusEnum.SUCCESS,
                  data: dynamicLink,
                  message: Messages.Change_Password_Request,
                })
              )
              .catch((error) =>
                res.status(500).json({
                  success: false,
                  message: error.message,
                })
              );
          } else {
            res.status(StatusEnum.PATTERN_NOT_MATCH).json({
              status: StatusEnum.PATTERN_NOT_MATCH,
              message: StatusMessages.PATTERN_NOT_MATCH,
              data: Messages.Invalid_Id,
            });
          }
          // }
        }
      } else {
        res.status(StatusEnum.PATTERN_NOT_MATCH).json({
          status: StatusEnum.PATTERN_NOT_MATCH,
          data: Messages.Invalid_Email,
          message: StatusMessages.PATTERN_NOT_MATCH,
        });
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  },
  // checkDocumentsAndSendWhatsAppMessage: async (req, res) => {
  //   try {
  //     // Find all users who have registered 15 minutes ago and have pending documents
  //     const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  //     const users = await userModel.findAll({
  //       where: {
  //         createdAt: { [Op.lte]: fifteenMinutesAgo },
  //         type: 'user'
  //       },
  //       include: [{
  //         required: false,
  //         as: 'attachment',
  //         model: documentModel
  //       }]
  //     });

  //     users.forEach(async (user) => {
  //       const pendingDocuments = user.attachment.filter(doc => !doc.document_url).map(doc => doc.document_name);
  //       if (pendingDocuments.length > 0) {
  //         const data = await sendDoubletickWhatsAppMessage(user.country_code + user.mobile_no , user.first_name + " " +user.last_name, pendingDocuments);
  //         res.status(StatusEnum.SUCCESS).json({
  //           status: StatusEnum.SUCCESS,
  //           data: data,
  //           message: Messages.Change_Password_Request,
  //         })
  //       }
  //     });
  //   } catch (error) {
  //     res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
  //       status: StatusEnum.INTERNAL_SERVER_ERROR,
  //       message: error.message
  //     });
  //   }
  // }


}