import mongoose from "mongoose";

const investorsSchema = new mongoose.Schema(
    {
        No: {
            type: Number,
            required: [true, "No required"],
            unique:true
        },

        Code_No: {
            type: String,
            required: [true, "Code required"],
            trim: true,
            uppercase: true, // ✅ case normalize
        },

        Name: {
            type: String,
            required: [true, "Name required"],
            trim: true,
        },

        Phone_No: {
            type: Number, 
            required: [true, "Phone required"],
            trim: true,
        },

        Gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
            required: [true, "Gender required"],
            default: "Other",
        },

        role: {
            type: String,
            default: "user",
        },
    },
    { timestamps: true }
);

// ✅ UNIQUE INDEX (STRONG)
investorsSchema.index({ Code_No: 1 }, { unique: true });
investorsSchema.index({ Phone_No: 1 }, { unique: true });
investorsSchema.index({ Name: "text" }); // text search
investorsSchema.index({ Gender: 1 });

export default mongoose.model("investors", investorsSchema);