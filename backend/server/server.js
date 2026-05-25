import mongoose from "mongoose";

export const ConnectionDB = async () => {
    try {
        mongoose.set('strictQuery', true);

        await mongoose.connect(process.env.MONGODB_SERVER_IP);

        console.log("MongoDB connected");
    } catch (error) {
        console.log("Database connection failed", error);
        process.exit(1);
    }
};
