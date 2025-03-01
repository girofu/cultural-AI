// 全局变量
let currentSection = "welcome-section";
let selectedLocation = null;
let selectedStyle = null;
let chatHistory = [];
let tourSummary = {
  location: "",
  style: "",
  date: "",
  highlights: [],
  questions: [],
};

// 语音识别API
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = "zh-TW";
}

// DOM元素
document.addEventListener("DOMContentLoaded", () => {
  // 导航链接
  const homeLink = document.getElementById("home-link");
  const historyLink = document.getElementById("history-link");
  const aboutLink = document.getElementById("about-link");

  // 欢迎页面
  const startTourBtn = document.getElementById("start-tour-btn");

  // 地点选择页面
  const locationSearchInput = document.getElementById("location-search");
  const searchBtn = document.getElementById("search-btn");
  const locationList = document.getElementById("location-list");
  const useCurrentLocationBtn = document.getElementById("use-current-location");
  const nextToStyleBtn = document.getElementById("next-to-style");

  // 风格选择页面
  const styleCards = document.querySelectorAll(".style-card");
  const backToLocationBtn = document.getElementById("back-to-location");
  const nextToChatBtn = document.getElementById("next-to-chat");

  // 聊天页面
  const backToStyleBtn = document.getElementById("back-to-style");
  const endTourBtn = document.getElementById("end-tour-btn");
  const locationNameEl = document.getElementById("location-name");
  const guideStyleEl = document.getElementById("guide-style");
  const chatMessages = document.getElementById("chat-messages");
  const messageInput = document.getElementById("message-input");
  const sendMessageBtn = document.getElementById("send-message-btn");
  const voiceInputBtn = document.getElementById("voice-input-btn");

  // 总结页面
  const summaryLocationEl = document.getElementById("summary-location");
  const summaryDateEl = document.getElementById("summary-date");
  const summaryContentEl = document.getElementById("summary-content");
  const printSummaryBtn = document.getElementById("print-summary-btn");
  const shareSummaryBtn = document.getElementById("share-summary-btn");
  const saveSummaryBtn = document.getElementById("save-summary-btn");
  const newTourBtn = document.getElementById("new-tour-btn");

  // 初始化页面
  initApp();

  // 事件监听器
  homeLink.addEventListener("click", (e) => {
    e.preventDefault();
    showSection("welcome-section");
    updateNavLinks(homeLink);
  });

  historyLink.addEventListener("click", (e) => {
    e.preventDefault();
    // 这里可以添加历史记录页面的逻辑
    alert("历史记录功能即将推出");
  });

  aboutLink.addEventListener("click", (e) => {
    e.preventDefault();
    // 这里可以添加关于我们页面的逻辑
    alert("关于我们功能即将推出");
  });

  startTourBtn.addEventListener("click", () => {
    showSection("location-section");
  });

  searchBtn.addEventListener("click", () => {
    searchLocations(locationSearchInput.value);
  });

  locationSearchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchLocations(locationSearchInput.value);
    }
  });

  useCurrentLocationBtn.addEventListener("click", () => {
    getCurrentLocation();
  });

  nextToStyleBtn.addEventListener("click", () => {
    if (selectedLocation) {
      showSection("style-section");
    } else {
      alert("请先选择一个地点");
    }
  });

  styleCards.forEach((card) => {
    card.addEventListener("click", () => {
      styleCards.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedStyle = card.getAttribute("data-style");
    });
  });

  backToLocationBtn.addEventListener("click", () => {
    showSection("location-section");
  });

  nextToChatBtn.addEventListener("click", () => {
    if (selectedStyle) {
      startTour();
    } else {
      alert("请先选择一个导览风格");
    }
  });

  backToStyleBtn.addEventListener("click", () => {
    showSection("style-section");
  });

  endTourBtn.addEventListener("click", () => {
    endTour();
  });

  sendMessageBtn.addEventListener("click", () => {
    sendMessage();
  });

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  if (recognition) {
    voiceInputBtn.addEventListener("click", toggleVoiceInput);
  } else {
    voiceInputBtn.style.display = "none";
  }

  printSummaryBtn.addEventListener("click", () => {
    printTourSummary();
  });

  shareSummaryBtn.addEventListener("click", () => {
    shareTourSummary();
  });

  saveSummaryBtn.addEventListener("click", () => {
    saveTourSummary();
  });

  newTourBtn.addEventListener("click", () => {
    resetApp();
    showSection("location-section");
  });
});

// 初始化应用
function initApp() {
  // 加载示例地点
  loadSampleLocations();

  // 初始化地图
  initMap();
}

// 加载示例地点
function loadSampleLocations() {
  const sampleLocations = [
    {
      id: 1,
      name: "台北101",
      description: "台北地标性建筑，曾是世界最高建筑",
      location: "台北市信义区信义路五段7号",
      category: "建筑",
    },
    {
      id: 2,
      name: "故宫博物院",
      description: "收藏大量中国古代艺术品和文物的博物馆",
      location: "台北市士林区至善路二段221号",
      category: "博物馆",
    },
    {
      id: 3,
      name: "阳明山国家公园",
      description: "以温泉和火山地质景观闻名的国家公园",
      location: "台北市北投区竹子湖路1-20号",
      category: "自然景观",
    },
    {
      id: 4,
      name: "九份老街",
      description: "保留日据时代建筑风格的山城老街",
      location: "新北市瑞芳区基山街",
      category: "历史街区",
    },
  ];

  const locationList = document.getElementById("location-list");
  locationList.innerHTML = "";

  sampleLocations.forEach((location) => {
    const locationItem = document.createElement("div");
    locationItem.className = "location-item";
    locationItem.setAttribute("data-id", location.id);
    locationItem.innerHTML = `
            <h3>${location.name}</h3>
            <p>${location.description}</p>
            <p><small>${location.location}</small></p>
        `;

    locationItem.addEventListener("click", () => {
      document.querySelectorAll(".location-item").forEach((item) => {
        item.classList.remove("selected");
      });
      locationItem.classList.add("selected");
      selectedLocation = location;
    });

    locationList.appendChild(locationItem);
  });
}

// 初始化地图（这里使用占位符，实际应用中可以集成Google Maps或其他地图服务）
function initMap() {
  const mapElement = document.getElementById("location-map");
  mapElement.innerHTML =
    '<div style="display: flex; justify-content: center; align-items: center; height: 100%; background-color: #f0f0f0;"><p>地图加载中...</p></div>';

  // 这里可以添加实际地图初始化代码
  // 例如：使用Google Maps API
}

// 搜索地点
function searchLocations(query) {
  if (!query.trim()) {
    alert("请输入搜索关键词");
    return;
  }

  // 这里应该调用API搜索地点
  // 为了演示，我们只是过滤示例数据
  const filteredLocations = [
    {
      id: 1,
      name: "台北101",
      description: "台北地标性建筑，曾是世界最高建筑",
      location: "台北市信义区信义路五段7号",
      category: "建筑",
    },
  ];

  const locationList = document.getElementById("location-list");
  locationList.innerHTML = "";

  if (filteredLocations.length === 0) {
    locationList.innerHTML = "<p>未找到匹配的地点</p>";
    return;
  }

  filteredLocations.forEach((location) => {
    const locationItem = document.createElement("div");
    locationItem.className = "location-item";
    locationItem.setAttribute("data-id", location.id);
    locationItem.innerHTML = `
            <h3>${location.name}</h3>
            <p>${location.description}</p>
            <p><small>${location.location}</small></p>
        `;

    locationItem.addEventListener("click", () => {
      document.querySelectorAll(".location-item").forEach((item) => {
        item.classList.remove("selected");
      });
      locationItem.classList.add("selected");
      selectedLocation = location;
    });

    locationList.appendChild(locationItem);
  });
}

// 获取当前位置
function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 这里应该调用API根据坐标获取附近的地点
        // 为了演示，我们只是显示一个示例地点
        const currentLocation = {
          id: 5,
          name: "当前位置",
          description: "根据您的GPS定位",
          location: `纬度: ${position.coords.latitude.toFixed(
            4
          )}, 经度: ${position.coords.longitude.toFixed(4)}`,
          category: "当前位置",
        };

        selectedLocation = currentLocation;

        const locationList = document.getElementById("location-list");
        const locationItem = document.createElement("div");
        locationItem.className = "location-item selected";
        locationItem.setAttribute("data-id", currentLocation.id);
        locationItem.innerHTML = `
                    <h3>${currentLocation.name}</h3>
                    <p>${currentLocation.description}</p>
                    <p><small>${currentLocation.location}</small></p>
                `;

        locationList.innerHTML = "";
        locationList.appendChild(locationItem);
      },
      (error) => {
        console.error("获取位置失败:", error);
        alert("无法获取您的位置，请检查位置权限设置");
      }
    );
  } else {
    alert("您的浏览器不支持地理定位");
  }
}

// 开始导览
function startTour() {
  // 设置聊天界面信息
  document.getElementById("location-name").textContent = selectedLocation.name;

  let styleText = "";
  switch (selectedStyle) {
    case "historical":
      styleText = "历史学者";
      break;
    case "local":
      styleText = "在地人";
      break;
    case "fun":
      styleText = "趣味导游";
      break;
    default:
      styleText = "导览助手";
  }

  document.getElementById("guide-style").textContent = styleText;

  // 清空聊天记录
  chatHistory = [];
  document.getElementById("chat-messages").innerHTML = "";

  // 显示聊天界面
  showSection("chat-section");

  // 发送欢迎消息
  setTimeout(() => {
    const welcomeMessage = `欢迎来到${selectedLocation.name}！我是您的${styleText}导览助手。有什么想了解的，随时可以问我。`;
    addAIMessage(welcomeMessage);

    // 保存到聊天历史 - 使用'assistant'角色而不是'ai'
    chatHistory.push({
      role: "assistant",
      content: welcomeMessage,
    });

    // 保存到导览摘要
    tourSummary.location = selectedLocation.name;
    tourSummary.style = styleText;
    tourSummary.date = new Date().toLocaleString("zh-TW");
  }, 500);
}

// 发送消息
function sendMessage() {
  const messageInput = document.getElementById("message-input");
  const message = messageInput.value.trim();

  if (!message) return;

  // 添加用户消息到聊天界面
  addUserMessage(message);

  // 保存到聊天历史
  chatHistory.push({
    role: "user",
    content: message,
  });

  // 保存到导览摘要的问题列表
  tourSummary.questions.push(message);

  // 清空输入框
  messageInput.value = "";

  // 模拟AI回复
  simulateAIResponse(message);
}

// 添加用户消息到聊天界面
function addUserMessage(message) {
  const chatMessages = document.getElementById("chat-messages");
  const messageElement = document.createElement("div");
  messageElement.className = "message user-message";
  messageElement.textContent = message;
  chatMessages.appendChild(messageElement);

  // 滚动到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 添加AI消息到聊天界面
function addAIMessage(message) {
  const chatMessages = document.getElementById("chat-messages");

  // 檢查是否已存在正在輸入的指示器並移除
  const existingTyping = chatMessages.querySelector(".typing");
  if (existingTyping) {
    chatMessages.removeChild(existingTyping);
  }

  // 創建新的消息元素
  const messageElement = document.createElement("div");
  messageElement.className = "message ai-message";

  // 檢查消息是否為有效字串
  if (typeof message !== "string") {
    console.warn("收到非字串類型的消息:", message);
    // 嘗試將對象轉換為字串
    message = JSON.stringify(message);
  }

  // 使用textContent而不是innerHTML，以避免HTML解析問題
  // 同時確保消息非空
  if (message && message.trim()) {
    // 將特殊換行符轉換為<br>標籤
    const formattedMessage = message.replace(/\n/g, "<br>");
    messageElement.innerHTML = formattedMessage;
  } else {
    messageElement.textContent = "未收到有效回覆。";
  }

  chatMessages.appendChild(messageElement);

  // 滚动到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // 調試信息
  console.log("添加AI消息:", message);
}

// 模拟AI回复（实际应用中应该调用OpenAI API）
function simulateAIResponse(userMessage) {
  // 显示正在输入指示器
  const chatMessages = document.getElementById("chat-messages");
  const typingIndicator = document.createElement("div");
  typingIndicator.className = "message ai-message typing";
  typingIndicator.textContent = "正在输入...";
  chatMessages.appendChild(typingIndicator);

  // 滚动到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // 准备请求数据
  const requestData = {
    location: selectedLocation,
    style: selectedStyle,
    message: userMessage,
    chatHistory: chatHistory,
  };

  // 調試信息
  console.log("發送聊天請求:", requestData);

  // 调用后端API获取OpenAI回复
  fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => {
      console.log("收到API響應狀態:", response.status);
      if (!response.ok) {
        throw new Error(`網絡響應不正常: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // 移除输入指示器
      const typingElement = document.querySelector(".typing");
      if (typingElement) {
        chatMessages.removeChild(typingElement);
      }

      // 調試信息
      console.log("解析的API響應:", data);

      // 获取AI回复，確保獲取完整響應
      let aiResponse = "";
      if (data.response) {
        aiResponse = data.response;
      } else if (data.message) {
        aiResponse = `回覆出錯: ${data.message}`;
      } else {
        aiResponse = "無法獲取完整的回覆，請重試。";
      }

      // 確保響應為字符串
      if (typeof aiResponse !== "string") {
        aiResponse = JSON.stringify(aiResponse);
      }

      // 添加AI回复到聊天界面
      addAIMessage(aiResponse);

      // 保存到聊天历史 - 使用'assistant'角色
      chatHistory.push({
        role: "assistant",
        content: aiResponse,
      });

      // 如果响应中包含亮点，添加到导览摘要
      if (data.highlight) {
        tourSummary.highlights.push(data.highlight);
      } else {
        // 默认添加
        tourSummary.highlights.push(`了解了关于${userMessage}的信息`);
      }

      // 滚动到底部
      chatMessages.scrollTop = chatMessages.scrollHeight;
    })
    .catch((error) => {
      console.error("獲取AI回覆出錯:", error);

      // 移除输入指示器
      const typingElement = document.querySelector(".typing");
      if (typingElement) {
        chatMessages.removeChild(typingElement);
      }

      // 显示错误消息
      const errorMessage = `很抱歉，我暫時無法回答您的問題。請稍後再試或嘗試其他問題。錯誤信息: ${error.message}`;
      addAIMessage(errorMessage);

      // 保存到聊天历史
      chatHistory.push({
        role: "assistant",
        content: errorMessage,
      });

      // 滚动到底部
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

// 语音输入
function toggleVoiceInput() {
  const voiceInputBtn = document.getElementById("voice-input-btn");

  if (recognition.listening) {
    // 停止语音识别
    recognition.stop();
    voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    voiceInputBtn.classList.remove("active");
  } else {
    // 开始语音识别
    recognition.start();
    voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    voiceInputBtn.classList.add("active");

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      document.getElementById("message-input").value = transcript;
    };

    recognition.onend = () => {
      voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      voiceInputBtn.classList.remove("active");
    };

    recognition.onerror = (event) => {
      console.error("语音识别错误:", event.error);
      voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      voiceInputBtn.classList.remove("active");
    };
  }
}

// 结束导览
function endTour() {
  // 生成导览总结
  generateTourSummary();

  // 显示总结页面
  showSection("summary-section");
}

// 生成导览总结
function generateTourSummary() {
  // 设置总结页面信息
  document.getElementById("summary-location").textContent =
    tourSummary.location;
  document.getElementById("summary-date").textContent = tourSummary.date;

  // 生成总结内容
  const summaryContent = document.getElementById("summary-content");
  summaryContent.innerHTML = "";

  // 添加亮点
  const highlightsSection = document.createElement("div");
  highlightsSection.innerHTML = `<h4>导览亮点</h4>`;

  if (tourSummary.highlights.length > 0) {
    const uniqueHighlights = [...new Set(tourSummary.highlights)]; // 去重
    const highlightsList = document.createElement("ul");

    uniqueHighlights.slice(0, 5).forEach((highlight) => {
      const item = document.createElement("li");
      item.textContent = highlight;
      highlightsList.appendChild(item);
    });

    highlightsSection.appendChild(highlightsList);
  } else {
    highlightsSection.innerHTML += `<p>没有记录亮点</p>`;
  }

  summaryContent.appendChild(highlightsSection);

  // 添加问答记录
  const questionsSection = document.createElement("div");
  questionsSection.innerHTML = `<h4>问答记录</h4>`;

  if (tourSummary.questions.length > 0) {
    const questionsList = document.createElement("ul");

    tourSummary.questions.forEach((question) => {
      const item = document.createElement("li");
      item.textContent = question;
      questionsList.appendChild(item);
    });

    questionsSection.appendChild(questionsList);
  } else {
    questionsSection.innerHTML += `<p>没有记录问题</p>`;
  }

  summaryContent.appendChild(questionsSection);

  // 添加总结
  const conclusionSection = document.createElement("div");
  conclusionSection.innerHTML = `
        <h4>导览总结</h4>
        <p>您在${tourSummary.date}使用${tourSummary.style}风格探索了${tourSummary.location}。</p>
        <p>希望这次导览为您带来了丰富的体验和知识！</p>
    `;

  summaryContent.appendChild(conclusionSection);
}

// 打印导览总结
function printTourSummary() {
  // 这里应该调用Epson connect API
  // 为了演示，我们只是显示一个提示
  alert("正在连接打印机...\n\n打印功能即将推出");
}

// 分享导览总结
function shareTourSummary() {
  // 这里应该实现分享功能
  // 为了演示，我们只是显示一个提示
  alert("分享功能即将推出");
}

// 保存导览总结
function saveTourSummary() {
  // 这里应该实现保存功能
  // 为了演示，我们只是显示一个提示
  alert("导览记录已保存");
}

// 重置应用
function resetApp() {
  selectedLocation = null;
  selectedStyle = null;
  chatHistory = [];
  tourSummary = {
    location: "",
    style: "",
    date: "",
    highlights: [],
    questions: [],
  };

  // 重置地点选择
  document.querySelectorAll(".location-item").forEach((item) => {
    item.classList.remove("selected");
  });

  // 重置风格选择
  document.querySelectorAll(".style-card").forEach((card) => {
    card.classList.remove("selected");
  });

  // 清空聊天记录
  document.getElementById("chat-messages").innerHTML = "";

  // 清空输入框
  document.getElementById("message-input").value = "";
}

// 显示指定部分
function showSection(sectionId) {
  // 隐藏所有部分
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });

  // 显示指定部分
  document.getElementById(sectionId).classList.add("active");

  // 更新当前部分
  currentSection = sectionId;
}

// 更新导航链接
function updateNavLinks(activeLink) {
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.remove("active");
  });

  if (activeLink) {
    activeLink.classList.add("active");
  }
}
