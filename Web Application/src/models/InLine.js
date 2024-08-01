const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.js');
const Family = require('./Family');

const InLine = sequelize.define('inline', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    familyId: {
        type: DataTypes.INTEGER,
        unique: true
    },
});

InLine.belongsTo(Family, { foreignKey: 'familyId' });

module.exports = InLine;