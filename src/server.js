/* @type {javascript} */
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const attractionsRouter = require("./routes/attractions");
require("dotenv").config();

console.log("启动服务器...");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

const app = express();

app.use(cors());
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, "../public")));

// 連接 MongoDB
console.log("正在连接MongoDB...");
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB连接成功"))
  .catch((err) => console.error("MongoDB连接失败:", err));

// 註冊路由
app.use("/api/attractions", attractionsRouter);

// 註冊聊天API路由
app.use("/api", attractionsRouter);

// 根路由 - 提供前端页面
app.get("/", (req, res) => {
  console.log("根路由被访问");
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// API 文档路由
app.get("/api", (req, res) => {
  console.log("API路由被访问");
  res.send("歡迎使用景點導覽 API");
});

// 添加健康检查端点（Render会用这个检查服务是否正常运行）
app.get("/health", (req, res) => {
  console.log("健康检查被访问");
  res.status(200).send("OK");
});

function startServer(port) {
  app
    .listen(port, "0.0.0.0", () => {
      console.log("==============================================");
      console.log(`服務器運行在端口 ${port}`);
      console.log(`如果在本地運行，請訪問: http://localhost:${port}`);
      console.log("==============================================");

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
console.log(`使用端口: ${PORT}`);
startServer(PORT);
