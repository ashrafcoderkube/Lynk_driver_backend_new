const DataTypes = require('sequelize');
const con = require('../config/db.config');

const homeData = con.define('homedata',{
    home_data_id : {
        type : DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey : true
    },
    lynks_icabbi_driver_android_url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lynks_icabbi_driver_ios_url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lynk_procedures: {
        type: DataTypes.STRING,
        allowNull: false
    },
    learn_how_to_use_the_lynks_icabbi_driver_app: {
        type: DataTypes.STRING,
        allowNull: false
    },
    faqs: {
        type: DataTypes.STRING,
        allowNull: false
    },
    rent_a_taxi: {
        type: DataTypes.STRING,
        allowNull: false
    },
    driver_news: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contact_driver_team: {
        type: DataTypes.STRING,
        allowNull: false
    },
    terms_and_conditions: {
        type: DataTypes.STRING,
        allowNull: false
    },
    privacy_policy: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_icons: {
        type: DataTypes.BOOLEAN,
        default: false
    }
},{
    tableName : 'homedata',
    timestamps : true
});

module.exports = homeData;