'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('documents', 'share_token', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    await queryInterface.addIndex('documents', ['share_token']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('documents', ['share_token']);
    await queryInterface.removeColumn('documents', 'share_token');
  }
};

