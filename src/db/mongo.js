const mongoose = require("mongoose");

const connectMongo = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
};

module.exports = connectMongo;