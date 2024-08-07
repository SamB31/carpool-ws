const redisClient = require("../config/redis");
const INLINE_KEY = "carpool:inline";



// Helper function to get the next station number (unchanged)
const getNextStation = async () => {
  const lastStation = await redisClient.get('lastStation') || '0';
  const nextStation = (parseInt(lastStation) % 4) + 1;
  await redisClient.set('lastStation', nextStation.toString());
  return nextStation;
};

// Adjust station numbers after a user is deleted
const adjustStations = async () => {
try {
  // Fetch all inline records from Redis
  const allInlineRecords = await redisClient.hgetall(INLINE_KEY);

  // Parse and sort by createdAt
  const sortedRecords = Object.values(allInlineRecords)
    .map((record) => JSON.parse(record))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());


  // Update Redis with new station numbers
  await Promise.all(
    sortedRecords.map(async (record) => {
      await redisClient.hset(
        INLINE_KEY,
        record.id, // Use 'id' instead of 'uniqueId' to ensure uniqueness
        JSON.stringify(record)
      );
    })
  );


  await redisClient.set('lastStation', lastStation.toString());
} catch (error) {
  console.error("Error adjusting stations:", error);
}
};

module.exports = { getNextStation, adjustStations };
