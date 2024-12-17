const DataTypes = require('sequelize');
const con = require('../config/db.config');

const reports = con.define('reports', {
    report_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date: {
       type: DataTypes.STRING,
       allowNull: false
    }
}, {
    tableName: 'reports',
    timestamps: true
});
module.exports = reports;