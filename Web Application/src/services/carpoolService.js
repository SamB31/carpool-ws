const Family = require('../models/Family');
const Historical = require('../models/Historical');
const redisClient = require('../config/redis');
const { getNextStation } = require('./historicalService')


const INLINE_KEY = 'carpool:inline';

const isCheckedIn = async (familyId) => {

  const members = await redisClient.hgetall(INLINE_KEY);
  
  for (let key in members) {
    try {
      const member = JSON.parse(members[key]);
      if (member.familyId == familyId) {  // Using == for type coercion
        return true;
      }
    } catch (error) {
      console.error('Error parsing member data:', error);
    }
  }
  return false;
};


// Check-in function using Redis
const checkIn = async (familyId) => {
  try {
    // Check if the user is already checked in using Redis
    const alreadyCheckedIn = await isCheckedIn(familyId);

    if (alreadyCheckedIn) {
      return { success: false, status: 400, message: 'User already checked in' };
    }

    // Check if the user is already checked out (historical table check remains unchanged)
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

    // Fetch family members from SQL
    const familyMembers = await Family.findAll({ where: { familyId } });

    if (familyMembers.length === 0) {
      return { success: false, status: 400, message: 'Unknown family ID' };
    }

    // Get the last name of the first family member (assuming all family members have the same last name)
    const lastName = familyMembers[0].dataValues.lastName;

    // Assign a station to the family
    const station = await getNextStation();

    // Store family members in Redis instead of SQL
    await Promise.all(familyMembers.map(async (member) => {
      const memberData = {
        id: member.dataValues.id,
        firstName: member.dataValues.firstName,
        lastName: member.dataValues.lastName,
        familyId: member.dataValues.familyId,
        station: station,
        createdAt: new Date().toISOString()
      };

      // Store each family member in Redis with hash (using ID as the key)
      await redisClient.hset(INLINE_KEY, member.dataValues.id, JSON.stringify(memberData));
    }));

    // Fetch the formatted data from Redis
    const formattedData = await formatMessage();

    return { success: true, status: 200, message: `${lastName} checked in to station ${station}`, data: formattedData };

  } catch (error) {
    console.error('Error during check-in:', error);
    return { success: false, status: 500, message: 'Internal server error' };
  }
};

  const checkOut = async (childIds) => {
    try {
      // Fetch family members from the database (as you still need their info)
      const familyMembers = await Family.findAll({ where: { id: childIds } });
  
      if (familyMembers.length === 0) {
        return {
          success: false,
          status: 400,
          message: 'No family members found for the provided family ID',
        };
      }
  
      // Check if members are checked in using Redis
      const checkedInMembers = [];
      const notCheckedInMembers = [];
  
      await Promise.all(
        familyMembers.map(async (member) => {
          const memberData = await redisClient.hget(INLINE_KEY, member.id);
          if (memberData) {
            checkedInMembers.push(JSON.parse(memberData));
          } else {
            notCheckedInMembers.push(member);
          }
        })
      );
  
      // Handle case where no members are checked in
      if (checkedInMembers.length === 0) {
        return {
          success: false,
          status: 400,
          message: 'User not checked in',
        };
      }
  
      // Get last names of checked-in members
      const lastNames = [...new Set(checkedInMembers.map((member) => member.lastName))];
      const lastNamesString = lastNames.join(', ');
  
      // Remove members from Redis
      await Promise.all(
        checkedInMembers.map(async (member) => {
          await redisClient.hdel(INLINE_KEY, member.id);
        })
      );
  
      // Add checked-out members to the Historical table
      await Promise.all(
        checkedInMembers.map(async (member) => {
          await Historical.create({ familyId: member.id });
        })
      );
  
      // Format message using Redis data
      const formattedData = await formatMessage();
  
      return {
        success: true,
        status: 200,
        message: `${lastNamesString} families checked out successfully`,
        data: formattedData,
      };
    } catch (error) {
      console.error('Error during check-out:', error);
      return {
        success: false,
        status: 500,
        message: 'Internal server error',
      };
    }
  };


  const studentDelete = async (childIds) => {
    try {
      // Fetch family members from the database (as you still need their info)
      const familyMembers = await Family.findAll({ where: { id: childIds } });
  
      if (familyMembers.length === 0) {
        return {
          success: false,
          status: 400,
          message: 'No family members found for the provided family ID',
        };
      }
  
      // Check if members are checked in using Redis
      const checkedInMembers = [];
      const notCheckedInMembers = [];
  
      await Promise.all(
        familyMembers.map(async (member) => {
          const memberData = await redisClient.hget(INLINE_KEY, member.id);
          if (memberData) {
            checkedInMembers.push(JSON.parse(memberData));
          } else {
            notCheckedInMembers.push(member);
          }
        })
      );
  
      // Handle case where no members are checked in
      if (checkedInMembers.length === 0) {
        return {
          success: false,
          status: 400,
          message: 'User not checked in',
        };
      }
  
      // Get last names of checked-in members
      const lastNames = [...new Set(checkedInMembers.map((member) => member.lastName))];
      const lastNamesString = lastNames.join(', ');
  
      // Remove members from Redis
      await Promise.all(
        checkedInMembers.map(async (member) => {
          await redisClient.hdel(INLINE_KEY, member.id);
        })
      );
  
      // Format message using Redis data
      const formattedData = await formatMessage();
  
      return {
        success: true,
        status: 200,
        message: `${lastNamesString} families deleted successfully`,
        data: formattedData,
      };
    } catch (error) {
      console.error('Error during check-out:', error);
      return {
        success: false,
        status: 500,
        message: 'Internal server error',
      };
    }
  };

const searchByLastName = async (lastName) => {
    try {
      const families = await Family.findAll({
        where: { lastName },
        attributes: ['familyId', 'lastName', 'firstName'],
        group: ['familyId'],
      });

      return {
        success: true,
        families: families.map(f => f.get({ plain: true })),
      };
    } catch (error) {
      console.error('Error in searchByLastName service:', error);
      return { success: false, message: 'Error searching for families' };
    }
}

const formatMessage = async () => {
    try {
      // Fetch all inline records from Redis
      const allInlineRecords = await redisClient.hgetall(INLINE_KEY);
  
      // Map over the Redis records and parse them into objects
      const formattedData = Object.values(allInlineRecords).map((record) => {
        const inlineData = JSON.parse(record); // Parse JSON string back to object
  
        return {
          uniqueId: inlineData.id, // Assuming inlineData includes id directly
          firstName: inlineData.firstName,
          lastName: inlineData.lastName,
          familyId: inlineData.familyId,
          station: inlineData.station,
          createdAt: inlineData.createdAt,
        };
      });
  
      return formattedData; // Return the formatted data
    } catch (error) {
      console.error('Error formatting message:', error);
      throw error;
    }
  };

module.exports = { checkIn, checkOut, studentDelete, formatMessage, searchByLastName };