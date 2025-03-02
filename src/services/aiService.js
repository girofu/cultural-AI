require("dotenv").config();
const OpenAI = require("openai");
const { retrieveRelevantDocuments } = require("./vectorDBService");

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

/**
 * 使用RAG方法生成聊天回复
 */
async function generateChatResponse(location, style, userMessage, chatHistory) {
  console.log("生成聊天回覆，用戶問題:", userMessage);
  console.log("聊天風格:", style);

  try {
    // 构建聊天上下文
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

    // 从向量数据库检索相关文档
    console.log(`檢索與問題相關的文檔: "${userMessage}"`);
    const relevantDocs = await retrieveRelevantDocuments(
      userMessage,
      "tour_guide_data",
      3
    );

    // 构建上下文内容
    let contextContent = "";
    if (relevantDocs && relevantDocs.length > 0) {
      contextContent = "根據檢索到的相關資料：\n\n";
      relevantDocs.forEach((doc, index) => {
        contextContent += `資料 ${index + 1}：\n${doc.pageContent}\n\n`;
      });
    }

    // 简化系统提示以减少token使用
    const systemPrompt = `你是一位${styleDescription}導覽員，正在為用戶介紹${
      location.name
    }。
位置：${location.location}
描述：${location.description}
${contextContent ? `額外參考資料：\n${contextContent}` : ""}
用繁體中文回答，簡潔但詳細，不要截斷回答。
重要限制：你只能回答關於${location.name}的相關資訊。若用戶問了與${
      location.name
    }無關的問題或對話，請用禮貌的方式拒絕回答，並引導用戶回到景點相關的話題。
如果提供了額外參考資料，優先使用這些資料來回答問題，並盡可能準確地引用這些資料的內容。`;

    // 将聊天历史转换为OpenAI API可接受的格式
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // 限制聊天历史以避免过长上下文，只保留最近的十次对话
    if (chatHistory && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-10);
      recentHistory.forEach((entry) => {
        const role = entry.role === "ai" ? "assistant" : entry.role;
        messages.push({
          role: role,
          content: entry.content,
        });
      });
    }

    // 添加当前用户问题
    messages.push({
      role: "user",
      content: userMessage,
    });

    console.log("發送給API的消息數:", messages.length);

    // 计算token数量粗略估计
    const totalChars = messages.reduce(
      (sum, msg) => sum + (msg.content?.length || 0),
      0
    );
    console.log("預估總字符數:", totalChars);

    // 调用OpenAI API
    try {
      console.log("調用OpenAI API...");
      const startTime = Date.now();

      const response = await openai.chat.completions.create({
        model: "o3-mini",
        messages: messages,
        max_completion_tokens: 1500, // 适度设置以确保回复完整但不过长
      });

      const endTime = Date.now();
      console.log(`API響應時間: ${endTime - startTime}ms`);

      // 确保响应有内容
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

      // 提供详细的API错误信息
      const errorMessage = apiError.message || "API呼叫失敗";
      console.error("完整錯誤:", apiError);

      throw new Error(`OpenAI API錯誤: ${errorMessage}`);
    }
  } catch (error) {
    console.error("聊天回覆生成錯誤:", error);

    // 返回错误信息给用户
    return {
      role: "assistant",
      content: `很抱歉，我在處理您的問題時遇到了技術問題。請稍後再試或換一個問題。錯誤原因：${
        error.message || "未知錯誤"
      }`,
    };
  }
}

/**
 * 使用自定义知识库直接回答问题
 */
async function generateRAGResponse(
  userQuery,
  collectionName = "tour_guide_data"
) {
  console.log(`使用RAG回答問題: "${userQuery}"`);

  try {
    // 检索相关文档
    const relevantDocs = await retrieveRelevantDocuments(
      userQuery,
      collectionName,
      5
    );

    // 构建上下文内容
    let contextContent = "";
    if (relevantDocs && relevantDocs.length > 0) {
      contextContent = "根據檢索到的相關資料：\n\n";
      relevantDocs.forEach((doc, index) => {
        const metadata = doc.metadata || {};
        contextContent += `資料 ${index + 1} (${
          metadata.title || "未知來源"
        })：\n${doc.pageContent}\n\n`;
      });
    } else {
      contextContent = "沒有找到與您問題相關的資料。";
    }

    // 构建系统提示
    const systemPrompt = `你是一個基於檢索增強生成(RAG)的智能助手。
請根據以下檢索到的資料回答用戶的問題。
如果檢索到的資料不足以回答問題，請誠實告知用戶無法回答，不要編造信息。
回答要基於檢索到的資料，並引用資料來源。
用繁體中文回答，簡潔但詳細。

檢索到的資料：
${contextContent}`;

    // 调用OpenAI API
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userQuery,
      },
    ];

    console.log("開始生成RAG回答...");
    const startTime = Date.now();

    const response = await openai.chat.completions.create({
      model: "o3-mini",
      messages: messages,
      max_completion_tokens: 1500,
    });

    const endTime = Date.now();
    console.log(`RAG回答生成時間: ${endTime - startTime}ms`);

    if (
      !response.choices ||
      response.choices.length === 0 ||
      !response.choices[0].message
    ) {
      throw new Error("API未返回有效回應");
    }

    const aiMessage = response.choices[0].message;

    return {
      role: "assistant",
      content: aiMessage.content,
      sources: relevantDocs.map((doc) => ({
        title: doc.metadata?.title || "未知來源",
        id: doc.metadata?.documentId,
        snippet: doc.pageContent.substring(0, 150) + "...",
      })),
    };
  } catch (error) {
    console.error("RAG回答生成錯誤:", error);
    return {
      role: "assistant",
      content: `很抱歉，我在處理您的問題時遇到了技術問題。請稍後再試或換一個問題。錯誤原因：${
        error.message || "未知錯誤"
      }`,
      sources: [],
    };
  }
}

module.exports = { generateGuide, generateChatResponse, generateRAGResponse };
