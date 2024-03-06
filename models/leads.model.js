const { DataTypes } = require('sequelize');
const con = require('../config/db.config');

const leads = con.define('leads', {
    lead_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    driver_phone_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    driver_email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    source: {
        type: DataTypes.STRING,
        allowNull: false
    },
    package_sold: {
        type: DataTypes.STRING,
        allowNull: false
    },
    training_date: {
        type: DataTypes.STRING,
        allowNull: false
    },
    notes: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_follow_up_date: {
        type: DataTypes.STRING,
        allowNull: false
    },
    next_follow_up_date: {
        type: DataTypes.STRING,
        allowNull: false
    },
    messages_comments: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_message_viewed: {
        type: DataTypes.STRING
    },
}, {
    tableName: 'leads',
    timestamps: true
});

module.exports = leads;