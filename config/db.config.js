const sequelize = require('sequelize');
const con = new sequelize('test','root','',{
    host: 'localhost',
    dialect: 'mysql'
})