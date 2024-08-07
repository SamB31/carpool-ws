





const INLINE_KEY = "carpool:inline";

const isCheckedIn = async (familyId) => {
  const members = await redisClient.hgetall(INLINE_KEY);

  for (let key in members) {
    try {
      const member = JSON.parse(members[key]);
      if (member.familyId == familyId) {
        // Using == for type coercion
        return true;
      }
    } catch (error) {
      console.error("Error parsing member data:", error);
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
      return {
        success: false,
        status: 400,
        message: "User already checked in",
      };
    }

    // Check if the user is already checked out (historical table check remains unchanged)
    const inHistorical = await Historical.findOne({
      include: [
        {
          model: Family,
          attributes: ["lastName"],
          where: { familyId },
        },
      ],
    });

    if (inHistorical) {
      return {
        success: false,
        status: 400,
        message: "User already checked out",
      };
    }

    // Fetch family members from SQL
    const familyMembers = await Family.findAll({ where: { familyId } });

    if (familyMembers.length === 0) {
      return { success: false, status: 400, message: "Unknown family ID" };
    }

    // Get the last name of the first family member (assuming all family members have the same last name)
    const lastName = familyMembers[0].dataValues.lastName;

    // Assign a station to the family
    const station = await getNextStation();

    // Store family members in Redis instead of SQL
    await Promise.all(
      familyMembers.map(async (member) => {
        const memberData = {
          id: member.dataValues.id,
          firstName: member.dataValues.firstName,
          lastName: member.dataValues.lastName,
          familyId: member.dataValues.familyId,
          station: station,
          createdAt: new Date().toISOString(),
        };

        // Store each family member in Redis with hash (using ID as the key)
        await redisClient.hset(
          INLINE_KEY,
          member.dataValues.id,
          JSON.stringify(memberData)
        );
      })
    );

    // Fetch the formatted data from Redis
    const formattedData = await formatMessage();

    return {
      success: true,
      status: 200,
      message: `${lastName} checked in to station ${station}`,
      data: formattedData,
    };
  } catch (error) {
    console.error("Error during check-in:", error);
    return { success: false, status: 500, message: "Internal server error" };
  }
};
