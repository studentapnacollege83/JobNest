
const Job = require("../models/Job");

exports.getHome = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "Active" })
      .populate("postedBy", "fullName")
      .sort({ createdAt: -1 });

    res.render("index", { jobs });
  } catch (error) {
    console.error("Homepage jobs error:", error.message);
    res.status(500).send("Unable to load jobs. Please try again.");
  }
};
