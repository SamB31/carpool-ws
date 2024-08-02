const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('carpool', 'samb31', 'Asb2107!', {
    host: 'localhost',
    dialect: 'postgres',
    port: 5432,
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Function to test the database connection
async function testConnection() {
    try {
        await sequelize.authenticate(); // Authenticate the connection
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        // Handle or rethrow error as needed
    }
}

// Call testConnection at startup to ensure connectivity
testConnection();

module.exports = { sequelize };