import * as THREE from 'three';

export interface ThemeColors {
  name: string;
  id: string;
  uBaseColor1: THREE.Color;
  uBaseColor2: THREE.Color;
  uCoolCore: THREE.Color;
  uCoolEdge: THREE.Color;
  uWarmCore: THREE.Color;
  uWarmEdge: THREE.Color;
  uRippleColor: THREE.Color;
  uPeakColor: THREE.Color; // 中间凸起峰值颜色
  uGlowIntensity: number;
}

/* 主题ID列表，用于轮询 */
export const themeIds = [
  'nocturnal',
  'ocean-deep',
  'arctic-aurora',
  'cyber-forest',
  'golden-hour',
  'ember-fire',
  'crimson-sunset',
  'coral-mirage',
  'neon-tokyo',
  'minimal-monochrome',
  'teal-depth',
  'lavender-dream',
  'cherry-blossom',
  'copper-forge',
  'mint-fresh',
] as const;

export type ThemeId = typeof themeIds[number];

/* 浅色模式常量：天空浅灰蓝，柱子基色白色系，保留少量灰度维持立体感 */
export const lightSkyColor = new THREE.Color(0.88, 0.90, 0.94);
export const lightBaseColor1 = new THREE.Color(1.0, 1.0, 1.0);
export const lightBaseColor2 = new THREE.Color(0.93, 0.94, 0.96);

/* 混合两个主题，t 为 0-1 之间的插值因子 */
export function lerpThemes(theme1: ThemeColors, theme2: ThemeColors, t: number): ThemeColors {
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    name: clampedT < 0.5 ? theme1.name : theme2.name,
    id: clampedT < 0.5 ? theme1.id : theme2.id,
    uBaseColor1: new THREE.Color().lerpColors(theme1.uBaseColor1, theme2.uBaseColor1, clampedT),
    uBaseColor2: new THREE.Color().lerpColors(theme1.uBaseColor2, theme2.uBaseColor2, clampedT),
    uCoolCore: new THREE.Color().lerpColors(theme1.uCoolCore, theme2.uCoolCore, clampedT),
    uCoolEdge: new THREE.Color().lerpColors(theme1.uCoolEdge, theme2.uCoolEdge, clampedT),
    uWarmCore: new THREE.Color().lerpColors(theme1.uWarmCore, theme2.uWarmCore, clampedT),
    uWarmEdge: new THREE.Color().lerpColors(theme1.uWarmEdge, theme2.uWarmEdge, clampedT),
    uRippleColor: new THREE.Color().lerpColors(theme1.uRippleColor, theme2.uRippleColor, clampedT),
    uPeakColor: new THREE.Color().lerpColors(theme1.uPeakColor, theme2.uPeakColor, clampedT),
    uGlowIntensity: THREE.MathUtils.lerp(theme1.uGlowIntensity, theme2.uGlowIntensity, clampedT),
  };
}

export const themes: Record<string, ThemeColors> = {
  // === 1. 靛蓝紫 (Indigo Violet) ===
  'nocturnal': {
    name: '霁紫',
    id: 'nocturnal',
    uBaseColor1: new THREE.Color(0.005, 0.008, 0.025),
    uBaseColor2: new THREE.Color(0.015, 0.025, 0.07),
    uCoolCore: new THREE.Color(0.35, 0.1, 0.9),     // 紫罗兰
    uCoolEdge: new THREE.Color(0.15, 0.0, 0.45),     // 深靛紫
    uWarmCore: new THREE.Color(0.65, 0.25, 1.0),     // 亮紫
    uWarmEdge: new THREE.Color(0.5, 0.1, 0.8),       // 中紫
    uRippleColor: new THREE.Color(0.5, 0.2, 1.0),
    uPeakColor: new THREE.Color(1.0, 0.55, 0.05),    // 亮橙色 - 互补色
    uGlowIntensity: 1.0,
  },
  // === 2. 深海蓝 (Deep Ocean Blue) ===
  'ocean-deep': {
    name: '沧蓝',
    id: 'ocean-deep',
    uBaseColor1: new THREE.Color(0.002, 0.008, 0.028),
    uBaseColor2: new THREE.Color(0.005, 0.018, 0.06),
    uCoolCore: new THREE.Color(0.0, 0.25, 1.0),      // 皇家蓝
    uCoolEdge: new THREE.Color(0.0, 0.08, 0.35),      // 深渊蓝
    uWarmCore: new THREE.Color(0.15, 0.55, 1.0),      // 天蓝
    uWarmEdge: new THREE.Color(0.05, 0.35, 0.85),     // 中蓝
    uRippleColor: new THREE.Color(0.1, 0.5, 1.0),
    uPeakColor: new THREE.Color(1.0, 0.75, 0.1),      // 金黄色 - 暖色对比
    uGlowIntensity: 1.1,
  },
  // === 3. 冰蓝 (Arctic Cyan) ===
  'arctic-aurora': {
    name: '冰蓝',
    id: 'arctic-aurora',
    uBaseColor1: new THREE.Color(0.003, 0.015, 0.022),
    uBaseColor2: new THREE.Color(0.01, 0.03, 0.055),
    uCoolCore: new THREE.Color(0.0, 0.75, 0.85),     // 青绿
    uCoolEdge: new THREE.Color(0.0, 0.3, 0.5),        // 冰蓝
    uWarmCore: new THREE.Color(0.2, 1.0, 0.85),       // 亮青
    uWarmEdge: new THREE.Color(0.05, 0.6, 0.6),       // 绿松
    uRippleColor: new THREE.Color(0.1, 0.9, 0.9),
    uPeakColor: new THREE.Color(1.0, 0.25, 0.35),     // 珊瑚红 - 互补色
    uGlowIntensity: 1.25,
  },
  // === 4. 翡翠绿 (Emerald Green) ===
  'cyber-forest': {
    name: '碧翠',
    id: 'cyber-forest',
    uBaseColor1: new THREE.Color(0.003, 0.018, 0.005),
    uBaseColor2: new THREE.Color(0.01, 0.045, 0.018),
    uCoolCore: new THREE.Color(0.0, 0.85, 0.35),     // 翡翠绿
    uCoolEdge: new THREE.Color(0.0, 0.35, 0.15),      // 墨绿
    uWarmCore: new THREE.Color(0.4, 1.0, 0.3),        // 亮绿
    uWarmEdge: new THREE.Color(0.15, 0.65, 0.2),      // 草绿
    uRippleColor: new THREE.Color(0.3, 1.0, 0.4),
    uPeakColor: new THREE.Color(1.0, 0.2, 0.5),       // 品红色 - 互补色
    uGlowIntensity: 1.3,
  },
  // === 5. 暖金黄 (Warm Gold) ===
  'golden-hour': {
    name: '流金',
    id: 'golden-hour',
    uBaseColor1: new THREE.Color(0.018, 0.015, 0.005),
    uBaseColor2: new THREE.Color(0.045, 0.035, 0.012),
    uCoolCore: new THREE.Color(0.85, 0.6, 0.05),      // 古铜
    uCoolEdge: new THREE.Color(0.5, 0.3, 0.02),        // 深褐
    uWarmCore: new THREE.Color(1.0, 0.92, 0.35),       // 亮金
    uWarmEdge: new THREE.Color(0.85, 0.7, 0.15),       // 暖金
    uRippleColor: new THREE.Color(1.0, 0.85, 0.25),
    uPeakColor: new THREE.Color(0.2, 0.5, 1.0),        // 宝蓝色 - 冷色对比
    uGlowIntensity: 1.2,
  },
  // === 6. 琥珀橙 (Amber Orange) ===
  'ember-fire': {
    name: '余烬',
    id: 'ember-fire',
    uBaseColor1: new THREE.Color(0.022, 0.008, 0.002),
    uBaseColor2: new THREE.Color(0.05, 0.018, 0.005),
    uCoolCore: new THREE.Color(1.0, 0.45, 0.0),      // 橙
    uCoolEdge: new THREE.Color(0.6, 0.15, 0.0),       // 焦橙
    uWarmCore: new THREE.Color(1.0, 0.78, 0.15),      // 琥珀
    uWarmEdge: new THREE.Color(0.9, 0.55, 0.05),      // 深琥珀
    uRippleColor: new THREE.Color(1.0, 0.65, 0.1),
    uPeakColor: new THREE.Color(0.1, 0.4, 1.0),        // 深蓝色 - 互补色
    uGlowIntensity: 1.5,
  },
  // === 7. 血红 (Crimson Red) ===
  'crimson-sunset': {
    name: '赤焰',
    id: 'crimson-sunset',
    uBaseColor1: new THREE.Color(0.025, 0.003, 0.005),
    uBaseColor2: new THREE.Color(0.055, 0.01, 0.015),
    uCoolCore: new THREE.Color(1.0, 0.05, 0.08),      // 正红
    uCoolEdge: new THREE.Color(0.65, 0.0, 0.06),       // 暗红
    uWarmCore: new THREE.Color(1.0, 0.35, 0.2),        // 亮红
    uWarmEdge: new THREE.Color(0.85, 0.12, 0.1),       // 中红
    uRippleColor: new THREE.Color(1.0, 0.15, 0.1),
    uPeakColor: new THREE.Color(0.1, 0.9, 0.7),        // 青绿色 - 互补色
    uGlowIntensity: 1.4,
  },
  // === 8. 珊瑚粉 (Coral Pink) ===
  'coral-mirage': {
    name: '霞粉',
    id: 'coral-mirage',
    uBaseColor1: new THREE.Color(0.02, 0.006, 0.01),
    uBaseColor2: new THREE.Color(0.045, 0.015, 0.022),
    uCoolCore: new THREE.Color(1.0, 0.25, 0.3),       // 珊瑚红
    uCoolEdge: new THREE.Color(0.7, 0.08, 0.18),       // 深珊瑚
    uWarmCore: new THREE.Color(1.0, 0.55, 0.55),       // 粉红
    uWarmEdge: new THREE.Color(0.9, 0.3, 0.35),        // 中珊瑚
    uRippleColor: new THREE.Color(1.0, 0.4, 0.4),
    uPeakColor: new THREE.Color(0.1, 0.7, 1.0),        // 天蓝色 - 冷色对比
    uGlowIntensity: 1.3,
  },
  // === 9. 霓虹紫粉 (Neon Magenta) ===
  'neon-tokyo': {
    name: '幻紫',
    id: 'neon-tokyo',
    uBaseColor1: new THREE.Color(0.01, 0.002, 0.025),
    uBaseColor2: new THREE.Color(0.03, 0.008, 0.065),
    uCoolCore: new THREE.Color(1.0, 0.05, 0.6),       // 霓虹粉
    uCoolEdge: new THREE.Color(0.55, 0.02, 0.85),      // 紫外光
    uWarmCore: new THREE.Color(1.0, 0.25, 0.85),       // 亮紫粉
    uWarmEdge: new THREE.Color(0.8, 0.1, 0.7),         // 中紫粉
    uRippleColor: new THREE.Color(1.0, 0.2, 0.75),
    uPeakColor: new THREE.Color(0.95, 1.0, 0.15),      // 荧光黄绿 - 互补色
    uGlowIntensity: 1.6,
  },
  // === 10. 极简黑白 (Greyscale) ===
  'minimal-monochrome': {
    name: '水墨',
    id: 'minimal-monochrome',
    uBaseColor1: new THREE.Color(0.012, 0.012, 0.012),
    uBaseColor2: new THREE.Color(0.045, 0.045, 0.045),
    uCoolCore: new THREE.Color(0.8, 0.8, 0.8),
    uCoolEdge: new THREE.Color(0.3, 0.3, 0.3),
    uWarmCore: new THREE.Color(1.0, 1.0, 1.0),
    uWarmEdge: new THREE.Color(0.6, 0.6, 0.6),
    uRippleColor: new THREE.Color(1.0, 1.0, 1.0),
    uPeakColor: new THREE.Color(1.0, 1.0, 1.0),        // 纯白
    uGlowIntensity: 0.7,
  },
  // === 11. 青 (Teal) ===
  'teal-depth': {
    name: '幽青',
    id: 'teal-depth',
    uBaseColor1: new THREE.Color(0.002, 0.018, 0.02),
    uBaseColor2: new THREE.Color(0.008, 0.04, 0.045),
    uCoolCore: new THREE.Color(0.0, 0.55, 0.55),       // 深青
    uCoolEdge: new THREE.Color(0.0, 0.25, 0.28),       // 暗青
    uWarmCore: new THREE.Color(0.2, 0.85, 0.75),       // 亮青绿
    uWarmEdge: new THREE.Color(0.08, 0.55, 0.5),       // 中青
    uRippleColor: new THREE.Color(0.15, 0.8, 0.7),
    uPeakColor: new THREE.Color(1.0, 0.45, 0.15),      // 橙红 - 互补色
    uGlowIntensity: 1.2,
  },
  // === 12. 薰衣草 (Lavender) ===
  'lavender-dream': {
    name: '薰衣草',
    id: 'lavender-dream',
    uBaseColor1: new THREE.Color(0.012, 0.008, 0.022),
    uBaseColor2: new THREE.Color(0.03, 0.02, 0.055),
    uCoolCore: new THREE.Color(0.55, 0.35, 0.85),      // 薰衣草紫
    uCoolEdge: new THREE.Color(0.3, 0.15, 0.55),       // 暗紫
    uWarmCore: new THREE.Color(0.75, 0.55, 1.0),       // 亮淡紫
    uWarmEdge: new THREE.Color(0.5, 0.3, 0.75),        // 中紫
    uRippleColor: new THREE.Color(0.65, 0.45, 1.0),
    uPeakColor: new THREE.Color(1.0, 0.8, 0.25),       // 暖黄 - 对比色
    uGlowIntensity: 1.1,
  },
  // === 13. 樱 (Cherry Blossom) ===
  'cherry-blossom': {
    name: '樱',
    id: 'cherry-blossom',
    uBaseColor1: new THREE.Color(0.018, 0.005, 0.012),
    uBaseColor2: new THREE.Color(0.04, 0.012, 0.025),
    uCoolCore: new THREE.Color(1.0, 0.55, 0.65),       // 樱花粉
    uCoolEdge: new THREE.Color(0.7, 0.2, 0.35),        // 深粉
    uWarmCore: new THREE.Color(1.0, 0.72, 0.78),       // 浅粉
    uWarmEdge: new THREE.Color(0.85, 0.45, 0.55),      // 中粉
    uRippleColor: new THREE.Color(1.0, 0.6, 0.7),
    uPeakColor: new THREE.Color(0.25, 0.9, 0.55),      // 翠绿 - 互补色
    uGlowIntensity: 1.15,
  },
  // === 14. 铜 (Copper) ===
  'copper-forge': {
    name: '锻铜',
    id: 'copper-forge',
    uBaseColor1: new THREE.Color(0.02, 0.01, 0.005),
    uBaseColor2: new THREE.Color(0.045, 0.025, 0.012),
    uCoolCore: new THREE.Color(0.85, 0.45, 0.2),       // 铜色
    uCoolEdge: new THREE.Color(0.5, 0.22, 0.08),       // 暗铜
    uWarmCore: new THREE.Color(1.0, 0.65, 0.3),        // 亮铜
    uWarmEdge: new THREE.Color(0.75, 0.38, 0.15),      // 中铜
    uRippleColor: new THREE.Color(0.9, 0.55, 0.25),
    uPeakColor: new THREE.Color(0.3, 0.65, 0.35),      // 铜绿 - 锈蚀互补
    uGlowIntensity: 1.3,
  },
  // === 15. 薄荷 (Mint) ===
  'mint-fresh': {
    name: '薄荷',
    id: 'mint-fresh',
    uBaseColor1: new THREE.Color(0.003, 0.02, 0.015),
    uBaseColor2: new THREE.Color(0.01, 0.045, 0.035),
    uCoolCore: new THREE.Color(0.3, 0.9, 0.65),        // 薄荷绿
    uCoolEdge: new THREE.Color(0.1, 0.45, 0.3),        // 深薄荷
    uWarmCore: new THREE.Color(0.5, 1.0, 0.8),         // 亮薄荷
    uWarmEdge: new THREE.Color(0.25, 0.7, 0.5),        // 中薄荷
    uRippleColor: new THREE.Color(0.4, 1.0, 0.7),
    uPeakColor: new THREE.Color(1.0, 0.3, 0.55),       // 玫红 - 互补色
    uGlowIntensity: 1.2,
  },
};
