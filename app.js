const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error", err));

const salesSchema = new mongoose.Schema({}, { strict: false });
const Sale = mongoose.model("Sale", salesSchema, "sales"); // collection name = sales

app.get('/api/revenue', async (req, res) => {
  try {
    const pipeline = [
      { $unwind: "$items" },
      {
        $project: {
          store: 1,
          month: { $dateToString: { format: "%Y-%m", date: "$date" } },
          revenue: { $multiply: ["$items.quantity", "$items.price"] },
          price: "$items.price",
        },
      },
      {
        $group: {
          _id: { store: "$store", month: "$month" },
          totalRevenue: { $sum: "$revenue" },
          averagePrice: { $avg: "$price" },
        },
      },
      {
        $project: {
          _id: 0,
          store: "$_id.store",
          month: "$_id.month",
          totalRevenue: 1,
          averagePrice: 1,
        },
      },
      { $sort: { store: 1, month: 1 } },
    ];

    const result = await Sale.aggregate(pipeline);
    res.json(result);
  } catch (err) {
    console.error("Aggregation error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
