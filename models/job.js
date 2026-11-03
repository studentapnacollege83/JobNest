
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    jobType: {
      type: String,
      required: true,
      enum: ["Full-time", "Part-time", "Internship", "Contract"],
    },

    workMode: {
      type: String,
      required: true,
      enum: ["On-site", "Remote", "Hybrid"],
    },

    salary: {
      type: String,
      trim: true,
      default: "Not disclosed",
    },

    experienceLevel: {
      type: String,
      required: true,
      enum: ["Fresher", "Entry-level", "Experienced"],
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    requirements: {
      type: String,
      trim: true,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
    },
    isDeleted: {
    type: Boolean,
    default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Job", jobSchema);
