const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require('path');
const axios = require('axios');
const { Op } = require('sequelize');
const moment = require('moment');
const userModel = require('../models/user.model');
const documentModel = require('../models/document.model');
const reportsModel = require('../models/reports.model');

const acchtml = path.join(__dirname, '../Utils/new-acc.html');
const forgothtml = path.join(__dirname, '../Utils/forget.html');
const driverhtml = path.join(__dirname, '../Utils/new-driver.html');
const ibanhtml = path.join(__dirname, '../Utils/iban.html');
const whatsappchathtml = path.join(__dirname, '../Utils/WhatsappChat.html');
const deletionhtml = path.join(__dirname, '../Utils/Deletion.html');
const holidayhtml = path.join(__dirname, '../Utils/Holiday.html');
const profileUpdatehtml = path.join(__dirname, '../Utils/Profile-updated.html');
const profileRegisterhtml = path.join(__dirname, '../Utils/profile-information.html');
const icabbiStatushtml = path.join(__dirname, '../Utils/icabbistatusupdate.html');
const subcriptionhtml = path.join(__dirname, '../Utils/subcription.html');
const documentUploadhtml = path.join(__dirname, '../Utils/document-pending.html');
const driverInformationhtml = path.join(__dirname, '../Utils/driver-information.html');
const weeklyReportshtml = path.join(__dirname, '../Utils/weekly-report.html');

const htmlFileacc = fs.readFileSync(acchtml, "utf8");
const htmlFileforgot = fs.readFileSync(forgothtml, "utf8");
const htmlFiledriver = fs.readFileSync(driverhtml, "utf8");
const htmlIBAN = fs.readFileSync(ibanhtml, "utf8");
const htmlWhatsappchat = fs.readFileSync(whatsappchathtml, "utf8");
const htmlHoliday = fs.readFileSync(holidayhtml, "utf8");
const htmlProfileUpdate = fs.readFileSync(profileUpdatehtml, "utf8");
const htmlDeletion = fs.readFileSync(deletionhtml, "utf8");
const htmlProfileRegister = fs.readFileSync(profileRegisterhtml, "utf-8");
const htmlicabbistatus = fs.readFileSync(icabbiStatushtml, "utf-8");
const htmlsubcription = fs.readFileSync(subcriptionhtml, "utf-8");
const htmlDocumentUpload = fs.readFileSync(documentUploadhtml, "utf-8");
const htmlDriverInformation = fs.readFileSync(driverInformationhtml, "utf-8");
const htmlWeeklyReport = fs.readFileSync(weeklyReportshtml, "utf-8");

const admin = require("firebase-admin");
const cronDoc = require("../models/cron.model");

const createTransporter = () => {
  if (process.env.IS_GMAIL == 'true') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASSWORD
      }
    });
  } else {
    return nodemailer.createTransport({
      host: 'localhost',
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });
  }
};

const StatusEnum = {
  SUCCESS: 200,                   // OK
  NO_CONTENT: 204,                // No Content
  ALREADY_EXIST: 409,             // Conflict (Custom code for "Already Exists")
  NOT_FOUND: 404,                // Not Found
  INTERNAL_SERVER_ERROR: 500,     // Internal Server Error
  TOKEN_EXP: 401,
  USER_NOT_FOUND: 400,
  CREDENTIS_NOT_MATCHED: 423,                  // Unauthorized (Token Expired)
  PATTERN_NOT_MATCH: 422,
  BLOCKED_USER: 403
}

const social_type = {
  Google: 0,
  Facebook: 1,
  Apple: 2
}
const BASEURL = "https://driverapp.lynk.ie/api/";
// const BASEURL = "http://34.246.223.252/";
// const BASEURL = "https://lynk-driver.onrender.com/";
const StatusMessages = {
  SUCCESS: 'Success',
  NO_CONTENT: 'No Content',
  ACCOUNT_BLOCKED: 'Your account is blocked by the admin. Please contact admin for any help.',
  LOGIN_SUCCESS: 'Driver login successfully.',
  USER_DELETE_SUCCESS: 'User deleted successfully.',
  LEAD_DELETE_SUCCESS: 'Lead deleted successfully.',
  MESSAGE_DELETE_SUCCESS: 'Message deleted successfully.',
  DOCUMENT_SUCCESS: 'Driver documents uploaded successfully.',
  AGREEMENT_SUCCESS: 'Driver agreement sign successfully.',
  MESSAGE_SUCCESS: 'Message send successfully.',
  REGISTER_SUCCESS: 'Driver register successfully.',
  LEAD_EMAIL_ALREADY_EXIST: 'The email address is already in use. Please try to use a different email address.',
  ALREADY_EXIST: 'The email address is already in use. Please try Forgot Password or use a different email address.',
  PHONENUMBER_ALREADY_EXIST: 'The phone number is already in use.',
  NOT_FOUND: 'Not Found',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  PATTERN_NOT_MATCH: 'Pattern Not Match',
  TOKEN_EXP: "Your token has expired, please login again",
  NO_TOKEN: "Access denied. No token provided.",
  PROFILE_UPDATE_SUCCESS: "Driver profile updated successfully.",
  INVALID_TOKEN: "Invalid token.",
  CREDENTIS_NOT_MATCHED: "The credentials entered do not match our records. Please check your email and password and try again."
}

const Messages = {
  Invalid_Email: "Invalid Email Address",
  Account_Blocked: 'Your account is blocked by the admin. Please contact admin for any help.',
  Invalid_Id: "Invalid Id Please Check",
  Id_Required: "Id Must Be Required",
  Invalid_Social: "Invalid Social Type",
  User_Deleted: 'User deleted successfully.',
  Lead_Deleted: 'Lead deleted successfully.',
  Message_Deleted: 'Message deleted successfully.',
  Password_Not_Natched: 'Passwords do NOT match!',
  User_Not_Found: "User Not Found Please Register First",
  Lead_Not_Found: "Lead Not Found Please Register First",
  Message_Not_Found: "Messages Not Found Please Add First",
  Holidays_Request_Submitted: 'Your request for holidays has been submitted!',
  Deletion_Request_Submitted: "Your request to delete your account has been submitted. We will be in touch to confirm when it's done.",
  Email_Already_Registered: "Email Address Already Registered",
  Phone_Number_Registered: "Phone number already registered.",
  Time_Slot_Required: "TimeSlot Id Must Be Required",
  Password_Reset_Successful: "Your password was reset successfully.",
  Profile_Update_Mail: "Your profile update mail sent successfully.",
  You_Are_Not_Admin: "You Are Not Admin",
  Agreement_Update_Success: "Agreement Updated Successfully",
  Change_Password_Request: 'We have sent an email to the email provided with instructions on how to reset your password.',
  // Change_Password_Request: 'If your email is registered with Lynk, you will receive an email with instructions on how to reset your password.',
  Credentials_Not_Matched: "The credentials entered do not match our records. Please check your email and password and try again.",
  WHATSAPPNOTIFY: "Your request for whatsapp chat has been submitted!"

}
const MSGTimers = {
  CheckDocuments: 15 * 60 * 1000,
  InitialReminder: 24 * 60 * 60 * 1000,
  SecondReminder: (24 + 72) * 60 * 60 * 1000,
  FinalReminder: ((24 * 60 * 60 * 1000) + (7 * 24 * 60 * 60 * 1000)),
  CheckDocuments2: 15 * 60 * 1000,
  CheckAgreements: 15 * 60 * 1000,
  CheckiCabbi: 15 * 60 * 1000,
  Subscription: (72) * 60 * 60 * 1000,
  DoubletickIBAN: 15 * 60 * 1000
}

// const MSGTimers = {
//   CheckDocuments: 2*  60 * 1000,
//   InitialReminder: 15 * 60 * 1000,
//   SecondReminder: 20 * 60 * 1000,
//   FinalReminder:  25 * 60 * 1000,
//   CheckDocuments2: 2 * 60 * 1000,
//   CheckAgreements: 3 * 60 * 1000,
//   CheckiCabbi:2* 60 * 1000,
//   Subscription: 15 * 60 * 1000,
//   DoubletickIBAN: 2 * 60 * 1000
// }

const SOCKET = {
  joinTimeSlot: "joinTimeSlot",
  leaveTimeSlot: "leaveTimeSlot",
  joinGame: "joinGame",
  leaveGame: "leaveGame"
}

const createMailConfig = (subject, html, fromEmail = "donotreply@lynk.ie", toEmail = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"], bcc = null) => {
  const config = {
    from: process.env.IS_GMAIL == 'true' ? process.env.MY_EMAIL : fromEmail,
    to: process.env.IS_GMAIL == 'true' ? ['darshika.coderkube@gmail.com', "vijay.coderkube@gmail.com"] : toEmail,
    subject: subject,
    html: html
  };

  if (bcc) {
    config.bcc = bcc;
  }

  return config;
};

function sendMail(OTP, EMAIL, TITLE, SUBTITLE1, SUBTITLE2, REDIRECT, ISFORGOTPASSWORD = false, ISADMINREGISTER = false, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = createTransporter();

    const ForgotPassword = htmlFileforgot.replace("{{REDIRECT}}", REDIRECT);
    const driverDoc = htmlFiledriver.replace("{{REDIRECT}}", REDIRECT).replace("{{DRIVER_ID}}", SUBTITLE1).replace("{{DRIVER_NAME}}", TITLE).replace("{{REDIRECT2}}", REDIRECT);
    const NewAccount = htmlFileacc.replace('{{OTP}}', OTP).replace("{{REDIRECT}}", REDIRECT);

    const html = ISFORGOTPASSWORD ? ForgotPassword : ISADMINREGISTER ? NewAccount : driverDoc;
    const to = (ISFORGOTPASSWORD || ISADMINREGISTER) ? EMAIL : RECEIVEREMAIL;

    const mail_configs = createMailConfig(SUBTITLE2, html, FROMEMAIL, to);

    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ res: 0, message: 'Email send successfully' });
    });
  });
}

function sendMailforIccabiStatus(DRIVER_NAME, EMAIL, TITLE, DRIVER_REF, DRIVER_APP_PIN, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = createTransporter();

    const icabbiStatus = htmlicabbistatus
      .replace("{{DRIVER_NAME}}", DRIVER_NAME)
      .replace("{{DRIVER_REF}}", DRIVER_REF)
      .replace("{{DRIVER_APP_PIN}}", DRIVER_APP_PIN);

    const mail_configs = createMailConfig(
      TITLE,
      icabbiStatus,
      FROMEMAIL,
      EMAIL,
      ['darren.okeeffe@lynk.ie', 'reception@lynk.ie']
    );

    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ res: 0, message: 'Email send successfully' });
    });
  });
}

function sendMailForIBAN(SUBJECT, IBAN_NUMBER, DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_SPSV, REDIRECT_LYNK, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = createTransporter();
    const MailForIBAN = htmlIBAN.replace('{{ID}}', DRIVER_ID).replace("{{NAME}}", DRIVER_NAME).replace("{{EMAIL}}", DRIVER_EMAIL).replace("{{SPSV}}", DRIVER_SPSV).replace("{{REDIRECT}}", REDIRECT_LYNK).replace("{{IBAN}}", IBAN_NUMBER);


    console.log("from::-", FROMEMAIL)
    console.log("to::-", RECEIVEREMAIL)

    const mail_configs = createMailConfig(SUBJECT, MailForIBAN, FROMEMAIL, RECEIVEREMAIL);
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ res: 0, message: 'Email send successfully' });
    });
  });
}

function sendMailForDELETION(SUBJECT, DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_SPSV, REDIRECT_LYNK, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = createTransporter();
    const MailForDeletion = htmlDeletion.replace('{{ID}}', DRIVER_ID).replace("{{NAME}}", DRIVER_NAME).replace("{{EMAIL}}", DRIVER_EMAIL).replace("{{SPSV}}", DRIVER_SPSV).replace("{{REDIRECT}}", REDIRECT_LYNK);


    console.log("from::-", FROMEMAIL)
    console.log("to::-", RECEIVEREMAIL)

    const mail_configs = createMailConfig(SUBJECT, MailForDeletion, FROMEMAIL, RECEIVEREMAIL);
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ res: 0, message: 'Email send successfully' });
    });
  });
}

function sendMailForHoliday(SUBJECT, DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_SPSV, DRIVER_PHONE, DRIVER_NO, FROM, TO, REASON, CURRENT_TIME, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["reception@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = createTransporter();
    const MailForHoliday = htmlHoliday.replace('{{ID}}', DRIVER_ID).replace("{{NAME}}", DRIVER_NAME).replace("{{NAME2}}", DRIVER_NAME).replace("{{EMAIL}}", DRIVER_EMAIL).replace("{{PHONE}}", DRIVER_PHONE).replace("{{SPSV}}", DRIVER_SPSV).replace("{{DRIVERNO}}", DRIVER_NO).replace("{{FROM}}", FROM).replace("{{TO}}", TO).replace("{{REASON}}", REASON).replace("{{CURRENTTIME}}", CURRENT_TIME);


    console.log("from::-", FROMEMAIL)
    console.log("to::-", RECEIVEREMAIL)
    console.log("DRIVER_NO::-", DRIVER_NO)
    console.log("DRIVER_FROM::-", FROM)
    console.log("DRIVER_To::-", TO)
    console.log("REASON::-", REASON)

    const mail_configs = createMailConfig(SUBJECT, MailForHoliday, FROMEMAIL, RECEIVEREMAIL);
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ res: 0, message: 'Email send successfully' });
    });
  });
}

function sendMailForWhatsappChat(SUBJECT, DRIVER_NAME, DRIVER_PHONE, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    // const transporter = nodemailer.createTransport({
    //   host: 'localhost',
    //   port: 25,
    //   secure: false,
    //   tls: {
    //     rejectUnauthorized: false
    //   }
    // });

    var transporter = createTransporter();
    const MailForrWhatsappChat = htmlWhatsappchat.replace("{{NAME}}", DRIVER_NAME).replace("{{PHONE}}", DRIVER_PHONE);

    console.log("from::-", FROMEMAIL)
    console.log("to::-", RECEIVEREMAIL)
    //
    // const mail_configs = {
    //   from: FROMEMAIL,
    //   to: RECEIVEREMAIL,
    //   subject: SUBJECT,
    //   html: MailForrWhatsappChat,
    // };
    const mail_configs = createMailConfig(SUBJECT, MailForrWhatsappChat, FROMEMAIL, RECEIVEREMAIL);
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ res: 0, message: 'Email send successfully' });
    });
  });
}

function sendMailForProfileUpdate(SUBJECT, DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_SPSV, DRIVER_PHONE, DRIVER_PROFILE_IMAGE, REDIRECT_LINK, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {

  return new Promise((resolve, reject) => {
    const transporter = createTransporter();
    const MailForProfileUpdate = htmlProfileUpdate.replace('{{ID}}', DRIVER_ID).replace("{{NAME}}", DRIVER_NAME).replace("{{NAME2}}", DRIVER_NAME).replace("{{EMAIL}}", DRIVER_EMAIL).replace("{{PHONE}}", DRIVER_PHONE).replace("{{SPSV}}", DRIVER_SPSV).replace("{{REDIRECT}}", REDIRECT_LINK).replace("{{PROFILE_IMAGE}}", DRIVER_PROFILE_IMAGE);

    console.log("from::-", FROMEMAIL)
    console.log("to::-", RECEIVEREMAIL)
    // console.log("to::- arfaz.coderkuber@gmail.com")
    console.log("Driver Name:-", DRIVER_NAME)
    console.log("REDIRECT_LINK:-", REDIRECT_LINK)

    const mail_configs = createMailConfig(SUBJECT, MailForProfileUpdate, FROMEMAIL, RECEIVEREMAIL);
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ res: 0, message: 'Email send successfully' });
    });
  });
}
function sendMailForSubcription(SUBJECT, DRIVER_NAME, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = createTransporter();
    const MailForProfileRegister = htmlsubcription.replace('{{DriverName}}', DRIVER_NAME);
    const mail_configs =  createMailConfig(SUBJECT, MailForProfileRegister, FROMEMAIL, RECEIVEREMAIL);
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ res: 0, message: 'Email send successfully' });
    });
  });
}
function sendMailForProfileRegister(SUBJECT, DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_SPSV, DRIVER_PHONE, DRIVER_PROFILE_IMAGE, REDIRECT_LINK, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {

  return new Promise((resolve, reject) => {
    const transporter = createTransporter();
    const MailForProfileRegister = htmlProfileRegister.replace('{{ID}}', DRIVER_ID).replace("{{NAME}}", DRIVER_NAME).replace("{{NAME2}}", DRIVER_NAME).replace("{{EMAIL}}", DRIVER_EMAIL).replace("{{PHONE}}", DRIVER_PHONE).replace("{{SPSV}}", DRIVER_SPSV).replace("{{REDIRECT}}", REDIRECT_LINK).replace("{{PROFILE_IMAGE}}", DRIVER_PROFILE_IMAGE);

    console.log("from::-", FROMEMAIL)
    console.log("to::-", RECEIVEREMAIL)
    console.log("Driver Name:-", DRIVER_NAME)
    console.log("REDIRECT_LINK:-", REDIRECT_LINK)

    const mail_configs = createMailConfig(SUBJECT, MailForProfileRegister, FROMEMAIL, RECEIVEREMAIL);
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ res: 0, message: 'Email send successfully' });
    });
  });
}
function sendMailForPendingDocuments(SUBJECT, DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_SPSV, DRIVER_PHONE, DRIVER_PROFILE_IMAGE, REDIRECT_LINK, PENDING_DOCUMENTS, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = createTransporter();
    const MailForPendingDocuments = htmlDocumentUpload.replace('{{ID}}', DRIVER_ID).replace("{{NAME}}", DRIVER_NAME).replace("{{NAME2}}", DRIVER_NAME).replace("{{EMAIL}}", DRIVER_EMAIL).replace("{{PHONE}}", DRIVER_PHONE).replace("{{SPSV}}", DRIVER_SPSV).replace("{{PROFILE_IMAGE}}", DRIVER_PROFILE_IMAGE).replace("{{REDIRECT}}", REDIRECT_LINK).replace("{{DOCUMENT_NAME}}", PENDING_DOCUMENTS);

    const mail_configs = createMailConfig(SUBJECT, MailForPendingDocuments, FROMEMAIL, RECEIVEREMAIL);
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ res: 0, message: 'Email send successfully' });
    });
  });
}
function sendMailForDriversInformation(SUBJECT, DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_PHONE, DRIVER_SPSV, DRIVER_PROFILE_IMAGE, DOCUMENT_1, DOCUMENT_2, DOCUMENT_3, DRIVER_IBAN, AGREEMENT_VERSION, REDIRECT_LINK, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = createTransporter();
    const MailForDriversInformation = htmlDriverInformation.replace('{{ID}}', DRIVER_ID)
      .replace("{{NAME}}", DRIVER_NAME)
      .replace("{{NAME2}}", DRIVER_NAME)
      .replace("{{EMAIL}}", DRIVER_EMAIL)
      .replace("{{PHONE}}", DRIVER_PHONE)
      .replace("{{SPSV}}", DRIVER_SPSV)
      .replace("{{PROFILE_IMAGE}}", DRIVER_PROFILE_IMAGE)
      .replace("{{DOCUMENT_1}}", DOCUMENT_1)
      .replace("{{DOCUMENT_2}}", DOCUMENT_2)
      .replace("{{DOCUMENT_3}}", DOCUMENT_3)
      .replace("{{IBAN_No}}", DRIVER_IBAN)
      .replace("{{AGREEMENT_VERSION}}", AGREEMENT_VERSION)
      .replace("{{REDIRECT}}", REDIRECT_LINK);
    const mail_configs = createMailConfig(SUBJECT, MailForDriversInformation, FROMEMAIL, RECEIVEREMAIL);
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ res: 0, message: 'Email send successfully' });
    });
  });
}
// Function to generate dynamic link
const generateDynamicLink = async (userId) => {
  const dynamicLinkInfo = {
    dynamicLinkInfo: {
      link: `https://lynk-driver.onrender.com/resetpassword?userId=${userId}`,
      domainUriPrefix: 'https://lynk-driver.onrender.com',
      androidInfo: {
        androidPackageName: 'com.lynkdriver.app',
      },
      iosInfo: {
        iosBundleId: 'com.lynkdriver.app',
      },
    },
  };
  console.log("userId", userId);
  console.log("dynamicLinkInfo", dynamicLinkInfo);
  try {
    const { data } = await admin.dynamicLinks().createLongLink(dynamicLinkInfo);
    console.log("data", data);
    return data.longDynamicLink;
  } catch (error) {
    console.error('Error generating dynamic link:', error);
    throw error;
  }
};
const getCurrentTime = () => {
  const currentTime = new Date();
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
  return currentTime.toLocaleString('en-US', options);
};
async function InitialReminder(user_id) {
  try {
    let user_data = await userModel.findOne({
      where: { user_id: user_id }
    });
    user_data = JSON.parse(JSON.stringify(user_data));
    if (user_data) {
      const data = await sendDoubletickWhatsAppMessage(
        user_data.country_code + user_data.mobile_no,
        user_data.first_name,
        "",
        user_data.user_id,
        'reminder_24_hours'
      );
      return data;
    } else
      return false;
  } catch (error) {
    return error.message;
  }
}
async function SecondReminder(user_id) {
  try {
    let user_data = await userModel.findOne({
      where: { user_id: user_id }
    });
    user_data = JSON.parse(JSON.stringify(user_data));
    if (user_data) {
      const data = await sendDoubletickWhatsAppMessage(
        user_data.country_code + user_data.mobile_no,
        user_data.first_name,
        "",
        user_data.user_id,
        'reminder_72_hours'
      );
      return data;
    } else
      return false;
  } catch (error) {
    return error.message;
  }
}
async function FinalReminder(user_id) {
  try {
    let user_data = await userModel.findOne({
      where: { user_id: user_id }
    });
    user_data = JSON.parse(JSON.stringify(user_data));
    if (user_data) {
      const data = await sendDoubletickWhatsAppMessage(
        user_data.country_code + user_data.mobile_no,
        user_data.first_name,
        "",
        user_data.user_id,
        'reminder_7_days'
      );
      return data;
    } else
      return false;
  } catch (error) {
    return error.message;
  }
}
async function checkDocumentsAndSendWhatsAppMessage(user_id) {
  try {
    let user = await userModel.findOne({
      where: {
        user_id: user_id
      },
      include: [{
        required: false,
        as: 'attachment',
        model: documentModel
      }]
    });
    user = JSON.parse(JSON.stringify(user));
    const fullName = user.first_name + " " + user.last_name;
    const subject = `Driver ${fullName} Profile Details`;
    const dynamicLink = "https://driverapp.lynk.ie/driver/view/" + encodeURIComponent(user.user_id);

    if (user) {
      const pendingDocuments = user.attachment.filter(doc => !doc.document_url).map(doc => doc.document_name);
      if (pendingDocuments.length > 0) {
        const data = await sendDoubletickWhatsAppMessage(user.country_code + user.mobile_no, user.first_name, pendingDocuments, user.user_id, 'first_template_missing_document');
        let mail = await sendMailForPendingDocuments(
          subject,
          user.user_id,
          fullName,
          user.email,
          user.spsv,
          user.mobile_no,
          user.profile_image,
          dynamicLink,
          pendingDocuments
        );
        return data;
      }
    } else {
      return false
    }
  } catch (error) {
    return error.message
  }
}
async function checkAgreementsAndSendWhatsAppMessage(user_id) {
  try {
    let user = await userModel.findOne({
      where: {
        user_id: user_id
      }
    });
    user = JSON.parse(JSON.stringify(user));
    if (user) {
      if (user.agreement_verified == false) {
        const data = await sendDoubletickWhatsAppMessage(user.country_code + user.mobile_no, user.first_name, "", user.user_id, 'second_template_missing_driver_agreement');
        return data;
      }
    } else {
      return false;
    }
  } catch (error) {
    return error.message
  }
}
async function checkiCabbiAndSendWhatsAppMessage(user_id) {
  try {
    let user = await userModel.findOne({
      where: {
        user_id: user_id
      }
    });
    user = JSON.parse(JSON.stringify(user));
    if (user) {
      if (user.clicked_to_app == 'No') {
        const data = await sendDoubletickWhatsAppMessage(user.country_code + user.mobile_no, user.first_name, "", user.user_id, 'third_template_missing_icabbi_driver_app_v2');
        return data;
      }
    } else {
      return false;
    }
  } catch (error) {
    return error.message
  }
}
async function checkSignUpCompleteBetweenFriday4ToSunday12SendWhatsAppMessage(user_id) {
  try {
    let user = await userModel.findOne({
      where: {
        user_id: user_id
      }
    });
    user = JSON.parse(JSON.stringify(user));
    if (user) {
      if (user.agreement_verified == true) {
        const data = await sendDoubletickWhatsAppMessage(user.country_code + user.mobile_no, user.first_name, "", user.user_id, 'sign_up_complete_between_fri4_sun12');
        return data;
      }
    } else {
      return false;
    }
  } catch (error) {
    return error.message
  }
}
async function sendWhatsAppMessageOnActiveIcabbiStatus(user_id) {
  try {
    let user = await userModel.findOne({
      where: {
        user_id: user_id
      }
    });
    user = JSON.parse(JSON.stringify(user));
    if (user) {
      await sendDoubletickWhatsAppMessage(user.country_code + user.mobile_no, user.first_name, "", user.user_id, 'icabbi_driver_ref_app_id_update_v5')

      let currentTime = new Date(); // Get the current date and time
      let timePlus72Hours = new Date(currentTime.getTime() + MSGTimers.Subscription); // Add 15 minutes
      await cronDoc.create({
        task_id: 8,
        task_name: "Send Doubletick Message and Send Mail for Subscription",
        task_time: timePlus72Hours,
        user_id: user_id
      })

      // setTimeout(async () => {
      //   const data = await sendDoubletickWhatsAppMessage(user.country_code + user.mobile_no, user.first_name, "", user.user_id, 'pricing_models_22october2024_utility');
      //   const mail = await sendMailForSubcription("Driver Payment Subcriptions", user.first_name, "donotreply@lynk.ie", user.email)
      //   if (mail.res == 0) {
      //     let report_data = await reportsModel.create({
      //       user_id: user_id,
      //       subject: 'Driver Payment Subscription.',
      //       date: moment().format('YYYY-MM-DD HH:mm:ss')
      //     })
      //   }

      // }, (72) * 60 * 60 * 1000);//(72) * 60 * 60 *
      return data;
    }
  } catch (error) {
    return error.message
  }
}
async function sendWhatsAppMessageOnActiveIBANStatus(user_id) {
  try {
    let currentTime = new Date(); // Get the current date and time
    let timePlus15Minutes = new Date(currentTime.getTime() + MSGTimers.DoubletickIBAN); // Add 15 minutes
    await cronDoc.create({
      task_id: 9,
      task_name: "Send Doubletick Message",
      task_time: timePlus15Minutes,
      user_id: user_id
    })

    // setTimeout(async () => {
    //   let user = await userModel.findOne({
    //     where: {
    //       user_id: user_id
    //     }
    //   });
    //   user = JSON.parse(JSON.stringify(user));
    //   if (user?.is_iban_submitted == 0) {
    //     const data = await sendDoubletickWhatsAppMessage(user.country_code + user.mobile_no, user.first_name, "", user.user_id, 'ibann_template_missing_driver_v1');
    //   }
    // }, 15 * 60 * 1000);//(72) * 60 * 60 *
    return data;

  } catch (error) {
    return error.message
  }
}
async function sendWeeklyReportsEmail(SUBJECT, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
  try {
    // Calculate the start and end dates for the previous week (Monday to Sunday)
    const now = new Date(); // Current date in UTC
    const endDate = new Date();
    endDate.setUTCDate(now.getUTCDate() - (now.getUTCDay() === 0 ? 7 : now.getUTCDay())); // Last Sunday's date
    endDate.setUTCHours(23, 59, 59, 999);

    const startDate = new Date(endDate);
    startDate.setUTCDate(endDate.getUTCDate() - 6); // Previous Monday's date
    startDate.setUTCHours(0, 0, 0, 0);

    // Convert dates to `YYYY-MM-DD HH:mm:ss` format
    const formattedStartDate = startDate.toISOString().slice(0, 19).replace('T', ' ');
    const formattedEndDate = endDate.toISOString().slice(0, 19).replace('T', ' ');

    // Query the database
    const data = await reportsModel.findAll({
      where: {
        date: {
          [Op.between]: [formattedStartDate, formattedEndDate] // Filter by date range
        }
      },
      include: [{
        model: userModel,
        where: { is_deleted: 0 },
        attributes: ['first_name', 'last_name']
      }]
    });
    // Prepare the data for email content
    const reportData = data.map(item => ({
      driverId: item?.user_id,
      driverName: `${item?.user?.first_name} ${item?.user?.last_name}`,
      subject: item?.subject,
      emailSent: formatDate(item?.createdAt)
    }));

    // Insert rows into the HTML
    let rows = '';
    reportData.forEach(item => {
      rows += `
        <tr>
          <td style="border: 1px solid gray; padding: 15px; width: 80px; text-align: center;">${item.driverId}</td>
          <td style="border: 1px solid gray; padding: 15px; width: 200px;">${item.driverName}</td>
          <td style="border: 1px solid gray; padding: 15px; width: 313px;">${item.subject}</td>
          <td style="border: 1px solid gray; padding: 15px; width: 230px; text-align: center;">${item.emailSent}</td>
        </tr>`;
    });

    return new Promise((resolve, reject) => {
      const transporter = createTransporter();
      const MailForWeeklyReports = htmlWeeklyReport.replace('{{reportRows}}', rows)

      const mail_configs = createMailConfig(SUBJECT, MailForWeeklyReports, FROMEMAIL, RECEIVEREMAIL);
      transporter.sendMail(mail_configs, function (error, info) {
        if (error) {
          console.log(error);
          return reject({ message: 'An error has occurred' });
        }
        console.log(info);
        return resolve({ res: 0, message: 'Email send successfully' });
      });
    });
  } catch (error) {
    console.error('Error fetching weekly data:', error);
  }
}

async function sendDoubletickWhatsAppMessage(mobileNo, driverName, pendingDocuments, user_id, templateName) {
  try {
    const templateMap = new Map([
      ["first_template_missing_document_updated", 0],
      ["second_template_missing_driver_agreement", 1],
      ["third_template_missing_icabbi_driver_app_v2", 2],
      ["reminder_24_hours", 4],
      ['reminder_72_hours', 5],
      ['reminder_7_days', 6],
      ['sign_up_complete_between_fri4_sun12', 7],
      ['icabbi_driver_ref_app_id_update_v5', 8],
      ['pricing_models_22october2024_utility', 9],
      ['ibann_template_missing_driver_v1', 10]
    ]);
    const template_id = templateMap.has(templateName) ? templateMap.get(templateName) : -1;
    if (pendingDocuments != "") {
      const documents = pendingDocuments.length > 0 ? pendingDocuments.join(", ") : pendingDocuments
      const response = await axios.post('https://public.doubletick.io/whatsapp/message/template', {
        messages: [
          {
            to: mobileNo,
            content: {
              templateName: templateName,
              language: 'en',
              templateData: {
                body: {
                  "placeholders": [driverName, documents]
                },
              },
              from: '+353858564510'
            },
          },
        ],
      }, {
        headers: {
          'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
        },
      });
      await userModel.update({
        template_id: 0,
        message_id: response.data.messages[0].messageId,
        message: 'first message from the template'
      }, {
        where: { user_id: user_id }
      });
      return response.data;
    } else if (template_id == 8) {
      let userData = await userModel.findOne({
        where: { user_id: user_id }
      });
      userData = JSON.parse(JSON.stringify(userData));
      const response = await axios.post('https://public.doubletick.io/whatsapp/message/template', {
        messages: [
          {
            to: mobileNo,
            content: {
              templateName: templateName,
              language: 'en',
              templateData: {
                body: {
                  "placeholders": [driverName, userData.icabbi_driver_ref, userData.icabbi_driver_app_pin]
                },
              },
              from: '+353858564510'
            },
          },
        ],
      }, {
        headers: {
          'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
        },
      });
      await userModel.update({
        template_id: 0,
        message_id: response.data.messages[0].messageId,
        message: 'Icabbi status updated of a driver'
      }, {
        where: { user_id: user_id }
      });
      return response.data;
    } else {
      const response = await axios.post('https://public.doubletick.io/whatsapp/message/template', {
        messages: [
          {
            to: mobileNo,
            content: {
              templateName: templateName,
              language: 'en',
              templateData: {
                body: {
                  "placeholders": [driverName]
                },
              },
              from: '+353858564510'
            },
          },
        ],
      }, {
        headers: {
          'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
        },
      });
      const msg_id = response.data.messages[0].messageId
      console.log("MESSAGE ID===============", msg_id);
      switch (template_id) {
        case 0:
          await userModel.update({
            template_id: template_id,
            message_id: response.data.messages[0].messageId,
            message: 'first message from the template'
          }, {
            where: { user_id: user_id }
          });
          break;
        case 1:
          await userModel.update({
            template_id: template_id,
            message_id: response.data.messages[0].messageId,
            message: 'first message from the template'
          }, {
            where: { user_id: user_id }
          });
          break;
        case 2:
          await userModel.update({
            template_id: template_id,
            message_id: response.data.messages[0].messageId,
            message: 'first message from the template'
          }, {
            where: { user_id: user_id }
          });
          break;
        case 4:
          await userModel.update({
            template_id: template_id,
            message_id: response.data.messages[0].messageId,
            message: '24 hours reminder'
          }, {
            where: { user_id: user_id }
          });
          break;
        case 5:
          await userModel.update({
            template_id: template_id,
            message_id: response.data.messages[0].messageId,
            message: '72 hours reminder'
          }, {
            where: { user_id: user_id }
          });
          break;
        case 6:
          await userModel.update({
            template_id: template_id,
            message_id: response.data.messages[0].messageId,
            message: '7 days reminder'
          }, {
            where: { user_id: user_id }
          });
          break;
        case 7:
          await userModel.update({
            template_id: template_id,
            message_id: response.data.messages[0].messageId,
            message: 'Sign up complete between Friday 4 pm to Sunday 12 pm'
          }, {
            where: { user_id: user_id }
          });
          break;
        case 9:
          await userModel.update({
            template_id: template_id,
            message_id: response.data.messages[0].messageId,
            message: 'subcription options'
          }, {
            where: { user_id: user_id }
          });
          break;
        case 10:
          await userModel.update({
            template_id: template_id,
            message_id: response.data.messages[0].messageId,
            message: 'Enter IBAN Number'
          }, {
            where: { user_id: user_id }
          });
          break;
        default:
          break;
      }

      return response.data;
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response ? error.response.data : error.message);
  }
}
function formatDate(date) {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Adding 1 to month as it is zero-indexed
  const day = String(d.getDate()).padStart(2, '0');

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const isPM = hours >= 12;

  if (hours > 12) hours -= 12;  // Convert to 12-hour format
  if (hours === 0) hours = 12;  // Convert 0 to 12 for 12 AM

  const period = isPM ? 'PM' : 'AM';

  // Format the final string as YYYY-MM-DD hh:mm A
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes} ${period}`;
  return formattedDate;
}
module.exports = {
  SOCKET,
  StatusEnum,
  StatusMessages,
  social_type,
  Messages,
  BASEURL,
  sendMail,
  sendMailForIBAN,
  sendMailForDELETION,
  generateDynamicLink,
  sendMailForHoliday,
  sendMailForWhatsappChat,
  sendMailForProfileUpdate,
  getCurrentTime,
  InitialReminder,
  SecondReminder,
  FinalReminder,
  sendDoubletickWhatsAppMessage,
  checkDocumentsAndSendWhatsAppMessage,
  checkAgreementsAndSendWhatsAppMessage,
  checkiCabbiAndSendWhatsAppMessage,
  checkSignUpCompleteBetweenFriday4ToSunday12SendWhatsAppMessage,
  sendWhatsAppMessageOnActiveIcabbiStatus,
  sendMailforIccabiStatus,
  sendMailForProfileRegister,
  sendMailForDriversInformation,
  sendWeeklyReportsEmail,
  sendWhatsAppMessageOnActiveIBANStatus,
  sendMailForSubcription,
  MSGTimers
}