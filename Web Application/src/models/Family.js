const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Family = sequelize.define('family', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    grade: DataTypes.STRING,
    inAfterSchoolCare: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    familyId: DataTypes.INTEGER,
});

module.exports = Family;