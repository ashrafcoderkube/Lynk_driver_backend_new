const documentModel = require('./document.model');
const userModel = require('./user.model');
const leadsModel = require('./leads.model');
const messageModel = require('./messages.model');
const reportsModel = require('./reports.model');
const cronDoc = require('./cron.model');

documentModel.belongsTo(userModel, { foreignKey: 'user_id' });
// cronDoc.belongsTo(userModel, { foreignKey: 'user_id' });
userModel.hasMany(documentModel, { foreignKey: 'user_id', as: 'attachment' });
messageModel.belongsTo(leadsModel, { foreignKey: 'lead_id' });
messageModel.belongsTo(userModel, { foreignKey: 'user_id' });
leadsModel.hasMany(messageModel, { foreignKey: 'lead_id' });
userModel.hasMany(messageModel, { foreignKey: 'user_id' });
reportsModel.belongsTo(userModel, { foreignKey: 'user_id' });
// userModel.hasMany(reportsModel, { foreignKey: 'user_id' });