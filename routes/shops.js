const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

const {
  getShop,
  getShops,
  createShop,
  updateShop,
  deleteShop,
} = require("../controllers/Shops");

const appointmentRouter = require("./appointments");
router.use("/:shopId/appointments", appointmentRouter);

router.route("/").get(getShops).post(protect, authorize("admin"), createShop);
router
  .route("/:id")
  .get(getShop)
  .put(protect, authorize("admin"), updateShop)
  .delete(protect, authorize("admin"), deleteShop);

module.exports = router;
