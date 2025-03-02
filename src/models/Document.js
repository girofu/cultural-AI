const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      default: "manual",
    },
    category: {
      type: String,
      default: "general",
    },
    tags: {
      type: [String],
      default: [],
    },
    vectorized: {
      type: Boolean,
      default: false,
    },
    collectionName: {
      type: String,
      default: "tour_guide_data",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
