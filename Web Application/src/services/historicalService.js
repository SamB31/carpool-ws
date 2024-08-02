const Historical = require('../models/Historical');
const Family = require('../models/Family');
const fs = require('fs');
const { writeDataToCSVFile } = require('../utils/csvHelper');
const redisClient = require('../config/redis');
const INLINE_KEY = 'carpool:inline';

const historicalFormatMessage = async () => {
    const allHistoricalRecords = await Historical.findAll({
        include: [{ model: Family, attributes: ['firstName', 'lastName'] }],
        order: [['createdAt', 'DESC']]
    });

    return allHistoricalRecords.map(record => {
        const inlineData = record.dataValues;
        const familyData = inlineData.family ? inlineData.family.dataValues : {};

        return {
            firstName: familyData.firstName,
            lastName: familyData.lastName,
            createdAt: inlineData.createdAt
        };
    });
};

const endCarpool = async () => {
    try {
        const historicalData = await Historical.findAll({
            include: [{ model: Family, attributes: ['firstName', 'lastName'] }]
        });

        await writeDataToCSVFile(historicalData);

        await Historical.destroy({ where: {} });

        await redisClient.del(INLINE_KEY);

        return { success: true, status: 200, message: 'Carpool has ended' };
    } catch (error) {
        console.error('Error ending carpool:', error);
        return { success: false, status: 500, message: 'Error ending carpool' };
    }
};

module.exports = { historicalFormatMessage, endCarpool };
