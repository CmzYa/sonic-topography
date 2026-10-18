# 项目交接文档

## 项目概述

**项目名称**：Sonic Topography（音域回响）
**类型**：Wallpaper Engine 音频可视化动态壁纸
**版本**：v17

一款基于音频驱动的 3D 地形可视化壁纸，配合 Wallpaper Engine 使用。160×160（可配置 80-1024）柱子网格随音乐起伏，带有波纹、流星、空闲波浪等效果。

---

## 目录结构

```
sonic-topography/
├── src/                          # 源代码
│   ├── lib/
│   │   ├── AudioEngine.ts        # 音频引擎核心（FFT分析、触发检测、空闲波浪）
│   │   └── themes.ts             # 10套色彩主题定义
│   ├── components/
│   │   └── AudioVisualizer/
│   │       ├── MapScene.tsx      # 3D场景组件（波纹/流星生成、相机控制）
│   │       └── CustomShaderMaterial.ts  # GLSL着色器（波浪、波纹、流星渲染）
│   └── index.css                 # 全局样式
│
├── wallpaper/                    # Wallpaper Engine 入口
│   ├── main.tsx                  # 壁纸主组件（属性监听、Media Integration）
│   └── project.json              # 壁纸配置声明（所有可调参数）
│
├── dist-wallpaper/               # 构建输出目录
│   └── wallpaper/
│       ├── index.html            # 壁纸入口页面
│       └── assets/               # JS/CSS 资源
│
├── vite.wallpaper.config.ts      # Vite 构建配置
├── package.json
├── CHANGELOG.md                  # 版本更新日志
└── HANDOVER.md                   # 本文档
```

---

## 核心技术实现

### 1. Wallpaper Engine 集成

**音频监听**：
```typescript
// main.tsx - 注册音频回调
window.wallpaperRegisterAudioListener((audioData) => {
  engine.setWallpaperAudioData(audioData);
});
```

**属性监听**（已修复时序问题）：
```typescript
// main.tsx - 模块级别缓存，解决加载时属性丢失
let _pendingProps = null;
let _applyProps = null;

window.wallpaperPropertyListener = {
  applyUserProperties: (props) => {
    if (_applyProps) {
      _applyProps(props);  // 组件已挂载，直接应用
    } else {
      _pendingProps = { ..._pendingProps, ...props };  // 缓存
    }
  }
};

// useEffect 中应用缓存
useEffect(() => {
  _applyProps = handleProperties;
  if (_pendingProps) {
    handleProperties(_pendingProps);
    _pendingProps = null;
  }
}, []);
```

**Media Integration**（播放器控制器）：
- 通过 `window.__mediaState` 获取歌曲标题、艺术家、专辑封面、播放状态
- 组件订阅 `_callbacks` 数组，实时更新 UI

### 2. 音频引擎 (AudioEngine.ts)

**FFT 频段分布**（512 bins @ 44.1kHz，每 bin ~43Hz）：
```typescript
// 主响应范围：0-3.5kHz
if (i <= 4)    subBass      // 0-172 Hz（超低频）
if (i <= 12)   bass         // 172-516 Hz（低频，波纹触发频段）
if (i <= 24)   lowMid       // 516-1032 Hz
if (i <= 45)   mid          // 1032-1935 Hz
if (i <= 81)   highMid      // 1935-3483 Hz
// 其余为高频（流星触发）
```

**空闲波浪防抖机制**：
- 有能量 → **立即**停止空闲波浪（无防抖）
- 无能量 → 需持续超过配置秒数才开始淡入空闲波浪
- `idleStartTime` 记录开始进入空闲的时间戳，0 表示非空闲状态

**波纹/流星触发**：
- 使用 Auto Beat 模式，基于频段能量突变检测
- 波纹：0-12 bin（172-516 Hz），灵敏度 0.22，冷却 45 帧
- 流星：92-340 bin（高频），灵敏度 0.40，冷却 180 帧

### 3. 着色器 (CustomShaderMaterial.ts)

**关键参数**：
- `uIdleWave`：空闲波浪强度（0-1）
- `uRipples[]`：波纹数组（位置、半径、类型）
- `uHalfExtent`：地形半径（30）

**波浪高度系数**：
- 背景波浪：`2.5 * uIdleWave`
- 流星波纹：衰减 18.0，高度 1.8（更明显）

---

## 配置参数 (project.json)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| theme | combo | nocturnal | 颜色主题（16套 + 自动轮询） |
| themeCycleInterval | slider | 60 | 轮询间隔（秒） |
| lightMode | bool | false | 浅色模式：天空变浅、柱子无响应时变白、流星波纹转深灰 |
| peakColorEnabled | bool | true | 强调色开关 |
| peakColorIntensity | slider | 1 | 强调色强度 |
| gridSize | combo | 160 | 渲染精度（120-4096） |
| responseRange | slider | 1 | 响应范围 |
| centralEnabled / centralIntensity | bool / slider | true / 1 | 中心隆起（超低频）开关与强度 |
| ringEnabled / ringIntensity | bool / slider | true / 1 | 中部环形（低频）开关与强度 |
| flowEnabled / flowIntensity | bool / slider | true / 1 | 全域流动（中低频）开关与强度 |
| riverEnabled / riverIntensity | bool / slider | true / 1 | 河流对角线（中频）开关与强度 |
| spikeEnabled / spikeIntensity | bool / slider | true / 1 | 高频尖刺（高频+能量突起）开关与强度 |
| pulseEnabled / pulseIntensity | bool / slider | true / 1 | 启用波纹 / 波纹强度 |
| pulseSensitivity | slider | 0.2 | 波纹灵敏度 |
| pulseCooldown | slider | 0 | 波纹冷却（帧） |
| meteorEnabled / meteorIntensity | bool / slider | true / 1 | 启用流星 / 流星强度 |
| meteorSensitivity | slider | 0.35 | 流星灵敏度 |
| meteorCooldown | slider | 60 | 流星冷却（帧） |
| meteorClickEnabled | bool | true | 点击触发流星 |
| idleWaveEnabled | bool | true | 空闲波浪开关 |
| idleWaveDebounce | slider | 1 | 空闲波浪防抖（秒） |
| idleWaveFadeDuration | slider | 1 | 空闲波浪过渡（秒） |
| cameraDistance | slider | 85 | 视角距离 |
| cameraAngleX/Y | slider | 120/25 | 视角角度 |
| autoRotateEnabled | bool | false | 自动旋转开关 |
| autoRotateSpeed | slider | 10 | 自动旋转速度 |
| showPlayerController | bool | true | 播放器控制器显示 |
| showAlbumCover | bool | true | 显示专辑封面 |
| controllerSize | combo | large | 控制器尺寸 |
| controllerX / controllerY | slider | 2 / 3 | 控制器位置（%） |

> 全部外观项（主题、渲染精度、响应通道、空闲波浪）已并入「外观 / Appearance」分类；音频响应强度 `audioIntensity` 已移除，改为各响应通道独立强度。

---

## 开发流程

### 构建
```bash
pnpm run build
```
输出到 `dist-wallpaper/wallpaper/`，将此目录导入 Wallpaper Engine。

### 本地开发
```bash
pnpm run dev
```
访问 `http://localhost:5173`（需手动模拟音频数据）。

---

## 已知问题与注意事项

1. **属性初始化时序**：Wallpaper Engine 在壁纸加载时立即调用 `applyUserProperties`，但 React 组件尚未挂载。已用 `_pendingProps` 缓存方案解决，**切勿删除模块级别的 `wallpaperPropertyListener` 注册**。

2. **空闲波浪逻辑**：防抖只在"进入空闲"方向生效，恢复音频应立即响应。修改时注意不要反向添加防抖。

3. **波纹触发频段**：目前固定为 0-12 bin，如需调整需同时修改 `AudioEngine.ts` 和 `TriggerConfig` 构造函数。

4. **高性能警告**：1024×1024 网格会非常卡顿，仅用于"抽象"效果展示。

5. **Wallpaper Engine 模式检测**：`isPlaying` 在 WE 模式下一直为 true，空闲检测必须基于音频能量而非播放状态。

---

## 关键文件速查

| 功能 | 文件 | 关键代码位置 |
|------|------|--------------|
| FFT频段分布 | AudioEngine.ts | L209-242 |
| 空闲波浪防抖 | AudioEngine.ts | L319-354 `getIdleWaveIntensity()` |
| 波纹触发配置 | AudioEngine.ts | L45-51 TriggerConfig 构造函数 |
| 属性监听缓存 | main.tsx | L11-31 `_pendingProps` + `wallpaperPropertyListener` |
| 波纹生成范围 | MapScene.tsx | L150-180 范围参数 |
| 波浪着色器 | CustomShaderMaterial.ts | L180-220 GLSL |

---

## 后续建议

1. 可考虑将波纹触发频段改为用户可配置（project.json 新增 combo）
2. 1024×1024 模式可自动降低着色器复杂度以缓解卡顿
3. Media Integration 可扩展更多字段（如音量、播放列表）

---

**交接日期**：2026-10-18
**当前版本**：v17