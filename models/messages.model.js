const { DataTypes } = require('sequelize');
const con = require('../config/db.config');

const messages = con.define('messages', {
    message_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lead_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'messages',
    timestamps: true
});

module.exports = messages;