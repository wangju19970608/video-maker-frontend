<template>
  <div class="mobile-app">
    <header class="app-header">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model.trim="searchKeyword"
          type="text"
          placeholder="婚礼海报"
          @keyup.enter="searchTemplates"
        />
        <span class="camera-icon">📷</span>
      </div>
    </header>

    <main class="app-main" :class="{ 'pad-bottom': activeModule !== 'maker' && activeModule !== 'profile' }">
      <section v-if="activeModule === 'template'" class="module-template">
        <div class="theme-grid">
          <div
            v-for="theme in templateThemes"
            :key="theme.key"
            class="theme-item"
            @click="selectedTheme = theme.key"
          >
            <div class="theme-icon-wrap" :class="{'active-theme': selectedTheme === theme.key}">
              <span class="theme-emoji">{{ theme.icon }}</span>
            </div>
            <span class="theme-name" :class="{'active-text': selectedTheme === theme.key}">{{ theme.name }}</span>
          </div>
        </div>

        <div class="promo-banners">
          <div class="promo-card promo-left">
            <div class="promo-text">
              <h3>婚礼MV <span>HOT</span></h3>
              <p>现场大屏</p>
            </div>
            <span class="promo-icon">🎬</span>
          </div>
          <div class="promo-card promo-right">
            <div class="promo-text">
              <h3>海报图片</h3>
              <p>结婚海报</p>
            </div>
            <span class="promo-icon">🖼️</span>
          </div>
        </div>

        <div class="category-scroll">
          <span class="cat-title">婚贝精选</span>
          <div class="cat-tabs">
            <span
              v-for="category in templateCategories"
              :key="category.key"
              class="cat-tab"
              :class="{ active: selectedCategory === category.key }"
              @click="selectedCategory = category.key"
            >
              {{ category.name }}
            </span>
          </div>
        </div>

        <div v-if="filteredTemplates.length" class="template-masonry">
          <article
            v-for="template in filteredTemplates"
            :key="template.id"
            class="template-card"
            @click="showTemplateDetail(template)"
          >
            <div class="card-cover" :style="coverStyle(template)">
              <video v-if="(getTemplatePreviewUrl(template) || '').endsWith('.mp4')" :src="getTemplatePreviewUrl(template)" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; pointer-events: none;" muted playsinline loop onmouseover="this.play()" onmouseout="this.pause()"></video>
              <span v-if="template.tag" class="card-tag" style="z-index: 1;">{{ template.tag }}</span>
              <div class="card-overlay" style="z-index: 2;">
                <button type="button" @click.stop="addOrder(template)" class="btn-make">制作</button>
              </div>
            </div>
            <div class="card-info">
              <h4>{{ template.name }}</h4>
            </div>
          </article>
        </div>
        <div v-else class="empty-state">没有符合的模板</div>
      </section>

      <section v-else-if="activeModule === 'order'" class="module-order">
        <h2 class="module-title">作品管理 / 订单</h2>
        <div v-if="!orders.length" class="empty-state">暂无订单记录</div>
        <div class="order-list">
          <article v-for="order in orders" :key="order.id" class="order-card">
            <div class="order-header">
              <span class="order-date">{{ order.createdAt }}</span>
              <span class="order-status" :class="order.status">{{ order.status === 'pending' ? '未付款' : '已付款' }}</span>
            </div>
            <div class="order-body">
              <div class="order-cover" :style="coverStyle(order.template)"></div>
              <div class="order-detail">
                <h3>{{ order.template.name }}</h3>
                <p>次数: {{ order.usedGenerateCount }} / {{ order.maxGenerateCount }}</p>

                <div v-if="order.historicalTasks && order.historicalTasks.length > 0" class="history-block">
                  <div class="history-title">制作记录：</div>
                  <div v-for="(task, index) in order.historicalTasks" :key="task.taskId" class="history-item">
                    <span>记录#{{ order.historicalTasks.length - index }}</span>
                    <div class="history-actions">
                      <div class="action-group">
                        <button @click.stop="previewTaskMedia(task.taskId, 'image')">看图</button>
                        <button @click.stop="downloadTaskFile(task.taskId, 'image')">存图</button>
                      </div>
                      <div class="action-group">
                        <button @click.stop="previewTaskMedia(task.taskId, 'video')">看视频</button>
                        <button @click.stop="downloadTaskFile(task.taskId, 'video')">存视频</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else-if="order.taskId" class="history-block">
                  <div class="history-actions">
                    <div class="action-group">
                      <button @click.stop="previewTaskMedia(order.taskId, 'image')">预览照片</button>
                      <button @click.stop="downloadTaskFile(order.taskId, 'image')">下载照片</button>
                    </div>
                    <div class="action-group">
                      <button @click.stop="previewTaskMedia(order.taskId, 'video')">预览视频</button>
                      <button @click.stop="downloadTaskFile(order.taskId, 'video')">下载视频</button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            <div class="order-footer">
              <button class="btn-outline" @click="deleteOrder(order.id)">删除</button>
              <button class="btn-primary" :disabled="order.usedGenerateCount >= order.maxGenerateCount" @click="jumpOrder(order)">
                {{ order.status === "pending" ? "去付款" : "去制作" }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- 我的页面 -->
      <section v-else-if="activeModule === 'profile'" class="module-profile">
        <h2 class="module-title">个人中心</h2>
        <div class="profile-menu">
          <div class="menu-item" @click="showCustomerService">
            <span class="menu-icon">💬</span>
            <span class="menu-text">联系客服</span>
            <span class="menu-arrow">›</span>
          </div>
        </div>
      </section>

      <section v-else class="module-maker">
        <div class="maker-nav">
          <button @click="backToTemplates" class="btn-back">← 返回</button>
          <h2>信息填写</h2>
        </div>
        <div class="maker-cover" :style="coverStyle(makerTemplate)">
          <video v-if="(getTemplatePreviewUrl(makerTemplate) || '').endsWith('.mp4')" :src="getTemplatePreviewUrl(makerTemplate)" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" controls playsinline></video>
          <button v-else class="btn-preview" style="z-index: 2;" @click="previewTemplate(makerTemplate)">预览演示</button>
        </div>
        <div class="maker-form">
          <template v-if="makerTemplate && makerTemplate.templateType === 'video'">
            <div class="form-group">
              <label>新郎/新娘姓名（或名称）</label>
              <input v-model.trim="makerForm.name" placeholder="请输入姓名或名称" />
            </div>
            <div class="form-group">
              <label>相关数字与年龄</label>
              <input v-model.trim="makerForm.age" placeholder="例如：4" />
            </div>
            <div class="form-group">
              <label>修改祝福语</label>
              <input v-model.trim="makerForm.time" placeholder="输入送上的祝福词" />
            </div>
            <div class="form-group">
              <label>上传照片</label>
              <button @click="onChooseImage" class="btn-outline" style="width:100%; padding: 10px; border-radius: 4px;">选择照片</button>
              <div v-if="localImagePreview" style="margin-top: 10px; text-align: center;">
                <img :src="localImagePreview" style="max-width: 100%; border-radius: 4px; max-height: 200px; object-fit: contain;" />
              </div>
            </div>
          </template>
          
          <template v-else>
            <div class="form-group">
              <label>新郎/新娘姓名</label>
              <input v-model.trim="makerForm.name" placeholder="如：张三 & 李四" />
            </div>
            <div class="form-group">
              <label>婚礼日期</label>
              <input v-model.trim="makerForm.time" placeholder="如：2026年5月20日" />
            </div>
            <div class="form-group">
              <label>年龄或桌数参考</label>
              <input v-model.trim="makerForm.age" placeholder="例如：24" />
            </div>
            <div class="form-group">
              <label>举办场地酒店</label>
              <input v-model.trim="makerForm.hotel" placeholder="如：洲际大酒店" />
            </div>
          </template>
        </div>
        <div class="maker-submit">
          <button class="btn-generate" :disabled="making" @click="generateVideo">
            {{ making ? "正在飞速生成中..." : "一键AI创作" }}
          </button>
        </div>
        <div v-if="makerResult" class="maker-result">
          <h3>生成完毕</h3>
          <div class="result-previews">
            <img :src="makerResult.imageUrl" class="res-img" />
            <video :src="makerResult.videoUrl" controls class="res-vid"></video>
          </div>
          <div style="margin-top: 10px; display:flex; gap: 10px; justify-content:center;">
            <button @click="downloadTaskFile(makerResult.taskId, 'image')" class="btn-outline">保存海报</button>
            <button @click="downloadTaskFile(makerResult.taskId, 'video')" class="btn-outline">保存视频</button>
          </div>
        </div>
      </section>
    </main>

    <nav v-if="activeModule !== 'maker'" class="bottom-tabbar">
      <div 
        class="tab-item" 
        :class="{ active: activeModule === 'template' }" 
        @click="activeModule = 'template'"
      >
        <div class="tab-icon">🏠</div>
        <span>首页</span>
      </div>
      <div class="tab-item">
        <div class="tab-icon">🖼️</div>
        <span>海报</span>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeModule === 'order' }" 
        @click="activeModule = 'order'"
      >
        <div class="tab-icon">📋</div>
        <span>作品管理</span>
      </div>
      <div
        class="tab-item"
        :class="{ active: activeModule === 'profile' }"
        @click="activeModule = 'profile'"
      >
        <div class="tab-icon">👤</div>
        <span>我的</span>
      </div>
    </nav>

    <transition name="fade">
      <div v-if="previewMedia" class="modal-overlay" @click.self="closePreview">
        <div class="modal-content">
          <img v-if="previewMedia.type === 'image'" :src="previewMedia.url" style="max-height: 80vh; max-width: 100%; object-fit: contain;" />
          <video v-if="previewMedia.type === 'video'" :src="previewMedia.url" controls autoplay loop playsinline style="max-height: 80vh; max-width: 100%; object-fit: contain;"></video>
          <div class="modal-close" @click="closePreview">✕</div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="customerServiceInfo" class="modal-overlay" @click.self="customerServiceInfo = null">
        <div class="modal-content" style="background:#fff; padding: 24px; border-radius: 16px; text-align:center;">
          <h3 style="margin:0 0 8px 0; color:#333; font-size:16px;">联系客服 ({{ customerServiceInfo.nickname }})</h3>
          <p style="font-size:12px; color:#888; margin-bottom:16px;">长按识别下方二维码，或点击直接跳转</p>
          <img v-if="customerServiceInfo.wechatQrUrl" :src="customerServiceInfo.wechatQrUrl" style="width: 200px; height: 200px; object-fit: contain; margin-bottom: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" />
          <div v-if="customerServiceInfo.wechatLink">
            <a :href="customerServiceInfo.wechatLink" class="btn-primary" style="display:inline-block; text-decoration:none; box-sizing:border-box; width: 100%; border-radius: 20px; padding: 10px 0;">直接唤起微信添加客服</a>
          </div>
          <div class="modal-close" style="top: -40px; right: 0;" @click="customerServiceInfo = null">✕</div>
        </div>
      </div>
    </transition>

    <!-- 支付宝扫码支付弹窗 -->
    <transition name="fade">
      <div v-if="payModal.visible" class="modal-overlay" @click.self="closePayModal">
        <div class="pay-modal-content">
          <div class="pay-modal-header">
            <span class="pay-alipay-logo">🔵 扫码支付</span>
            <div class="modal-close pay-close" @click="closePayModal">✕</div>
          </div>

          <div class="pay-amount-row">
            <span class="pay-amount-label">应付金额</span>
            <span class="pay-amount-value">¥ {{ payModal.amount }}</span>
          </div>

          <div class="pay-qrcode-wrap">
            <div v-if="payModal.loading" class="pay-qr-loading">
              <div class="pay-spinner"></div>
              <p>二维码生成中...</p>
            </div>
            <img v-else :src="payModal.qrcodeUrl" class="pay-qr-canvas" style="width: 200px; height: 200px;" />
          </div>

          <div class="pay-tip">
            <span v-if="payModal.polling">⏳ 等待支付中，请使用微信或支付宝扫描上方二维码...</span>
            <span v-else-if="payModal.error" class="pay-error">{{ payModal.error }}</span>
            <span v-else>请使用微信或支付宝扫描二维码完成付款</span>
          </div>

          <div class="pay-orderinfo">
            <span>订单号：{{ payModal.orderNo }}</span>
          </div>
        </div>
      </div>
    </transition>

    <transition name="toast">
      <div v-if="notice" class="toast-message">{{ notice }}</div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

const API_BASE = import.meta.env.VITE_API_BASE || "http://118.178.169.23:38080/api";
const API_ROOT = API_BASE.replace(/\/api\/?$/, "");
const DEFAULT_TEMPLATE_PREVIEW = "/api/assets/templates/1.png";

const request = (method, url, config = {}) => {
  return new Promise((resolve, reject) => {
    const fullUrl = url.startsWith('http') ? url : API_BASE + url;
    const options = {
      url: fullUrl,
      method,
      timeout: config.timeout || 60000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res); 
        } else {
          reject({ response: { data: res.data } });
        }
      },
      fail: (err) => reject(err || new Error('Request failed'))
    };
    if (config.data || config.params) {
      const payload = config.data || config.params;
      const cleanPayload = {};
      for (const key in payload) {
        if (payload[key] !== undefined && payload[key] !== null && payload[key] !== "") {
          cleanPayload[key] = payload[key];
        }
      }
      options.data = cleanPayload;
    }
    if (config.headers) {
      options.header = config.headers;
    }
    uni.request(options);
  });
};

const http = {
  get: (url, config) => request('GET', url, config),
  post: (url, data, config) => request('POST', url, { ...config, data }),
  delete: (url, config) => request('DELETE', url, config)
};

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
  { key: "wedding1", name: "婚礼邀请", icon: "💌" },
  { key: "wedding2", name: "婚礼MV", icon: "🎬" },
  { key: "wedding3", name: "父母邀请", icon: "👨‍👩‍👦" },
  { key: "wedding4", name: "回门答谢", icon: "⛩️" },
  { key: "wedding5", name: "出阁宴", icon: "🎊" },
  { key: "birthday", name: "生日请柬", icon: "🎂" },
  { key: "baby1", name: "百日宴", icon: "🧸" },
  { key: "baby2", name: "满月宴", icon: "🍼" },
  { key: "house", name: "乔迁之喜", icon: "🏠" },
  { key: "all", name: "全部分类", icon: "🗂️" }
];

const fallbackCategories = [
  { key: "all", name: "全部" },
  { key: "hot", name: "网红爆款" },
  { key: "mv", name: "MV精选" },
  { key: "free", name: "限时免费" },
  { key: "new", name: "每周上新" }
];

const activeModule = ref("template");
const selectedTheme = ref("all");
const selectedCategory = ref("all");
const searchKeyword = ref("");
const focusedTemplateId = ref(null);
const previousModule = ref("template");

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
  hotel: "",
  coverImageFile: null
});
const makerResult = ref(null);
const making = ref(false);
const previewMedia = ref(null);
const currentOrderId = ref(null);
const customerServiceInfo = ref(null);

// 支付宝扫码弹窗状态
const payModal = reactive({
  visible: false,
  loading: false,
  polling: false,
  amount: '0.00',
  orderNo: '',
  qrcodeUrl: '',
  error: '',
  orderId: null
});
let payPollTimer = null;

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
  noticeTimer = setTimeout(() => {
    notice.value = "";
  }, 2200);
};

const showCustomerService = async () => {
  try {
    const { data } = await http.get("/customer-service/contact");
    if (data) {
      if (data.wechatQrUrl) {
        data.wechatQrUrl = resolveApiUrl(data.wechatQrUrl);
      }
      customerServiceInfo.value = data;
    }
  } catch (error) {
    showNotice("抱歉，当前暂无可用客服或入口维护中。");
  }
};

const getTemplatePreviewUrl = (template) => {
  if (!template) {
    return resolveApiUrl(DEFAULT_TEMPLATE_PREVIEW);
  }
  const rawPreview = template.previewUrl || "";
  const rawCover = template.coverUrl || "";
  const isMedia = (value) => {
    if (!value) {
      return false;
    }
    const normalized = value.replace(/\\/g, "/").toLowerCase();
    return normalized.endsWith(".png")
      || normalized.endsWith(".jpg")
      || normalized.endsWith(".jpeg")
      || normalized.endsWith(".webp")
      || normalized.endsWith(".gif")
      || normalized.endsWith(".mp4");
  };

  const candidate = isMedia(rawPreview)
    ? rawPreview
    : (isMedia(rawCover) ? rawCover : DEFAULT_TEMPLATE_PREVIEW);

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
  if (template?.templateType === 'video') {
    const url = template.coverUrl || getTemplatePreviewUrl(template);
    if (!url) {
      showNotice("暂无模板视频可预览。");
      return;
    }
    previewMedia.value = { type: 'video', url: url };
  } else {
    const url = getTemplatePreviewUrl(template);
    if (!url) {
      showNotice("暂无模板图片可预览。");
      return;
    }
    previewMedia.value = { type: 'image', url: url };
  }
};

const previewTaskMedia = (taskId, type) => {
  const url = getTaskUrl(taskId, type);
  previewMedia.value = { type, url };
};

const closePreview = () => {
  previewMedia.value = null;
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
    templateType: raw?.templateType || "word",
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
    taskId: raw?.taskId || "",
    maxGenerateCount: raw?.maxGenerateCount || 5,
    usedGenerateCount: raw?.usedGenerateCount || 0,
    historicalTasks: Array.isArray(raw?.historicalTasks) ? raw.historicalTasks : [],
    template
  };
};

const getTaskUrl = (taskId, type) => {
  return resolveApiUrl(`/api/video/tasks/${taskId}/${type}`);
};

const downloadTaskFile = async (taskId, type) => {
  try {
    const ext = type === 'image' ? 'png' : type === 'video' ? 'mp4' : 'docx';
    const fileUrl = resolveApiUrl(`/api/video/tasks/${taskId}/${type}?download=true`);
    
    uni.showLoading({ title: '下载中...' });
    uni.downloadFile({
      url: fileUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          if (type === 'image') {
            uni.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                uni.hideLoading();
                showNotice("图片已保存到相册。");
              },
              fail: () => {
                uni.hideLoading();
                showNotice("保存失败，请检查权限。");
              }
            });
          } else if (type === 'video') {
            uni.saveVideoToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                uni.hideLoading();
                showNotice("视频已保存到相册。");
              },
              fail: () => {
                uni.hideLoading();
                showNotice("保存失败，请检查权限。");
              }
            });
          } else {
            uni.hideLoading();
            const fs = uni.getFileSystemManager();
            fs.saveFile({
              tempFilePath: res.tempFilePath,
              success: (saveRes) => {
                uni.openDocument({
                  filePath: saveRes.savedFilePath,
                  showMenu: true
                });
              }
            });
          }
        } else {
          uni.hideLoading();
          showNotice("文件下载失败。");
        }
      },
      fail: () => {
        uni.hideLoading();
        showNotice("文件下载失败，请稍后重试。");
      }
    });
  } catch (error) {
    uni.hideLoading();
    showNotice("文件下载失败，请稍后重试。");
  }
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
    hotel: "",
    coverImageFile: null
  });
  if (localImagePreview.value) {
    URL.revokeObjectURL(localImagePreview.value);
  }
  localImagePreview.value = "";
  previousModule.value = activeModule.value;
  activeModule.value = "maker";
};

const localImagePreview = ref("");
const onChooseImage = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0];
      makerForm.coverImageFile = tempFilePath;
      localImagePreview.value = tempFilePath;
    }
  });
};

const backToTemplates = () => {
  stopTaskPolling();
  making.value = false;
  currentOrderId.value = null;
  activeModule.value = previousModule.value || "template";
};

const generateVideo = async () => {
  if (making.value) return;
  if (!makerTemplate.value) {
    showNotice("请选择模板后再制作。");
    return;
  }

  try {
    making.value = true;
    makerResult.value = null;
    stopTaskPolling();

    let taskInfo;
    if (makerTemplate.value.templateType === 'video') {
      const formData = {
        templateId: makerTemplate.value.id,
        name: makerForm.name,
        age: makerForm.age,
        time: makerForm.time
      };
      if (currentOrderId.value) formData.orderId = currentOrderId.value;
      if (makerForm.hotel) formData.hotel = makerForm.hotel;

      if (makerForm.coverImageFile) {
        const uploadRes = await new Promise((resolve, reject) => {
          uni.uploadFile({
            url: API_BASE + "/video/tasks/multipart?async=true",
            filePath: makerForm.coverImageFile,
            name: 'coverImage',
            formData: formData,
            success: (uploadFileRes) => resolve(uploadFileRes),
            fail: (err) => reject(err)
          });
        });
        const data = JSON.parse(uploadRes.data);
        taskInfo = normalizeTaskResult(data);
      } else {
        const { data } = await http.post("/video/tasks/multipart?async=true", formData);
        taskInfo = normalizeTaskResult(data);
      }
    } else {
      const { data } = await http.post("/video/tasks?async=true", {
        templateId: makerTemplate.value.id,
        name: makerForm.name,
        age: makerForm.age,
        time: makerForm.time,
        hotel: makerForm.hotel,
        orderId: currentOrderId.value || undefined
      });
      taskInfo = normalizeTaskResult(data);
    }

    if (!taskInfo.taskId) {
      throw new Error("未获取到任务编号，请稍后重试。");
    }

    if (taskInfo.status === "failed") {
      throw new Error(taskInfo.message || "生成失败，请稍后再试。");
    }

    if (taskInfo.status === "completed") {
      makerResult.value = taskInfo;
      showNotice("生成成功，已输出图片和视频。");
      await loadOrders();
      return;
    }

    await pollTaskStatus(taskInfo.taskId);
    await loadOrders();
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
      // 未付款 => 弹出支付宝二维码
      await openPayModal(order);
      return;
    }

    const { data } = await http.get(`/orders/${order.id}/jump`);
    const targetTemplate = normalizeTemplate(data);

    currentOrderId.value = order.id;
    openMaker(targetTemplate);

    showNotice("已为您准备好制作页面。" );
  } catch (error) {
    showNotice(getErrorMessage(error, "订单跳转失败。"));
  }
};

const openPayModal = async (order) => {
  // 初始化弹窗状态
  Object.assign(payModal, {
    visible: true,
    loading: true,
    polling: false,
    amount: Number(order.amount || 0).toFixed(2),
    orderNo: order.orderNo || '',
    qrcodeUrl: '',
    error: '',
    orderId: order.id
  });

  try {
    const { data } = await http.get(`/orders/${order.id}/payment-qrcode`);
    const qrcodeUrl = data.qrcodeUrl || data.qrcode_url || '';
    payModal.qrcodeUrl = qrcodeUrl;
    payModal.orderNo = data.orderNo || order.orderNo || '';
    payModal.amount = Number(data.amount || order.amount || 0).toFixed(2);
    payModal.loading = false;

    // 渲染二维码
    await renderQrcode(qrcodeUrl);

    // 开始轮询订单状态
    payModal.polling = true;
    startPayPolling(order.id);
  } catch (error) {
    payModal.loading = false;
    payModal.error = getErrorMessage(error, '二维码获取失败，请稍后重试');
  }
};

const renderQrcode = async (url) => {
  if (!url) return;
  payModal.qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
};

const startPayPolling = (orderId) => {
  stopPayPolling();
  const poll = async () => {
    if (!payModal.visible || payModal.orderId !== orderId) return;
    try {
      const { data } = await http.get(`/orders/${orderId}`);
      if (data.status === 'paid') {
        payModal.polling = false;
        payModal.visible = false;
        await loadOrders();
        showNotice('🎉 支付成功！订单已更新。');
        return;
      }
    } catch { /* 忽略轮询错误 */ }
    payPollTimer = setTimeout(poll, 2000);
  };
  payPollTimer = setTimeout(poll, 2000);
};

const stopPayPolling = () => {
  if (payPollTimer) {
    clearTimeout(payPollTimer);
    payPollTimer = null;
  }
};

const closePayModal = () => {
  stopPayPolling();
  payModal.visible = false;
  payModal.polling = false;
  // 刷新订单列表（可能已在别处支付）
  loadOrders();
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
  searchTimer = setTimeout(() => {
    searchTemplates();
  }, 300);
});

onMounted(async () => {
  await Promise.all([loadThemes(), loadCategories()]);
  await Promise.all([searchTemplates(), loadOrders()]);
});

onBeforeUnmount(() => {
  stopTaskPolling();
  stopPayPolling();
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
page, view, text, image, input, button, textarea, scroll-view, navigator, label, form, map, canvas {
  box-sizing: border-box;
}
page {
  margin: 0; padding: 0; min-height: 100vh; background: #f5f6f8;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  user-select: none; -webkit-tap-highlight-color: transparent;
}
</style>

<style scoped>
.mobile-app {
  max-width: 480px; margin: 0 auto; background: #fff; min-height: 100vh; position: relative;
  box-shadow: 0 0 20px rgba(0,0,0,0.05); overflow-x: hidden; display: flex; flex-direction: column;
}
.app-header {
  background: linear-gradient(180deg, #fff3f5 0%, #fff 100%); padding: 12px 16px 4px;
  position: sticky; top: 0; z-index: 10;
}
.search-box {
  display: flex; align-items: center; background: #f4f5f7; border-radius: 999px; padding: 8px 14px; margin-bottom: 8px;
}
.search-icon { font-size: 16px; margin-right: 6px; opacity: 0.6; }
.camera-icon { font-size: 18px; margin-left: 6px; opacity: 0.6; }
.search-box input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; color: #333; }

.app-main { flex: 1; overflow-y: auto; padding-bottom: 20px; }
.pad-bottom { padding-bottom: calc(70px + env(safe-area-inset-bottom)); }

.theme-grid {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px 0; padding: 12px 10px;
}
.theme-item { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; }
.theme-icon-wrap { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: #fdf5f6; font-size: 24px; transition: transform 0.2s; }
.active-theme { transform: scale(1.1); box-shadow: 0 4px 12px rgba(255,100,120,0.2); background: #ffeaed; }
.theme-name { font-size: 11px; color: #666; }
.active-text { color: #ff4d6d; font-weight: bold; }

.promo-banners { display: flex; gap: 10px; padding: 0 16px 16px; }
.promo-card { flex: 1; border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center; }
.promo-left { background: linear-gradient(135deg, #f0f4ff, #e6ecff); }
.promo-right { background: linear-gradient(135deg, #fff2f5, #ffe6eb); }
.promo-text h3 { font-size: 14px; margin: 0 0 4px; color: #333; display: flex; align-items: center; gap: 4px; }
.promo-text h3 span { background: #ff4d6d; color: #fff; font-size: 9px; padding: 1px 4px; border-radius: 4px; }
.promo-text p { font-size: 11px; color: #888; margin: 0; }
.promo-icon { font-size: 28px; }

.category-scroll { display: flex; align-items: center; padding: 0 16px 12px; border-bottom: 1px solid #f0f0f0; }
.cat-title { font-size: 16px; font-weight: bold; margin-right: 12px; white-space: nowrap; color: #333; }
.cat-tabs { display: flex; gap: 16px; overflow-x: auto; flex: 1; scrollbar-width: none; }
.cat-tabs::-webkit-scrollbar { display: none; }
.cat-tab { font-size: 14px; color: #666; white-space: nowrap; position: relative; padding-bottom: 4px; cursor: pointer; }
.cat-tab.active { font-weight: bold; color: #333; }
.cat-tab.active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 16px; height: 3px; background: #ff4d6d; border-radius: 2px; }

.template-masonry { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px 16px; background: #f5f6f8; }
.template-card { background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); position: relative; cursor: pointer; }
.card-cover { width: 100%; height: 220px; position: relative; }
.card-tag { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.5); color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; }
.card-info { padding: 10px; }
.card-info h4 { margin: 0; font-size: 13px; color: #333; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.2); opacity: 0; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s; }
.template-card:hover .card-overlay { opacity: 1; }
.btn-make { background: #ff4d6d; color: #fff; border: none; padding: 8px 20px; border-radius: 20px; font-weight: bold; cursor: pointer; }

.module-order { padding: 16px; background: #f5f6f8; min-height: 100vh; }
.module-title { font-size: 18px; margin: 0 0 16px; text-align: center; display: block; color: #333;}
.module-profile { padding: 16px; background: #f5f6f8; min-height: 100vh; }
.profile-menu { background: #fff; border-radius: 12px; overflow: hidden; }
.menu-item { display: flex; align-items: center; padding: 16px; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
.menu-item:last-child { border-bottom: none; }
.menu-icon { font-size: 20px; margin-right: 12px; }
.menu-text { flex: 1; font-size: 15px; color: #333; }
.menu-arrow { font-size: 18px; color: #ccc; }
.order-list { display: flex; flex-direction: column; gap: 16px; padding-bottom: 20px; }
.order-card { background: #fff; border-radius: 16px; padding: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.04); }
.order-header { display: flex; justify-content: space-between; font-size: 13px; color: #999; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid #f5f5f5; }
.order-status.pending { color: #ff8f1f; font-weight: 600; }
.order-status.completed, .order-status.paid { color: #00b578; font-weight: 600; }
.order-body { display: flex; gap: 14px; }
.order-cover { width: 72px; height: 96px; border-radius: 8px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.order-detail { flex: 1; min-width: 0; }
.order-detail h3 { font-size: 15px; margin: 0 0 6px; color: #333; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.order-detail p { font-size: 13px; color: #888; margin: 0 0 10px; }
.history-block { background: #fdfdfd; padding: 12px; border-radius: 10px; margin-top: 12px; border: 1px solid #f0f0f0; }
.history-title { font-size: 12px; color: #333; margin-bottom: 10px; font-weight: 600; }
.history-item { display: flex; justify-content: space-between; align-items: flex-start; font-size: 12px; padding: 12px 0; border-bottom: 1px dashed #eee; }
.history-item:last-child { border-bottom: none; padding-bottom: 0; }
.history-item > span { color: #666; font-weight: 500; flex-shrink: 0; white-space: nowrap; margin-right: 12px; padding-top: 4px; }
.history-actions { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
.action-group { display: flex; gap: 8px; }
.action-group button { display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; background: #f2f5fd; border: none; padding: 5px 12px; border-radius: 6px; font-size: 12px; color: #1677ff; cursor:pointer; text-decoration: none; line-height: 1.4; white-space: nowrap; font-weight: 600; flex-shrink: 0; }
.action-group button:active { opacity: 0.8; }
.order-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 18px; padding-top: 16px; border-top: 1px solid #f5f5f5; }
.order-footer button { padding: 8px 22px; border-radius: 100px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; line-height: 1.5; }
.btn-outline { background: #fff; border: 1px solid #e0e0e0; color: #555; }
.btn-outline:active { background: #f9f9f9; }
.btn-primary { background: linear-gradient(135deg, #ff4d6d, #ff758c); border: none; color: #fff; box-shadow: 0 4px 14px rgba(255, 77, 109, 0.25); }
.btn-primary:disabled { background: #ddd; box-shadow: none; cursor: not-allowed; opacity: 1; color: #aaa; }
.btn-primary:active:not(:disabled) { opacity: 0.9; transform: scale(0.98); }

.module-maker { background: #fff; min-height: 100vh; display: flex; flex-direction: column; }
.maker-nav { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #f0f0f0; }
.maker-nav h2 { margin: 0; font-size: 16px; text-align: center; color: #333;}
.btn-back { background: transparent; border: none; font-size: 14px; color: #666; cursor: pointer; }
.maker-cover { height: 260px; position: relative; }
.btn-preview { position: absolute; bottom: 16px; right: 16px; background: rgba(0,0,0,0.6); color: #fff; padding: 6px 14px; border-radius: 20px; border: none; font-size: 12px; cursor:pointer; }
.maker-form { padding: 20px 16px; flex: 1; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; color: #555; margin-bottom: 8px; font-weight: 500; }
.form-group input { width: 100%; border: none; border-bottom: 1px solid #eee; padding: 10px 0; font-size: 15px; outline: none; transition: border-color 0.2s; color:#333; }
.form-group input:focus { border-bottom-color: #ff4d6d; }
.maker-submit { padding: 16px; }
.btn-generate { width: 100%; background: linear-gradient(90deg, #ff6b81, #ff4d6d); color: #fff; border: none; padding: 14px; border-radius: 24px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(255,77,109,0.3); cursor: pointer; }
.btn-generate:disabled { background: #ccc; box-shadow: none; cursor:not-allowed;}
.maker-result { padding: 16px; border-top: 8px solid #f5f6f8; text-align: center; }
.maker-result h3 { font-size: 16px; color:#333; }
.res-img, .res-vid { width: 100%; max-width: 300px; border-radius: 8px; margin-top: 10px; }

.bottom-tabbar { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: #fff; display: flex; justify-content: space-around; padding: 8px 0 env(safe-area-inset-bottom); box-shadow: 0 -2px 10px rgba(0,0,0,0.03); z-index: 20; border-top: 1px solid #f0f0f0; }
.tab-item { display: flex; flex-direction: column; align-items: center; color: #999; font-size: 10px; cursor: pointer; gap:2px; }
.tab-icon { font-size: 22px; margin-bottom: 2px; }
.tab-item.active { color: #ff4d6d; }

.empty-state { padding: 40px 0; text-align: center; color: #999; font-size: 14px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 50; display: flex; align-items: center; justify-content: center; }
.modal-content { position: relative; width: 90%; max-width: 400px; }
.modal-content img { width: 100%; border-radius: 12px; }
.modal-close { position: absolute; right: -12px; top: -36px; color: #fff; font-size: 24px; cursor: pointer; font-weight:bold; }
.toast-message { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.7); color: #fff; padding: 10px 20px; border-radius: 6px; font-size: 14px; z-index: 99; text-align: center; width: max-content; max-width: 80%; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; }

/* ─── 支付宝扫码弹窗 ─────────────────────────────── */
.pay-modal-content {
  background: #fff;
  border-radius: 20px;
  width: 92%;
  max-width: 340px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0,0,0,0.3);
}
.pay-modal-header {
  background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pay-alipay-logo {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.pay-close {
  position: static;
  color: rgba(255,255,255,0.8);
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
}
.pay-amount-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 16px 24px 8px;
  border-bottom: 1px solid #f0f0f0;
}
.pay-amount-label { font-size: 13px; color: #888; }
.pay-amount-value { font-size: 28px; font-weight: 700; color: #ff4d4f; }
.pay-qrcode-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 24px;
  background: #fafcff;
}
.pay-qr-canvas {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(22,119,255,0.12);
}
.pay-qr-loading {
  width: 200px;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 13px;
  gap: 12px;
}
.pay-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e0eaff;
  border-top-color: #1677ff;
  border-radius: 50%;
  animation: pay-spin 0.8s linear infinite;
}
@keyframes pay-spin { to { transform: rotate(360deg); } }
.pay-tip {
  text-align: center;
  font-size: 12px;
  color: #888;
  padding: 0 24px 12px;
  line-height: 1.6;
  min-height: 32px;
}
.pay-error { color: #ff4d4f; }
.pay-orderinfo {
  text-align: center;
  font-size: 11px;
  color: #ccc;
  padding-bottom: 16px;
}
</style>