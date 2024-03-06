const express = require('express');
const PORT = process.env.PORT || 8888;
const app = express();
const con = require('./config/db.config');
// const userModel = require('../models/user.model');
// const documentModel = require("../models/document.model");
// const leadsModel = require('./models/leads.model');
// const messagesModel = require('./models/messages.model');
const models = require('./models/index');
const path = require('path');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.route');
const agreementRoutes = require('./routes/agreement.route');
const documentRoutes = require('./routes/document.route');
const authRoutes = require('./routes/auth.route');
require('dotenv').config();
app.use(express.json());

con.sync({ alter: true }).then(() => {
    console.log("Models synchronized successfully.");
}).catch((error) => {
    console.log(error.message);
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', authRoutes);
app.use('/agreement', agreementRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/document', documentRoutes);

app.listen(PORT, (err) => {
    if (err) console.log("Error in server setup")
    console.log(`Server listening at ${PORT}.`);
})