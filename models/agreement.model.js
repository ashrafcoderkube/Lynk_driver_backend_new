const { DataTypes } = require('sequelize');
const con = require('../config/db.config');

const agreement = con.define('agreement', {
    agreement_id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(),
        allowNull: false
    },
    version: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false

    }
}, {
    tableName: 'agreement',
    timeStamps: true
});

module.exports = agreement;

