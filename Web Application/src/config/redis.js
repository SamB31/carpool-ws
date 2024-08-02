const Redis = require('ioredis');

const redisClient = new Redis({
  host: 'localhost', // Redis server host
  port: 6379,        // Redis server port
  // password: 'your-redis-password', // Uncomment if you have a password
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (error) => {
  console.error('Redis error:', error);
});

module.exports = redisClient;