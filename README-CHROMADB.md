# ChromaDB 向量資料庫設置指南

## 概述

本文件說明如何使用 Docker 運行 ChromaDB 向量資料庫，以及如何配置您的應用程序連接到該服務。

## 先決條件

- 已安裝 Docker 和 Docker Compose
- Node.js 環境已設置

## 步驟 1: 啟動 ChromaDB 服務

使用 Docker Compose 啟動 ChromaDB 服務：

```bash
docker-compose up -d
```

此命令將在後台啟動 ChromaDB 服務，並映射到本地的 8000 端口。

## 步驟 2: 驗證 ChromaDB 服務是否運行正常

您可以通過訪問以下 URL 來檢查 ChromaDB 服務是否正常運行：

```
http://localhost:8000/api/v1/heartbeat
```

如果服務正常運行，您將收到一個包含 `nanosecond heartbeat` 的回應。

## 步驟 3: 配置您的應用程序

在您的應用程序中，確保設置了正確的環境變數以連接到 ChromaDB 服務：

```bash
# 在啟動應用程序前設置
export CHROMA_URL=http://localhost:8000
export OPENAI_API_KEY=your_openai_api_key
```

或者，您可以在啟動應用程序時設置這些變數：

```bash
CHROMA_URL=http://localhost:8000 OPENAI_API_KEY=your_openai_api_key npm start
```

## 故障排除

### 無法連接到 ChromaDB

如果您的應用程序無法連接到 ChromaDB，請檢查：

1. ChromaDB Docker 容器是否正在運行：

   ```bash
   docker ps
   ```

2. 檢查 ChromaDB 容器日誌是否有錯誤：

   ```bash
   docker logs <容器ID或名稱>
   ```

3. 確認 ChromaDB 端口是否可訪問：
   ```bash
   curl http://localhost:8000/api/v1/heartbeat
   ```

### 數據持久化

ChromaDB 數據存儲在名為 `chroma-data` 的 Docker 卷中。如果需要完全重置數據，可以刪除此卷：

```bash
docker-compose down
docker volume rm <項目名稱>_chroma-data
docker-compose up -d
```

## 參考資料

- [ChromaDB 官方文檔](https://docs.trychroma.com/)
- [ChromaDB Docker 映像說明](https://hub.docker.com/r/chromadb/chroma)
