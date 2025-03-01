require("dotenv").config();
const OpenAI = require("openai");

console.log(
  "OPENAI_API_KEY:",
  process.env.OPENAI_API_KEY ? "已設置" : "未設置"
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateGuide(attractionInfo) {
  try {
    const prompt = `請為以下景點生成導覽解說：
    景點名稱：${attractionInfo.name}
    位置：${attractionInfo.location}
    描述：${attractionInfo.description}
    類別：${attractionInfo.category}`;

    const response = await openai.chat.completions.create({
      model: "o3-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_completion_tokens: 50000,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("AI 導覽生成錯誤:", error);
    throw error;
  }
}

async function generateChatResponse(location, style, userMessage, chatHistory) {
  console.log("生成聊天回覆，用戶問題:", userMessage);
  console.log("聊天風格:", style);

  try {
    // 構建聊天上下文
    let styleDescription = "";
    switch (style) {
      case "historical":
        styleDescription = "歷史學者";
        break;
      case "local":
        styleDescription = "在地人";
        break;
      case "fun":
        styleDescription = "趣味導遊";
        break;
      default:
        styleDescription = "一般導覽";
    }

    // 簡化系統提示以減少token使用
    const systemPrompt = `你是一位${styleDescription}導覽員，正在為用戶介紹${location.name}。
位置：${location.location}
描述：${location.description}
用繁體中文回答，簡潔但詳細，不要截斷回答。`;

    // 將聊天歷史轉換為OpenAI API可接受的格式
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // 限制聊天歷史以避免過長上下文，只保留最近的兩次對話
    if (chatHistory && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-4); // 只保留最近2輪對話(4條消息)
      recentHistory.forEach((entry) => {
        const role = entry.role === "ai" ? "assistant" : entry.role;
        messages.push({
          role: role,
          content: entry.content,
        });
      });
    }

    // 添加當前用戶問題
    messages.push({
      role: "user",
      content: userMessage,
    });

    console.log("發送給API的消息數:", messages.length);

    // 計算token數量粗略估計
    const totalChars = messages.reduce(
      (sum, msg) => sum + (msg.content?.length || 0),
      0
    );
    console.log("預估總字符數:", totalChars);

    // 調用OpenAI API
    try {
      console.log("調用OpenAI API...");
      const startTime = Date.now();

      const response = await openai.chat.completions.create({
        model: "o3-mini",
        messages: messages,
        max_completion_tokens: 1500, // 適度設置以確保回覆完整但不過長
      });

      const endTime = Date.now();
      console.log(`API響應時間: ${endTime - startTime}ms`);

      // 確保回應有內容
      if (
        !response.choices ||
        response.choices.length === 0 ||
        !response.choices[0].message
      ) {
        console.error("API返回無效響應:", response);
        throw new Error("API未返回有效回應");
      }

      const aiMessage = response.choices[0].message;
      console.log("API回覆長度:", aiMessage.content.length);

      return aiMessage;
    } catch (apiError) {
      console.error("OpenAI API錯誤:", apiError.message);

      // 提供詳細的API錯誤信息
      const errorMessage = apiError.message || "API呼叫失敗";
      console.error("完整錯誤:", apiError);

      throw new Error(`OpenAI API錯誤: ${errorMessage}`);
    }
  } catch (error) {
    console.error("聊天回覆生成錯誤:", error);

    // 返回錯誤信息給用戶
    return {
      role: "assistant",
      content: `很抱歉，我在處理您的問題時遇到了技術問題。請稍後再試或換一個問題。錯誤原因：${
        error.message || "未知錯誤"
      }`,
    };
  }
}

module.exports = { generateGuide, generateChatResponse };
