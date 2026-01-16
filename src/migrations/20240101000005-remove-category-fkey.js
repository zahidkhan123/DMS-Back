'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove foreign key constraint on category if it exists
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE documents 
        DROP CONSTRAINT IF EXISTS documents_category_fkey;
      `);
    } catch (error) {
      // Constraint might not exist, which is fine
      console.log('Category foreign key constraint does not exist or already removed');
    }
  },

  async down(queryInterface, Sequelize) {
    // This migration doesn't need a down migration
    // as we're removing a constraint that shouldn't exist
  }
};

