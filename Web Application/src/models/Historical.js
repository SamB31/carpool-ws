const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Family = require('./Family');

const Historical = sequelize.define('historical', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    familyId: {
        type: DataTypes.INTEGER
    }
});

Historical.belongsTo(Family, { foreignKey: 'familyId' });

module.exports = Historical;