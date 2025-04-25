const express = require("express");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const qs = require("qs");
const { Order, OrderItem, Transaction } = require("../models");
const { Cart, CartItem, ProductSize } = require("../models");
const sequelize = require("sequelize");

const router = express.Router();

const config = {
  appid: "2554",
  key1: "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
  key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
};

// 📌 1️⃣ API Tạo Thanh Toán ZaloPay
router.post("/create-payment", async (req, res) => {
  try {
    const { userId, address, amount, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Giỏ hàng trống" });
    }

    const app_trans_id = `${moment().format("YYMMDD")}_${uuidv4().slice(0, 8)}`;

    // 🔹 Lưu giao dịch vào database (bảng transactions)
    await Transaction.create({
      apptransid: app_trans_id,
      user_id: userId,
      address,
      amount,
      status: "pending", // Trạng thái mặc định: Đang chờ thanh toán
      payment_method: "ZaloPay",
      items,
    });

    const embeddata = {
      redirecturl: "http://localhost:5173",
    };

    const orderData = {
      app_id: config.appid,
      app_trans_id,
      app_user: "demo_user",
      app_time: Date.now(),
      amount,
      embed_data: JSON.stringify(embeddata),
      item: JSON.stringify(items),
      description: `Thanh toán đơn hàng ${moment().format(
        "YYYY-MM-DD HH:mm:ss"
      )}`,
      bankcode: "zalopayapp",
      callback_url:
        "https://744b-2001-ee0-1a2d-7574-c96-d4da-5df8-e8cd.ngrok-free.app/api/callback",
    };

    const data =
      config.appid +
      "|" +
      orderData.app_trans_id +
      "|" +
      orderData.app_user +
      "|" +
      orderData.amount +
      "|" +
      orderData.app_time +
      "|" +
      orderData.embed_data +
      "|" +
      orderData.item;

    orderData.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    const response = await axios.post(
      config.endpoint,
      qs.stringify(orderData),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("🎯 ZaloPay response:", response.data);

    console.log("🔗 Callback URL gửi lên ZaloPay:", orderData.callback_url);
    console.log("📌 Đã lưu giao dịch vào database:", app_trans_id);

    if (response.data.return_code !== 1) {
      return res.status(400).json({ error: "Không thể tạo giao dịch ZaloPay" });
    }

    res.json({
      ...response.data,
      paymentUrl: response.data.order_url,
      app_trans_id,
    });
  } catch (error) {
    console.error("❌ Payment Error:", error.message);
    res.status(500).json({ error: "Thanh toán thất bại" });
  }
});

// 📌 2️⃣ API Xử Lý Callback từ ZaloPay
router.post("/callback", async (req, res) => {
  console.log("📩 Received CALLBACK:");
  console.log("✅ Body:", req.body);
  console.log("✅ Query:", req.query);

  try {
    const { data, mac } = req.body;

    // Parse JSON string
    const parsedData = JSON.parse(data);
    const { app_trans_id, amount, item } = parsedData;

    console.log("📩 Parsed Callback:", parsedData);

    // Tìm giao dịch trong DB
    const transaction = await Transaction.findOne({
      where: { apptransid: app_trans_id },
    });

    if (!transaction) {
      console.log(
        `❌ Không tìm thấy giao dịch với app_trans_id: ${app_trans_id}`
      );
      return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    }

    // Cập nhật trạng thái thành công
    transaction.status = "success";
    await transaction.save();

    // Tạo đơn hàng
    const newOrder = await Order.create({
      user_id: transaction.user_id,
      address: transaction.address,
      total_price: transaction.amount,
      status: "paid",
      payment_method: "ZaloPay",
    });

    // Parse items từ transaction (nếu lưu là JSON string thì parse lại)
    const items = Array.isArray(transaction.items)
      ? transaction.items
      : JSON.parse(transaction.items);

    // Tạo order items
    const orderItems = items.map((item) => ({
      order_id: newOrder.id,
      product_id: item.productId,
      size_id: item.size_id,
      quantity: item.quantity,
      price: item.price,
    }));
    await OrderItem.bulkCreate(orderItems);

    // Cập nhật tồn kho
    for (const item of items) {
      await ProductSize.update(
        {
          quantity: sequelize.literal(`quantity - ${item.quantity}`),
        },
        {
          where: { id: item.size_id },
        }
      );
    }

    // Xóa các CartItem tương ứng
    const cart = await Cart.findOne({
      where: { user_id: transaction.user_id },
    });

    if (cart) {
      const cartItemIdsToDelete = [];

      for (const item of items) {
        const cartItem = await CartItem.findOne({
          where: {
            cart_id: cart.id,
            product_id: item.productId,
            size_id: item.size_id,
          },
        });

        if (cartItem) {
          cartItemIdsToDelete.push(cartItem.id);
        }
      }

      if (cartItemIdsToDelete.length > 0) {
        await CartItem.destroy({
          where: {
            id: cartItemIdsToDelete,
          },
        });
      }
    }

    console.log(
      `✅ Đã tạo đơn hàng #${newOrder.id} và xoá CartItem tương ứng sau khi thanh toán thành công.`
    );

    res.json({ success: true, orderId: newOrder.id });
  } catch (error) {
    console.error("❌ Lỗi callback thanh toán:", error);
    res.status(500).json({ error: "Lỗi xử lý callback thanh toán" });
  }
});

module.exports = router;
