const axios = require('axios');
const userModel = require('../models/user.model');

// Function to handle incoming webhook requests
module.exports = {
    handleWebhook: async (req, res) => {
        const { to, from, message, contact, dtMessageId, messageId, dtPairedMessageId, dtLastMessageId } = req.body;
        console.log("Webhook Called");
        try {
            if (!message?.text) {
                return res.status(400).send({ error: 'Response is required' });
            }

            let data = await userModel.findOne({
                where: { message_id: dtLastMessageId },
                attributes: ['template_id', 'message', 'user_id', 'first_name', 'last_name', 'device_type']
            });
            let reply;
            switch (data?.template_id) {
                case 0:
                    if (message?.text.toLowerCase() === "i'm not ready yet") {
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/template', {
                            messages: [
                                {
                                    to: from,
                                    content: {
                                        templateName: 'document_not_ready_reply',
                                        language: 'en',
                                        templateData: {
                                            body: {
                                                "placeholders": []
                                            },
                                        },
                                        from: to
                                    },
                                },
                            ],
                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: message?.text,
                            message_id: response.data?.messages[0].messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        if (response.data?.messages[0].status !== 'SENT') {
                            return res.status(500).send({ error: 'Failed to send template message.' });
                        }
                        res.status(200).send({ success: 'Message sent successfully.' });
                    } else if (message?.text.toLowerCase() === 'yes' && data?.message.toLowerCase() === "i'm not ready yet") {
                        reply = `Sure ${data.first_name}! What can we assist with?`;
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/text', {
                            "content": {
                                "text": reply
                            },
                            "from": to,
                            "to": from

                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: "final " + message?.text,
                            message_id: response.data?.messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        // Check if the message was sent successfully
                        if (response.data.status === 'SENT') {
                            res.status(200).send({ success: 'Message sent successfully.' });
                        } else {
                            res.status(500).send({ error: 'Failed to send message.' });
                        }
                    } else if (message?.text.toLowerCase() === 'no' && data?.message.toLowerCase() === "i'm not ready yet") {
                        reply = `Sounds good ${data.first_name}! Just give us a shout if you need anything down the road. We're always here to help. Happy driving! 🚗😊`;
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/text', {
                            "content": {
                                "text": reply
                            },
                            "from": to,
                            "to": from

                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: "final " + message?.text,
                            message_id: response.data?.messageId
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
                            if (data?.message == `We have your message ${data.first_name}. Please bear with us and we'll get back to you shortly.`) {
                                reply = `We have your message ${data.first_name}. Please bear with us and we'll get back to you shortly.`
                            } else {
                                reply = data?.message === "Thanks! We’ll get back to you shortly"
                                    ? `We have your message ${data.first_name}. Please bear with us and we'll get back to you shortly.`
                                    : "Thanks! We’ll get back to you shortly";
                            }
                        } else {
                            if (data?.message == `We have your message ${data.first_name}. Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day.`) {
                                reply = `We have your message ${data.first_name}. Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day.`;
                            } else {
                                reply = data?.message === "Thanks! Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day."
                                    ? `We have your message ${data.first_name}. Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day.`
                                    : "Thanks! Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day.";

                            }
                        }
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/text', {
                            "content": {
                                "text": reply
                            },
                            "from": to,
                            "to": from

                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: reply,
                            message_id: response.data?.messageId
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
                    if (message?.text.toLowerCase() == 'yes' && data?.message.toLowerCase() == 'no' && data?.template_id == 1) {
                        reply = `Sure ${data.first_name}! What can we assist with?`;
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/text', {
                            "content": {
                                "text": reply
                            },
                            "from": to,
                            "to": from

                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: "final " + message?.text,
                            message_id: response.data?.messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        // Check if the message was sent successfully
                        if (response.data.status === 'SENT') {
                            res.status(200).send({ success: 'Message sent successfully.' });
                        } else {
                            res.status(500).send({ error: 'Failed to send message.' });
                        }
                    } else if (message?.text.toLowerCase() === 'yes') {
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/template', {
                            messages: [
                                {
                                    to: from,
                                    content: {
                                        templateName: 'agreement_template_for_yes',
                                        language: 'en',
                                        templateData: {
                                            body: {
                                                "placeholders": [data.first_name]
                                            },
                                        },
                                        from: to
                                    },
                                },
                            ],
                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: message?.text,
                            message_id: response.data?.messages[0].messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        if (response.data?.messages[0].status !== 'SENT') {
                            return res.status(500).send({ error: 'Failed to send template message.' });
                        }
                        res.status(200).send({ success: 'Message sent successfully.' });
                    } else if (message?.text.toLowerCase() === 'no' && data?.message.toLowerCase() === 'no') {
                        reply = `Sounds good ${data.first_name}! Just give us a shout if you need anything down the road. We're always here to help. Happy driving!🚗😊`;
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/text', {
                            "content": {
                                "text": reply
                            },
                            "from": to,
                            "to": from

                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: message?.text,
                            message_id: response.data?.messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        // Check if the message was sent successfully
                        if (response.data.status === 'SENT') {
                            res.status(200).send({ success: 'Message sent successfully.' });
                        } else {
                            res.status(500).send({ error: 'Failed to send message.' });
                        }
                    } else if (message?.text.toLowerCase() === 'no') {
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/template', {
                            messages: [
                                {
                                    to: from,
                                    content: {
                                        templateName: 'document_not_ready_reply',
                                        language: 'en',
                                        templateData: {
                                            body: {
                                                "placeholders": [data.first_name]
                                            },
                                        },
                                        from: to
                                    },
                                },
                            ],
                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: message?.text,
                            message_id: response.data?.messages[0].messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        if (response.data?.messages[0].status !== 'SENT') {
                            return res.status(500).send({ error: 'Failed to send template message.' });
                        }
                        res.status(200).send({ success: 'Message sent successfully.' });
                    } else {
                        if (isWithinBusinessHours()) {
                            if (data?.message == `We have your message ${data.first_name}. Please bear with us and we'll get back to you shortly.`) {
                                reply = `We have your message ${data.first_name}. Please bear with us and we'll get back to you shortly.`
                            } else {
                                reply = data?.message === "Thanks! We’ll get back to you shortly"
                                    ? `We have your message ${data.first_name}. Please bear with us and we'll get back to you shortly.`
                                    : "Thanks! We’ll get back to you shortly";
                            }
                        } else {
                            if (data?.message == `We have your message ${data.first_name}. Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day.`) {
                                reply = `We have your message ${data.first_name}. Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day.`;
                            } else {
                                reply = data?.message === "Thanks! Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day."
                                    ? `We have your message ${data.first_name}. Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day.`
                                    : "Thanks! Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day.";

                            }
                        }
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/text', {
                            "content": {
                                "text": reply
                            },
                            "from": to,
                            "to": from

                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: reply,
                            message_id: response.data?.messageId
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
                    let templateName = data?.device_type == 'Android' ? 'icabbi_template_for_android' : 'icabbi_template_for_ios'
                    if (message?.text.toLowerCase() == 'yes' && data?.message.toLowerCase() == 'no' && data?.template_id == 2) {
                        reply = `Sure ${data.first_name}! What can we assist with?`;
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/text', {
                            "content": {
                                "text": reply
                            },
                            "from": to,
                            "to": from

                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: "final " + message?.text,
                            message_id: response.data?.messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        // Check if the message was sent successfully
                        if (response.data.status === 'SENT') {
                            res.status(200).send({ success: 'Message sent successfully.' });
                        } else {
                            res.status(500).send({ error: 'Failed to send message.' });
                        }
                    } else if (message?.text.toLowerCase() === 'yes') {
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/template', {
                            messages: [
                                {
                                    to: from,
                                    content: {
                                        templateName: templateName,
                                        language: 'en',
                                        templateData: {
                                            body: {
                                                "placeholders": [data.first_name]
                                            },
                                        },
                                        from: to
                                    },
                                },
                            ],
                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: message?.text,
                            message_id: response.data?.messages[0].messageId,
                            clicked_to_app: 'Yes'
                        }, {
                            where: { user_id: data.user_id }
                        });
                        if (response.data?.messages[0].status !== 'SENT') {
                            return res.status(500).send({ error: 'Failed to send template message.' });
                        }
                        res.status(200).send({ success: 'Message sent successfully.' });
                    } else if ((message?.text.toLowerCase() === 'no' && data?.message.toLowerCase() === 'no') || message?.text.toLowerCase() == "already have icabbi app") {
                        reply = `Sounds good ${data.first_name}! Just give us a shout if you need anything down the road. We're always here to help. Happy driving!🚗😊`;
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/text', {
                            "content": {
                                "text": reply
                            },
                            "from": to,
                            "to": from

                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        let dynamicData = {};
                        if (message?.text.toLowerCase() === "already have icabbi app") {
                            dynamicData = {
                                message: message?.text,
                                message_id: response.data?.messageId,
                                clicked_to_app: 'Yes'
                            };
                        } else {
                            dynamicData = {
                                message: message?.text,
                                message_id: response.data?.messageId
                            };
                        }
                        await userModel.update(dynamicData, {
                            where: { user_id: data.user_id }
                        });
                        // Check if the message was sent successfully
                        if (response.data.status === 'SENT') {
                            res.status(200).send({ success: 'Message sent successfully.' });
                        } else {
                            res.status(500).send({ error: 'Failed to send message.' });
                        }
                    } else if (message?.text.toLowerCase() === 'no') {
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/template', {
                            messages: [
                                {
                                    to: from,
                                    content: {
                                        templateName: 'document_not_ready_reply',
                                        language: 'en',
                                        templateData: {
                                            body: {
                                                "placeholders": [data.first_name]
                                            },
                                        },
                                        from: to
                                    },
                                },
                            ],
                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: message?.text,
                            message_id: response.data?.messages[0].messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        if (response.data?.messages[0].status !== 'SENT') {
                            return res.status(500).send({ error: 'Failed to send template message.' });
                        }
                        res.status(200).send({ success: 'Message sent successfully.' });
                    } else {
                        if (isWithinBusinessHours()) {
                            if (data?.message == `We have your message ${data.first_name}. Please bear with us and we'll get back to you shortly.`) {
                                reply = `We have your message ${data.first_name}. Please bear with us and we'll get back to you shortly.`
                            } else {
                                reply = data?.message === "Thanks! We’ll get back to you shortly"
                                    ? `We have your message ${data.first_name}. Please bear with us and we'll get back to you shortly.`
                                    : "Thanks! We’ll get back to you shortly";
                            }
                        } else {
                            if (data?.message == `We have your message ${data.first_name}. Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day.`) {
                                reply = `We have your message ${data.first_name}. Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day.`;
                            } else {
                                reply = data?.message === "Thanks! Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day."
                                    ? `We have your message ${data.first_name}. Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day.`
                                    : "Thanks! Our Driver Team department is currently closed, but we'll be happy to assist you as soon as we're back on the next working day.";

                            }
                        }
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/text', {
                            "content": {
                                "text": reply
                            },
                            "from": to,
                            "to": from

                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: reply,
                            message_id: response.data?.messageId
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
                case 9:
                    if (message?.text.toLowerCase() == 'select option 1' ||
                    message?.text.toLowerCase() == 'select option 2' ||
                    message?.text.toLowerCase() == 'select option 3' ||
                    message?.text.toLowerCase() == 'select option 4' ){
                        let reply= "Thank You! \n We will reflect your selection on your Lynk profile.";
                        const response = await axios.post('https://public.doubletick.io/whatsapp/message/text', {
                            "content": {
                                "text": reply
                            },
                            "from": to,
                            "to": from

                        }, {
                            headers: {
                                'Authorization': `${process.env.DOUBLE_TICK_API_KEY}`,
                            },
                        });
                        await userModel.update({
                            message: reply,
                            message_id: response.data?.messageId
                        }, {
                            where: { user_id: data.user_id }
                        });
                        console.log("Sent Data Response" ,response.data)
                        console.log("massege Data Response" ,message?.text.toLowerCase())
                        // Check if the message was sent successfully
                        if (response.data.status === 'SENT') {
                            res.status(200).send({ success: 'Message sent successfully.' });
                        } else {
                            res.status(500).send({ error: 'Failed to send message.' });
                        }
                    }
                default:
                    break;
            }
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
    return isWeekday && isWithinHours;
}