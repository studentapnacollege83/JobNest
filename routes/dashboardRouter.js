const express = require("express");
const dashboardRouter = express.Router();

const dashboardController = require("../controllers/dashBoardController");

const {
  isAuthenticated,
  isEmployer,
  isJobSeeker
} = require("../middleware/authMiddleware");

dashboardRouter.get(
  "/dashboard",
  isAuthenticated,
  dashboardController.getDashboard
);

dashboardRouter.get(
  "/job-seeker/dashboard",
  isJobSeeker,
  dashboardController.getJobSeekerDashboard
);

dashboardRouter.get(
  "/employer/dashboard",
  isEmployer,
  dashboardController.getEmployerDashboard
);
dashboardRouter.get(
  "/job-seeker/applications",
  isJobSeeker,
  dashboardController.getMyApplications
);
dashboardRouter.get(
  "/employer/applicants",
  isEmployer,
  dashboardController.getEmployerApplicants
);

dashboardRouter.get(
  "/job-seeker/notifications",
  isJobSeeker,
  dashboardController.getHiringNotifications
);
module.exports = dashboardRouter;