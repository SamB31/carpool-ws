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

        await redisClient.set('lastStation', '0');

        return { success: true, status: 200, message: 'Carpool has ended' };
    } catch (error) {
        console.error('Error ending carpool:', error);
        return { success: false, status: 500, message: 'Error ending carpool' };
    }
};

// Helper function to get the next station number (unchanged)
const getNextStation = async () => {
    const lastStation = await redisClient.get('lastStation') || '0';
    const nextStation = (parseInt(lastStation) % 4) + 1;
    await redisClient.set('lastStation', nextStation.toString());
    return nextStation;
  };

module.exports = { historicalFormatMessage, endCarpool, getNextStation };
