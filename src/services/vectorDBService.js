const { Document } = require("@langchain/core/documents");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const path = require("path");
const fs = require("fs");

// ChromaDB 服務連接配置
const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";

// 初始化OpenAI嵌入模型
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

/**
 * 初始化向量數據庫客戶端
 */
async function getVectorStore(collectionName = "tour_guide_data") {
  try {
    console.log(
      `嘗試連接 ChromaDB 於 ${CHROMA_URL}, 集合名稱: ${collectionName}`
    );

    // 嘗試連接到現有集合或創建新集合
    const vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: collectionName,
      url: CHROMA_URL, // 連接到 Docker 中的 ChromaDB 服務
    });

    console.log(`成功連接到 ChromaDB 集合: ${collectionName}`);
    return vectorStore;
  } catch (error) {
    console.error("初始化向量數據庫失敗:", error);

    // 如果集合不存在，創建一個新的空集合
    console.log(`嘗試創建新的集合: ${collectionName}`);
    try {
      const newVectorStore = await Chroma.fromDocuments([], embeddings, {
        collectionName: collectionName,
        url: CHROMA_URL, // 連接到 Docker 中的 ChromaDB 服務
      });
      console.log(`成功創建新的集合: ${collectionName}`);
      return newVectorStore;
    } catch (createError) {
      console.error("創建新集合失敗:", createError);
      throw createError;
    }
  }
}

/**
 * 將文本切分為較小的文檔塊
 */
async function splitTextIntoChunks(text, metadata = {}) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splitDocs = await splitter.createDocuments([text], [metadata]);

  return splitDocs;
}

/**
 * 將文檔添加到向量數據庫
 */
async function addDocumentToVectorDB(
  text,
  metadata = {},
  collectionName = "tour_guide_data"
) {
  try {
    // 切分文檔
    const docs = await splitTextIntoChunks(text, metadata);

    // 獲取向量數據庫
    const vectorStore = await getVectorStore(collectionName);

    // 添加文檔到向量數據庫
    await vectorStore.addDocuments(docs);

    console.log(`成功添加文檔到向量數據庫, 集合名稱: ${collectionName}`);
    return true;
  } catch (error) {
    console.error("添加文檔到向量數據庫失敗:", error);
    throw error;
  }
}

/**
 * 根據查詢檢索相關文檔
 */
async function retrieveRelevantDocuments(
  query,
  collectionName = "tour_guide_data",
  maxResults = 5
) {
  try {
    const vectorStore = await getVectorStore(collectionName);
    const results = await vectorStore.similaritySearch(query, maxResults);
    return results;
  } catch (error) {
    console.error("檢索相關文檔失敗:", error);
    return [];
  }
}

/**
 * 刪除集合中的所有文檔
 */
async function clearCollection(collectionName = "tour_guide_data") {
  try {
    const vectorStore = await getVectorStore(collectionName);
    await vectorStore.delete();
    console.log(`已清空集合: ${collectionName}`);
    return true;
  } catch (error) {
    console.error("清空集合失敗:", error);
    throw error;
  }
}

module.exports = {
  addDocumentToVectorDB,
  retrieveRelevantDocuments,
  clearCollection,
};
