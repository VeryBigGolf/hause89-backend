const Appointment = require("../models/Appointment");
const Shop = require("../models/Shop");

//@desc     Get all appointments
//@route    GET /api/v1/appointments
//@access   Public
exports.getAppointments = async (req, res, next) => {
  let query;

  if (req.user.role !== "admin") {
    query = Appointment.find({ user: req.user.id }).populate({
      path: "shop",
      select: "name province tel",
    });
  } else {
    // Admin can filter by shopId
    if (req.params.shopId) {
      query = Appointment.find({ shop: req.params.shopId }).populate({
        path: "shop",
        select: "name province tel",
      });
    } else {
      query = Appointment.find().populate({
        path: "shop",
        select: "name province tel",
      });
    }
  }

  try {
    const appointments = await query;

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Cannot find Appointment",
    });
  }
};

//@desc     Get single appointment
//@route    GET /api/v1/appointments/:id
//@access   Public
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate({
      path: "shop",
      select: "name description tel",
    });
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: `No appointment with the id of ${req.params.id}`,
      });
    }
    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find Appointment" });
  }
};

//@desc     Add appointment
//@route    POST /api/v1/shops/:shopId/appointment
//@access   Private
exports.addAppointment = async (req, res, next) => {
  try {
    req.body.shop = req.params.shopId;
    req.body.user = req.user.id;

    const existedAppointments = await Appointment.find({ user: req.user.id });

    if (existedAppointments.length >= 3 && req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: `The user with id ${req.user.id} has already made 3 appointments`,
      });
    }

    const shop = await Shop.findById(req.params.shopId);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: `No shop with the id of ${req.params.shopId}`,
      });
    }

    // Assume same date but different time
    if (req.body.apptDate) {
      const reqDate = new Date(req.body.apptDate);
      const open = shop.openTime;
      const close = shop.closeTime;

      let isClosed = false;
      if (open < close) {
        isClosed = reqDate < open || reqDate > close;
      } else {
        isClosed = reqDate < open && reqDate > close;
      }

      if (isClosed) {
        return res.status(400).json({
          succes: false,
          message: "the apptDate is not in the massage shop working hours",
        });
      }
    }

    const appointment = await Appointment.create(req.body);

    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Cannot create Appointment" });
  }
};

//@desc     Update appointment
//@route    PUT /api/v1/appointments/:id
//@access   Private
exports.updateAppointment = async (req, res, next) => {
  try {
    let appointment = await Appointment.findById(req.params.id);

    if (
      appointment.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this appointment`,
      });
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: `No appointment with the id of ${req.params.id}`,
      });
    }

    // Assume same date but different time
    if (req.body.apptDate) {
      const reqDate = new Date(req.body.apptDate);
      const open = shop.openTime;
      const close = shop.closeTime;

      let isClosed = false;
      if (open < close) {
        isClosed = reqDate < open || reqDate > close;
      } else {
        isClosed = reqDate < open && reqDate > close;
      }

      if (isClosed) {
        return res.status(400).json({
          succes: false,
          message: "the apptDate is not in the massage shop working hours",
        });
      }
    }

    appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Cannot update Appointment",
    });
  }
};

//@desc     Delete appointment
//@route    DELETE /api/v1/appointments/:id
//@access   Private
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (
      appointment.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this appointment`,
      });
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: `No appointment with the id of ${req.params.id}`,
      });
    }

    await appointment.deleteOne();

    return res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Cannot delete Appointment" });
  }
};
