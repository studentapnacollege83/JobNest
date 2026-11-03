

const express = require("express");
const jobRouter = express.Router();
const { resumeUpload } = require("../middleware/resumeUpload");

const jobController = require("../controllers/jobController");
const {
  isAuthenticated,
  isEmployer,
  isJobSeeker,
} = require("../middleware/authMiddleware");

// Employer: show Post a Job form
jobRouter.get(
  "/employer/jobs/new",
  isAuthenticated,
  isEmployer,
  jobController.getPostJob
);

// Employer: save a new job
jobRouter.post(
  "/employer/jobs",
  isAuthenticated,
  isEmployer,
  jobController.postJob
);

 // Employer: edit an existing job
jobRouter.get(
  "/employer/jobs/:id/edit",
  isAuthenticated,
  isEmployer,
  jobController.getEditJob
);

// Employer: update an existing job
jobRouter.post(
  "/employer/jobs/:id/edit",
  isAuthenticated,
  isEmployer,
  jobController.updateJob
);

// Employer: close one of their own jobs
jobRouter.post(
  "/employer/jobs/:id/close",
  isAuthenticated,
  isEmployer,
  jobController.closeJob
);
// Employer: delete their own job safely
jobRouter.post(
  "/employer/jobs/:id/delete",
  isAuthenticated,
  isEmployer,
  jobController.deleteJob
);
// Public: view and filter all active jobs
jobRouter.get(
  "/jobs",
  jobController.getAllJobs
);
// Public: view job details
jobRouter.get(
  "/jobs/:id",
  jobController.getJobDetails
);
jobRouter.post(
  "/jobs/:id/apply",
  isAuthenticated,
  isJobSeeker,
  jobController.applyToJob
);
jobRouter.post(
  "/employer/applications/:applicationId/status",
  isAuthenticated,
  isEmployer,
  jobController.updateApplicationStatus
);
// Handle Multer errors without passing invalid uploads to the controller.
const handleResumeUpload = (req, res, next) => {
  resumeUpload.single("resume")(req, res, (error) => {
    if (error) {
      return res.status(400).send(
        error.code === "LIMIT_FILE_SIZE"
          ? "Resume must be 2 MB or smaller."
          : error.message || "Resume upload failed."
      );
    }

    next();
  });
};

// Job seeker: upload or replace resume
jobRouter.post(
  "/job-seeker/resume",
  isAuthenticated,
  isJobSeeker,
  handleResumeUpload,
  jobController.uploadResume
);

// Employer: view resume for an applicant to their own job
jobRouter.get(
  "/employer/applications/:applicationId/resume",
  isAuthenticated,
  isEmployer,
  jobController.viewApplicantResume
);

jobRouter.post(
  "/employer/applications/:applicationId/hire",
  isAuthenticated,
  isEmployer,
  jobController.hireCandidate
);

module.exports = jobRouter;
