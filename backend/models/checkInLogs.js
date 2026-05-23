import mongoose from "mongoose";

const checkInLogSchema =
    new mongoose.Schema({

        registrationId: {

            type:
                mongoose.Schema.Types.ObjectId,

            ref: "registrations",

        },

        scannedAt: {

            type: Date,

            default: Date.now,

        },

        status: String,

        gateName: String,

        device: String,

    });

export default mongoose.model(
    "checkinlogs",
    checkInLogSchema
);