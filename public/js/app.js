// 全局變量
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

// 語音識別API
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
  // 導航鏈接
  const homeLink = document.getElementById("home-link");
  const historyLink = document.getElementById("history-link");
  const aboutLink = document.getElementById("about-link");

  // 歡迎頁面
  const startTourBtn = document.getElementById("start-tour-btn");

  // 地點選擇頁面
  const locationSearchInput = document.getElementById("location-search");
  const searchBtn = document.getElementById("search-btn");
  const locationList = document.getElementById("location-list");
  const useCurrentLocationBtn = document.getElementById("use-current-location");
  const nextToStyleBtn = document.getElementById("next-to-style");

  // 風格選擇頁面
  const styleCards = document.querySelectorAll(".style-card");
  const backToLocationBtn = document.getElementById("back-to-location");
  const nextToChatBtn = document.getElementById("next-to-chat");

  // 聊天頁面
  const backToStyleBtn = document.getElementById("back-to-style");
  const endTourBtn = document.getElementById("end-tour-btn");
  const locationNameEl = document.getElementById("location-name");
  const guideStyleEl = document.getElementById("guide-style");
  const chatMessages = document.getElementById("chat-messages");
  const messageInput = document.getElementById("message-input");
  const sendMessageBtn = document.getElementById("send-message-btn");
  const voiceInputBtn = document.getElementById("voice-input-btn");

  // 總結頁面
  const summaryLocationEl = document.getElementById("summary-location");
  const summaryDateEl = document.getElementById("summary-date");
  const summaryContentEl = document.getElementById("summary-content");
  const printSummaryBtn = document.getElementById("print-summary-btn");
  const shareSummaryBtn = document.getElementById("share-summary-btn");
  const saveSummaryBtn = document.getElementById("save-summary-btn");
  const newTourBtn = document.getElementById("new-tour-btn");

  // 初始化頁面
  initApp();

  // 事件監聽器
  homeLink.addEventListener("click", (e) => {
    e.preventDefault();
    showSection("welcome-section");
    updateNavLinks(homeLink);
  });

  historyLink.addEventListener("click", (e) => {
    e.preventDefault();
    // 這裡可以添加歷史記錄頁面的邏輯
    alert("歷史記錄功能即將推出");
  });

  aboutLink.addEventListener("click", (e) => {
    e.preventDefault();
    // 這裡可以添加關於我們頁面的邏輯
    alert("關於我們功能即將推出");
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
      alert("請先選擇一個地點");
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
      alert("請先選擇一個導覽風格");
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

// 初始化應用
function initApp() {
  // 加載示例地點
  loadSampleLocations();

  // 初始化地圖
  initMap();
}

// 加載示例地點
function loadSampleLocations() {
  const sampleLocations = [
    {
      id: 1,
      name: "台北101",
      description: "台北地標性建築，曾是世界最高建築",
      location: "台北市信義區信義路五段7號",
      category: "建築",
    },
    {
      id: 2,
      name: "故宮博物院",
      description: "收藏大量中國古代藝術品和文物的博物館",
      location: "台北市士林區至善路二段221號",
      category: "博物館",
    },
    {
      id: 3,
      name: "陽明山國家公園",
      description: "以溫泉和火山地質景觀聞名的國家公園",
      location: "台北市北投區竹子湖路1-20號",
      category: "自然景觀",
    },
    {
      id: 4,
      name: "九份老街",
      description: "保留日據時代建築風格的山城老街",
      location: "新北市瑞芳區基山街",
      category: "歷史街區",
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

// 初始化地圖（這裡使用佔位符，實際應用中可以集成Google Maps或其他地圖服務）
function initMap() {
  const mapElement = document.getElementById("location-map");
  mapElement.innerHTML =
    '<div style="display: flex; justify-content: center; align-items: center; height: 100%; background-color: #f0f0f0;"><p>地圖加載中...</p></div>';

  // 這裡可以添加實際地圖初始化代碼
  // 例如：使用Google Maps API
}

// 搜索地點
function searchLocations(query) {
  if (!query.trim()) {
    alert("請輸入搜索關鍵詞");
    return;
  }

  // 這裡應該調用API搜索地點
  // 為了演示，我們只是過濾示例數據
  const filteredLocations = [
    {
      id: 1,
      name: "台北101",
      description: "台北地標性建築，曾是世界最高建築",
      location: "台北市信義區信義路五段7號",
      category: "建築",
    },
  ];

  const locationList = document.getElementById("location-list");
  locationList.innerHTML = "";

  if (filteredLocations.length === 0) {
    locationList.innerHTML = "<p>未找到匹配的地點</p>";
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

// 獲取當前位置
function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 這裡應該調用API根據坐標獲取附近的地點
        // 為了演示，我們只是顯示一個示例地點
        const currentLocation = {
          id: 5,
          name: "當前位置",
          description: "根據您的GPS定位",
          location: `緯度: ${position.coords.latitude.toFixed(
            4
          )}, 經度: ${position.coords.longitude.toFixed(4)}`,
          category: "當前位置",
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
        console.error("獲取位置失敗:", error);
        alert("無法獲取您的位置，請檢查位置權限設置");
      }
    );
  } else {
    alert("您的瀏覽器不支持地理定位");
  }
}

// 開始導覽
function startTour() {
  // 設置聊天界面信息
  document.getElementById("location-name").textContent = selectedLocation.name;

  let styleText = "";
  switch (selectedStyle) {
    case "historical":
      styleText = "歷史學者";
      break;
    case "local":
      styleText = "在地人";
      break;
    case "fun":
      styleText = "趣味導遊";
      break;
    default:
      styleText = "導覽助手";
  }

  document.getElementById("guide-style").textContent = styleText;

  // 清空聊天記錄
  chatHistory = [];
  document.getElementById("chat-messages").innerHTML = "";

  // 顯示聊天界面
  showSection("chat-section");

  // 發送歡迎消息
  setTimeout(() => {
    const welcomeMessage = `歡迎來到${selectedLocation.name}！我是您的${styleText}導覽助手。有什麼想了解的，隨時可以問我。`;
    addAIMessage(welcomeMessage);

    // 保存到聊天歷史 - 使用'assistant'角色而不是'ai'
    chatHistory.push({
      role: "assistant",
      content: welcomeMessage,
    });

    // 保存到導覽摘要
    tourSummary.location = selectedLocation.name;
    tourSummary.style = styleText;
    tourSummary.date = new Date().toLocaleString("zh-TW");
  }, 500);
}

// 發送消息
function sendMessage() {
  const messageInput = document.getElementById("message-input");
  const message = messageInput.value.trim();

  if (!message) return;

  // 添加用戶消息到聊天界面
  addUserMessage(message);

  // 保存到聊天歷史
  chatHistory.push({
    role: "user",
    content: message,
  });

  // 保存到導覽摘要的問題列表
  tourSummary.questions.push(message);

  // 清空輸入框
  messageInput.value = "";

  // 模擬AI回復
  simulateAIResponse(message);
}

// 添加用戶消息到聊天界面
function addUserMessage(message) {
  const chatMessages = document.getElementById("chat-messages");
  const messageElement = document.createElement("div");
  messageElement.className = "message user-message";
  messageElement.textContent = message;
  chatMessages.appendChild(messageElement);

  // 滾動到底部
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

  // 滾動到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // 調試信息
  console.log("添加AI消息:", message);
}

// 模擬AI回復（實際應用中應該調用OpenAI API）
function simulateAIResponse(userMessage) {
  // 顯示正在輸入指示器
  const chatMessages = document.getElementById("chat-messages");
  const typingIndicator = document.createElement("div");
  typingIndicator.className = "message ai-message typing";
  typingIndicator.textContent = "正在輸入...";
  chatMessages.appendChild(typingIndicator);

  // 滾動到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // 準備請求數據
  const requestData = {
    location: selectedLocation,
    style: selectedStyle,
    message: userMessage,
    chatHistory: chatHistory,
  };

  // 調試信息
  console.log("發送聊天請求:", requestData);

  // 調用後端API獲取OpenAI回復
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
      // 移除輸入指示器
      const typingElement = document.querySelector(".typing");
      if (typingElement) {
        chatMessages.removeChild(typingElement);
      }

      // 調試信息
      console.log("解析的API響應:", data);

      // 獲取AI回復，確保獲取完整響應
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

      // 添加AI回復到聊天界面
      addAIMessage(aiResponse);

      // 保存到聊天歷史 - 使用'assistant'角色
      chatHistory.push({
        role: "assistant",
        content: aiResponse,
      });

      // 如果響應中包含亮點，添加到導覽摘要
      if (data.highlight) {
        tourSummary.highlights.push(data.highlight);
      } else {
        // 默認添加
        tourSummary.highlights.push(`了解了關於${userMessage}的信息`);
      }

      // 滾動到底部
      chatMessages.scrollTop = chatMessages.scrollHeight;
    })
    .catch((error) => {
      console.error("獲取AI回覆出錯:", error);

      // 移除輸入指示器
      const typingElement = document.querySelector(".typing");
      if (typingElement) {
        chatMessages.removeChild(typingElement);
      }

      // 顯示錯誤消息
      const errorMessage = `很抱歉，我暫時無法回答您的問題。請稍後再試或嘗試其他問題。錯誤信息: ${error.message}`;
      addAIMessage(errorMessage);

      // 保存到聊天歷史
      chatHistory.push({
        role: "assistant",
        content: errorMessage,
      });

      // 滾動到底部
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

// 語音輸入
function toggleVoiceInput() {
  const voiceInputBtn = document.getElementById("voice-input-btn");

  if (recognition.listening) {
    // 停止語音識別
    recognition.stop();
    voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    voiceInputBtn.classList.remove("active");
  } else {
    // 開始語音識別
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
      console.error("語音識別錯誤:", event.error);
      voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      voiceInputBtn.classList.remove("active");
    };
  }
}

// 結束導覽
function endTour() {
  // 生成導覽總結
  generateTourSummary();

  // 顯示總結頁面
  showSection("summary-section");
}

// 生成導覽總結
function generateTourSummary() {
  // 設置總結頁面信息
  document.getElementById("summary-location").textContent =
    tourSummary.location;
  document.getElementById("summary-date").textContent = tourSummary.date;

  // 生成總結內容
  const summaryContent = document.getElementById("summary-content");
  summaryContent.innerHTML = "";

  // 添加亮點
  const highlightsSection = document.createElement("div");
  highlightsSection.innerHTML = `<h4>導覽亮點</h4>`;

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
    highlightsSection.innerHTML += `<p>沒有記錄亮點</p>`;
  }

  summaryContent.appendChild(highlightsSection);

  // 添加問答記錄
  const questionsSection = document.createElement("div");
  questionsSection.innerHTML = `<h4>問答記錄</h4>`;

  if (tourSummary.questions.length > 0) {
    const questionsList = document.createElement("ul");

    tourSummary.questions.forEach((question) => {
      const item = document.createElement("li");
      item.textContent = question;
      questionsList.appendChild(item);
    });

    questionsSection.appendChild(questionsList);
  } else {
    questionsSection.innerHTML += `<p>沒有記錄問題</p>`;
  }

  summaryContent.appendChild(questionsSection);

  // 添加總結
  const conclusionSection = document.createElement("div");
  conclusionSection.innerHTML = `
        <h4>導覽總結</h4>
        <p>您在${tourSummary.date}使用${tourSummary.style}風格探索了${tourSummary.location}。</p>
        <p>希望這次導覽為您帶來了豐富的體驗和知識！</p>
    `;

  summaryContent.appendChild(conclusionSection);
}

// 列印導覽總結
function printTourSummary() {
  // 這裡應該調用Epson connect API
  // 為了演示，我們只是顯示一個提示
  alert("正在連接印表機...\n\n列印功能即將推出");
}

// 分享導覽總結
function shareTourSummary() {
  // 這裡應該實現分享功能
  // 為了演示，我們只是顯示一個提示
  alert("分享功能即將推出");
}

// 保存導覽總結
function saveTourSummary() {
  // 這裡應該實現保存功能
  // 為了演示，我們只是顯示一個提示
  alert("導覽記錄已保存");
}

// 重置應用
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

  // 重置地點選擇
  document.querySelectorAll(".location-item").forEach((item) => {
    item.classList.remove("selected");
  });

  // 重置風格選擇
  document.querySelectorAll(".style-card").forEach((card) => {
    card.classList.remove("selected");
  });

  // 清空聊天記錄
  document.getElementById("chat-messages").innerHTML = "";

  // 清空輸入框
  document.getElementById("message-input").value = "";
}

// 顯示指定部分
function showSection(sectionId) {
  // 隱藏所有部分
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });

  // 顯示指定部分
  document.getElementById(sectionId).classList.add("active");

  // 更新當前部分
  currentSection = sectionId;
}

// 更新導航鏈接
function updateNavLinks(activeLink) {
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.remove("active");
  });

  if (activeLink) {
    activeLink.classList.add("active");
  }
}
