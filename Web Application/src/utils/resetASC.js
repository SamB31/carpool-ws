const Family = require('../models/Family');


// Helper function to reset all rows in the family database to inAfterSchoolCare = false
const resetAfterSchoolCareStatus = async (req, res) => {
  try {
    const [updatedCount] = await Family.update(
      { inAfterSchoolCare: false }, 
      { where: {} } 
    );

    console.log(`Successfully reset inAfterSchoolCare status for ${updatedCount} family members.`);
    res.redirect('/admin/resources/families');
  } catch (error) {
    console.error('Error resetting inAfterSchoolCare status:', error);
    res.status(500).send('Failed to reset inAfterSchoolCare status.');
  }
};


module.exports = { resetAfterSchoolCareStatus };
