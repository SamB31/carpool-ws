const Family = require('./Family');
const InLine = require('./InLine');
const Historical = require('./Historical');

// Relationships
InLine.belongsTo(Family, {foreignKey: 'familyId'});
Historical.belongsTo(Family, {foreignKey: 'familyId'});

// You can also define reverse associations if needed
Family.hasMany(InLine, {foreignKey: 'familyId'});
Family.hasMany(Historical, {foreignKey: 'familyId'});

module.exports = {
    Family,
    InLine,
    Historical
};