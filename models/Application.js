
const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Applied", "Shortlisted", "Rejected", "Hired"],
      default: "Applied",
    },
    hiringDetails: {
      joiningDate: {
        type: Date,
      },
      notificationRead: {
      type: Boolean,
      default: false,
      },
      reportingTime: {
        type: String,
        trim: true,
      },
      joiningLocation: {
        type: String,
        trim: true,
      },
      salary: {
        type: String,
        trim: true,
      },
      contactPerson: {
        type: String,
        trim: true,
      },
      instructions: {
        type: String,
        trim: true,
      },
      hiredAt: {
        type: Date,
      },
    },
  },
  { timestamps: true }
);
// Prevent the same user from applying to the same job twice.
applicationSchema.index(
  { job: 1, applicant: 1 },
  { unique: true }
);
module.exports = mongoose.model("Application", applicationSchema);
