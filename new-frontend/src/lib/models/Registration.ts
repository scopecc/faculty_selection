import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["open", "closed"],
      required: true,
      default: "closed",
    },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const Registration =
  mongoose.models.Registration ||
  mongoose.model("Registration", RegistrationSchema);
export default Registration;
