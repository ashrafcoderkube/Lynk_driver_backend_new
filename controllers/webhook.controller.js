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
                attributes: ['template_id', 'message', 'user_id']
            });
            let reply;
            switch (data?.template_id) {
                case 0:
                    if (message.text.toLowerCase() === "i'm not ready yet") {
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/template', {
                            messages: [
                                {
                                    to: to,
                                    content: {
                                        templateName: 'document_not_ready_reply',
                                        language: 'en',
                                        templateData: {
                                            body: {
                                                "placeholders": []
                                            },
                                        },
                                        from: '+353858564510'
                                    },
                                },
                            ],
                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: message.text,
                            message_id: response.data.messages[0].messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        if (response.data.messages[0].status !== 'SENT') {
                            return res.status(500).send({ error: 'Failed to send template message.' });
                        }
                        res.status(200).send({ success: 'Message sent successfully.' });
                    } else if (message.text.toLowerCase() === 'yes' && data.message.toLowerCase() === "i'm not ready yet") {
                        reply = `Sure ${contact.name}! What can we assist with?`;
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
                        await userModel.update({
                            message: "final " + message.text,
                            message_id: response.data.messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        // Check if the message was sent successfully
                        if (response.data.status === 'SENT') {
                            res.status(200).send({ success: 'Message sent successfully.' });
                        } else {
                            res.status(500).send({ error: 'Failed to send message.' });
                        }
                    } else if (message.text.toLowerCase() === 'no' && data.message.toLowerCase() === "i'm not ready yet") {
                        reply = `Sounds good ${contact.name}! Just give us a shout if you need anything down the road. We're always here to help. Happy driving! 🚗😊`;
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
                        await userModel.update({
                            message: "final " + message.text,
                            message_id: response.data.messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        // Check if the message was sent successfully
                        if (response.data.status === 'SENT') {
                            res.status(200).send({ success: 'Message sent successfully.' });
                        } else {
                            res.status(500).send({ error: 'Failed to send message.' });
                        }
                    } else {
                        if (isWithinBusinessHours()) {
                            reply = "Thanks! We’ll get back to you shortly";
                        } else {
                            reply = "Thanks! Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day.";
                        }
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
                        await userModel.update({
                            message: message.text,
                            message_id: response.data.messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        // Check if the message was sent successfully
                        if (response.data.status === 'SENT') {
                            res.status(200).send({ success: 'Message sent successfully.' });
                        } else {
                            res.status(500).send({ error: 'Failed to send message.' });
                        }
                    }
                    break;
                case 1:
                    if (message.text.toLowerCase() == 'yes' && data.message.toLowerCase() == 'no' && data.template_id == 1) {
                        reply = `Sure ${contact.name}! What can we assist with?`;
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
                        await userModel.update({
                            message: "final " + message.text,
                            message_id: response.data.messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        // Check if the message was sent successfully
                        if (response.data.status === 'SENT') {
                            res.status(200).send({ success: 'Message sent successfully.' });
                        } else {
                            res.status(500).send({ error: 'Failed to send message.' });
                        }
                    } else if (message.text.toLowerCase() === 'yes') {
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/template', {
                            messages: [
                                {
                                    to: to,
                                    content: {
                                        templateName: 'agreement_template_for_yes',
                                        language: 'en',
                                        templateData: {
                                            body: {
                                                "placeholders": [contact.name]
                                            },
                                        },
                                        from: '+353858564510'
                                    },
                                },
                            ],
                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: message.text,
                            message_id: response.data.messages[0].messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        if (response.data.messages[0].status !== 'SENT') {
                            return res.status(500).send({ error: 'Failed to send template message.' });
                        }
                        res.status(200).send({ success: 'Message sent successfully.' });
                    } else if (message.text.toLowerCase() === 'no' && data.message.toLowerCase() === 'no') {
                        reply = `Sounds good ${contact.name}! Just give us a shout if you need anything down the road. We're always here to help. Happy driving!`;
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
                        await userModel.update({
                            message: message.text,
                            message_id: response.data.messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        // Check if the message was sent successfully
                        if (response.data.status === 'SENT') {
                            res.status(200).send({ success: 'Message sent successfully.' });
                        } else {
                            res.status(500).send({ error: 'Failed to send message.' });
                        }
                    } else if (message.text.toLowerCase() === 'no') {
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/template', {
                            messages: [
                                {
                                    to: to,
                                    content: {
                                        templateName: 'document_not_ready_reply',
                                        language: 'en',
                                        templateData: {
                                            body: {
                                                "placeholders": [contact.name]
                                            },
                                        },
                                        from: '+353858564510'
                                    },
                                },
                            ],
                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: message.text,
                            message_id: response.data.messages[0].messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        if (response.data.messages[0].status !== 'SENT') {
                            return res.status(500).send({ error: 'Failed to send template message.' });
                        }
                        res.status(200).send({ success: 'Message sent successfully.' });
                    } else {
                        if (isWithinBusinessHours()) {
                            reply = "Thanks! We’ll get back to you shortly";
                        } else {
                            reply = "Thanks! Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day.";
                        }
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
                        await userModel.update({
                            message: message.text,
                            message_id: response.data.messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        // Check if the message was sent successfully
                        if (response.data.status === 'SENT') {
                            res.status(200).send({ success: 'Message sent successfully.' });
                        } else {
                            res.status(500).send({ error: 'Failed to send message.' });
                        }
                    }
                    break;
                case 2:
                    if (message.text.toLowerCase() == 'yes' && data.message.toLowerCase() == 'no' && data.template_id == 2) {
                        reply = `Sure ${contact.name}! What can we assist with?`;
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
                        await userModel.update({
                            message: "final " + message.text,
                            message_id: response.data.messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        // Check if the message was sent successfully
                        if (response.data.status === 'SENT') {
                            res.status(200).send({ success: 'Message sent successfully.' });
                        } else {
                            res.status(500).send({ error: 'Failed to send message.' });
                        }
                    } else if (message.text.toLowerCase() === 'yes') {
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/template', {
                            messages: [
                                {
                                    to: to,
                                    content: {
                                        templateName: 'icabbi_template_for_yes',
                                        language: 'en',
                                        templateData: {
                                            body: {
                                                "placeholders": [contact.name]
                                            },
                                        },
                                        from: '+353858564510'
                                    },
                                },
                            ],
                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: message.text,
                            message_id: response.data.messages[0].messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        if (response.data.messages[0].status !== 'SENT') {
                            return res.status(500).send({ error: 'Failed to send template message.' });
                        }
                        res.status(200).send({ success: 'Message sent successfully.' });
                    } else if ((message.text.toLowerCase() === 'no' && data.message.toLowerCase() === 'no') || message.text.toLowerCase() == "already have the icabbi") {
                        reply = `Sounds good ${contact.name}! Just give us a shout if you need anything down the road. We're always here to help. Happy driving!`;
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
                        await userModel.update({
                            message: message.text,
                            message_id: response.data.messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        // Check if the message was sent successfully
                        if (response.data.status === 'SENT') {
                            res.status(200).send({ success: 'Message sent successfully.' });
                        } else {
                            res.status(500).send({ error: 'Failed to send message.' });
                        }
                    } else if (message.text.toLowerCase() === 'no') {
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/template', {
                            messages: [
                                {
                                    to: to,
                                    content: {
                                        templateName: 'document_not_ready_reply',
                                        language: 'en',
                                        templateData: {
                                            body: {
                                                "placeholders": [contact.name]
                                            },
                                        },
                                        from: '+353858564510'
                                    },
                                },
                            ],
                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: message.text,
                            message_id: response.data.messages[0].messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        if (response.data.messages[0].status !== 'SENT') {
                            return res.status(500).send({ error: 'Failed to send template message.' });
                        }
                        res.status(200).send({ success: 'Message sent successfully.' });
                    } else {
                        if (isWithinBusinessHours()) {
                            reply = "Thanks! We’ll get back to you shortly";
                        } else {
                            reply = "Thanks! Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day.";
                        }
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
                        await userModel.update({
                            message: message.text,
                            message_id: response.data.messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        // Check if the message was sent successfully
                        if (response.data.status === 'SENT') {
                            res.status(200).send({ success: 'Message sent successfully.' });
                        } else {
                            res.status(500).send({ error: 'Failed to send message.' });
                        }
                    }
                    break;
                default:
                    break;
            }
            // // Sending the message to the double tick API
            // const response = await axios.post('https://public.doubletick.io/whatsapp/message/text', {
            //     "content": {
            //         "text": reply
            //     },
            //     "from": from,
            //     "to": to

            // }, {
            //     headers: {
            //         'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
            //     },
            // });

            // // Check if the message was sent successfully
            // if (response.data.status === 'SENT') {
            //     res.status(200).send({ success: 'Message sent successfully.' });
            // } else {
            //     res.status(500).send({ error: 'Failed to send message.' });
            // }
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send({ error: error.message });
        }
    }
}
function isWithinBusinessHours() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isWithinHours = hour >= 9 && hour < 16;

    // Check if tomorrow is a working day
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowDayOfWeek = tomorrow.getDay();
    const isTomorrowWeekday = tomorrowDayOfWeek >= 1 && tomorrowDayOfWeek <= 5;

    return (isWeekday && isWithinHours) || isTomorrowWeekday;
}