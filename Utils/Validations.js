const { social_type } = require("./Constant");

// Validate Email
function validateEmail(email) {
    // Simple email validation regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate Phone Number
function validatePhone(phone) {
    // Custom phone number validation logic
    // This is a simple example, you may need to adapt it to your specific requirements
    const phoneRegex = /^(?:\+\d{1,4}\s*)?\d{10}$/;// Assumes a 10-digit phone number
    return phoneRegex.test(phone);
}

// Validate Required Field
function validateRequiredField(value) {
    return !!value.trim(); // Checks if the value is not empty after trimming whitespace
}
function checkSocialType(value) {
    if (value == social_type.Apple || value == social_type.Google || value == social_type.Facebook) {
        return true
    } else {
        return false;
    }
}

module.exports = {
    validateEmail,
    validatePhone,
    validateRequiredField,
    checkSocialType
};
