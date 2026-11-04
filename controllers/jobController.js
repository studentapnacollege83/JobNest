const fs = require("fs/promises");
const Job = require("../models/job");
const path = require("path");
const Application = require("../models/Application");
const User = require("../models/user");
const { saveResume, uploadDirectory } = require("../middleware/resumeUpload");

exports.getEditJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(404).send("Job not found.");
    }

    const job = await Job.findOne({
      _id: id,
      postedBy: req.session.user.id,
    });

    if (!job) {
      return res.status(404).send("Job not found.");
    }

    return res.render("jobs/edit-job", { job });
  } catch (error) {
    console.error("Get edit job error:", error);
    return res.status(500).send("Unable to load the edit job form.");
  }
};

exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(404).send("Job not found.");
    }

    const {
      title,
      companyName,
      location,
      jobType,
      workMode,
      salary,
      experienceLevel,
      description,
      requirements,
      skills,
    } = req.body;

    const cleanTitle = title?.trim();
    const cleanCompanyName = companyName?.trim();
    const cleanLocation = location?.trim();
    const cleanDescription = description?.trim();

    if (
      !cleanTitle ||
      !cleanCompanyName ||
      !cleanLocation ||
      !cleanDescription ||
      !["Full-time", "Part-time", "Internship", "Contract"].includes(jobType) ||
      !["On-site", "Remote", "Hybrid"].includes(workMode) ||
      !["Fresher", "Entry-level", "Experienced"].includes(experienceLevel)
    ) {
      return res.status(400).send("Please provide valid job details.");
    }

    const job = await Job.findOne({
      _id: id,
      postedBy: req.session.user.id,
    });

    if (!job) {
      return res.status(404).send("Job not found.");
    }

    job.title = cleanTitle;
    job.companyName = cleanCompanyName;
    job.location = cleanLocation;
    job.jobType = jobType;
    job.workMode = workMode;
    job.salary = salary?.trim() || "Not disclosed";
    job.experienceLevel = experienceLevel;
    job.description = cleanDescription;
    job.requirements = requirements?.trim() || "";
    job.skills = skills
      ? skills.split(",").map((skill) => skill.trim()).filter(Boolean)
      : [];

    // Preserve job.status and job.postedBy.
    await job.save();

    return res.redirect("/employer/dashboard");
  } catch (error) {
    console.error("Update job error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).send("Invalid job details. Please check your inputs.");
    }

    return res.status(500).send("Unable to update job. Please try again.");
  }
};

exports.getPostJob = (req, res) => {
  res.render("jobs/post-job");
};

exports.postJob = async (req, res) => {
  try {
    const {
      title,
      companyName,
      location,
      jobType,
      workMode,
      salary,
      experienceLevel,
      description,
      requirements,
      skills,
    } = req.body;

    const job = new Job({
      title,
      companyName,
      location,
      jobType,
      workMode,
      salary: salary?.trim() || "Not disclosed",
      experienceLevel,
      description,
      requirements,
      skills: skills
        ? skills.split(",").map((skill) => skill.trim()).filter(Boolean)
        : [],
      postedBy: req.session.user.id,
    });

    await job.save();

    res.redirect("/employer/dashboard");
  } catch (error) {
    console.error("Job posting error:", error);
    res.status(500).send("Unable to publish job. Please try again.");
  }
};
exports.closeJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(404).send("Job not found.");
    }

    const job = await Job.findOne({
      _id: id,
      postedBy: req.session.user.id,
    });

    if (!job) {
      return res.status(404).send("Job not found.");
    }

    if (job.status === "Closed") {
      return res.redirect("/employer/dashboard");
    }

    job.status = "Closed";
    await job.save();

    return res.redirect("/employer/dashboard");
  } catch (error) {
    console.error("Close job error:", error);
    return res.status(500).send("Unable to close job.");
  }
};
// Employer: soft-delete their own job
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(404).send("Job not found.");
    }

    const job = await Job.findOne({
      _id: id,
      postedBy: req.session.user.id,
    });

    if (!job) {
      return res.status(404).send("Job not found.");
    }

    if (job.isDeleted === true) {
      return res.redirect("/employer/dashboard");
    }

    job.isDeleted = true;
    job.status = "Closed";

    await job.save();

    return res.redirect("/employer/dashboard");
  } catch (error) {
    console.error("Delete job error:", error);
    return res.status(500).send("Unable to delete job.");
  }
};
exports.getJobDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(404).send("Job not found.");
    }

  const job = await Job.findOne({
  _id: id,
  status: "Active",
  isDeleted: { $ne: true },
}).populate("postedBy", "fullName");

    if (!job) {
      return res.status(404).send("Job not found or no longer available.");
    }

    // Pass session data explicitly to the view. This keeps the Apply button
    // independent of implicit template locals.
    res.render("jobs/details", {
      job,
      currentUser: req.session.user || null,
      isJobSeeker:
        String(req.session.user?.role || "").trim().toLowerCase() ===
        "jobseeker",
      applicationSuccess: req.query.applied === "success",
    });
  } catch (error) {
    console.error("Job details error:", error);
    res.status(500).send("Unable to load job details.");
  }
};


exports.applyToJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate job ID
    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(404).send("Job not found.");
    }

    // Find an active, non-deleted job
    const job = await Job.findOne({
      _id: id,
      status: "Active",
      isDeleted: { $ne: true },
    });

    if (!job) {
      return res.status(404).send("Job not found or no longer available.");
    }

    // Create application
    await Application.create({
      job: job._id,
      applicant: req.session.user.id,
    });

    return res.redirect(`/jobs/${job._id}?applied=success`);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).send("You have already applied for this job.");
    }

    console.error("Job application error:", error);
    return res.status(500).send("Unable to submit your application.");
  }
};


exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    // Only allow these status values
    const allowedStatuses = ["Shortlisted", "Rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).send("Invalid application status.");
    }

    // Find only jobs posted by the logged-in employer
    const employerJobs = await Job.find({
      postedBy: req.session.user.id,
    }).select("_id");

    const jobIds = employerJobs.map((job) => job._id);

    // Update only an application belonging to this employer's job
    const application = await Application.findOne({
      _id: applicationId,
      job: { $in: jobIds },
    });

    if (!application) {
      return res.status(404).send("Application not found.");
    }

    application.status = status;
    await application.save();

    res.redirect("/employer/applicants");
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).send("Unable to update application status.");
  }
};

exports.uploadResume = async (req, res) => {
  let savedFile = null;

  try {
    if (!req.file) {
      return res.status(400).send("Please select a PDF resume.");
    }

    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Validate PDF signature and save privately.
    savedFile = await saveResume(req.file.buffer);

    const oldFilename = user.resume?.filename;

    user.resume = {
      filename: savedFile.filename,
      originalName: path.basename(req.file.originalname).slice(0, 200),
      contentType: "application/pdf",
      uploadedAt: new Date(),
    };

    await user.save();

    // Delete the previous resume only after the new one is saved.
    if (oldFilename && oldFilename !== savedFile.filename) {
      const safeOldName = path.basename(oldFilename);

      if (safeOldName === oldFilename) {
        await fs.unlink(path.join(uploadDirectory, safeOldName)).catch(() => {});
      }
    }

    return res.redirect("/job-seeker/dashboard?resume=uploaded");
  } catch (error) {
    if (savedFile?.filePath) {
      await fs.unlink(savedFile.filePath).catch(() => {});
    }

    console.error("Resume upload error:", error);

    if (error.message === "Invalid PDF file.") {
      return res.status(400).send("The selected file is not a valid PDF.");
    }

    return res.status(500).send("Unable to upload resume. Please try again.");
  }
};

exports.viewApplicantResume = async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!/^[a-fA-F0-9]{24}$/.test(applicationId)) {
      return res.status(404).send("Application not found.");
    }

    // Only find applications belonging to jobs posted by this employer.
    const employerJobs = await Job.find({
      postedBy: req.session.user.id,
    }).select("_id");

    const jobIds = employerJobs.map((job) => job._id);

    const application = await Application.findOne({
      _id: applicationId,
      job: { $in: jobIds },
    }).populate("applicant", "resume fullName");

    if (!application) {
      return res.status(404).send("Application not found.");
    }

    const filename = application.applicant?.resume?.filename;

    if (!filename || path.basename(filename) !== filename) {
      return res.status(404).send("No resume is available for this applicant.");
    }

    const filePath = path.join(uploadDirectory, filename);

    await fs.access(filePath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="applicant-resume.pdf"'
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    return res.sendFile(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).send("Resume file not found.");
    }

    console.error("View applicant resume error:", error);
    return res.status(500).send("Unable to open this resume.");
  }
};


exports.getAllJobs = async (req, res) => {
  try {
   const { category, type, location } = req.query;
   const search = req.query.search?.trim() || "";

    const filter = {
  status: "Active",
  isDeleted: { $ne: true },
};
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const conditions = [];

    // Filter by job type
    if (type) {
      const allowedTypes = [
        "Full-time",
        "Part-time",
        "Internship",
        "Contract",
      ];

      if (!allowedTypes.includes(type)) {
        return res.status(400).send("Invalid job type.");
      }

      filter.jobType = type;
    }
   // Keyword search: title, company, description, and skills
if (search) {
  const escapedSearch = escapeRegex(search);
  const searchRegex = new RegExp(escapedSearch, "i");

  conditions.push({
    $or: [
      { title: searchRegex },
      { companyName: searchRegex },
      { description: searchRegex },
      { skills: searchRegex },
    ],
  });
}
    // Filter by category
    const categoryKeywords = {
      development:
        "developer|development|software|programming|backend|frontend|full.?stack|web|node|javascript|python",
      design:
        "design|designer|ui.?ux|graphic|visual|creative|figma",
      marketing:
        "marketing|seo|social media|content|brand|digital marketing",
    };

    if (category) {
      const keywords = categoryKeywords[category];

      if (!keywords) {
        return res.status(400).send("Invalid job category.");
      }

      const regex = new RegExp(keywords, "i");

      conditions.push({
        $or: [
          { title: regex },
          { description: regex },
          { skills: regex },
        ],
      });
    }

    // Filter by location or work mode
    const locationQuery = location?.trim();

    if (locationQuery) {
      const escapedLocation = escapeRegex(locationQuery);


      const locationRegex = new RegExp(escapedLocation, "i");

      conditions.push({
        $or: [
          { location: locationRegex },
          { workMode: locationRegex },
        ],
      });
    }

    // Category and location filters must both match
    if (conditions.length > 0) {
      filter.$and = conditions;} 
const page = Math.max(1, parseInt(req.query.page, 10) || 1);
const limit = 6;

const totalJobs = await Job.countDocuments(filter);
const totalPages = Math.ceil(totalJobs / limit);

// Agar requested page available nahi hai, last valid page par aao.
const currentPage = Math.min(page, Math.max(1, totalPages));
const currentSkip = (currentPage - 1) * limit;


const sort = req.query.sort === "oldest" ? "oldest" : "latest";

const sortOption =
  sort === "oldest"
    ? { createdAt: 1 }
    : { createdAt: -1 };

const jobs = await Job.find(filter)
  .populate("postedBy", "fullName")
  .sort(sortOption)
  .skip(currentSkip)
  .limit(limit);
;

res.render("jobs/list", {
  jobs,
  category: category || "",
  type: type || "",
  location: locationQuery || "",
  currentUser: req.session.user || null,
  currentPage,
  totalPages,
  totalJobs,
  sort,
  search,
});

  } catch (error) {
    console.error("Get all jobs error:", error);
    res.status(500).send("Unable to load jobs. Please try again.");
  }
};

exports.hireCandidate = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const {
      joiningDate,
      reportingTime,
      joiningLocation,
      salary,
      contactPerson,
      instructions,
    } = req.body;

    // Validate application ID
    if (!/^[a-fA-F0-9]{24}$/.test(applicationId)) {
      return res.status(400).send("Invalid application ID.");
    }

    // Required joining details
    if (!joiningDate || !reportingTime || !joiningLocation?.trim()) {
      return res.status(400).send(
        "Joining date, reporting time, and joining location are required."
      );
    }

    const parsedJoiningDate = new Date(joiningDate);

    if (Number.isNaN(parsedJoiningDate.getTime())) {
      return res.status(400).send("Invalid joining date.");
    }

    // Find only jobs owned by this employer
    const employerJobs = await Job.find({
  postedBy: req.session.user.id,
  isDeleted: { $ne: true },
}).select("_id");
    const jobIds = employerJobs.map((job) => job._id);

    const application = await Application.findOne({
      _id: applicationId,
      job: { $in: jobIds },
    });

    if (!application) {
      return res.status(404).send("Application not found.");
    }

    // Do not hire rejected or already hired applicants again
    if (!["Applied", "Shortlisted"].includes(application.status)) {
      return res.status(400).send(
        "Only Applied or Shortlisted candidates can be hired."
      );
    }

    application.status = "Hired";

application.hiringDetails = {
  joiningDate: parsedJoiningDate,
  reportingTime: reportingTime.trim(),
  joiningLocation: joiningLocation.trim(),
  salary: salary?.trim() || "",
  contactPerson: contactPerson?.trim() || "",
  instructions: instructions?.trim() || "",
  hiredAt: new Date(),
  notificationRead: false,
};

    await application.save();

    return res.redirect("/employer/applicants?hire=success");
  } catch (error) {
    console.error("Hire candidate error:", error);
    return res.status(500).send("Unable to hire candidate right now.");
  }
};
