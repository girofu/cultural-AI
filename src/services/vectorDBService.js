const { Document } = require("@langchain/core/documents");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const path = require("path");
const fs = require("fs");

// 配置向量数据库存储路径
const CHROMA_DIRECTORY = path.join(__dirname, "../../data/chroma");
// 确保目录存在
if (!fs.existsSync(CHROMA_DIRECTORY)) {
  fs.mkdirSync(CHROMA_DIRECTORY, { recursive: true });
}

// 初始化OpenAI嵌入模型
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

/**
 * 初始化向量数据库客户端
 */
async function getVectorStore(collectionName = "tour_guide_data") {
  try {
    // 尝试连接到现有集合或创建新集合
    const vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: collectionName,
    });
    return vectorStore;
  } catch (error) {
    console.error("初始化向量数据库失败:", error);
    // 如果集合不存在，创建一个新的空集合
    return await Chroma.fromDocuments([], embeddings, {
      collectionName: collectionName,
      url: `file://${CHROMA_DIRECTORY}`,
    });
  }
}

/**
 * 将文本切分为较小的文档块
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
 * 将文档添加到向量数据库
 */
async function addDocumentToVectorDB(
  text,
  metadata = {},
  collectionName = "tour_guide_data"
) {
  try {
    // 切分文档
    const docs = await splitTextIntoChunks(text, metadata);

    // 获取向量数据库
    const vectorStore = await getVectorStore(collectionName);

    // 添加文档到向量数据库
    await vectorStore.addDocuments(docs);

    console.log(`成功添加文档到向量数据库, 集合名稱: ${collectionName}`);
    return true;
  } catch (error) {
    console.error("添加文档到向量数据库失败:", error);
    throw error;
  }
}

/**
 * 根据查询检索相关文档
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
    console.error("检索相关文档失败:", error);
    return [];
  }
}

/**
 * 删除集合中的所有文档
 */
async function clearCollection(collectionName = "tour_guide_data") {
  try {
    const vectorStore = await getVectorStore(collectionName);
    await vectorStore.delete();
    console.log(`已清空集合: ${collectionName}`);
    return true;
  } catch (error) {
    console.error("清空集合失败:", error);
    throw error;
  }
}

module.exports = {
  addDocumentToVectorDB,
  retrieveRelevantDocuments,
  clearCollection,
};
