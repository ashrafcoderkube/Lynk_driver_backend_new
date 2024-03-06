const sequelize = require('sequelize');
const con = new sequelize('test','root','',{
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = con;