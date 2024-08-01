const InLine = require('../models/InLine');
const Family = require('../models/Family');
const Historical = require('../models/Historical');

const checkIn = async (familyId) => {
    const alreadyCheckedIn = await InLine.findOne({
        include: [{
            model: Family,
            attributes: ['lastName'],
            where: { familyId }
        }]
    });

    if (alreadyCheckedIn) {
        return { success: false, status: 400, message: 'User already checked in' };
    }

    const inHistorical = await Historical.findOne({
        include: [{
            model: Family,
            attributes: ['lastName'],
            where: { familyId }
        }]
    });

    if (inHistorical) {
        return { success: false, status: 400, message: 'User already checked out' };
    }

    const familyMembers = await Family.findAll({ where: { familyId } });

    if (familyMembers.length === 0) {
        return { success: false, status: 400, message: 'Unknown family ID' };
    }

    const lastName = familyMembers[0].dataValues.lastName;

    await Promise.all(familyMembers.map(async (member) => {
        await InLine.create({ familyId: member.dataValues.id });
    }));

    const formattedData = await formatMessage();

    return { success: true, status: 200, message: `${lastName} checked in`, data: formattedData };
};

const checkOut = async (childIds) => {
    const familyMembers = await Family.findAll({ where: { id: childIds } });

    if (familyMembers.length === 0) {
        return { success: false, status: 400, message: 'No family members found for the provided family ID' };
    }

    const notCheckedIn = await InLine.findAll({
        include: [{
            model: Family,
            attributes: ['lastName'],
            where: { id: childIds }
        }]
    });

    if (notCheckedIn.length === 0) {
        return { success: false, status: 400, message: 'User not checked in' };
    }

    const lastNames = [...new Set(familyMembers.map(member => member.dataValues.lastName))];
    const lastNamesString = lastNames.join(", ");

    await Promise.all(familyMembers.map(member => 
        InLine.destroy({ where: { familyId: member.id } })
    ));

    await Promise.all(familyMembers.map(async (member) => {
        await Historical.create({ familyId: member.dataValues.id });
    }));

    const formattedData = await formatMessage();

    return { success: true, status: 200, message: `${lastNamesString} families checked out successfully`, data: formattedData };
};

const formatMessage = async () => {
    const allInLineRecords = await InLine.findAll({
        include: [{ model: Family, attributes: ['id', 'firstName', 'lastName', 'familyId'] }],
        order: [['createdAt', 'ASC']]
    });

    return allInLineRecords.map(record => {
        const inlineData = record.dataValues;
        const familyData = inlineData.family ? inlineData.family.dataValues : {};

        return {
            uniqueId: familyData.id,
            firstName: familyData.firstName,
            lastName: familyData.lastName,
            familyId: familyData.familyId,
            createdAt: inlineData.createdAt
        };
    });
};

module.exports = { checkIn, checkOut, formatMessage };