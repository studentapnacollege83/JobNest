const Job = require("../models/Job");
const Application = require("../models/Application");
const User = require("../models/User");
exports.getDashboard = (req, res) => {
  if (req.session.user.role === "employer") {
    return res.redirect("/employer/dashboard");
  }

  return res.redirect("/job-seeker/dashboard");
};



exports.getEmployerDashboard = async (req, res) => {
  try {
    const employerId = req.session.user.id;

    // Hide soft-deleted jobs from dashboard cards.
    const jobs = await Job.find({
      postedBy: employerId,
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    const visibleJobIds = jobs.map((job) => job._id);

    const [
      totalApplications,
      activeJobs,
      closedJobs,
    ] = await Promise.all([
      // Preserve applications for jobs still visible on dashboard.
      Application.countDocuments({
        job: { $in: visibleJobIds },
      }),

      Job.countDocuments({
        postedBy: employerId,
        status: "Active",
        isDeleted: { $ne: true },
      }),

      Job.countDocuments({
        postedBy: employerId,
        status: "Closed",
        isDeleted: { $ne: true },
      }),
    ]);

    return res.render("dashboard/employer", {
      user: req.session.user,
      jobs,
      totalJobs: jobs.length,
      activeJobs,
      closedJobs,
      totalApplications,
    });
  } catch (error) {
    console.error("Employer dashboard error:", error);
    return res.status(500).send("Unable to load employer dashboard.");
  }
};

exports.getJobSeekerDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id)
      .select("fullName email role resume");

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const applicantId = req.session.user.id;

    const [
      totalApplications,
      shortlistedApplications,
      hiredApplications,
      rejectedApplications,
    ] = await Promise.all([
      Application.countDocuments({
        applicant: applicantId,
      }),
      Application.countDocuments({
        applicant: applicantId,
        status: "Shortlisted",
      }),
      Application.countDocuments({
        applicant: applicantId,
        status: "Hired",
      }),
      Application.countDocuments({
        applicant: applicantId,
        status: "Rejected",
      }),
    ]);

    return res.render("dashboard/job-seeker", {
      user,
      resumeUploaded: req.query.resume === "uploaded",
      totalApplications,
      shortlistedApplications,
      hiredApplications,
      rejectedApplications,
    });
  } catch (error) {
    console.error("Job seeker dashboard error:", error);
    return res.status(500).send("Unable to load dashboard.");
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      applicant: req.session.user.id,
    })
      .populate("job")
      .sort({ createdAt: -1 });

    res.render("dashboard/my-applications", {
      user: req.session.user,
      applications,
    });
  } catch (error) {
    console.error("My applications error:", error);
    res.status(500).send("Unable to load your applications.");
  }
};

exports.getEmployerApplicants = async (req, res) => {
  try {
    const jobs = await Job.find({
      postedBy: req.session.user.id,
    }).select("_id");

    const jobIds = jobs.map((job) => job._id);

    const applications = await Application.find({
      job: { $in: jobIds },
    })
      .populate("applicant", "fullName email resume")
      .populate("job", "title companyName")
      .sort({ createdAt: -1 });

    res.render("dashboard/employer-applicants", {
      user: req.session.user,
      applications,
    });
  } catch (error) {
    console.error("Employer applicants error:", error);
    res.status(500).send("Unable to load applicants.");
  }
};
exports.getHiringNotifications = async (req, res) => {
  try {
    const applicantId = req.session.user.id;

    const applications = await Application.find({
      applicant: applicantId,
      status: "Hired",
    })
      .populate("job", "title companyName")
      .sort({ "hiringDetails.hiredAt": -1 });

    // Mark this user's hiring notifications as read.
    await Application.updateMany(
  {
    applicant: applicantId,
    status: "Hired",
    "hiringDetails.notificationRead": { $ne: true },
  },
  {
    $set: { "hiringDetails.notificationRead": true },
  }
);

    return res.render("dashboard/hiring-notifications", {
      applications,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Hiring notifications error:", error);
    return res.status(500).send("Unable to load hiring notifications.");
  }
};

exports.getUnreadHiringNotificationCount = async (req, res) => {
  try {
    return await Application.countDocuments({
      applicant: req.session.user.id,
      status: "Hired",
      "hiringDetails.notificationRead": false,
    });
  } catch (error) {
    console.error("Unread notification count error:", error);
    return 0;
  }
};