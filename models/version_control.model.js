const DataTypes = require('sequelize');
const con = require('../config/db.config');

const version_control = con.define('version_control', {
    version_control_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    android_version: {
        type: DataTypes.STRING
    },
    android_is_force_update: {
        type: DataTypes.INTEGER(1)
    },
    android_message: {
        type: DataTypes.STRING
    },
    ios_version: {
        type: DataTypes.STRING
    },
    ios_is_force_update: {
        type: DataTypes.INTEGER(1)
    },
    ios_message: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'version_control',
    timestamps: true
});

module.exports = version_control;