const mongoose = require("mongoose");
const ShopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      unique: true,
      trim: true,
      maxlength: [50, "Name can not be more than 50 characters"],
    },
    address: {
      type: String,
      required: [true, "Please add an address"],
    },
    tel: {
      type: String,
    },
    openTime: {
      type: Date,
      required: [true, "Please add an open time"],
    },
    closeTime: {
      type: Date,
      required: [true, "Please add an close time"],
    },
    // district: {
    //   type: String,
    //   required: [true, "Please add a district"],
    // },
    // province: {
    //   type: String,
    //   required: [true, "Please add a province"],
    // },
    // postalcode: {
    //   type: String,
    //   required: [true, "Please add a postalcode"],
    //   maxlength: [5, "Postal Code can not be more than 5 digits"],
    // },
    // region: {
    //   type: String,
    //   required: [true, "Please add a region"],
    // },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ShopSchema.virtual("appointments", {
  ref: "Appointment",
  localField: "_id",
  foreignField: "shop",
  justOne: false,
});

module.exports = mongoose.model("Shop", ShopSchema);
