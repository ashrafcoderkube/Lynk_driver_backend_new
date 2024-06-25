const DataTypes = require('sequelize');
const con = require('../config/db.config');

const document = con.define('document', {
    document_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    document_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    document_url: {
        type: DataTypes.STRING,
        allowNull: false

    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'document',
    timestamps: true
});
module.exports = document;