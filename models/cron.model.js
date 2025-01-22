const DataTypes = require('sequelize');
const con = require('../config/db.config');


const cronDoc = con.define('cronDoc', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    task_id: {
        type: DataTypes.INTEGER,
        // primaryKey: true
    },
    task_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    task_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'cronDoc',
    timestamps: true
});
module.exports = cronDoc;