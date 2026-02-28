const Shop = require("../models/Shop");
const Appointment = require("../models/Appointment");

// @desc Get all shops
// @route GET /api/v1/shops
// @access Public
exports.getShops = async (req, res, nxt) => {
  let query;

  const reqQuery = { ...req.query };
  const removeFields = ["select", "sort", "page", "limit"];
  removeFields.forEach((param) => delete reqQuery[param]);

  let queryStr = JSON.stringify(req.query);

  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Basic Filter
  query = Shop.find(JSON.parse(queryStr)).populate("appointments");

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
    const total = await Shop.countDocuments();
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

    const shops = await query;
    return res.status(200).json({
      success: true,
      count: shops.length,
      pagination,
      data: shops,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ success: false });
  }
};

// @desc Get single shop
// @route GET /api/v1/shops/:id
// @access Public
exports.getShop = async (req, res, nxt) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(400).json({ success: false });
    }

    return res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (err) {
    return res.status(400).json({ success: false });
  }
};

// @desc Create a shop
// @route POST /api/v1/shops/
// @access Private
exports.createShop = async (req, res, nxt) => {
  const shop = await Shop.create(req.body);
  res.status(201).json({
    success: true,
    data: shop,
  });
};

// @desc Update single shop
// @route PUT /api/v1/shops/:id
// @access Private
exports.updateShop = async (req, res, nxt) => {
  try {
    const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return updated document
      runValidators: true,
    });

    if (!shop) {
      return res.status(400).json({ success: false });
    }

    return res.status(200).json({ success: true, data: shop });
  } catch (err) {
    return res.status(400).json({ success: false });
  }
};

// @desc Delete single shop
// @route DELETE /api/v1/shops/:id
// @access Private
exports.deleteShop = async (req, res, nxt) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(400).json({ success: false });
    }

    await Appointment.deleteMany({ shop: req.params.id });
    await Shop.deleteOne({ _id: req.params.id });

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    return res.status(400).json({ success: false });
  }
};
