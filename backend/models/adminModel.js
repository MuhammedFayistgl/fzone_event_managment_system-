import mongoose from "mongoose";


const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["admin", "scanner", "finance"],
        default: "admin",
    }
})

export default mongoose.model('admin', adminSchema);
