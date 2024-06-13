const sequelize = require('sequelize');
const con = new sequelize('test4','root','DomoOnly35',{
    host: 'localhost',
    dialect: 'mysql'
});
module.exports = con;