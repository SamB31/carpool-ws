const fs = require('fs');
const csv = require('csv-parser');
const Family = require('../models/Family');
const { sequelize } = require('../config/database');


// Function to read and parse CSV file
const readCsvFile = (filePath) => {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                const trimmedData = {};
                for (const key in data) {
                    if (data.hasOwnProperty(key)) {
                        trimmedData[key] = data[key].trim();
                    }
                }
                results.push(trimmedData);
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

// Main function to insert data
const insertDataFromCsv = async (filePath) => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Sync the model with the database
        await Family.sync();

        // Read data from CSV file
        const families = await readCsvFile(filePath);

        // Insert data into the database
        for (const family of families) {
            await Family.create(family);
        }

        console.log('Data inserted successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } 
};

module.exports = { insertDataFromCsv };