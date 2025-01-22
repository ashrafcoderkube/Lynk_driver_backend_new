const express = require('express');
const PORT = process.env.PORT || 8888;
const app = express();
const fs = require('fs');
const http = require('http');
const cron = require('node-cron');
const con = require('./config/db.config');
const models = require('./models/index');
const path = require('path');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.route');
const agreementRoutes = require('./routes/agreement.route');
const reportsModel = require('./models/reports.model');
const moment = require('moment');

const documentRoutes = require('./routes/document.route');
const authRoutes = require('./routes/auth.route');
const webhookRoutes = require('./routes/webhook.route');
const { sendWeeklyReportsEmail, checkDocumentsAndSendWhatsAppMessage, InitialReminder, SecondReminder, FinalReminder, checkAgreementsAndSendWhatsAppMessage, checkiCabbiAndSendWhatsAppMessage, sendDoubletickWhatsAppMessage, sendMailForSubcription } = require('./Utils/Constant');

require('dotenv').config();

const cors = require('cors')
const bodyParser = require("body-parser");


app.use(cors());


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

app.use(express.json());

await con.sync({ alter: true }).then(() => {
    console.log("Models synchronized successfully.");
}).catch((error) => {
    console.log(error.message);
});
const cronDoc = require('./models/cron.model');
const user = require('./models/user.model');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use((req, res, next) => {
    res.on("finish", () => {
        console.log(`${req.method} - ${req.originalUrl} - ${res.statusCode}`);
    });
    next();
});

// Runs every Monday at 11:00 AM GMT
cron.schedule('0 11 * * 1', async () => {
    // cron.schedule('*/1 * * * *', () => {
    const subject = 'Driver App Emails Weekly Report'
    console.log('Task is running every Monday at 11:00 AM GMT');
    await sendWeeklyReportsEmail(subject);
});



// Runs every 5 minutes
cron.schedule('*/1 * * * *', async () => {
    try {
        console.log('Cron job running for scheduled document tasks...');

        // Get current time
        const currentTime = new Date();

        // Fetch all pending cron document tasks
        const cronDocs = await cronDoc.findAll({
        });

        for (const doc of cronDocs) {
            const taskTime = new Date(doc.task_time); // Assuming taskTime field exists

            // Check if task time has arrived
            if (taskTime <= currentTime) {

                // Get user details
                let user_data = await user.findOne({
                    where: {
                        user_id: doc.user_id
                    }
                });
                user_data = JSON.parse(JSON.stringify(user_data));

                if (!user_data) {
                    console.log(`User not found for cronDoc ID: ${doc.id}`);
                    continue;
                }

                // Process task based on task_id
                switch (doc.task_id) {
                    case 1:
                        // Handle task 1
                        console.log('Processing task 1');
                        await checkDocumentsAndSendWhatsAppMessage(doc.user_id);
                        await cronDoc.destroy(
                            { where: { id: doc.id } }
                        );
                        break;

                    case 2:
                        // Handle task 2
                        console.log('Processing task 2');
                        if (user_data?.document_uploaded == 0 || user_data?.is_iban_submitted == 0 || user_data?.agreement_verified == 0 || user_data?.clicked_to_app == 'No') {
                            await InitialReminder(user_data.user_id);
                        }
                        await cronDoc.destroy(
                            { where: { id: doc.id } }
                        );
                        break;

                    case 3:
                        // Handle task 3
                        console.log('Processing task 3');
                        if (user_data?.document_uploaded == 0 || user_data?.is_iban_submitted == 0 || user_data?.agreement_verified == 0 || user_data?.clicked_to_app == 'No') {
                            await SecondReminder(user_data.user_id); // 72-hour reminder
                        }
                        await cronDoc.destroy(
                            { where: { id: doc.id } }
                        );
                        break;

                    case 4:
                        // Handle task 4
                        console.log('Processing task 4');
                        if (user_data?.document_uploaded == 0 || user_data?.is_iban_submitted == 0 || user_data?.agreement_verified == 0 || user_data?.clicked_to_app == 'No') {
                            await FinalReminder(user_data.user_id); // 7-day reminder
                        }
                        await cronDoc.destroy(
                            { where: { id: doc.id } }
                        );
                        break;

                    case 5:
                        // Handle task 5
                        console.log('Processing task 5');
                        await checkDocumentsAndSendWhatsAppMessage(user_data.user_id);
                        await cronDoc.destroy(
                            { where: { id: doc.id } }
                        );
                        break;

                    case 6:
                        // Handle task 6
                        console.log('Processing task 6');
                        await checkAgreementsAndSendWhatsAppMessage(user_data.user_id);
                        await cronDoc.destroy(
                            { where: { id: doc.id } }
                        );
                        break;

                    case 7:
                        // Handle task 7
                        console.log('Processing task 7');
                        await checkiCabbiAndSendWhatsAppMessage(user_data.user_id);
                        await cronDoc.destroy(
                            { where: { id: doc.id } }
                        );
                        break;

                    case 8:
                        // Handle task 8
                        console.log('Processing task 8');
                        const data = await sendDoubletickWhatsAppMessage(user_data.country_code + user_data.mobile_no, user_data.first_name, "", user_data.user_id, 'pricing_models_22october2024_utility');
                        const mail = await sendMailForSubcription("Driver Payment Subcriptions", user_data.first_name, "donotreply@lynk.ie", user_data.email)
                        if (mail.res == 0) {
                            let report_data = await reportsModel.create({
                                user_id: user_data.user_id,
                                subject: 'Driver Payment Subscription.',
                                date: moment().format('YYYY-MM-DD HH:mm:ss')
                            })
                        }
                        await cronDoc.destroy(
                            { where: { id: doc.id } }
                        );
                        break;

                    case 9:
                        // Handle task 9
                        console.log('Processing task 9');
                        if (user_data?.is_iban_submitted == 0) {
                            const data = await sendDoubletickWhatsAppMessage(user_data.country_code + user_data.mobile_no, user_data.first_name, "", user_data.user_id, 'ibann_template_missing_driver_v1');
                        }
                        await cronDoc.destroy(
                            { where: { id: doc.id } }
                        );
                        break;

                    default:
                        console.log(`Unknown task_id: ${doc.task_id}`);
                }
            }
        }
    } catch (error) {
        console.error('Error in cronDoc processing:', error);
    }
});


app.use('/', authRoutes);
app.use('/agreement', agreementRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/document', documentRoutes);
app.use('/webhook', webhookRoutes);
app.listen(PORT, (err) => {
    if (err) console.log("Error in server setup")
    console.log(`Server listening at ${PORT}.`);
});

// const options = {
//     key: fs.readFileSync('C:/Program Files/OpenSSL-Win64/bin/PEM/key.pem'),
//     cert: fs.readFileSync('C:/Program Files/OpenSSL-Win64/bin/PEM/cert.pem')
// };

// const server = http.createServer(app, (req, res) => {
//     res.writeHead(200);
//     // res.end('Hello, HTTPS world!');
// });

// server.listen(443, () => {
//     console.log('Server listening on port 443');
// });