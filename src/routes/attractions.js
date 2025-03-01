/* @type {javascript} */
const express = require("express");
const router = express.Router();
const Attraction = require("../models/Attraction");
const {
  generateGuide,
  generateChatResponse,
} = require("../services/aiService");

// 新增景點
router.post("/", async (req, res) => {
  try {
    const attraction = new Attraction(req.body);
    const aiGuide = await generateGuide(req.body);
    attraction.aiGeneratedGuide = aiGuide;
    await attraction.save();
    res.status(201).json(attraction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 獲取所有景點
router.get("/", async (req, res) => {
  try {
    const attractions = await Attraction.find();
    res.json(attractions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 處理聊天請求
router.post("/chat", async (req, res) => {
  try {
    console.log("接收到聊天請求:", {
      location: req.body.location?.name,
      style: req.body.style,
      message: req.body.message,
    });

    const { location, style, message, chatHistory } = req.body;

    // 驗證請求參數
    if (!location || !message) {
      console.error("請求參數無效:", { location, message });
      return res.status(400).json({
        message: "請求參數無效，需要location和message",
        response: "請求參數無效，請確保提供了正確的地點和問題。",
      });
    }

    // 調用AI服務生成回覆
    const response = await generateChatResponse(
      location,
      style,
      message,
      chatHistory
    );

    console.log("AI回覆:", {
      role: response.role,
      contentLength: response.content?.length,
      contentPreview: response.content?.substring(0, 100) + "...",
    });

    // 檢查響應格式並確保完整性
    if (!response || !response.content) {
      throw new Error("生成的回覆無效或不完整");
    }

    // 返回回覆，確保內容完整傳遞
    const result = {
      response: response.content,
      highlight: `了解了關於${location.name}的${message}`,
    };

    console.log("返回前端的響應大小:", JSON.stringify(result).length);
    res.json(result);
  } catch (error) {
    console.error("聊天API錯誤:", error);

    // 返回詳細錯誤信息，確保前端能顯示
    res.status(500).json({
      message: error.message || "未知錯誤",
      response: `很抱歉，在處理您的問題時遇到了技術問題。請稍後再試或換一個問題。錯誤原因：${
        error.message || "未知錯誤"
      }`,
      error: error.stack, // 在開發環境中提供詳細錯誤堆棧
    });
  }
});

module.exports = router;
