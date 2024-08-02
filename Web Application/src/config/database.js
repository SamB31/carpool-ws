const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('carpool', 'samb31', 'Asb2107!', {
    host: 'localhost',
    dialect: 'postgres',
    port: 5432,
    logging: false,
    pool: {
        max: 100,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = { sequelize };