const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require('path');
const axios = require('axios');
const userModel = require('../models/user.model');
const documentModel = require('../models/document.model');

const acchtml = path.join(__dirname, '../Utils/new-acc.html');
const forgothtml = path.join(__dirname, '../Utils/forget.html');
const driverhtml = path.join(__dirname, '../Utils/new-driver.html');
const ibanhtml = path.join(__dirname, '../Utils/iban.html');
const deletionhtml = path.join(__dirname, '../Utils/Deletion.html');
const holidayhtml = path.join(__dirname, '../Utils/Holiday.html');
const profileUpdatehtml = path.join(__dirname, '../Utils/Profile-updated.html');
const profileRegisterhtml = path.join(__dirname, '../Utils/profile-information.html');
const icabbiStatushtml = path.join(__dirname, '../Utils/icabbistatusupdate.html');
const subcriptionhtml = path.join(__dirname, '../Utils/subcription.html');

const htmlFileacc = fs.readFileSync(acchtml, "utf8");
const htmlFileforgot = fs.readFileSync(forgothtml, "utf8");
const htmlFiledriver = fs.readFileSync(driverhtml, "utf8");
const htmlIBAN = fs.readFileSync(ibanhtml, "utf8");
const htmlHoliday = fs.readFileSync(holidayhtml, "utf8");
const htmlProfileUpdate = fs.readFileSync(profileUpdatehtml, "utf8");
const htmlDeletion = fs.readFileSync(deletionhtml, "utf8");
const htmlProfileRegister = fs.readFileSync(profileRegisterhtml, "utf-8");
const htmlicabbistatus = fs.readFileSync(icabbiStatushtml, "utf-8");
const htmlsubcription = fs.readFileSync(subcriptionhtml, "utf-8");

const admin = require("firebase-admin");


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
  Credentials_Not_Matched: "The credentials entered do not match our records. Please check your email and password and try again."
}

const SOCKET = {
  joinTimeSlot: "joinTimeSlot",
  leaveTimeSlot: "leaveTimeSlot",
  joinGame: "joinGame",
  leaveGame: "leaveGame"
}


// function sendMail2(OTP, EMAIL, TITLE, SUBTITLE1, SUBTITLE2,REDIRECT) {
//     return new Promise((resolve, reject) => {
//         var transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.MY_EMAIL,
//                 pass: process.env.MY_PASSWORD
//             }
//         });

//         const mailHtml = htmlFile.replace('{{OTP}}', OTP).replace('{{TITLE}}', TITLE).replace("{{SUBTITLE1}}", SUBTITLE1).replace("{{SUBTITLE2}}", SUBTITLE2).replace("{{REDIRECT}}", REDIRECT);


//         const mail_configs = {
//             from: process.env.MY_EMAIL,
//             to: EMAIL,
//             subject: 'Testing email',
//             html: mailHtml,
//         };
//         transporter.sendMail(mail_configs, function (error, info) {
//             if (error) {
//                 console.log(error);
//                 return reject({ message: 'An error has occurred' });
//             }
//             return resolve({ message: 'Email send successfully' });
//         });
//     });
// }
// "darren.okeeffe@lynk.ie"
function sendMail(OTP, EMAIL, TITLE, SUBTITLE1, SUBTITLE2, REDIRECT, ISFORGOTPASSWORD = false, ISADMINREGISTER = false, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });

    // return new Promise((resolve, reject) => {
    //   var transporter = nodemailer.createTransport({
    //     service: 'gmail',
    //     auth: {
    //       user: process.env.MY_EMAIL,
    //       pass: process.env.MY_PASSWORD
    //     }
    //   });
    console.log("send mail-------" + ISFORGOTPASSWORD);

    const ForgotPassword = htmlFileforgot.replace("{{REDIRECT}}", REDIRECT);
    const driverDoc = htmlFiledriver.replace("{{REDIRECT}}", REDIRECT).replace("{{DRIVER_ID}}", SUBTITLE1).replace("{{DRIVER_NAME}}", TITLE).replace("{{REDIRECT2}}", REDIRECT);
    const NewAccount = htmlFileacc.replace('{{OTP}}', OTP).replace("{{REDIRECT}}", REDIRECT);


    console.log("from::-", FROMEMAIL)
    console.log("to::-", ISFORGOTPASSWORD ? EMAIL : RECEIVEREMAIL)

    const mail_configs = {
      from: FROMEMAIL,
      to: (ISFORGOTPASSWORD || ISADMINREGISTER) ? EMAIL : RECEIVEREMAIL,
      subject: SUBTITLE2,
      html: ISFORGOTPASSWORD ? ForgotPassword : ISADMINREGISTER ? NewAccount : driverDoc,
    };
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ message: 'Email send successfully' });
    });
  });
}
function sendMailforIccabiStatus(DRIVER_NAME, EMAIL, TITLE, DRIVER_REF, DRIVER_APP_PIN, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });
    // return new Promise((resolve, reject) => {
    //   var transporter = nodemailer.createTransport({
    //     service: 'gmail',
    //     auth: {
    //       user: process.env.MY_EMAIL,
    //       pass: process.env.MY_PASSWORD
    //     }
    //   });
    const icabbiStatus = htmlicabbistatus.replace("{{DRIVER_NAME}}", DRIVER_NAME).replace("{{DRIVER_REF}}", DRIVER_REF).replace("{{DRIVER_APP_PIN}}", DRIVER_APP_PIN);
    const mail_configs = {
      from: FROMEMAIL,
      to: EMAIL,
      subject: TITLE,
      html: icabbiStatus,
      bcc: ['darren.okeeffe@lynk.ie', 'reception@lynk.ie']
    };
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ message: 'Email send successfully' });
    });
  });
}
function sendMailForIBAN(SUBJECT, IBAN_NUMBER, DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_SPSV, REDIRECT_LYNK, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });

    const MailForIBAN = htmlIBAN.replace('{{ID}}', DRIVER_ID).replace("{{NAME}}", DRIVER_NAME).replace("{{EMAIL}}", DRIVER_EMAIL).replace("{{SPSV}}", DRIVER_SPSV).replace("{{REDIRECT}}", REDIRECT_LYNK).replace("{{IBAN}}", IBAN_NUMBER);


    console.log("from::-", FROMEMAIL)
    console.log("to::-", RECEIVEREMAIL)

    const mail_configs = {
      from: FROMEMAIL,
      to: RECEIVEREMAIL,
      subject: SUBJECT,
      html: MailForIBAN,
    };
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ message: 'Email send successfully' });
    });
  });
}

function sendMailForDELETION(SUBJECT, DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_SPSV, REDIRECT_LYNK, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });

    const MailForDeletion = htmlDeletion.replace('{{ID}}', DRIVER_ID).replace("{{NAME}}", DRIVER_NAME).replace("{{EMAIL}}", DRIVER_EMAIL).replace("{{SPSV}}", DRIVER_SPSV).replace("{{REDIRECT}}", REDIRECT_LYNK);


    console.log("from::-", FROMEMAIL)
    console.log("to::-", RECEIVEREMAIL)

    const mail_configs = {
      from: FROMEMAIL,
      to: RECEIVEREMAIL,
      // to: "darren.okeeffe@lynk.ie",
      subject: SUBJECT,
      html: MailForDeletion,
    };
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ message: 'Email send successfully' });
    });
  });
}

function sendMailForHoliday(SUBJECT, DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_SPSV, DRIVER_PHONE, DRIVER_NO, FROM, TO, REASON, CURRENT_TIME, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["reception@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });

    const MailForHoliday = htmlHoliday.replace('{{ID}}', DRIVER_ID).replace("{{NAME}}", DRIVER_NAME).replace("{{NAME2}}", DRIVER_NAME).replace("{{EMAIL}}", DRIVER_EMAIL).replace("{{PHONE}}", DRIVER_PHONE).replace("{{SPSV}}", DRIVER_SPSV).replace("{{DRIVERNO}}", DRIVER_NO).replace("{{FROM}}", FROM).replace("{{TO}}", TO).replace("{{REASON}}", REASON).replace("{{CURRENTTIME}}", CURRENT_TIME);


    console.log("from::-", FROMEMAIL)
    console.log("to::-", RECEIVEREMAIL)
    console.log("DRIVER_NO::-", DRIVER_NO)
    console.log("DRIVER_FROM::-", FROM)
    console.log("DRIVER_To::-", TO)
    console.log("REASON::-", REASON)

    const mail_configs = {
      from: FROMEMAIL,
      to: RECEIVEREMAIL,
      // to: "reception@lynk.ie",
      subject: SUBJECT,
      html: MailForHoliday,
    };
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ message: 'Email send successfully' });
    });
  });
}

function sendMailForProfileUpdate(SUBJECT, DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_SPSV, DRIVER_PHONE, REDIRECT_LINK, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {

  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });

    const MailForProfileUpdate = htmlProfileUpdate.replace('{{ID}}', DRIVER_ID).replace("{{NAME}}", DRIVER_NAME).replace("{{NAME2}}", DRIVER_NAME).replace("{{EMAIL}}", DRIVER_EMAIL).replace("{{PHONE}}", DRIVER_PHONE).replace("{{SPSV}}", DRIVER_SPSV).replace("{{REDIRECT}}", REDIRECT_LINK);

    console.log("from::-", FROMEMAIL)
    console.log("to::-", RECEIVEREMAIL)
    // console.log("to::- arfaz.coderkuber@gmail.com")
    console.log("Driver Name:-", DRIVER_NAME)
    console.log("REDIRECT_LINK:-", REDIRECT_LINK)

    const mail_configs = {
      from: FROMEMAIL,
      to: RECEIVEREMAIL,
      // to: "arfaz.coderkuber@gmail.com",
      subject: SUBJECT,
      html: MailForProfileUpdate,
    };
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ message: 'Email send successfully' });
    });
  });
}
function sendMailForSubcription(SUBJECT, DRIVER_NAME, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });
    const MailForProfileRegister = htmlsubcription.replace('{{DriverName}}', DRIVER_NAME);
    const mail_configs = {
      from: FROMEMAIL,
      to: RECEIVEREMAIL,
      // to: "arfaz.coderkuber@gmail.com",
      subject: SUBJECT,
      html: MailForProfileRegister,
    };
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ message: 'Email send successfully' });
    });
  });
}
function sendMailForProfileRegister(SUBJECT, DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_SPSV, DRIVER_PHONE, REDIRECT_LINK, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {

  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });

    const MailForProfileRegister = htmlProfileRegister.replace('{{ID}}', DRIVER_ID).replace("{{NAME}}", DRIVER_NAME).replace("{{NAME2}}", DRIVER_NAME).replace("{{EMAIL}}", DRIVER_EMAIL).replace("{{PHONE}}", DRIVER_PHONE).replace("{{SPSV}}", DRIVER_SPSV).replace("{{REDIRECT}}", REDIRECT_LINK);

    console.log("from::-", FROMEMAIL)
    console.log("to::-", RECEIVEREMAIL)
    // console.log("to::- arfaz.coderkuber@gmail.com")
    console.log("Driver Name:-", DRIVER_NAME)
    console.log("REDIRECT_LINK:-", REDIRECT_LINK)

    const mail_configs = {
      from: FROMEMAIL,
      to: RECEIVEREMAIL,
      // to: "arfaz.coderkuber@gmail.com",
      subject: SUBJECT,
      html: MailForProfileRegister,
    };
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: 'An error has occurred' });
      }
      console.log(info);
      return resolve({ message: 'Email send successfully' });
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
    // users.forEach(async (user) => {
    if (user) {
      const pendingDocuments = user.attachment.filter(doc => !doc.document_url).map(doc => doc.document_name);
      if (pendingDocuments.length > 0) {
        const data = await sendDoubletickWhatsAppMessage(user.country_code + user.mobile_no, user.first_name, pendingDocuments, user.user_id, 'first_template_missing_document');
        return data;
      }
      // });
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
      const data = await sendDoubletickWhatsAppMessage(user.country_code + user.mobile_no, user.first_name, "", user.user_id, 'icabbi_driver_ref_app_id_update_v5');
      //  await sendDoubletickWhatsAppMessage(user.country_code + user.mobile_no, user.first_name, "", user.user_id, 'icabbi_driver_ref_app_id_update_v5');

      setTimeout(async () => {
        await sendDoubletickWhatsAppMessage(user.country_code + user.mobile_no, user.first_name, "", user.user_id, 'pricing_models_22october2024_utility');
        await sendMailForSubcription("Driver Payment Subcriptions", user.first_name, "donotreply@lynk.ie", user.email)
      }, (72) * 60 * 60 * 1000);//(72) * 60 * 60 *
      return data;
    }
  } catch (error) {
    return error.message
  }
}
async function sendWhatsAppMessageOnActiveIBANStatus(user_id) {
  try {
    setTimeout(async () => {
      let user = await userModel.findOne({
        where: {
          user_id: user_id
        }
      });
      user = JSON.parse(JSON.stringify(user));
      if(user?.is_iban_submitted == 0){
      await sendDoubletickWhatsAppMessage(user.country_code + user.mobile_no, user.first_name, "", user.user_id, 'ibann_template_missing_driver_v1');}
    }, 15 * 60 * 1000);//(72) * 60 * 60 *
    return data;

  } catch (error) {
    return error.message
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
  sendWhatsAppMessageOnActiveIBANStatus
}

// /await sendDoubletickWhatsAppMessage("+919662367101", "Ashraf", "", 12, 'icabbi_driver_ref_app_id_update_v5');
// axios.post('https://public.doubletick.io/whatsapp/message/template', {
//   messages: [
//     {
//       to: "+919662367101",
//       content: {
//         templateName: "pricing_models_22october2024_utility",
//         language: 'en',
//         templateData: {
//           body: {
//             "placeholders": ["Ashraf"]
//           },
//         },
//         from: '+353858564510'
//       },
//     },
//   ],
// }, {
//   headers: {
//     'Authorization': `key_osQNf7Kp9U`
//   },
// }).then((r) => {
//   const msg_id = r.data.messages[0].messageId
//   console.log("MESSAGE ID===============", msg_id);
//   console.log("MESSAGE ID===============", r.data);
// });