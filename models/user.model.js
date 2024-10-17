const { DataTypes } = require('sequelize');
const con = require('../config/db.config');

const user = con.define('users', {
    user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    profile_image: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    agreement_version: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    agreement_signed: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    clicked_to_app: {
        type: DataTypes.ENUM('Yes', 'No'),
        defaultValue: "No"
    },
    type: {
        type: DataTypes.ENUM('user', 'admin', 'super_admin'),
        defaultValue: "user"
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mobile_no: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    authToken: {
        type: DataTypes.STRING,
        allowNull: false
    },
    spsv: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    last_login: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    country_code: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    device_type: {
        type: DataTypes.ENUM('Android', 'iOS', 'Desktop'),
        defaultValue: "Android"
    },
    document_uploaded: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_deleted: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },

    agreement_verified: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_iban_submitted: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    promocode: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    icabbiStatus: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    icabbi_driver_ref: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    icabbi_driver_app_pin: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    template_id: {
        type: DataTypes.INTEGER
    },
    message_id: {
        type: DataTypes.STRING
    },
    message: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'users',
    timestamps: true
});

module.exports = user;