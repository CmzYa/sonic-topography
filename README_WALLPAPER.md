# Sonic Topography - Wallpaper Engine 壁纸版

## 项目概述

Sonic Topography 是一个 3D 音频响应地形可视化壁纸，使用 React、Three.js 和 Web Audio 构建。支持 Wallpaper Engine 的音频输入，可响应系统音频产生波纹、流星和地形起伏效果。

## 目录结构

```
sonic-topography/
├── wallpaper/                    # Wallpaper Engine 专用源码
│   ├── index.html               # 壁纸 HTML 入口
│   ├── main.tsx                 # React 入口文件
│   ├── AppWallpaper.tsx         # 壁纸主组件（无 UI）
│   └── project.json             # Wallpaper Engine 项目配置
│
├── src/                         # 共享源码
│   ├── components/
│   │   └── AudioVisualizer/
│   │       ├── MapScene.tsx     # 3D 地形场景
│   │       └── CustomShaderMaterial.ts  # 地形着色器
│   ├── lib/
│   │   ├── AudioEngine.ts       # 音频引擎（支持 Wallpaper Engine API）
│   │   └── themes.ts            # 颜色主题定义
│   └── types.ts                 # 类型定义
│
├── dist-wallpaper/              # 壁纸构建产物（导入 Wallpaper Engine）
│   ├── index.html
│   ├── assets/
│   └── project.json
│
├── vite.wallpaper.config.ts     # 壁纸专用 Vite 配置
├── package.json                 # 项目配置
└── README_WALLPAPER.md          # 本交接文档
```

## 构建命令

```powershell
# 安装依赖
pnpm install

# 构建壁纸版本
pnpm run build:wallpaper

# 构建产物位于 dist-wallpaper/ 目录
```

## Wallpaper Engine 导入步骤

1. 运行 `pnpm run build:wallpaper` 构建项目
2. 打开 Wallpaper Engine
3. 选择"壁纸工作室" -> "创建壁纸"
4. 选择"网页"类型
5. 导入整个 `dist-wallpaper/` 目录
6. 在壁纸属性中勾选"音频反应"启用音频输入

## 配置项说明

所有外观与响应项统一放在「外观 / Appearance」分类下。

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| 颜色主题 | 下拉 | 霁紫 | 16 套主题 + 自动轮询 |
| 轮询间隔 | 滑块 | 60 | 自动轮询切换间隔（秒） |
| 浅色模式 | 开关 | 关闭 | 天空变浅、流星波纹转深灰 |
| 启用强调色 / 强调色强度 | 开关 / 滑块 | 开启 / 1 | 中心隆起峰值颜色 |
| 渲染精度 | 下拉 | 160x160 | 网格分辨率（120~4096） |
| 响应范围 | 滑块 | 1 | 音频响应空间衰减范围 |
| 中心隆起 | 开关 + 强度 | 开启 / 1 | 超低频大块中心抬升 |
| 中部环形 | 开关 + 强度 | 开启 / 1 | 低频中部环形弹跳 |
| 全域流动 | 开关 + 强度 | 开启 / 1 | 中低频全地图流动 |
| 河流对角线 | 开关 + 强度 | 开启 / 1 | 中频对角河流 |
| 高频尖刺 | 开关 + 强度 | 开启 / 1 | 高频散点尖刺与能量突起 |
| 启用波纹 / 波纹强度 | 开关 / 滑块 | 开启 / 1 | 低频触发扩散涟漪 |
| 波纹灵敏度 / 冷却 | 滑块 | 0.2 / 0 | 触发灵敏度与间隔帧数 |
| 启用流星 / 流星强度 | 开关 / 滑块 | 开启 / 1 | 高频触发流星坠落 |
| 流星灵敏度 / 冷却 | 滑块 | 0.35 / 60 | 触发灵敏度与间隔帧数 |
| 点击触发流星 | 开关 | 开启 | 空闲时点击地形产生流星 |
| 空闲波浪 / 防抖 / 过渡 | 开关 + 滑块 | 开启 / 1 / 1 | 无音频时的环境波浪 |
| 视角距离 / 角度 / 自动旋转 | 滑块 + 开关 | 85 / 120·25 / 关闭 | 相机与旋转控制 |
| 播放器控制器（显示/尺寸/位置/封面） | 开关 + 下拉 + 滑块 | 开启 / 大 / 2·3 | Media Integration 卡片 |

## 空闲波浪效果

当无音频输入时（energy < 0.05），自动激活以下效果：

1. **随机波纹** — 每3秒在随机位置产生波纹
2. **随机流星** — 50%概率同时生成流星，撞击产生白色波纹和粒子
3. **地形起伏** — 4层波浪叠加，每个方块有独立的高度偏移和强度

## 关键文件说明

### wallpaper/AppWallpaper.tsx

壁纸主组件，负责：
- 注册 Wallpaper Engine 音频监听回调
- 注册配置属性回调
- 渲染 3D Canvas 场景

### src/lib/AudioEngine.ts

音频引擎核心，关键方法：
- `setWallpaperAudioData(audioData)` — 接收 Wallpaper Engine 音频数据
- `getAudioData()` — 返回处理后的音频数据
- `pulseTrigger` / `meteorTrigger` — 触发器配置

### src/components/AudioVisualizer/CustomShaderMaterial.ts

地形着色器，关键 uniform：
- `uIdleWave` — 空闲波浪强度（0或1）
- `uBass/uMid/uTreble` — 音频频段数据
- `uRipples[10]` — 波纹数组

### wallpaper/project.json

Wallpaper Engine 项目配置，定义所有可调参数。

## 技术要点

### Wallpaper Engine 音频 API

```typescript
// 注册音频监听
window.wallpaperRegisterAudioListener((audioData: number[]) => {
  // audioData 是 128 个频率 bins，值范围 0~1
  engine.setWallpaperAudioData(audioData);
});

// 注册属性监听
window.wallpaperPropertyListener = {
  applyUserProperties: (properties) => {
    // 处理配置变更
  }
};

// 通知加载完成
window.wallpaperReady();
```

### 构建配置要点

- `base: './'` — 使用相对路径，确保 Wallpaper Engine 能加载资源
- `root: 'wallpaper'` — 指定壁纸源码目录
- 输出到 `dist-wallpaper/` 目录

## 主题颜色

| 主题 | 基础色 | 冷色调 | 暖色调 |
|------|--------|--------|--------|
| 夜色 | 深蓝黑 | 蓝/紫 | 红/橙 |
| 霓虹东京 | 深紫 | 粉/紫 | 橙/黄 |
| 赛博森林 | 深绿 | 青/绿 | 黄/金 |
| 极简黑白 | 灰黑 | 白/灰 | 白 |

## 注意事项

1. Wallpaper Engine 不支持本地服务器，必须使用构建后的静态文件
2. 资源路径必须使用相对路径（`./assets/`）
3. 音频数据由 Wallpaper Engine 推送，不需要手动获取
4. 配置项变更通过 `wallpaperPropertyListener.applyUserProperties` 回调接收

## 后续开发建议

- 可添加更多主题颜色
- 可添加波浪速度、起伏幅度等细调参数
- 可优化粒子效果数量和样式
- 可添加鼠标拖拽旋转相机功能

---

构建日期：2026-06-18