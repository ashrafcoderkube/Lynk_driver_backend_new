const userModel = require('../models/user.model');
const agreementModel = require('../models/agreement.model');
const documentModel = require('../models/document.model');
const leadsModel = require('../models/leads.model');
const messageModel = require('../models/messages.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Sequelize, Op, where } = require('sequelize');
const exceljs = require('exceljs');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const axios = require('axios');
const {
  BASEURL,
  StatusEnum,
  StatusMessages,
  Messages,
  sendMail,
  getCurrentTime,
  sendMailForIBAN
} = require("../Utils/Constant");
const { errorHandler } = require("../Utils/error");
const {
  validateEmail,
  validatePhone,
  validateRequiredField,
  checkSocialType,
} = require("../Utils/Validations");
const { use } = require('../routes/admin.route');
const { CONSTANTS } = require('@firebase/util');
const e = require('express');

module.exports = {
  getAllUsers: async (req, res) => {
    try {
      const { id, uid, page, firstName, lastName, email, mobile, spsv, icabbiStatus } = req.query;
      let device_type = req.query.device_type || ['Android', 'iOS', 'Desktop'];
      let type = req.query.type || 'user';
      const sortField = req.query.sortField || "createdAt";
      const sortOrder = req.query.sortOrder && req.query.sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";
      const existUser = await userModel.findOne({
        where: { user_id: id }
      });
      if (existUser) {
        if (existUser.type == "user") {
          res.status(StatusEnum.NOT_FOUND).json({
            status: StatusEnum.NOT_FOUND,
            data: Messages.You_Are_Not_Admin,
            message: StatusMessages.You_Are_Not_Admin,
          });
        } else {
          const page = parseInt(req.query.page) || 1;
          const pageSize = 10;
          const offset = (page - 1) * pageSize;
          let whereCondition = {};
          if (typeof icabbiStatus == "undefined") {
            whereCondition = {
              device_type: device_type,
              type: type,
              is_deleted: 0
            };
          } else {
            whereCondition = {
              device_type: device_type,
              type: type,
              is_deleted: 0,
              icabbiStatus: icabbiStatus
            };
          }

          if (firstName || lastName || email || mobile || uid) {
            whereCondition[Sequelize.Op.and] = [];
            if (firstName) {
              whereCondition[Sequelize.Op.and].push({
                first_name: {
                  [Sequelize.Op.like]: `%${firstName}%`
                }
              });
            }
            if (lastName) {
              whereCondition[Sequelize.Op.and].push({
                last_name: {
                  [Sequelize.Op.like]: `%${lastName}%`
                }
              });
            }
            if (email) {
              whereCondition[Sequelize.Op.and].push({
                email: {
                  [Sequelize.Op.like]: `%${email}%`
                }
              });
            }
            if (mobile) {
              whereCondition[Sequelize.Op.and].push({
                mobile_no: {
                  [Sequelize.Op.like]: `%${mobile}%`
                }
              });
            }
            if (uid) {
              whereCondition[Sequelize.Op.and].push({
                user_id: {
                  [Sequelize.Op.eq]: `${uid}`
                }
              });
            }
          }
          const totalNumberOfUser = await userModel.count({ where: whereCondition });
          const totalPages = Math.ceil(totalNumberOfUser / pageSize);
          let userData = await userModel.findAndCountAll({
            where: whereCondition,
            order: [[sortField, sortOrder]],
            limit: pageSize,
            offset: offset,
            include: [{
              as: 'attachment',
              model: documentModel
            }]
          });
          userData = JSON.parse(JSON.stringify(userData));
          let registrationComplete = "";
          userData.rows.forEach(user => {
            const isDocumentUploaded = user.document_uploaded;
            const isAgreementVerified = user.agreement_verified;
            const isIBANVerified = user.is_iban_submitted
            if (isDocumentUploaded !== undefined && isAgreementVerified !== undefined && isIBANVerified !== undefined) {
              if (isDocumentUploaded && isAgreementVerified && isIBANVerified) {
                registrationComplete = "Yes";
              } else if (!isDocumentUploaded) {
                registrationComplete = "No";
              } else if (!isAgreementVerified) {
                registrationComplete = "NO";
              } else if (!isIBANVerified) {
                registrationComplete = "NO"
              }
            } else {
              console.warn("isDocumentUploaded or isAgreementVerified or isIBANVerified is not defined for user:", user);
            }
            user['registrationComplete'] = registrationComplete;
          });

          res.status(StatusEnum.SUCCESS).json({
            status: StatusEnum.SUCCESS,
            message: StatusMessages.SUCCESS,
            data: userData.rows,
            page: page,
            totalPages: totalPages,
          });
        }
      } else {
        res.status(StatusEnum.NOT_FOUND).json({
          status: StatusEnum.NOT_FOUND,
          message: StatusMessages.NOT_FOUND,
          data: "User not found.",
        });
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  },
  getAllAdmins: async (req, res) => {
    try {
      const { id, uid, page, firstName, lastName, email, mobile, spsv } = req.query;
      let device_type = req.query.device_type || ['Android', 'iOS', 'Desktop'];
      let type = req.query.type || ['admin', 'superadmin'];
      const sortField = req.query.sortField || "createdAt";
      const sortOrder = req.query.sortOrder && req.query.sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";
      const existUser = await userModel.findOne({
        where: { user_id: id }
      });
      if (existUser) {
        if (existUser.type == "user") {
          res.status(StatusEnum.NOT_FOUND).json({
            status: StatusEnum.NOT_FOUND,
            data: Messages.You_Are_Not_Admin,
            message: StatusMessages.You_Are_Not_Admin,
          });
        } else {
          const page = parseInt(req.query.page) || 1;
          const pageSize = 10;
          const offset = (page - 1) * pageSize;
          let whereCondition = {
            device_type: device_type,
            type: type,
            is_deleted: 0
          };
          if (firstName || lastName || email || mobile || uid) {
            whereCondition[Sequelize.Op.and] = [];
            if (firstName) {
              whereCondition[Sequelize.Op.and].push({
                first_name: {
                  [Sequelize.Op.like]: `%${firstName}%`
                }
              });
            }
            if (lastName) {
              whereCondition[Sequelize.Op.and].push({
                last_name: {
                  [Sequelize.Op.like]: `%${lastName}%`
                }
              });
            }
            if (email) {
              whereCondition[Sequelize.Op.and].push({
                email: {
                  [Sequelize.Op.like]: `%${email}%`
                }
              });
            }
            if (mobile) {
              whereCondition[Sequelize.Op.and].push({
                mobile_no: {
                  [Sequelize.Op.like]: `%${mobile}%`
                }
              });
            }
            if (uid) {
              whereCondition[Sequelize.Op.and].push({
                user_id: {
                  [Sequelize.Op.eq]: `${uid}`
                }
              });
            }
          }
          const totalNumberOfUser = await userModel.count({ where: whereCondition });
          const totalPages = Math.ceil(totalNumberOfUser / pageSize);
          let userData = await userModel.findAndCountAll({
            where: whereCondition,
            order: [[sortField, sortOrder]],
            limit: pageSize,
            offset: offset,
            include: [{
              as: 'attachment',
              model: documentModel
            }]
          });
          userData = JSON.parse(JSON.stringify(userData));
          let registrationComplete = "";
          userData.rows.forEach(user => {
            const isDocumentUploaded = user.document_uploaded;
            const isAgreementVerified = user.agreement_verified;
            const isIBANVerified = user.is_iban_submitted
            if (isDocumentUploaded !== undefined && isAgreementVerified !== undefined && isIBANVerified !== undefined) {
              if (isDocumentUploaded && isAgreementVerified && isIBANVerified) {
                registrationComplete = "Yes";
              } else if (!isDocumentUploaded) {
                registrationComplete = "No";
              } else if (!isAgreementVerified) {
                registrationComplete = "NO";
              } else if (!isIBANVerified) {
                registrationComplete = "NO"
              }
            } else {
              console.warn(
                "isDocumentUploaded or isAgreementVerified or isIBANVerified is not defined for user:",
                user
              );
            }
            user['registrationComplete'] = registrationComplete;
          });

          res.status(StatusEnum.SUCCESS).json({
            status: StatusEnum.SUCCESS,
            message: StatusMessages.SUCCESS,
            data: userData.rows,
            page: page,
            totalPages: totalPages,
          });
        }
      } else {
        res.status(StatusEnum.NOT_FOUND).json({
          status: StatusEnum.NOT_FOUND,
          message: StatusMessages.NOT_FOUND,
          data: "User not found.",
        });
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  },
  getAllReports: async (req, res) => {
    try {
      const { id, uid, firstName, lastName, email, mobile, spsv, icabbiStatus } = req.query;
      if (id) {
        const userData = await userModel.findOne({
          where: { user_id: id }
        });
        if (userData) {
          if (userData.type === "user") {
            res.status(StatusEnum.NOT_FOUND).json({
              status: StatusEnum.NOT_FOUND,
              data: Messages.You_Are_Not_Admin,
              message: StatusMessages.You_Are_Not_Admin,
            });
          } else {
            let device_type = req.query.device_type || ['Android', 'iOS', 'Desktop'];
            const sortField = req.query.sortField || "createdAt";
            const sortOrder = req.query.sortOrder && req.query.sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";
            const page = parseInt(req.query.page) || 1;
            const pageSize = 10;
            const offset = (page - 1) * pageSize;

            let whereCondition = {
              device_type: device_type,
              is_deleted: 0,
              document_uploaded: 0,
              agreement_verified: 0
            }

            if (firstName || lastName || email || mobile || spsv || icabbiStatus || uid) {
              whereCondition[Sequelize.Op.and] = [];
              if (firstName) {
                whereCondition[Sequelize.Op.and].push({
                  first_name: {
                    [Sequelize.Op.like]: `%${firstName}%`
                  }
                });
              }
              if (lastName) {
                whereCondition[Sequelize.Op.and].push({
                  last_name: {
                    [Sequelize.Op.like]: `%${lastName}%`
                  }
                });
              }
              if (email) {
                whereCondition[Sequelize.Op.and].push({
                  email: {
                    [Sequelize.Op.like]: `%${email}%`
                  }
                });
              }
              if (mobile) {
                whereCondition[Sequelize.Op.and].push({
                  mobile_no: {
                    [Sequelize.Op.like]: `%${mobile}%`
                  }
                });
              }
              if (icabbiStatus) {
                whereCondition[Sequelize.Op.and].push({
                  icabbiStatus: {
                    [Sequelize.Op.like]: `%${icabbiStatus}%`
                  }
                });
              }
              if (uid) {
                whereCondition[Sequelize.Op.and].push({
                  user_id: {
                    [Sequelize.Op.eq]: `${uid}`
                  }
                });
              }
            }
            const totalNumberOfUser = await userModel.count({ where: whereCondition });
            const totalPages = Math.ceil(totalNumberOfUser / pageSize);
            let userData = await userModel.findAndCountAll({
              where: whereCondition,
              order: [[sortField, sortOrder]],
              limit: pageSize,
              offset: offset,
              include: [{
                required: true,
                as: 'attachment',
                model: documentModel
              }]
            });
            userData = JSON.parse(JSON.stringify(userData));
            const filteredResults = userData.rows.filter((user) => !(user.document_uploaded && user.agreement_verified));
            filteredResults.forEach(user => {
              let status = "";
              const isDocumentUploaded = user.document_uploaded;
              const isAgreementVerified = user.agreement_verified;
              if (isDocumentUploaded !== undefined && isAgreementVerified !== undefined) {
                if (isDocumentUploaded && isAgreementVerified) {
                  status = "Sign Up Complete";
                } else if (!isDocumentUploaded) {
                  status = "Pending Document Upload";
                } else if (!isAgreementVerified) {
                  status = "Pending Agreement";
                }
              } else {
                console.warn("isDocumentUploaded or isAgreementVerified is not defined for user:", user);
              }
              user['status'] = status;
            });

            res.status(StatusEnum.SUCCESS).json({
              message: StatusMessages.SUCCESS,
              status: StatusEnum.SUCCESS,
              data: userData.rows,
              page: page,
              totalPages: totalPages,
            });
          }
        } else {
          res.status(StatusEnum.SUCCESS).json({
            status: StatusEnum.NOT_FOUND,
            message: StatusMessages.NOT_FOUND,
            data: "User not found.",
          });
        }
      } else {
        res.status(StatusEnum.NOT_FOUND).json({
          status: StatusEnum.NOT_FOUND,
          message: StatusMessages.You_Are_Not_Admin,
          data: StatusMessages.You_Are_Not_Admin,
        });
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  },
  updateAgreement: async (req, res) => {
    try {
      const { version, id, admin_id, title, content } = req.body;
      const user_data = await userModel.findOne({
        where: { user_id: admin_id, type: 'admin', is_deleted: 0 }
      });

      if (!user_data) {
        res.status(StatusEnum.USER_NOT_FOUND).json({
          status: StatusEnum.USER_NOT_FOUND,
          message: Messages.You_Are_Not_Admin
        });
      } else {
        const agreement_data = await agreementModel.findOne({
          where: { agreement_id: id }
        });
        if (agreement_data) {
          const updateAgreement = await agreementModel.update({
            version: version,
            title: title,
            content: content
          }, {
            where: { agreement_id: id }
          });
          const agreement_data = await agreementModel.findOne({
            where: { agreement_id: id },
            attributes: ['title', 'version', 'content']
          });
          res.status(StatusEnum.SUCCESS).json({
            status: StatusEnum.SUCCESS,
            message: Messages.Agreement_Update_Success,
            data: agreement_data
          });
        } else {
          res.status(StatusEnum.Not_Found).json({
            status: StatusEnum.Not_Found,
            message: Messages.Agreement_Not_Found
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
  exportSearchedUser: async (req, res) => {
    try {
      const { id, uid, page, firstName, lastName, email, mobile, spsv, type } = req.query;
      const sortField = req.query.sortField || "createdAt";
      const sortOrder = req.query.sortOrder && req.query.sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";
      const existUser = await userModel.findOne({
        where: { user_id: id }
      });
      if (existUser) {
        if (existUser.type == "user") {
          res.status(StatusEnum.NOT_FOUND).json({
            status: StatusEnum.NOT_FOUND,
            data: Messages.You_Are_Not_Admin,
            message: StatusMessages.You_Are_Not_Admin,
          });
        } else {
          const page = parseInt(req.query.page) || 1;
          const pageSize = 10;
          const offset = (page - 1) * pageSize;
          let userData = await userModel.findAndCountAll({
            where: {
              [Sequelize.Op.or]: [
                {
                  first_name: {
                    [Sequelize.Op.like]: `%${firstName}%`
                  }
                },
                {
                  last_name: {
                    [Sequelize.Op.like]: `%${lastName}%`
                  }
                },
                {
                  email: {
                    [Sequelize.Op.like]: `%${email}%`
                  }
                },
                {
                  mobile_no: {
                    [Sequelize.Op.like]: `%${mobile}%`
                  }
                },
              ],

            },
            order: [[sortField, sortOrder]],
            limit: pageSize,
            offset: offset,
          });
          userData = JSON.parse(JSON.stringify(userData));
          const downloadFolderPath = path.join(__dirname, "../downloads");

          const filePath = path.join(downloadFolderPath, "reports.csv");

          // Ensure the 'downloads' folder exists
          if (!fs.existsSync(downloadFolderPath)) {
            fs.mkdirSync(downloadFolderPath);
          }

          const csvWriter = createCsvWriter({
            path: filePath,
            header: [
              { id: "first_name", title: "First Name" },
              { id: "last_name", title: "Last Name" },
              { id: "mobile_no", title: "Mobile" },
              { id: "email", title: "Email" },
              { id: "spsv", title: "SPSV" },
              { id: "device_type", title: "Device Type" },
              { id: "status", title: "Progress" },
            ],
          });

          await csvWriter.writeRecords(userData.rows);

          // Set headers for file download
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            "attachment; filename=reports.csv"
          );

          // Create a read stream from the file and pipe it to the response
          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);

          // Optionally, you can delete the file after streaming it
           fileStream.on("end", async () => {
                // Optionally, you can delete the file after streaming it
                //fs.unlinkSync(filePath);

                // After streaming the file, make a GET request to the desired URL
                // try {
                //   await axios.get(
                //     `https://driverapp.lynk.ie/apiv/downloads/reports.csv`
                //   );
                // } catch (error) {
                //   console.error(
                //     "Error making GET request to the other API",
                //     error
                //   );
                // }
              }
          );

          res.sendFile(filePath, (err) => {
            if (err) {
              console.error(err);
              res.status(err.status).end();
            } else {
              //console.log(`File sent: ${filePath}`);
            }
          });
         // fs.unlinkSync(filePath);
          return;

        }
      } else {
        res.status(StatusEnum.NOT_FOUND).json({
          status: StatusEnum.NOT_FOUND,
          data: "User not found.",
          message: StatusMessages.NOT_FOUND,
        });
        return;
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  },
  getAttachments: async (req, res) => {
    try {
      const { user_id } = req.query;
      const userData = await userModel.findOne({
        where: { user_id: user_id },
        include: [{
          model: documentModel
        }]
      });
      res.status(StatusEnum.SUCCESS).json({
        status: StatusEnum.SUCCESS,
        data: userData,
        message: StatusMessages.SUCCESS,
      });
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  },
  getHomeData: async (req, res) => {
    try {
      const responseData = {
        show_app_information: true,
        show_app_video: true,
        show_lynk_procedures: true,
        show_faqs: true,
        show_get_in_touch: true,
        show_lynk_pricing: true,
        app_information: {
          app_icon: "",
          title: "Lynk's iCabbi driver app",
          description:
            "Use Lynk's iCabbi driver app to connect you with passengers",
          android_app_url:
            "https://play.google.com/store/apps/details?id=com.icabbi.driver.app&hl=en_US&gl=US",
          ios_app_url:
            "https://apps.apple.com/ie/app/icabbi-driver-app/id718845727",
          documents_description:
            "Once your documents have been approved, we will send your login details for this app.",
          is_android_icons: false,
        },
        app_video: {
          video_thumbnail: "",
          app_video:
            "https://www.youtube.com/watch?v=WslHSFOaM94&feature=youtu.be",
          title: "Learn how to use Lynk’s iCabbi driver app",
          description:
            "Quick tutorial video: Accept Jobs, Refuse Jobs, Complete Booking and Price Fares.",
        },
        lynk_procedures: {
          icon: "",
          title: "Lynk Procedures",
          description:
            "Simple Guidelines and Rules to follow so our customers get the best service possible. Please read to make sure you understand our procedures.",
          link: "https://www.lynk.ie/wp-content/uploads/2023/11/Driver-Procedures-24.pdf",
        },
        faqs: {
          icon: "",
          title: "FAQs",
          description:
            "We have compiled our driver’s most common questions to improve your experience with our company!",
          view_faqs_text: "View FAQs",
          link: "https://www.lynk.ie/blog-drivers/driver-frequently-asked-questions/",
        },
        get_in_touch: {
          icon: "",
          title: "Get in Touch",
          description:
            "Call us with any questions you may have. Our term is here to help 24/7/365!",
          call_number: "0035314731333",
        },
        lynk_pricing: {
          icon: "",
          title: "Lynk Pricing",
          sub_title: "First week",
          type: "FREE!",
          description:
            "All new drivers get their first week without paying freight. Get a feel for the app and quality of the work.",
          weekly_freight: "Weekly freight €85",
          free_case_card_hotel_fares: "Free Case, Card and Hotel fares *",
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
        message: "HomeData fetched successfully",
        data: responseData,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },
  deleteUsers: async (req, res) => {
    try {
      const { id } = req.query;
      if (id) {
        //soft delete.
        const deleteUser = await userModel.update({
          is_deleted: 1
        }, {
          where: { user_id: id }
        });

        //hard delete
        // const deleteUser = await userModel.destroy({
        //     where: { user_id: id }
        // });
        res.status(StatusEnum.SUCCESS).json({
          status: StatusEnum.SUCCESS,
          data: StatusMessages.USER_DELETE_SUCCESS,
          message: Messages.User_Deleted,
        });
      } else {
        res.status(StatusEnum.USER_NOT_FOUND).json({
          message: Messages.User_Not_Found,
          status: StatusEnum.USER_NOT_FOUND,
        });
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  },
  // getLastTwoWeekUsers: async (req, res) => {
  //   try {
  //     const { id, uid, page, firstName, lastName, email, mobile, spsv, type } = req.query;

  //     const twoWeeksAgo = new Date();
  //     twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  //     const sortField = req.query.sortField || "createdAt";
  //     const sortOrder = req.query.sortOrder && req.query.sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";
  //     const existUser = await userModel.findOne({
  //       where: { user_id: id }
  //     });

  //     if (existUser) {
  //       if (existUser.type == "user") {
  //         res.status(StatusEnum.NOT_FOUND).json({
  //           status: StatusEnum.NOT_FOUND,
  //           data: Messages.You_Are_Not_Admin,
  //           message: StatusMessages.You_Are_Not_Admin,
  //         });
  //       } else {
  //         const page = parseInt(req.body.page) || 1;
  //         const pageSize = 10;
  //         const offset = (page - 1) * pageSize;
  //         const userData = await userModel.findAndCountAll({
  //           where: {
  //             [Sequelize.Op.or]: [
  //               {
  //                 first_name: {
  //                   [Sequelize.Op.like]: `%${firstName}%`
  //                 }
  //               },
  //               {
  //                 last_name: {
  //                   [Sequelize.Op.like]: `%${lastName}%`
  //                 }
  //               },
  //               {
  //                 email: {
  //                   [Sequelize.Op.like]: `%${email}%`
  //                 }
  //               },
  //               {
  //                 mobile_no: {
  //                   [Sequelize.Op.like]: `%${mobile}%`
  //                 }
  //               },
  //             ],
  //             createdAt: {
  //               [Sequelize.Op.gte]: twoWeeksAgo
  //             }
  //           },
  //           order: [[sortField, sortOrder]],
  //           limit: pageSize,
  //           offset: offset,
  //         });
  //         res.status(StatusEnum.SUCCESS).json({
  //           status: StatusEnum.SUCCESS,
  //           message: StatusMessages.SUCCESS,
  //           data: userData,
  //           // page: page,
  //           // totalPages: totalPages,
  //         });
  //         // return;
  //         // responseHelper.successResponse(res, StatusEnum.SUCCESS, userData, StatusMessages.SUCCESS);
  //       }
  //     } else {
  //       res.status(StatusEnum.NOT_FOUND).json({
  //         status: StatusEnum.NOT_FOUND,
  //         data: "User not found.",
  //         message: StatusMessages.NOT_FOUND,
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
  getLastTwoWeekUsers: async (req, res) => {
    try {
      function getStartOfWeekDate() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // day starts with sunday and index starts from 0
        const startOfWeek = new Date(today); // Copy the current date
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek); // Subtract days to get to the start of the week
        startOfWeek.setHours(0, 0, 0, 0); // Set time to midnight

        return startOfWeek;
      }
      const startOfWeek = getStartOfWeekDate();

      function getEndOfWeekDate() {
        const today = new Date();
        const dayOfWeek = today.getDay(); //day starts with sunday and index starts from 0
        const endOfWeek = new Date(today); // Copy the current date
        const diff = 6 - dayOfWeek; // Calculate the difference between Saturday (end of the week) and the current day

        endOfWeek.setDate(endOfWeek.getDate() + diff); // Add the difference to the current date to get to the end of the week
        endOfWeek.setHours(23, 59, 59, 999); // Set time to the end of the day

        return endOfWeek;
      }
      const endOfWeek = getEndOfWeekDate();

      function getLastWeekStartDate() {
        var today = new Date();
        var dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
        var diff = dayOfWeek + 7; // calculate the difference to go back to the start of the previous week
        var lastWeekStartDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - diff);

        // Adjust to the beginning of the day
        lastWeekStartDate.setHours(0, 0, 0, 0);

        return lastWeekStartDate;
      }
      const lastWeekStartDate = getLastWeekStartDate();

      function getLastWeekEndDate() {
        var lastWeekStartDate = getLastWeekStartDate();
        var lastWeekEndDate = new Date(lastWeekStartDate);

        // Add 6 days to the start date to get the end date of the last week
        lastWeekEndDate.setDate(lastWeekEndDate.getDate() + 6);

        // Adjust to the end of the day
        lastWeekEndDate.setHours(23, 59, 59, 999);

        return lastWeekEndDate;
      }
      const lastWeekEndDate = getLastWeekEndDate();
      const totalUsers = await userModel.count({
        where: { type: 'user', is_deleted: 0 }
      });

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Construct the start and end dates for the current month
      const startDate = new Date(currentYear, currentMonth - 1, 1); // Month is 0-indexed
      const endDate = new Date(currentYear, currentMonth, 0); // Last day of the month

      const numberOfCurrentMonthUser = await userModel.count({
        where: { type: 'user', is_deleted: 0, createdAt: { [Sequelize.Op.between]: [startDate, endDate] } }
      });
      let currentWeekData = await userModel.findAll({
        attributes: [
          [Sequelize.fn('DAYOFWEEK', Sequelize.col('createdAt')), 'dayOfWeek'],
          [Sequelize.fn('COUNT', Sequelize.col('*')), 'count']
        ],
        where: { type: 'user', createdAt: { [Sequelize.Op.between]: [startOfWeek, endOfWeek] } },
        group: [Sequelize.fn('DAYOFWEEK', Sequelize.col('createdAt'))]
      });
      let lastWeekData = await userModel.findAll({
        attributes: [
          [Sequelize.fn('DAYOFWEEK', Sequelize.col('createdAt')), 'dayOfWeek'],
          [Sequelize.fn('COUNT', Sequelize.col('*')), 'count']
        ],
        where: { type: 'user', createdAt: { [Sequelize.Op.between]: [lastWeekStartDate, lastWeekEndDate] } },
        group: [Sequelize.fn('DAYOFWEEK', Sequelize.col('createdAt'))]
      });
      currentWeekData = JSON.parse(JSON.stringify(currentWeekData));
      lastWeekData = JSON.parse(JSON.stringify(lastWeekData));
      function fillWeekWithZeroCounts(results) {
        let index = 0;
        let weekArray = [];
        for (let i = 1; i <= 7; i++) {
          if (results[index] && results[index].dayOfWeek === i) {
            weekArray.push(results[index]);
            index++;
          } else {
            weekArray.push({ dayOfWeek: i, count: 0 });
          }
        }
        return weekArray;
      }
      let currentWeekArray = fillWeekWithZeroCounts(currentWeekData);
      let lastWeekArray = fillWeekWithZeroCounts(lastWeekData);

      res.status(StatusEnum.SUCCESS).json({
        status: StatusEnum.SUCCESS,
        message: StatusMessages.SUCCESS,
        data: {
          currentWeek: currentWeekArray.map(ele => ele.count),
          lastWeek: lastWeekArray.map(ele => ele.count),
          totalUserCount: totalUsers,
          userCountThisMonth: numberOfCurrentMonthUser,
        }
      });
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  },
  getUserById: async (req, res) => {
    try {
      const userId = req.query.id;
      if (!userId) {
        res.status().json({ message: "Please provide user id." });
      } else {
        let userData = await userModel.findOne({
          where: { user_id: userId },
          include: [{
            as: 'attachment',
            model: documentModel
          }]
        });
        userData = JSON.parse(JSON.stringify(userData));
        if (userData) {
          let registrationComplete = "";
          const isDocumentUploaded = userData.document_uploaded;
          const isAgreementVerified = userData.agreement_verified;
          if (isDocumentUploaded !== undefined && isAgreementVerified !== undefined) {
            if (isDocumentUploaded && isAgreementVerified) {
              registrationComplete = "Yes";
            } else if (!isDocumentUploaded) {
              registrationComplete = "No";
            } else if (!isAgreementVerified) {
              registrationComplete = "No";
            }
          } else {
            console.warn("isDocumentUploaded or isAgreementVerified is not defined for user:", userData);
          }
          userData['registrationComplete'] = registrationComplete;
          res.status(StatusEnum.SUCCESS).json({
            status: StatusEnum.SUCCESS,
            message: StatusMessages.SUCCESS,
            data: userData,
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
        message: error.message,
      });
    }
  },
  updateUserProfile: async (req, res) => {
    try {
      const userId = req.body.id;
      const email = req.body.email;
      let existUser = await userModel.findOne({
        where: { email: email, is_deleted: 0 }
      });
      existUser = JSON.parse(JSON.stringify(existUser));
      // const user = await Squery("SELECT * FROM users WHERE _id = ? LIMIT 1", [
      //   userId,
      // ]);

      if (!existUser) {
        res.status(StatusEnum.USER_NOT_FOUND).json({
          status: StatusEnum.USER_NOT_FOUND,
          message: Messages.User_Not_Found,
        });
      } else {
        // icabbiStatus
        if (email === existUser.email) {
          await userModel.update({
            first_name: req.body.first_name || existUser.first_name,
            last_name: req.body.last_name || existUser.last_name,
            country_code: req.body.country_code || existUser.country_code,
            device_type: req.body.device_type || existUser.device_type,
            clicked_to_app: req.body.clicked_to_app || existUser.clicked_to_app,
            type: req.body.type || existUser.type,
            email: req.body.email || existUser.email,
            password: req.body.password || existUser.password,
            mobile_no: req.body.mobile_no || existUser.mobile_no,
            spsv: req.body.spsv || existUser.spsv,
            is_deleted: req.body.is_deleted || existUser.is_deleted,
            icabbiStatus: req.body.icabbiStatus || existUser.icabbiStatus,
            profile_image: req.file ? BASEURL + req.file.path : existUser.profile_image,
          }, {
            where: { user_id: userId }
          });
          // const updateUserQuery = `
          //           UPDATE users
          //           SET first_name = ?, last_name = ?, country_code = ?, device_type = ?,
          //               clicked_to_app = ?, type = ?, email = ?, password = ?,
          //               mobile_no = ?, spsv = ?, is_deleted = ?,icabbiStatus = ?, profile_image = ?
          //           WHERE _id = ?
          //       `;

          // await Squery(updateUserQuery, [
          //   req.body.first_name || user[0].first_name,
          //   req.body.last_name || user[0].last_name,
          //   req.body.country_code || user[0].country_code,
          //   req.body.device_type || user[0].device_type,
          //   req.body.clicked_to_app || user[0].clicked_to_app,
          //   req.body.type || user[0].type,
          //   req.body.email || user[0].email,
          //   req.body.password || user[0].password,
          //   req.body.mobile_no || user[0].mobile_no,
          //   req.body.spsv || user[0].spsv,
          //   req.body.is_deleted || user[0].is_deleted,
          //   req.body.icabbiStatus || user[0].icabbiStatus,
          //   req.file ? BASEURL + req.file.path : user[0].profile_image,
          //   userId,
          // ]);
          let updatedUser = await userModel.findOne({
            where: { user_id: userId, is_deleted: 0 },
            include: [{
              as: 'attachment',
              model: documentModel
            }]
          });
          updatedUser = JSON.parse(JSON.stringify(updatedUser));
          // const updatedUser = await Squery('SELECT * FROM users LEFT JOIN docs ON users._id = docs.user_id WHERE users._id = ?', [userId]);

          if (req.file) {
            const fullName = updatedUser.first_name + updatedUser.last_name;
            const title = "Profile Image Updated";
            const subTitle1 = "We received a new doc from this driver: " + fullName;
            const subTitle2 = "here is driver's id: " + updatedUser.user_id;
            const isForgotPassword = false;
            const isAdminRegister = false;
            sendMail(
              BASEURL + req.file.path,
              updatedUser.email,
              fullName,
              updatedUser.user_id,
              subTitle2,
              BASEURL + req.file.path,
              isForgotPassword,
              isAdminRegister
            );
          }
          // data._id = parseInt(userId, 0);
          res.status(StatusEnum.SUCCESS).json({
            status: StatusEnum.SUCCESS,
            message: "User updated successfully",
            data: updatedUser
          });
        } else {
          // const isEmail = await Squery(
          //   "SELECT * FROM users WHERE email = ? LIMIT 1",
          //   [email]
          // );
          const isEmail = await userModel.findOne({
            where: { email: email, is_deleted: 0 }
          });
          if (isEmail) {
            res.status(StatusEnum.ALREADY_EXIST).json({
              status: StatusEnum.ALREADY_EXIST,
              message: StatusMessages.ALREADY_EXIST,
            });
          } else {
            await userModel.update({
              first_name: req.body.first_name || existUser.first_name,
              last_name: req.body.last_name || existUser.last_name,
              country_code: req.body.country_code || existUser.country_code,
              device_type: req.body.device_type || existUser.device_type,
              clicked_to_app: req.body.clicked_to_app || existUser.clicked_to_app,
              type: req.body.type || existUser.type,
              email: req.body.email || existUser.email,
              password: req.body.password || existUser.password,
              mobile_no: req.body.mobile_no || existUser.mobile_no,
              spsv: req.body.spsv || existUser.spsv,
              is_deleted: req.body.is_deleted || existUser.is_deleted,
              icabbiStatus: req.body.icabbiStatus || existUser.icabbiStatus,
              profile_image: req.file ? BASEURL + req.file.path : existUser.profile_image,
            }, {
              where: { user_id: userId }
            });

            // const updatedUser = await Squery(
            //   "SELECT * FROM users WHERE _id = ? LIMIT 1",
            //   [userId]
            // );
            let updatedUser = await userModel.findOne({
              where: { user_id: userId, is_deleted: 0 },
              include: [{
                as: 'attachment',
                model: documentModel
              }]
            });
            updatedUser = JSON.parse(JSON.stringify(updatedUser));
            if (req.file) {
              const fullName = updatedUser.first_name + updatedUser.last_name;
              const title = "Profile Image Updated";
              const subTitle1 = "We received a new doc from this driver: " + fullName;
              const subTitle2 = "here is driver's id: " + updatedUser.user_id;
              const isForgotPassword = false;
              const isAdminRegister = false;
              sendMail(
                BASEURL + req.file.path,
                updatedUser.email,
                fullName,
                updatedUser.user_id,
                subTitle2,
                BASEURL + req.file.path,
                isForgotPassword,
                isAdminRegister
              );
            }

            res.status(StatusEnum.SUCCESS).json({
              status: StatusEnum.SUCCESS,
              message: "User updated successfully",
              data: updatedUser
            });
          }
        }
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  },



  /// Leads Flow
  addLeads: async (req, res) => {
    try {
      // Check if email already exists
      const { first_name, last_name, driver_email, driver_phone_number, source, package_sold, training_date, notes, is_message_viewed, status, last_follow_up_date, next_follow_up_date, messages_comments } = req.body;
      const existingUser = await leadsModel.findOne({
        where: { driver_email: driver_email }
      });
      if (existingUser) {
        res.status(StatusEnum.ALREADY_EXIST).json({
          status: StatusEnum.ALREADY_EXIST,
          message: StatusMessages.ALREADY_EXIST,
          data: Messages.Email_Already_Registered,
        });
      } else {
        if (validateEmail(driver_email)) {
          let leadsCreate = await leadsModel.create({
            first_name: first_name ?? "",
            last_name: last_name ?? "",
            driver_email: driver_email ?? "",
            driver_phone_number: driver_phone_number ?? "",
            source: source ?? "",
            package_sold: package_sold ?? "",
            training_date: training_date ?? "",
            notes: notes ?? "",
            status: status ?? "",
            last_follow_up_date: last_follow_up_date ?? "",
            next_follow_up_date: next_follow_up_date ?? "",
            messages_comments: messages_comments ?? ""
          });

          res.status(StatusEnum.SUCCESS).json({
            status: StatusEnum.SUCCESS,
            message: StatusMessages.REGISTER_SUCCESS,
            data: JSON.parse(JSON.stringify(leadsCreate)),
          });
        } else {
          res.status(StatusEnum.PATTERN_NOT_MATCH).json({
            status: StatusEnum.PATTERN_NOT_MATCH,
            message: StatusMessages.PATTERN_NOT_MATCH,
            data: Messages.Invalid_Email,
          });
        }
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  },
  getAllLeads: async (req, res) => {
    try {
      const { id, first_name, last_name, driver_email, driver_phone_number, source, package_sold, training_date, notes, last_follow_up_date, next_follow_up_date, messages_comments } = req.query;
      const sortField = req.query.sortField || "createdAt";
      const sortOrder = req.query.sortOrder && req.query.sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";
      if (id) {
        let existUser = await userModel.findOne({
          where: { user_id: id }
        });
        existUser = JSON.parse(JSON.stringify(existUser));
        if (existUser) {
          if (existUser.type === "user") {
            res.status(StatusEnum.NOT_FOUND).json({
              status: StatusEnum.NOT_FOUND,
              message: StatusMessages.You_Are_Not_Admin,
              data: Messages.You_Are_Not_Admin,
            });
          } else {
            const page = parseInt(req.query.page) || 1;
            const pageSize = 10;
            const offset = (page - 1) * pageSize;
            const totalNumberOfLeads = await leadsModel.count();
            const totalPages = Math.ceil(totalNumberOfLeads / pageSize);
            let leadsData = await leadsModel.findAndCountAll({
              where: {
                [Sequelize.Op.or]: [
                  {
                    first_name: {
                      [Sequelize.Op.like]: `%${first_name}%`
                    }
                  },
                  {
                    last_name: {
                      [Sequelize.Op.like]: `%${last_name}%`
                    }
                  },
                  {
                    driver_email: {
                      [Sequelize.Op.like]: `%${driver_email}%`
                    }
                  },
                  {
                    driver_phone_number: {
                      [Sequelize.Op.like]: `%${driver_phone_number}%`
                    }
                  },
                  {
                    source: {
                      [Sequelize.Op.like]: `%${source}%`
                    }
                  },
                  {
                    package_sold: {
                      [Sequelize.Op.like]: `%${package_sold}%`
                    }
                  },
                  {
                    training_date: {
                      [Sequelize.Op.like]: `%${training_date}%`
                    }
                  },
                  {
                    notes: {
                      [Sequelize.Op.like]: `%${notes}%`
                    }
                  },
                  {
                    last_follow_up_date: {
                      [Sequelize.Op.like]: `%${last_follow_up_date}%`
                    }
                  },
                  {
                    next_follow_up_date: {
                      [Sequelize.Op.like]: `%${next_follow_up_date}%`
                    }
                  },
                  {
                    messages_comments: {
                      [Sequelize.Op.like]: `%${messages_comments}%`
                    }
                  }
                ]
              },
              order: [[sortField, sortOrder]],
              limit: pageSize,
              offset: offset
            });
            leadsData = JSON.parse(JSON.stringify(leadsData));
            res.status(StatusEnum.SUCCESS).json({
              status: StatusEnum.SUCCESS,
              page: page,
              totalPages: totalPages,
              message: StatusMessages.SUCCESS,
              data: leadsData.rows,
            });
          }

        } else {
          res.status(StatusEnum.NOT_FOUND).json({
            status: StatusEnum.NOT_FOUND,
            message: StatusMessages.NOT_FOUND,
            data: "Leads not found.",
          });
        }

      } else {
        res.status(StatusEnum.NOT_FOUND).json({
          status: StatusEnum.NOT_FOUND,
          message: StatusMessages.Id_Required,
        });
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  },
  getLeadsById: async (req, res) => {
    try {
      const leadId = req.query.id;
      // Retrieve user data with attached documents
      let leadData = await leadsModel.findOne({
        where: { lead_id: leadId }
      });
      if (leadData) {
        res.status(StatusEnum.SUCCESS).json({
          status: StatusEnum.SUCCESS,
          message: StatusMessages.SUCCESS,
          data: JSON.parse(JSON.stringify(leadData))
        });
      } else {
        res.status(StatusEnum.NOT_FOUND).json({
          status: StatusEnum.NOT_FOUND,
          message: Messages.Lead_Not_Found,
        });
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  },
  updateLead: async (req, res) => {
    try {
      const leadId = parseInt(req.body.id, 0);
      let leadData = await leadsModel.findOne({
        where: { lead_id: leadId }
      });
      leadData = JSON.parse(JSON.stringify(leadData));
      if (!leadData) {
        res.status(StatusEnum.NOT_FOUND).json({
          status: StatusEnum.NOT_FOUND,
          message: Messages.Lead_Not_Found,
        });
      } else {
        // icabbiStatus
        if (req.body.driver_email === leadData.driver_email) {
          await leadsModel.update({
            first_name: first_name || (leadData.first_name ?? ""),
            last_name: last_name || (leadData.last_name ?? ""),
            driver_email: driver_email || (leadData.driver_email ?? ""),
            driver_phone_number: driver_phone_number || (leadData.driver_phone_number ?? ""),
            source: source || (leadData.source ?? ""),
            package_sold: package_sold || (leadData.package_sold ?? ""),
            training_date: training_date || (leadData.training_date ?? ""),
            notes: notes || (leadData.notes ?? ""),
            status: status || (leadData.status ?? ""),
            last_follow_up_date: last_follow_up_date || (leadData.last_follow_up_date ?? ""),
            next_follow_up_date: next_follow_up_date || (leadData.next_follow_up_date ?? ""),
            messages_comments: messages_comments || (leadData.messages_comments ?? ""),
            is_message_viewed: is_message_viewed === undefined ? leadData.is_message_viewed : is_message_viewed,
          }, {
            where: { lead_id: leadId }
          });

          let data = await leadsModel.findOne({
            where: { lead_id: leadId }
          });
          res.status(StatusEnum.SUCCESS).json({
            status: StatusEnum.SUCCESS,
            message: "Lead updated successfully",
            data: JSON.parse(JSON.stringify(data)),
          });
        } else {
          const isEmail = await leadsModel.findOne({
            where: { driver_email: driver_email }
          });

          if (isEmail) {
            res.status(StatusEnum.ALREADY_EXIST).json({
              status: StatusEnum.ALREADY_EXIST,
              message: StatusMessages.LEAD_EMAIL_ALREADY_EXIST,
            });
          } else {
            await leadsModel.update({
              first_name: first_name || (leadData.first_name ?? ""),
              last_name: last_name || (leadData.last_name ?? ""),
              driver_email: driver_email || (leadData.driver_email ?? ""),
              driver_phone_number: driver_phone_number || (leadData.driver_phone_number ?? ""),
              source: source || (leadData.source ?? ""),
              package_sold: package_sold || (leadData.package_sold ?? ""),
              training_date: training_date || (leadData.training_date ?? ""),
              notes: notes || (leadData.notes ?? ""),
              status: status || (leadData.status ?? ""),
              last_follow_up_date: last_follow_up_date || (leadData.last_follow_up_date ?? ""),
              next_follow_up_date: next_follow_up_date || (leadData.next_follow_up_date ?? ""),
              messages_comments: messages_comments || (leadData.messages_comments ?? ""),
              is_message_viewed: is_message_viewed === undefined ? leadData.is_message_viewed : is_message_viewed,
            }, {
              where: { lead_id: leadId }
            });

            let data = await leadsModel.findOne({
              where: { lead_id: leadId }
            });
            res.status(StatusEnum.SUCCESS).json({
              status: StatusEnum.SUCCESS,
              message: "Lead updated successfully",
              data: JSON.parse(JSON.stringify(data)),
            });
          }
        }
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  },
  deleteLeads: async (req, res) => {
    try {
      if (req.query.id) {
        await leadsModel.destroy({
          where: { lead_id: req.query.id }
        });
        res.status(StatusEnum.SUCCESS).json({
          status: StatusEnum.SUCCESS,
          data: StatusMessages.LEAD_DELETE_SUCCESS,
          message: Messages.Lead_Deleted,
        });
      } else {
        res.status(StatusEnum.NOT_FOUND).json({
          status: StatusEnum.NOT_FOUND,
          message: Messages.Id_Required,
        });
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  },


  /// Messages/ Comments Flow
  addMessageInLead: async (req, res) => {
    try {
      const { message, user_id, lead_id } = req.body;
      if (!message) {
        res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide message.' });
      } else if (!user_id) {
        res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide user id.' });
      } else if (!lead_id) {
        res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide lead id.' });
      } else {
        let userData = await userModel.findOne({
          where: { user_id: user_id }
        });
        let leadData = await leadsModel.findOne({
          where: { lead_id: lead_id }
        });
        userData = JSON.parse(JSON.stringify(userData));
        leadData = JSON.parse(JSON.stringify(leadData));
        if (userData) {
          if (userData.type === "user") {
            res.status(StatusEnum.NOT_FOUND).json({
              status: StatusEnum.NOT_FOUND,
              data: Messages.You_Are_Not_Admin,
              message: StatusMessages.You_Are_Not_Admin,
            });
          } else if (leadData) {
            const messageCreate = await messageModel.create({
              message: message,
              user_id: user_id,
              lead_id: lead_id
            });

            await leadsModel.update({
              messages_comments: message,
              is_message_viewed: 0
            }, {
              where: {
                lead_id: lead_id
              }
            });

            let data = await leadsModel.findOne({
              where: { lead_id: lead_id }
            });
            res.status(StatusEnum.SUCCESS).json({
              status: StatusEnum.SUCCESS,
              message: StatusMessages.MESSAGE_SUCCESS,
              data: JSON.parse(JSON.stringify(data))
            });
          } else {
            res.status(StatusEnum.NOT_FOUND).json({
              status: StatusEnum.NOT_FOUND,
              message: Messages.Lead_Not_Found,
            });
          }
        } else {
          res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
            status: StatusEnum.INTERNAL_SERVER_ERROR,
            message: error.message,
          });
        }
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  },
  getAllMessages: async (req, res) => {
    try {
      const { user_id, lead_id } = req.query;
      if (!user_id) {
        res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide user id.' });
      } else if (!lead_id) {
        res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide lead id.' });
      } else {
        let userData = await userModel.findOne({
          where: { user_id: user_id }
        });
        userData = JSON.parse(JSON.stringify(userData));
        // const userData = await Squery('SELECT * FROM users WHERE _id = ?', [req.query.user_id]);
        const messageData = await messageModel.findAll();
        // const messageData = await Squery(
        //   "SELECT * FROM messages");
        // console.log("messageData", messageData);
        if (userData) {
          if (userData.type === "user") {
            res.status(StatusEnum.NOT_FOUND).json({
              status: StatusEnum.NOT_FOUND,
              message: StatusMessages.You_Are_Not_Admin,
              data: Messages.You_Are_Not_Admin,
            });
            return;
          } else if (messageData) {
            const page = parseInt(req.query.page) || 1;
            const pageSize = 10;
            const offset = (page - 1) * pageSize;
            const totalNumberOfMessages = await messageModel.count();
            const totalPages = Math.ceil(totalNumberOfMessages / pageSize);
            const sortField = req.query.sortField || "createdAt";
            const sortOrder = req.query.sortOrder && req.query.sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";

            let data = await messageModel.findAndCountAll({
              where: {
                [Sequelize.Op.or]: [
                  {
                    lead_id: {
                      [Sequelize.Op.like]: `%${lead_id}%`
                    }
                  },
                  {
                    user_id: {
                      [Sequelize.Op.like]: `%${user_id}%`
                    }
                  }
                ],
              },
              order: [[sortField, sortOrder]],
              limit: pageSize,
              offset: offset
            });
            data = JSON.parse(JSON.stringify(data));
            res.status(StatusEnum.SUCCESS).json({
              status: StatusEnum.SUCCESS,
              message: StatusMessages.SUCCESS,
              page: page,
              totalPages: totalPages,
              data: data.rows
            });
          } else {
            res.status(StatusEnum.NOT_FOUND).json({
              status: StatusEnum.NOT_FOUND,
              message: Messages.Message_Not_Found,
            });
          }
        } else {
          res.status(StatusEnum.NOT_FOUND).json({
            status: StatusEnum.NOT_FOUND,
            message: Messages.User_Not_Found,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  },
  updateMessage: async (req, res) => {
    try {
      const messageId = req.body.id;
      if (!messageId) {
        res.status(StatusEnum.NOT_FOUND).json({
          message: "Please enter message id.",
          status: StatusEnum.NOT_FOUND,
        });
      } else {
        let messageData = await messageModel.findOne({
          where: { message_id: messageId }
        });
        messageData = JSON.parse(JSON.stringify(messageData));

        if (!messageData) {
          res.status(StatusEnum.NOT_FOUND).json({
            status: StatusEnum.NOT_FOUND,
            message: Messages.Message_Not_Found,
          });
        } else {
          const updateMessage = await messageModel.update({
            message: req.body.message || messageData.message
          }, {
            where: {
              message_id: messageId
            }
          });

          let data = await messageModel.findOne({
            where: {
              message_id: messageId
            }
          });
          res.status(StatusEnum.SUCCESS).json({
            status: StatusEnum.SUCCESS,
            message: "Message updated successfully",
            data: JSON.parse(JSON.stringify(data))
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
  deleteMessage: async (req, res, next) => {
    try {
      if (req.query.id) {
        const deleteMessage = await messageModel.destroy({
          where: { message_id: req.query.id }
        });
        res.status(StatusEnum.SUCCESS).json({
          status: StatusEnum.SUCCESS,
          message: Messages.Message_Deleted,
          data: StatusMessages.MESSAGE_DELETE_SUCCESS,
        });
      } else {
        res.status(StatusEnum.NOT_FOUND).json({
          message: Messages.Id_Required,
          status: StatusEnum.NOT_FOUND,
        });
      }
    } catch (error) {
      res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
        status: StatusEnum.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  }
}