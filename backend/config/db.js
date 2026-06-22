import mongoose from "mongoose";
import colors from "colors";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(
      `Connected To Mongodb Database ${conn.connection.host}`.bgMagenta.white
    );
    console.log(`Using Database: ${conn.connection.name}`.bgGreen.white); // This should print 'financetrackerdemoDB'
  } catch (error) {
    console.log(`Error in Mongodb ${error}`.bgRed.white);
    process.exit(1);
  }
};

export default connectDB;
