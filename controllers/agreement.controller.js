
const agreementModel = require("../models/agreement.model");
const { errorHandler } = require("../Utils/error");
const {
    BASEURL,
    StatusEnum,
    StatusMessages,
    Messages,
} = require("../Utils/Constant");

module.exports = {

    createAgreements: async (req, res) => {
        try {
            const { title, Content, version } = req.body;
            if (!title) {
                res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide title.' });
            } else if (!version) {
                res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide version.' });
            } else if (!Content) {
                res.status(StatusEnum.TOKEN_EXP).json({ message: 'Please provide content.' });
            } else {
                let agreement = await agreementModel.create({
                    title: title,
                    content: Content,
                    version: version
                });
                agreement = JSON.parse(JSON.stringify(agreement));
                const agreement_data = await agreementModel.findOne({
                    where: { agreement_id: agreement.agreement_id },
                    attributes: ['title', 'content', 'version']
                });
                res.status(StatusEnum.SUCCESS).json({
                    status: StatusEnum.SUCCESS,
                    message: StatusMessages.SUCCESS,
                    data: agreement_data,
                });
            }
        } catch (error) {
            res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
                status: StatusEnum.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    },

    getAgreements: async (req, res) => {
        try {
            const agreement_data = await agreementModel.findOne({
                order: [['createdAt', 'DESC']],
                limit: 1
            });

            if (!agreement_data) {
                res.status(StatusEnum.NOT_FOUND).json({
                    status: StatusEnum.NOT_FOUND,
                    message: StatusMessages.NOT_FOUND,
                });
            }
            res.status(StatusEnum.SUCCESS).json({
                status: StatusEnum.SUCCESS,
                message: StatusMessages.SUCCESS,
                data: agreement_data,
            });
        } catch (error) {
            res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
                message: error.message,
                status: StatusEnum.INTERNAL_SERVER_ERROR,
            });
        }
    }
}