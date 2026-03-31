import fs from 'fs';

const appVuePath = 'D:\\project\\birthday-video-maker\\frontend\\src\\App.vue';
let content = fs.readFileSync(appVuePath, 'utf8');

const newTemplate = `<template>
  <div class="mobile-app">
    <header class="app-header">
      <div class="top-bar">
        <h1>婚贝请柬</h1>
        <div class="header-actions">
          <span class="icon-more">···</span>
          <span class="icon-close">◎</span>
        </div>
      </div>
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

    <main class="app-main" :class="{ 'pad-bottom': activeModule !== 'maker' }">
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
              <span class="card-tag">{{ template.tag || '相册' }}</span>
              <div class="card-overlay">
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
                      <button @click="downloadTaskFile(task.taskId, 'image')">存图</button>
                      <button @click="downloadTaskFile(task.taskId, 'video')">视频</button>
                    </div>
                  </div>
                </div>
                <div v-else-if="order.taskId" class="history-block">
                  <div class="history-actions">
                    <button @click="downloadTaskFile(order.taskId, 'image')">下载照片</button>
                    <button @click="downloadTaskFile(order.taskId, 'video')">下载视频</button>
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

      <section v-else class="module-maker">
        <div class="maker-nav">
          <button @click="backToTemplates" class="btn-back">← 返回</button>
          <h2>信息填写</h2>
        </div>
        <div class="maker-cover" :style="coverStyle(makerTemplate)">
          <button class="btn-preview" @click="previewTemplate(makerTemplate)">预览演示</button>
        </div>
        <div class="maker-form">
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
      <div class="tab-item">
        <div class="tab-icon">👤</div>
        <span>我的</span>
      </div>
    </nav>

    <transition name="fade">
      <div v-if="previewImage" class="modal-overlay" @click.self="closePreview">
        <div class="modal-content">
          <img :src="previewImage" />
          <div class="modal-close" @click="closePreview">✕</div>
        </div>
      </div>
    </transition>

    <transition name="toast">
      <div v-if="notice" class="toast-message">{{ notice }}</div>
    </transition>
  </div>
</template>`;

const newThemes = `const fallbackThemes = [
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
];`;

const newCategories = `const fallbackCategories = [
  { key: "all", name: "全部" },
  { key: "hot", name: "网红爆款" },
  { key: "mv", name: "MV精选" },
  { key: "free", name: "限时免费" },
  { key: "new", name: "每周上新" }
];`;

const newStyles = `<style>
html, body, #app {
  margin: 0; padding: 0; min-height: 100vh; background: #f5f6f8;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  user-select: none; -webkit-tap-highlight-color: transparent;
}
* { box-sizing: border-box; }
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
.top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.top-bar h1 { font-size: 18px; font-weight: 600; margin: 0; flex: 1; text-align: center; color: #333; padding-left: 60px; }
.header-actions { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.04); border-radius: 20px; padding: 2px 10px; font-size: 14px; color: #333; }
.search-box {
  display: flex; align-items: center; background: #f4f5f7; border-radius: 999px; padding: 8px 14px; margin-bottom: 8px;
}
.search-icon { font-size: 16px; margin-right: 6px; opacity: 0.6; }
.camera-icon { font-size: 18px; margin-left: 6px; opacity: 0.6; }
.search-box input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; color: #333; }

.app-main { flex: 1; overflow-y: auto; padding-bottom: 20px; }
.pad-bottom { padding-bottom: 70px; }

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
.order-list { display: flex; flex-direction: column; gap: 12px; }
.order-card { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
.order-header { display: flex; justify-content: space-between; font-size: 12px; color: #888; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.order-status.pending { color: #fa8c16; }
.order-status.completed, .order-status.paid { color: #52c41a; }
.order-body { display: flex; gap: 12px; }
.order-cover { width: 70px; height: 90px; border-radius: 8px; flex-shrink: 0; }
.order-detail { flex: 1; }
.order-detail h3 { font-size: 14px; margin: 0 0 4px; color: #333; }
.order-detail p { font-size: 12px; color: #888; margin: 0 0 8px; }
.history-block { background: #f9f9f9; padding: 8px; border-radius: 6px; margin-top: 8px; }
.history-title { font-size: 11px; color: #666; margin-bottom: 6px; font-weight: bold; }
.history-item { display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 6px; color: #666;}
.history-actions { display: flex; gap: 6px; }
.history-actions button { background: #fff; border: 1px solid #ddd; padding: 2px 8px; border-radius: 4px; font-size: 11px; color: #555; cursor:pointer;}
.order-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; }
.order-footer button { padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-outline { background: #fff; border: 1px solid #ccc; color: #666; }
.btn-primary { background: linear-gradient(90deg, #ff6b81, #ff4d6d); border: none; color: #fff; }
.btn-primary:disabled { background: #ccc; cursor: not-allowed; opacity: 0.6; }

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

.bottom-tabbar { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: #fff; display: flex; justify-content: space-around; padding: 8px 0; box-shadow: 0 -2px 10px rgba(0,0,0,0.03); z-index: 20; border-top: 1px solid #f0f0f0; }
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
</style>`;

let success = true;

content = content.replace(/<template>[\s\S]*?<\/template>/, newTemplate);
if (!content.includes(newTemplate.slice(0, 50))) success = false;

content = content.replace(/const fallbackThemes = \[[\s\S]*?\];/, newThemes);
if (!content.includes("wedding1")) success = false;

content = content.replace(/const fallbackCategories = \[[\s\S]*?\];/, newCategories);
if (!content.includes("hot")) success = false;

content = content.replace(/<style>[\s\S]*?<\/style>[\s\S]*?<style scoped>[\s\S]*?<\/style>/, newStyles);
if (!content.includes(".mobile-app")) {
  // Try fallback in case it was a single script block
  content = content.replace(/<style scoped>[\s\S]*?<\/style>/, newStyles);
}

fs.writeFileSync(appVuePath, content, 'utf8');
if(success) console.log('App.vue updated successfully for mobile UI!');
else console.error('Regex update failed, partial or no changes made.');
