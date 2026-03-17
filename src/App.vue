<template>
  <div class="page-shell">
    <span class="ambient-shape shape-a"></span>
    <span class="ambient-shape shape-b"></span>

    <main class="app-frame">
      <section v-if="activeModule === 'template'" class="template-module">
        <div class="search-bar">
          <span class="search-icon">⌕</span>
          <input
            v-model.trim="searchKeyword"
            class="search-input"
            type="text"
            placeholder="搜索模板名称"
            @keyup.enter="searchTemplates"
          />
          <button class="search-btn" type="button" @click="searchTemplates">搜索</button>
        </div>

        <div class="theme-row">
          <button
            v-for="theme in templateThemes"
            :key="theme.key"
            type="button"
            class="theme-card"
            :class="{ active: selectedTheme === theme.key }"
            @click="selectedTheme = theme.key"
          >
            <span class="theme-emoji">{{ theme.icon }}</span>
            <span class="theme-name">{{ theme.name }}</span>
          </button>
        </div>

        <div class="category-row">
          <button
            v-for="category in templateCategories"
            :key="category.key"
            type="button"
            class="category-pill"
            :class="{ active: selectedCategory === category.key }"
            @click="selectedCategory = category.key"
          >
            {{ category.name }}
          </button>
        </div>

        <div v-if="filteredTemplates.length" class="template-grid">
          <article
            v-for="template in filteredTemplates"
            :key="template.id"
            class="template-item"
            :class="{ focused: focusedTemplateId === template.id }"
          >
            <div class="template-cover" :style="coverStyle(template)">
              <span class="template-tag">{{ template.tag }}</span>
              <button type="button" class="play-icon" @click.stop="previewTemplate(template)">预览</button>
              <h3>{{ template.name }}</h3>
              <p>{{ template.subtitle }}</p>
            </div>
            <div class="template-footer">
              <span class="template-price">¥ {{ formatPrice(template.price) }}</span>
              <button type="button" class="action-btn ghost" @click="showTemplateDetail(template)">
                查看详情
              </button>
              <button type="button" class="action-btn ghost" @click="addOrder(template)">
                加入订单
              </button>
              <button type="button" class="action-btn primary" @click="openMaker(template)">
                开始制作
              </button>
            </div>
          </article>
        </div>

        <div v-else class="empty-panel">
          没找到匹配模板，请尝试更换关键词或分类。
        </div>
      </section>

      <section v-else-if="activeModule === 'order'" class="order-module">
        <header class="order-header">
          <h2>我的订单</h2>
          <p>已加入 {{ orders.length }} 条订单，合计 ¥ {{ formatPrice(totalPrice) }}</p>
        </header>

        <article v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-top">
            <span>{{ order.createdAt }}</span>
            <span>{{ order.productId }}</span>
            <span class="order-status" :class="order.status">
              {{ order.status === "pending" ? "未支付" : "已支付" }}
            </span>
          </div>

          <div class="order-center">
            <div class="order-thumb" :style="coverStyle(order.template)"></div>
            <div class="order-info">
              <h3>{{ order.template.name }}</h3>
              <p>订单号：{{ order.orderNo }}</p>
              <p>{{ order.template.subtitle }}</p>
            </div>
          </div>

          <div class="order-actions">
            <span class="order-price">¥ {{ formatPrice(order.amount) }}</span>
            <button type="button" class="action-btn ghost" @click="openOrderDetail(order)">
              查看详情
            </button>
            <button type="button" class="action-btn primary" @click="jumpOrder(order)">
              {{ order.status === "pending" ? "去付款" : "跳转模板" }}
            </button>
            <button type="button" class="action-btn danger" @click="deleteOrder(order.id)">
              删除
            </button>
          </div>
        </article>

        <div v-if="!orders.length" class="empty-panel">
          订单列表为空，先去模板页挑选一个喜欢的样式吧。
        </div>
      </section>

      <section v-else class="maker-module">
        <header class="maker-header">
          <button type="button" class="action-btn ghost" @click="backToTemplates">返回模板</button>
          <div>
            <h2>开始制作</h2>
            <p>填写关键信息，生成专属大屏祝福视频</p>
          </div>
        </header>

        <div class="maker-preview" :style="coverStyle(makerTemplate)">
          <button type="button" class="preview-btn" @click="previewTemplate(makerTemplate)">查看模板</button>
        </div>

        <div class="maker-form">
          <label>
            姓名
            <input v-model.trim="makerForm.name" type="text" placeholder="请输入姓名" />
          </label>
          <label>
            年龄
            <input v-model.trim="makerForm.age" type="text" placeholder="例如：18" />
          </label>
          <label>
            时间
            <input v-model.trim="makerForm.time" type="text" placeholder="例如：2026年1月1日" />
          </label>
          <label>
            酒店
            <input v-model.trim="makerForm.hotel" type="text" placeholder="请输入酒店名称" />
          </label>
        </div>

        <button type="button" class="action-btn primary full" :disabled="making" @click="generateVideo">
          {{ making ? "生成中..." : "生成视频" }}
        </button>

        <div v-if="makerResult" class="maker-result">
          <div class="result-media">
            <img :src="makerResult.imageUrl" alt="生成图片" />
          </div>
          <div class="result-media">
            <video controls :src="makerResult.videoUrl"></video>
          </div>
          <div class="maker-actions">
            <a class="action-btn ghost" :href="appendDownload(makerResult.imageUrl)" download>下载图片</a>
            <a class="action-btn ghost" :href="makerResult.docxUrl" target="_blank" rel="noreferrer">下载文档</a>
            <a class="action-btn primary" :href="makerResult.videoUrl" target="_blank" rel="noreferrer">下载视频</a>
          </div>
        </div>
      </section>

      <nav v-if="activeModule !== 'maker'" class="bottom-nav">
        <button
          type="button"
          class="nav-item"
          :class="{ active: activeModule === 'template' }"
          @click="activeModule = 'template'"
        >
          <span class="nav-icon">⌘</span>
          <span>模板</span>
        </button>
        <button
          type="button"
          class="nav-item"
          :class="{ active: activeModule === 'order' }"
          @click="activeModule = 'order'"
        >
          <span class="nav-icon">◔</span>
          <span>我的订单</span>
        </button>
      </nav>
    </main>

    <transition name="fade">
      <div v-if="detailOrder" class="modal-mask" @click.self="detailOrder = null">
        <section class="detail-modal">
          <h3>订单详情</h3>
          <p>模板名称：{{ detailOrder.template.name }}</p>
          <p>订单号：{{ detailOrder.orderNo }}</p>
          <p>商品编号：{{ detailOrder.productId }}</p>
          <p>创建时间：{{ detailOrder.createdAt }}</p>
          <p>状态：{{ detailOrder.status === "pending" ? "未支付" : "已支付" }}</p>
          <p>金额：¥ {{ formatPrice(detailOrder.amount) }}</p>
          <button type="button" class="action-btn primary full" @click="detailOrder = null">
            关闭
          </button>
        </section>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="previewImage" class="modal-mask" @click.self="closePreview">
        <section class="preview-modal">
          <h3>模板预览</h3>
          <img :src="previewImage" alt="模板预览" />
          <div class="preview-actions">
            <a class="action-btn ghost" :href="previewImage" target="_blank" rel="noreferrer">新窗口打开</a>
            <button type="button" class="action-btn primary" @click="closePreview">关闭</button>
          </div>
        </section>
      </div>
    </transition>

    <transition name="toast">
      <div v-if="notice" class="notice">{{ notice }}</div>
    </transition>
  </div>
</template>

<script setup>
import axios from "axios";
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";
const API_ROOT = API_BASE.replace(/\/api\/?$/, "");
const DEFAULT_TEMPLATE_PREVIEW = "/api/assets/templates/1.png";
const http = axios.create({
  baseURL: API_BASE,
  timeout: 300000
});

const resolveApiUrl = (url) => {
  if (!url) {
    return "";
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/api")) {
    return `${API_ROOT}${url}`;
  }
  return url;
};

const appendDownload = (url) => {
  if (!url) {
    return "";
  }
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}download=1`;
};

const fallbackThemes = [
  { key: "all", name: "全部", icon: "🧭" },
  { key: "screen", name: "生日投屏", icon: "🖥️" },
  { key: "study", name: "升学", icon: "🎓" },
  { key: "housewarming", name: "乔迁", icon: "🏠" },
  { key: "birthday", name: "生日祝福", icon: "🎂" },
  { key: "hero", name: "奥特曼", icon: "🦸" }
];

const fallbackCategories = [
  { key: "all", name: "综合" },
  { key: "invitation", name: "邀请函" },
  { key: "tv", name: "电视投屏图" },
  { key: "blessing", name: "祝福视频" }
];

const activeModule = ref("template");
const selectedTheme = ref("all");
const selectedCategory = ref("all");
const searchKeyword = ref("");
const focusedTemplateId = ref(null);

const templateThemes = ref([...fallbackThemes]);
const templateCategories = ref([...fallbackCategories]);
const templates = ref([]);
const orders = ref([]);
const detailOrder = ref(null);
const notice = ref("");

const makerTemplate = ref(null);
const makerForm = reactive({
  name: "",
  age: "",
  time: "",
  hotel: ""
});
const makerResult = ref(null);
const making = ref(false);
const previewImage = ref("");
const currentOrderId = ref(null);

let noticeTimer = null;
let searchTimer = null;
const MAX_MAKING_MS = 300000;
const POLL_INTERVAL = 1500;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let activeTaskId = "";


const filteredTemplates = computed(() => templates.value);
const totalPrice = computed(() =>
  orders.value.reduce((sum, order) => sum + Number(order.amount || 0), 0)
);

const formatPrice = (value) => Number(value || 0).toFixed(1);

const getErrorMessage = (error, fallback) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return fallback;
};

const showNotice = (text) => {
  notice.value = text;
  if (noticeTimer) {
    clearTimeout(noticeTimer);
  }
  noticeTimer = window.setTimeout(() => {
    notice.value = "";
  }, 2200);
};

const getTemplatePreviewUrl = (template) => {
  if (!template) {
    return resolveApiUrl(DEFAULT_TEMPLATE_PREVIEW);
  }
  const rawPreview = template.previewUrl || "";
  const rawCover = template.coverUrl || "";
  const isImage = (value) => {
    if (!value) {
      return false;
    }
    const normalized = value.replace(/\\/g, "/").toLowerCase();
    return normalized.endsWith(".png")
      || normalized.endsWith(".jpg")
      || normalized.endsWith(".jpeg")
      || normalized.endsWith(".webp")
      || normalized.endsWith(".gif");
  };

  const candidate = isImage(rawPreview)
    ? rawPreview
    : (isImage(rawCover) ? rawCover : DEFAULT_TEMPLATE_PREVIEW);

  if (!candidate) {
    return resolveApiUrl(DEFAULT_TEMPLATE_PREVIEW);
  }
  if (candidate.startsWith("http://") || candidate.startsWith("https://") || candidate.startsWith("/api")) {
    return resolveApiUrl(candidate);
  }
  const normalized = candidate.replace(/\\/g, "/");
  const filename = normalized.split("/").pop();
  if (filename) {
    return resolveApiUrl(`/api/assets/templates/${filename}`);
  }
  return resolveApiUrl(DEFAULT_TEMPLATE_PREVIEW);
};

const previewTemplate = (template) => {
  const url = getTemplatePreviewUrl(template);
  if (!url) {
    showNotice("暂无模板图片可预览。");
    return;
  }
  previewImage.value = url;
};

const closePreview = () => {
  previewImage.value = "";
};

const stopTaskPolling = () => {
  activeTaskId = "";
};

const pollTaskStatus = async (taskId) => {
  activeTaskId = taskId;
  const startedAt = Date.now();
  while (activeTaskId === taskId) {
    const { data } = await http.get(`/video/tasks/${taskId}`);
    const statusInfo = normalizeTaskResult(data);

    if (statusInfo.status === "completed") {
      makerResult.value = statusInfo;
      showNotice("生成成功，已输出图片和视频。");
      return;
    }
    if (statusInfo.status === "failed") {
      throw new Error(statusInfo.message || "生成失败，请稍后再试。");
    }
    if (Date.now() - startedAt > MAX_MAKING_MS) {
      throw new Error("生成超时，请稍后在订单中查看。");
    }
    await sleep(POLL_INTERVAL);
  }
};

const normalizeTemplate = (raw) => {
  const colors = Array.isArray(raw?.colors) && raw.colors.length >= 2
    ? raw.colors
    : ["#c90b18", "#81000f"];

  return {
    id: raw?.id,
    templateCode: raw?.templateCode,
    name: raw?.name || "未命名模板",
    subtitle: raw?.subtitle || "",
    theme: raw?.theme || "all",
    category: raw?.category || "all",
    tag: raw?.tag || "模板",
    price: Number(raw?.price || 0),
    colors,
    coverUrl: resolveApiUrl(raw?.coverUrl || ""),
    previewUrl: resolveApiUrl(raw?.previewUrl || "")
  };
};

const normalizeTaskResult = (raw) => {
  const derivedStatus = raw?.status || (raw?.imageUrl && raw?.videoUrl ? "completed" : "processing");
  return {
    taskId: raw?.taskId || "",
    status: derivedStatus,
    imageUrl: resolveApiUrl(raw?.imageUrl || ""),
    videoUrl: resolveApiUrl(raw?.videoUrl || ""),
    docxUrl: resolveApiUrl(raw?.docxUrl || ""),
    message: raw?.message || ""
  };
};

const normalizeOrder = (raw) => {
  const template = normalizeTemplate(raw?.template || {});
  return {
    id: raw?.id,
    createdAt: raw?.createdAt || "",
    productId: raw?.productId || "",
    orderNo: raw?.orderNo || "",
    status: raw?.status || "pending",
    amount: Number(raw?.amount || template.price || 0),
    template
  };
};

const coverStyle = (item) => {
  const colors = Array.isArray(item?.colors) && item.colors.length >= 2
    ? item.colors
    : ["#c90b18", "#81000f"];

  if (item?.coverUrl) {
    return {
      backgroundImage: `url(${item.coverUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundColor: "#8b0d1a"
    };
  }

  return {
    background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`
  };
};

const loadThemes = async () => {
  try {
    const { data } = await http.get("/templates/themes");
    if (Array.isArray(data) && data.length > 0) {
      const iconMap = fallbackThemes.reduce((map, theme) => {
        map[theme.key] = theme.icon;
        return map;
      }, {});
      templateThemes.value = data.map((item) => ({
        key: item.key,
        name: item.name,
        icon: iconMap[item.key] || "图"
      }));
      return;
    }
  } catch (error) {
    showNotice(getErrorMessage(error, "主题列表加载失败，已使用本地数据。"));
  }
  templateThemes.value = [...fallbackThemes];
};

const loadCategories = async () => {
  try {
    const { data } = await http.get("/templates/categories");
    if (Array.isArray(data) && data.length > 0) {
      templateCategories.value = data.map((item) => ({
        key: item.key,
        name: item.name
      }));
      return;
    }
  } catch (error) {
    showNotice(getErrorMessage(error, "分类列表加载失败，已使用本地数据。"));
  }
  templateCategories.value = [...fallbackCategories];
};

const loadTemplates = async () => {
  const params = {
    keyword: searchKeyword.value || undefined,
    theme: selectedTheme.value,
    category: selectedCategory.value
  };

  const { data } = await http.get("/templates", { params });
  templates.value = Array.isArray(data) ? data.map(normalizeTemplate) : [];
};

const loadOrders = async () => {
  const { data } = await http.get("/orders");
  orders.value = Array.isArray(data) ? data.map(normalizeOrder) : [];
};

const searchTemplates = async () => {
  try {
    await loadTemplates();
  } catch (error) {
    showNotice(getErrorMessage(error, "模板加载失败，请检查后端服务。"));
  }
};

const showTemplateDetail = async (template) => {
  try {
    const { data } = await http.get(`/templates/${template.id}`);
    const detail = normalizeTemplate(data);
    showNotice(`模板“${detail.name}”支持一键替换文字和图片。`);
  } catch (error) {
    showNotice(getErrorMessage(error, "获取模板详情失败。"));
  }
};

const addOrder = async (template) => {
  try {
    await http.post("/orders", {
      templateId: template.id
    });
    await loadOrders();
    showNotice(`已加入订单：${template.name}`);
  } catch (error) {
    showNotice(getErrorMessage(error, "创建订单失败。"));
  }
};

const openMaker = (template) => {
  stopTaskPolling();
  makerTemplate.value = template;
  makerResult.value = null;
  Object.assign(makerForm, {
    name: "",
    age: "",
    time: "",
    hotel: ""
  });
  activeModule.value = "maker";
};

const backToTemplates = () => {
  stopTaskPolling();
  making.value = false;
  currentOrderId.value = null;
  activeModule.value = "template";
};

const generateVideo = async () => {
  if (!makerTemplate.value) {
    showNotice("请选择模板后再制作。");
    return;
  }
  if (!makerForm.name || !makerForm.age || !makerForm.time || !makerForm.hotel) {
    showNotice("请完整填写姓名、年龄、时间和酒店。");
    return;
  }

  try {
    making.value = true;
    makerResult.value = null;
    stopTaskPolling();

    const { data } = await http.post("/video/tasks?async=true", {
      templateId: makerTemplate.value.id,
      name: makerForm.name,
      age: makerForm.age,
      time: makerForm.time,
      hotel: makerForm.hotel,
      orderId: currentOrderId.value || undefined
    });

    const taskInfo = normalizeTaskResult(data);
    if (!taskInfo.taskId) {
      throw new Error("未获取到任务编号，请稍后重试。");
    }

    if (taskInfo.status === "failed") {
      throw new Error(taskInfo.message || "生成失败，请稍后再试。");
    }

    if (taskInfo.status === "completed") {
      makerResult.value = taskInfo;
      showNotice("生成成功，已输出图片和视频。");
      return;
    }

    await pollTaskStatus(taskInfo.taskId);
  } catch (error) {
    showNotice(getErrorMessage(error, "生成失败，请稍后再试。"));
  } finally {
    making.value = false;
  }
};

const openOrderDetail = async (order) => {
  try {
    const { data } = await http.get(`/orders/${order.id}`);
    detailOrder.value = normalizeOrder(data);
  } catch (error) {
    showNotice(getErrorMessage(error, "获取订单详情失败。"));
  }
};

const jumpOrder = async (order) => {
  try {
    if (order.status === "pending") {
      await http.put(`/orders/${order.id}/pay`);
      await loadOrders();
      showNotice("支付成功，订单状态已更新。" );
      return;
    }

    const { data } = await http.get(`/orders/${order.id}/jump`);
    const targetTemplate = normalizeTemplate(data);

    activeModule.value = "template";
    selectedTheme.value = "all";
    selectedCategory.value = "all";
    searchKeyword.value = targetTemplate.name;
    currentOrderId.value = order.id;
    await loadTemplates();

    focusedTemplateId.value = targetTemplate.id;
    showNotice("已跳转到对应模板。" );
  } catch (error) {
    showNotice(getErrorMessage(error, "订单跳转失败。"));
  }
};

const deleteOrder = async (orderId) => {
  try {
    await http.delete(`/orders/${orderId}`);
    if (detailOrder.value?.id === orderId) {
      detailOrder.value = null;
    }
    await loadOrders();
    showNotice("订单已删除。" );
  } catch (error) {
    showNotice(getErrorMessage(error, "删除订单失败。"));
  }
};

watch([selectedTheme, selectedCategory], async () => {
  await searchTemplates();
});

watch(searchKeyword, () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  searchTimer = window.setTimeout(() => {
    searchTemplates();
  }, 300);
});

onMounted(async () => {
  await Promise.all([loadThemes(), loadCategories()]);
  await Promise.all([searchTemplates(), loadOrders()]);
});

onBeforeUnmount(() => {
  stopTaskPolling();
  closePreview();
  if (noticeTimer) {
    clearTimeout(noticeTimer);
  }
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
});
</script>

<style>
html,
body,
#app {
  margin: 0;
  min-height: 100%;
}

body {
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
}
</style>

<style scoped>
.page-shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 9% -2%, rgba(246, 228, 127, 0.76), transparent 28%),
    radial-gradient(circle at 85% 12%, rgba(248, 216, 125, 0.68), transparent 22%),
    linear-gradient(180deg, #f6e78f 0%, #f3e6be 30%, #edf0f3 56%, #e8edf5 100%);
}

.ambient-shape {
  position: absolute;
  border-radius: 999px;
  filter: blur(2px);
}

.shape-a {
  top: -80px;
  left: -120px;
  width: 260px;
  height: 260px;
  background: rgba(255, 255, 255, 0.18);
}

.shape-b {
  right: -80px;
  top: 120px;
  width: 220px;
  height: 220px;
  background: rgba(255, 255, 255, 0.2);
}

.app-frame {
  position: relative;
  z-index: 1;
  max-width: 1260px;
  margin: 0 auto;
  padding: 12px 10px 92px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 8px 12px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(150, 126, 44, 0.2);
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(104, 83, 10, 0.08);
}

.search-icon {
  color: #666;
  font-size: 16px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #393939;
  outline: none;
}

.search-btn {
  border: none;
  border-radius: 14px;
  padding: 6px 18px;
  background: linear-gradient(120deg, #5f66ff, #4861dc);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.theme-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(92px, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.theme-card {
  border: 1px solid rgba(128, 104, 31, 0.2);
  border-radius: 14px;
  background: rgba(255, 249, 229, 0.68);
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  color: #2f2f2f;
  cursor: pointer;
  transition: all 0.25s ease;
}

.theme-card.active {
  transform: translateY(-3px);
  background: #fff5d0;
  border-color: rgba(160, 121, 8, 0.48);
  box-shadow: 0 8px 20px rgba(100, 69, 15, 0.16);
}

.theme-emoji {
  font-size: 52px;
  line-height: 1;
}

.theme-name {
  font-size: 14px;
}

.category-row {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  padding-bottom: 2px;
  overflow-x: auto;
}

.category-pill {
  border: none;
  border-radius: 10px;
  padding: 6px 12px;
  color: #666;
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  white-space: nowrap;
}

.category-pill.active {
  background: linear-gradient(120deg, #6b6dff, #4f62d8);
  color: #fff;
}

.template-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.template-item {
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(170, 170, 170, 0.25);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(24, 18, 0, 0.08);
  transition: transform 0.25s ease;
}

.template-item.focused {
  animation: pulse 1.4s ease;
}

.template-item:hover {
  transform: translateY(-4px);
}

.template-cover {
  position: relative;
  min-height: 220px;
  padding: 16px;
  color: #fff8e4;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.template-cover::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 80% 20%, rgba(255, 224, 171, 0.32), transparent 34%),
    repeating-linear-gradient(
      -40deg,
      rgba(255, 255, 255, 0.03),
      rgba(255, 255, 255, 0.03) 8px,
      transparent 8px,
      transparent 16px
    );
}

.template-cover h3,
.template-cover p {
  position: relative;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.template-cover h3 {
  font-size: 24px;
}

.template-cover p {
  margin-top: 6px;
  font-size: 14px;
  opacity: 0.92;
}

.template-tag {
  position: absolute;
  left: 12px;
  top: 12px;
  z-index: 1;
  border-radius: 999px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.24);
  font-size: 12px;
}

.play-icon {
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 2;
  min-width: 44px;
  height: 26px;
  padding: 0 8px;
  border-radius: 999px;
  border: none;
  background: rgba(0, 0, 0, 0.32);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.play-icon:hover {
  transform: scale(1.04);
  background: rgba(0, 0, 0, 0.5);
}

.template-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px;
}

.template-price {
  font-weight: 700;
  color: #e14636;
  margin-right: auto;
}

.action-btn {
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
}

.action-btn.ghost {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(87, 93, 113, 0.36);
  color: #39414f;
}

.action-btn.primary {
  background: linear-gradient(120deg, #5d66fe, #4d58e7);
  color: #fff;
}

.action-btn.danger {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(195, 62, 72, 0.45);
  color: #cc3c46;
}

.action-btn.full {
  width: 100%;
  margin-top: 12px;
}

.order-module {
  margin-top: 4px;
}

.order-header {
  border-radius: 14px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(176, 176, 176, 0.26);
  box-shadow: 0 8px 20px rgba(27, 27, 27, 0.08);
}

.order-header h2 {
  margin: 0;
  font-size: 28px;
}

.order-header p {
  margin: 8px 0 0;
  color: #5d6570;
}

.order-card {
  margin-top: 12px;
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(177, 177, 177, 0.3);
  box-shadow: 0 8px 20px rgba(17, 17, 17, 0.08);
}

.order-top {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
  font-size: 13px;
  color: #6c7382;
}

.order-status.pending {
  color: #e39700;
}

.order-status.paid {
  color: #0f8a2a;
}

.order-center {
  margin-top: 10px;
  display: flex;
  gap: 12px;
}

.order-thumb {
  width: 120px;
  border-radius: 10px;
  flex-shrink: 0;
  min-height: 78px;
}

.order-info h3 {
  margin: 0;
  font-size: 16px;
  color: #2f333c;
}

.order-info p {
  margin: 6px 0 0;
  color: #5c6372;
  font-size: 13px;
}

.order-actions {
  margin-top: 12px;
  border-top: 1px dashed rgba(130, 130, 130, 0.35);
  padding-top: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.order-price {
  margin-right: auto;
  color: #dc452f;
  font-weight: 700;
}

.empty-panel {
  margin-top: 16px;
  border-radius: 12px;
  padding: 18px;
  text-align: center;
  color: #5a6170;
  background: rgba(255, 255, 255, 0.7);
  border: 1px dashed rgba(140, 140, 140, 0.3);
}

.maker-module {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.maker-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 24px rgba(18, 18, 18, 0.08);
}

.maker-header h2 {
  margin: 0;
  font-size: 22px;
}

.maker-header p {
  margin: 6px 0 0;
  color: #5d6570;
  font-size: 13px;
}

.maker-preview {
  position: relative;
  border-radius: 16px;
  min-height: 260px;
  background-size: cover;
  background-position: center;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 30px rgba(12, 12, 12, 0.12);
}

.maker-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 24px rgba(16, 16, 16, 0.08);
}

.maker-form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #495160;
  font-size: 13px;
}

.maker-form input {
  border: 1px solid rgba(130, 130, 130, 0.3);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
}

.maker-result {
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  display: grid;
  gap: 12px;
  box-shadow: 0 10px 24px rgba(16, 16, 16, 0.08);
}

.result-media img,
.result-media video {
  width: 100%;
  border-radius: 12px;
  background: #000;
}

.maker-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.bottom-nav {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  width: min(1260px, 100vw);
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid rgba(120, 120, 120, 0.26);
  box-shadow: 0 -8px 24px rgba(28, 28, 28, 0.08);
}

.nav-item {
  border: none;
  background: transparent;
  padding: 8px 0 10px;
  color: #555c69;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
}

.nav-item.active {
  color: #5260e6;
  font-weight: 600;
}

.nav-icon {
  font-size: 24px;
  line-height: 1;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(16, 18, 26, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 15;
}

.preview-btn {
  position: absolute;
  right: 12px;
  bottom: 12px;
  border: none;
  border-radius: 999px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.preview-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

.preview-modal {
  width: min(720px, 92vw);
  border-radius: 16px;
  padding: 16px;
  background: #fff;
  box-shadow: 0 18px 32px rgba(10, 10, 10, 0.28);
}

.preview-modal h3 {
  margin: 0 0 12px;
  font-size: 18px;
}

.preview-modal img {
  width: 100%;
  border-radius: 12px;
  display: block;
  border: 1px solid rgba(220, 220, 220, 0.8);
}

.preview-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 12px;
}

.detail-modal {
  width: min(420px, 100%);
  border-radius: 14px;
  padding: 16px;
  background: #fff;
  box-shadow: 0 18px 32px rgba(10, 10, 10, 0.28);
}

.detail-modal h3 {
  margin: 0 0 10px;
}

.detail-modal p {
  margin: 8px 0 0;
  color: #4f5766;
}

.notice {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 80px;
  border-radius: 999px;
  background: rgba(22, 27, 43, 0.9);
  color: #fff;
  padding: 8px 16px;
  font-size: 13px;
  z-index: 20;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 6px);
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 10px 28px rgba(24, 18, 0, 0.08);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(81, 96, 230, 0.2), 0 10px 28px rgba(24, 18, 0, 0.08);
  }
}

@media (max-width: 980px) {
  .theme-row {
    display: flex;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .theme-card {
    min-width: 106px;
  }
}

@media (max-width: 760px) {
  .maker-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .template-grid {
    grid-template-columns: 1fr;
  }

  .template-cover {
    min-height: 190px;
  }

  .order-top {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .order-center {
    flex-direction: column;
  }

  .order-thumb {
    width: 100%;
    min-height: 140px;
  }

  .order-actions {
    flex-wrap: wrap;
  }
}
</style>