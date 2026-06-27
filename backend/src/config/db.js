const mongoose = require("mongoose");

const connectDatabase = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  await mongoose.connect(process.env.DATABASE_URL);
  return mongoose.connection;
};

module.exports = connectDatabase;
