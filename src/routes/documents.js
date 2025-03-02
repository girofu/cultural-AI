/* @type {javascript} */
const express = require("express");
const router = express.Router();
const Document = require("../models/Document");
const {
  addDocumentToVectorDB,
  retrieveRelevantDocuments,
  clearCollection,
} = require("../services/vectorDBService");

// 上传新文档
router.post("/", async (req, res) => {
  try {
    const { title, content, category, tags, collectionName } = req.body;

    // 验证必要字段
    if (!title || !content) {
      return res.status(400).json({ message: "标题和内容为必填项" });
    }

    // 创建新文档记录
    const document = new Document({
      title,
      content,
      category: category || "general",
      tags: tags || [],
      collectionName: collectionName || "tour_guide_data",
    });

    // 保存到MongoDB
    await document.save();

    // 将文档添加到向量数据库
    try {
      await addDocumentToVectorDB(
        content,
        {
          title,
          documentId: document._id.toString(),
          category: category || "general",
        },
        document.collectionName
      );

      // 更新文档状态为已向量化
      document.vectorized = true;
      await document.save();
    } catch (vectorError) {
      console.error("向量化文档失败:", vectorError);
      // 文档已保存到MongoDB，但向量化失败
      return res.status(201).json({
        document,
        warning: "文档已保存，但向量化处理失败，检索功能可能受限",
      });
    }

    // 全部成功
    res.status(201).json({
      document,
      message: "文档已成功保存并向量化",
    });
  } catch (error) {
    console.error("上传文档失败:", error);
    res.status(500).json({ message: error.message });
  }
});

// 获取所有文档
router.get("/", async (req, res) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取单个文档
router.get("/:id", async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: "文档不存在" });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 更新文档
router.put("/:id", async (req, res) => {
  try {
    const { title, content, category, tags, collectionName } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "文档不存在" });
    }

    // 更新文档字段
    document.title = title || document.title;
    document.content = content || document.content;
    document.category = category || document.category;
    document.tags = tags || document.tags;

    // 如果内容更新，需要重新向量化
    if (content && content !== document.content) {
      document.vectorized = false;
    }

    // 如果集合名称更改，也需要重新向量化
    if (collectionName && collectionName !== document.collectionName) {
      document.collectionName = collectionName;
      document.vectorized = false;
    }

    await document.save();

    // 如果需要重新向量化
    if (!document.vectorized) {
      try {
        await addDocumentToVectorDB(
          document.content,
          {
            title: document.title,
            documentId: document._id.toString(),
            category: document.category,
          },
          document.collectionName
        );

        document.vectorized = true;
        await document.save();
      } catch (vectorError) {
        console.error("重新向量化文档失败:", vectorError);
        return res.status(200).json({
          document,
          warning: "文档已更新，但向量化处理失败，检索功能可能受限",
        });
      }
    }

    res.json({
      document,
      message: "文档已成功更新",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 删除文档
router.delete("/:id", async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "文档不存在" });
    }

    await Document.deleteOne({ _id: req.params.id });

    // 注意：这里没有从向量数据库中删除对应的向量
    // 向量数据库中的内容会在下次重建索引时更新

    res.json({ message: "文档已成功删除" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 搜索文档
router.post("/search", async (req, res) => {
  try {
    const { query, collectionName, maxResults } = req.body;

    if (!query) {
      return res.status(400).json({ message: "查询参数不能为空" });
    }

    // 从向量数据库检索相关文档
    const results = await retrieveRelevantDocuments(
      query,
      collectionName || "tour_guide_data",
      maxResults || 5
    );

    res.json({
      results,
      count: results.length,
    });
  } catch (error) {
    console.error("搜索文档失败:", error);
    res.status(500).json({ message: error.message });
  }
});

// 重新向量化所有文档
router.post("/vectorize-all", async (req, res) => {
  try {
    const { collectionName } = req.body;
    const collection = collectionName || "tour_guide_data";

    // 清空现有集合
    await clearCollection(collection);

    // 获取所有文档
    const documents = await Document.find({ collectionName: collection });

    // 统计成功和失败数量
    let successCount = 0;
    let failCount = 0;

    // 重新向量化每个文档
    for (const doc of documents) {
      try {
        await addDocumentToVectorDB(
          doc.content,
          {
            title: doc.title,
            documentId: doc._id.toString(),
            category: doc.category,
          },
          collection
        );

        doc.vectorized = true;
        await doc.save();
        successCount++;
      } catch (error) {
        console.error(`向量化文档 ${doc._id} 失败:`, error);
        failCount++;
      }
    }

    res.json({
      message: `向量化完成: ${successCount} 成功, ${failCount} 失败`,
      successCount,
      failCount,
      totalDocuments: documents.length,
    });
  } catch (error) {
    console.error("批量向量化失败:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
