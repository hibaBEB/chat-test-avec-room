const Sequelize = require("sequelize");

module.exports = (sequilize, DataTypes) => {
    return sequilize.define("chat",{
        name : Sequelize.STRING,
        message : Sequelize.STRING,
        room : Sequelize.STRING,
    });
};