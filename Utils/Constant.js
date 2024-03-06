const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require('path');

const acchtml = path.join(__dirname, '../Utils/new-acc.html');
const forgothtml = path.join(__dirname, '../Utils/forget.html');
const driverhtml = path.join(__dirname, '../Utils/new-driver.html');
const ibanhtml = path.join(__dirname, '../Utils/iban.html');
const deletionhtml = path.join(__dirname, '../Utils/Deletion.html');
const holidayhtml = path.join(__dirname, '../Utils/Holiday.html');
const profileUpdatehtml = path.join(__dirname, '../Utils/Profile-updated.html');

const htmlFileacc = fs.readFileSync(acchtml, "utf8");
const htmlFileforgot = fs.readFileSync(forgothtml, "utf8");
const htmlFiledriver = fs.readFileSync(driverhtml, "utf8");
const htmlIBAN = fs.readFileSync(ibanhtml, "utf8");
const htmlHoliday = fs.readFileSync(holidayhtml, "utf8");
const htmlProfileUpdate = fs.readFileSync(profileUpdatehtml, "utf8");
const htmlDeletion = fs.readFileSync(deletionhtml, "utf8");
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
   const BASEURL =  "https://driverapp.lynk.ie/apiv/";
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
    Time_Slot_Required: "TimeSlot Id Must Be Required",
    Password_Reset_Successful: "Your password was reset successfully.",
    Profile_Update_Mail: "Your profile update mail sent successfully.",
    You_Are_Not_Admin: "You Are Not Admin",
    Agreement_Update_Success:"Agreement Updated Successfully",
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
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail', // Path to the sendmail binary
    });
    console.log("send mail-------"+ ISFORGOTPASSWORD);

      const ForgotPassword = htmlFileforgot.replace("{{REDIRECT}}", REDIRECT);
      const driverDoc = htmlFiledriver.replace("{{REDIRECT}}", REDIRECT).replace("{{DRIVER_ID}}",SUBTITLE1 ).replace("{{DRIVER_NAME}}" , TITLE).replace("{{REDIRECT2}}", REDIRECT);
      const NewAccount = htmlFileacc.replace('{{OTP}}', OTP).replace("{{REDIRECT}}", REDIRECT);


      console.log("from::-" ,FROMEMAIL)
      console.log("to::-" ,ISFORGOTPASSWORD ? EMAIL : RECEIVEREMAIL)
     
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

function sendMailForIBAN(SUBJECT,IBAN_NUMBER,DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_SPSV,REDIRECT_LYNK, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail', // Path to the sendmail binary
    });

      const MailForIBAN = htmlIBAN.replace('{{ID}}', DRIVER_ID).replace("{{NAME}}", DRIVER_NAME).replace("{{EMAIL}}", DRIVER_EMAIL).replace("{{SPSV}}", DRIVER_SPSV).replace("{{REDIRECT}}", REDIRECT_LYNK).replace("{{IBAN}}", IBAN_NUMBER);
     

      console.log("from::-" ,FROMEMAIL)
      console.log("to::-" ,RECEIVEREMAIL)
     
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

function sendMailForDELETION(SUBJECT,DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_SPSV, REDIRECT_LYNK, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail', // Path to the sendmail binary
    });

      const MailForDeletion = htmlDeletion.replace('{{ID}}', DRIVER_ID).replace("{{NAME}}", DRIVER_NAME).replace("{{EMAIL}}", DRIVER_EMAIL).replace("{{SPSV}}", DRIVER_SPSV).replace("{{REDIRECT}}", REDIRECT_LYNK);


      console.log("from::-" ,FROMEMAIL)
      console.log("to::-" ,RECEIVEREMAIL)
     
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

function sendMailForHoliday(SUBJECT,DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_SPSV, DRIVER_PHONE,DRIVER_NO,FROM,TO,REASON,CURRENT_TIME, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["reception@lynk.ie"]) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail', // Path to the sendmail binary
    });

      const MailForHoliday = htmlHoliday.replace('{{ID}}', DRIVER_ID).replace("{{NAME}}", DRIVER_NAME).replace("{{NAME2}}", DRIVER_NAME).replace("{{EMAIL}}", DRIVER_EMAIL).replace("{{PHONE}}", DRIVER_PHONE).replace("{{SPSV}}", DRIVER_SPSV).replace("{{DRIVERNO}}", DRIVER_NO).replace("{{FROM}}", FROM).replace("{{TO}}", TO).replace("{{REASON}}", REASON).replace("{{CURRENTTIME}}", CURRENT_TIME);


      console.log("from::-" ,FROMEMAIL)
      console.log("to::-" ,RECEIVEREMAIL)
      console.log("DRIVER_NO::-" ,DRIVER_NO)
      console.log("DRIVER_FROM::-" ,FROM)
      console.log("DRIVER_To::-" ,TO)
      console.log("REASON::-" ,REASON)
     
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

function sendMailForProfileUpdate(SUBJECT,DRIVER_ID, DRIVER_NAME, DRIVER_EMAIL, DRIVER_SPSV, DRIVER_PHONE,REDIRECT_LINK, FROMEMAIL = "donotreply@lynk.ie", RECEIVEREMAIL = ["darren.okeeffe@lynk.ie", "sandra.cole@lynk.ie"]) {
 
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail', // Path to the sendmail binary
    });

      const MailForProfileUpdate = htmlProfileUpdate.replace('{{ID}}', DRIVER_ID).replace("{{NAME}}", DRIVER_NAME).replace("{{NAME2}}", DRIVER_NAME).replace("{{EMAIL}}", DRIVER_EMAIL).replace("{{PHONE}}", DRIVER_PHONE).replace("{{SPSV}}", DRIVER_SPSV).replace("{{REDIRECT}}", REDIRECT_LINK);

      console.log("from::-" ,FROMEMAIL)
      console.log("to::-" ,RECEIVEREMAIL)
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
    getCurrentTime
}

