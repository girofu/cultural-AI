/* @type {javascript} */
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const attractionsRouter = require("./routes/attractions");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, "../public")));

// 連接 MongoDB
mongoose.connect(process.env.MONGODB_URI);

// 註冊路由
app.use("/api/attractions", attractionsRouter);

// 註冊聊天API路由
app.use("/api", attractionsRouter);

// 根路由 - 提供前端页面
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// API 文档路由
app.get("/api", (req, res) => {
  res.send("歡迎使用景點導覽 API");
});

function startServer(port) {
  app
    .listen(port, "0.0.0.0", () => {
      console.log(`服務器運行在端口 ${port}`);
      console.log(`如果在本地運行，請訪問: http://localhost:${port}`);

      if (process.env.HOST) {
        console.log(`或是訪問: ${process.env.HOST}:${port}`);
      }
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`端口 ${port} 已被占用，嘗試使用端口 ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error("服務器啟動錯誤:", err);
      }
    });
}

const PORT = process.env.PORT || 5000;
startServer(PORT);
