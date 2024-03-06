const sequelize = require('sequelize');
const con = new sequelize('book','root','',{
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = con;