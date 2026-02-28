const Hospital = require("../models/Hospital");
const Appointment = require("../models/Appointment");

// @desc Get all hospitals
// @route GET /api/v1/hospitals
// @access Public
exports.getHospitals = async (req, res, nxt) => {
  let query;

  const reqQuery = { ...req.query };
  const removeFields = ["select", "sort", "page", "limit"];
  removeFields.forEach((param) => delete reqQuery[param]);

  let queryStr = JSON.stringify(req.query);

  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`,
  );

  // Basic Filter
  query = Hospital.find(JSON.parse(queryStr)).populate("appointments");

  // Select
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1; // page number
  const limit = parseInt(req.query.limit, 10) || 25; // documents per page

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit; // open ended bound
  query = query.skip(startIndex).limit(limit);

  try {
    const total = await Hospital.countDocuments();
    const pagination = {};
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    const hospitals = await query;
    return res.status(200).json({
      success: true,
      count: hospitals.length,
      pagination,
      data: hospitals,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ success: false });
  }
};

// @desc Get single hospital
// @route GET /api/v1/hospitals/:id
// @access Public
exports.getHospital = async (req, res, nxt) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(400).json({ success: false });
    }

    return res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (err) {
    return res.status(400).json({ success: false });
  }
};

// @desc Create a hospital
// @route POST /api/v1/hospitals/
// @access Private
exports.createHospital = async (req, res, nxt) => {
  const hospital = await Hospital.create(req.body);
  res.status(201).json({
    success: true,
    data: hospital,
  });
};

// @desc Update single hospital
// @route PUT /api/v1/hospitals/:id
// @access Private
exports.updateHospital = async (req, res, nxt) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return updated document
      runValidators: true,
    });

    if (!hospital) {
      return res.status(400).json({ success: false });
    }

    return res.status(200).json({ success: true, data: hospital });
  } catch (err) {
    return res.status(400).json({ success: false });
  }
};

// @desc Delete single hospital
// @route DELETE /api/v1/hospitals/:id
// @access Private
exports.deleteHospital = async (req, res, nxt) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(400).json({ success: false });
    }

    await Appointment.deleteMany({ hospital: req.params.id });
    await Hospital.deleteOne({ _id: req.params.id });

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    return res.status(400).json({ success: false });
  }
};
