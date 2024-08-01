const fs = require('fs');

const writeDataToCSVFile = (data, filePath = 'historicalData.csv') => {
    return new Promise((resolve, reject) => {
        let csvContent = 'FirstName,LastName,Picked up at\n';
        data.forEach(row => {
            const firstName = row.dataValues.family.dataValues.firstName;
            const lastName = row.dataValues.family.dataValues.lastName;
            const createdAt = row.dataValues.createdAt;

            const csvRow = `"${firstName}","${lastName}","${createdAt}"\n`;
            csvContent += csvRow;
        });

        fs.writeFile(filePath, csvContent, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

module.exports = { writeDataToCSVFile };