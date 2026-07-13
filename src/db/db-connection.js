import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log({DB_URI:process.env.DB_URI});
    
    await mongoose.connect(process.env.DB_URI);

    console.log("Db connected successfully");
  } catch (error) {
    console.log("Error connecting to DB", error);
  }
};

export default connectDB;
