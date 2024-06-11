// controllers/webhookController.js

const axios = require('axios');
const userModel = require('../models/user.model');

// Function to handle incoming webhook requests
module.exports = {
    handleWebhook: async (req, res) => {
        const { to, from, message, contact, dtMessageId } = req.body;
        try {
            if (!message.text) {
                return res.status(400).send({ error: 'Response is required' });
            }
            const data = await userModel.findOne({
                where: { message_id: dtMessageId },
                attributes: ['template_id']
            });
            let reply;
            switch (data.template_id) {
                case 0:
                    if (message.text.toLowerCase() === 'yes') {
                        reply = 'Sure thing! How can we help?';
                    } else if (message.text.toLowerCase() === 'no') {
                        reply = `Sounds good, ${contact.name}! Just give us a shout if you need anything down the road. We're always here to help. Happy driving! 🚗😊`;
                    } else {
                        return res.status(400).send({ error: 'Invalid response' });
                    }
                    break;
                case 1:
                    if (message.text.toLowerCase() === 'yes') {
                        reply = 'No problem at all! How can we help?';
                    } else if (message.text.toLowerCase() === 'no') {
                        reply = `Got it, ${contact.name}! If you need anything later, just let us know. Best of luck! 😊`;
                    } else {
                        return res.status(400).send({ error: 'Invalid response' });
                    }
                    break;
                case 2:
                    if (message.text.toLowerCase() === 'yes') {
                        reply = `Fantastic, ${contact.name}, we're all set then!`;
                    } else if (message.text.toLowerCase() === 'no') {
                        reply = `No worries, ${contact.name}! Download the Lynk iCabbi App here whenever you're ready. If you need any assistance, feel free to reach out. We're here to make driving easy for you! 🚗😊`;
                    } else {
                        return res.status(400).send({ error: 'Invalid response' });
                    }
                    break;
                default:
                    break;
            }
            // Sending the message to the double tick API
            const response = await axios.post('https://public.doubletick.io/whatsapp/message/text', {
                "content": {
                    "text": reply
                },
                "from": from,
                "to": to

            }, {
                headers: {
                    'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                },
            });

            // Check if the message was sent successfully
            if (response.data.status === 'SENT') {
                res.status(200).send({ success: 'Message sent successfully.' });
            } else {
                res.status(500).send({ error: 'Failed to send message.' });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send({ error: error.message });
        }
    }
}
