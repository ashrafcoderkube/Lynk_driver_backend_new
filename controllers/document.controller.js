
const documentModel = require('../models/document.model');
const { errorHandler } = require("../Utils/error");
const {
    BASEURL,
    StatusEnum,
    StatusMessages,
    Messages,
} = require("../Utils/Constant");


module.exports = {
    createDocs: async (req, res) => {
        try {
            const { document_name, document_url, user_id } = req.body;
            let document = await documentModel.create({
                document_name: document_name,
                document_url: document_url,
                user_id: user_id
            });
            document = JSON.parse(JSON.stringify(document));
            const document_data = await documentModel.findOne({
                where: { document_id: document.document_id },
                attributes: ['document_name', 'document_url', 'user_id']
            })
            res.status(StatusEnum.SUCCESS).json({
                status: StatusEnum.SUCCESS,
                message: StatusMessages.SUCCESS,
                data: document_data,
            });
        } catch (error) {
            res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
                status: StatusEnum.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    },
    getDocs: async (req, res) => {
        try {
            const document_data = await documentModel.findAll({
                attributes: ['document_name', 'document_url','user_id']
            });
            res.status(StatusEnum.SUCCESS).json({
                status: StatusEnum.SUCCESS,
                message: StatusMessages.SUCCESS,
                data: document_data,
            });
            return;
        } catch (error) {
            res.status(StatusEnum.INTERNAL_SERVER_ERROR).json({
                status: StatusEnum.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    },
}