import { useFrame, extend, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useMemo, useCallback, useLayoutEffect, useEffect, forwardRef, useImperativeHandle } from 'react';
import { MapShaderMaterial } from './CustomShaderMaterial';
import { engine } from '../../lib/AudioEngine';
import { AudioData } from '../../types';
import { themes, ThemeColors, lightSkyColor, lightBaseColor1, lightBaseColor2 } from '../../lib/themes';

extend({ MapShaderMaterial });

interface MapSceneProps {
  theme?: string | ThemeColors; // 支持主题名或混合后的主题颜色对象
  cameraDistance?: number;
  idleWaveEnabled?: boolean;
  // 各响应通道的独立开关与强度
  centralEnabled?: boolean; // 中心隆起（超低频）
  centralIntensity?: number;
  ringEnabled?: boolean; // 中部环形（低频）
  ringIntensity?: number;
  flowEnabled?: boolean; // 全域流动（中低频）
  flowIntensity?: number;
  riverEnabled?: boolean; // 河流对角线（中频）
  riverIntensity?: number;
  spikeEnabled?: boolean; // 高频尖刺（高频 + 能量突起）
  spikeIntensity?: number;
  rippleIntensity?: number; // 波纹强度倍率
  meteorIntensity?: number; // 流星强度倍率
  responseRange?: number;
  cameraAngleX?: number;
  cameraAngleY?: number;
  autoRotateEnabled?: boolean;
  autoRotateSpeed?: number; // 每秒旋转的角度（度）
  gridSize?: number;
  peakColorEnabled?: boolean; // 强调色开关
  peakColorIntensity?: number; // 强调色强度 (0-2)
  lightMode?: boolean; // 浅色模式：天空变浅，柱子无响应时变白
}

export interface MapSceneHandle {
  triggerMeteorAt: (clientX: number, clientY: number) => void;
}

export const MapScene = forwardRef<MapSceneHandle, MapSceneProps>(({ theme = 'nocturnal', cameraDistance = 50, idleWaveEnabled = true, responseRange = 1.0, centralEnabled = true, centralIntensity = 1.0, ringEnabled = true, ringIntensity = 1.0, flowEnabled = true, flowIntensity = 1.0, riverEnabled = true, riverIntensity = 1.0, spikeEnabled = true, spikeIntensity = 1.0, rippleIntensity = 1.0, meteorIntensity = 1.0, cameraAngleX = 45, cameraAngleY = 30, autoRotateEnabled = false, autoRotateSpeed = 10, gridSize = 160, peakColorEnabled = true, peakColorIntensity = 1.0, lightMode = false }, ref) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<any>(null);
  const { clock, camera, gl } = useThree();

  // 自动旋转角度追踪
  const autoRotateAngleRef = useRef(cameraAngleX);

  // 逻辑帧参数 ref：存储最新的动态参数，避免 useEffect 频繁重建
  const logicParamsRef = useRef({
    autoRotateEnabled,
    autoRotateSpeed,
    cameraAngleY,
    cameraDistance,
  });

  // 同步最新参数到 ref
  useEffect(() => {
    logicParamsRef.current.autoRotateEnabled = autoRotateEnabled;
    logicParamsRef.current.autoRotateSpeed = autoRotateSpeed;
    logicParamsRef.current.cameraAngleY = cameraAngleY;
    logicParamsRef.current.cameraDistance = cameraDistance;
  }, [autoRotateEnabled, autoRotateSpeed, cameraAngleY, cameraDistance]);

  // 触发型效果（波纹/流星）的强度倍率，供触发器回调读取最新值
  const triggerIntensityRef = useRef({ ripple: rippleIntensity, meteor: meteorIntensity });
  useEffect(() => {
    triggerIntensityRef.current.ripple = rippleIntensity;
    triggerIntensityRef.current.meteor = meteorIntensity;
  }, [rippleIntensity, meteorIntensity]);

  // 复用 Color 对象避免每帧 GC
  const _tempColor = useMemo(() => new THREE.Color(), []);
  const _whiteColor = useMemo(() => new THREE.Color(0xffffff), []);

  // 获取主题颜色对象
  const getThemeColors = useCallback((): ThemeColors => {
    if (typeof theme === 'string') {
      return themes[theme] || themes['nocturnal'];
    }
    return theme;
  }, [theme]);
  
  const totalRange = 168;
  const spacing = totalRange / gridSize;
  const pillarWidth = spacing * 0.857;
  const count = gridSize * gridSize;
  const halfExtent = totalRange / 2;

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const tempMatrix = new THREE.Matrix4();
    const offset = (gridSize * spacing) / 2;

    let i = 0;
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const px = x * spacing - offset;
        const pz = z * spacing - offset;
        tempMatrix.makeTranslation(px, 0.5, pz);
        meshRef.current.setMatrixAt(i, tempMatrix);
        i++;
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [gridSize, spacing]);

  // Ripples logic
  // We keep a ring buffer of 20 ripples
  const ripplesRef = useRef(new Array(20).fill(null).map(() => ({
    pos: new THREE.Vector2(),
    time: -100,
    strength: 0,
    isActive: 0,
    rippleType: 0
  })));
  const rippleIndex = useRef(0);

  const addRipple = useCallback((x: number, y: number, strength: number, isWhite: boolean = false) => {
    const idx = rippleIndex.current;
    ripplesRef.current[idx] = {
      pos: new THREE.Vector2(x, y),
      time: clock.getElapsedTime(),
      strength,
      isActive: 1,
      rippleType: isWhite ? 1 : 0
    } as any;
    rippleIndex.current = (idx + 1) % 20;
  }, [clock]);

  const fogRef = useRef<THREE.Fog>(null);
  
  // Meteors logic
  const MAX_METEORS = 40;
  const meteorMeshRef = useRef<THREE.InstancedMesh>(null);
  const meteorMatRef = useRef<THREE.MeshBasicMaterial>(null);
  
  // Particles for meteor trails
  const MAX_PARTICLES = 200;
  const particleMeshRef = useRef<THREE.InstancedMesh>(null);
  const particleMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const particlesRef = useRef(new Array(MAX_PARTICLES).fill(null).map(() => ({
    active: false,
    x: 0, y: -1000, z: 0,
    vx: 0, vy: 0, vz: 0,
    life: 0, maxLife: 1, scale: 1
  })));
  const particleIndex = useRef(0);
  const spawnParticle = useCallback((x: number, y: number, z: number, speedMultiplier: number) => {
     const idx = particleIndex.current;
     const p = particlesRef.current[idx];
     p.active = true;
     p.x = x + (Math.random() - 0.5) * 1.5;
     p.y = y + (Math.random() - 0.5) * 1.5;
     p.z = z + (Math.random() - 0.5) * 1.5;
     p.vx = (Math.random() - 0.5) * 2.0;
     p.vy = Math.random() * 2.0 + speedMultiplier * 10.0;
     p.vz = (Math.random() - 0.5) * 2.0;
     p.life = 0;
     p.maxLife = 0.5 + Math.random() * 0.5;
     p.scale = Math.random() * 0.6 + 0.2;
     particleIndex.current = (idx + 1) % MAX_PARTICLES;
  }, [MAX_PARTICLES]);
  
  const dummyMatrix = useMemo(() => new THREE.Matrix4(), []);
  const dummyPosition = useMemo(() => new THREE.Vector3(), []);
  const dummyRotation = useMemo(() => new THREE.Quaternion(), []);
  const dummyScale = useMemo(() => new THREE.Vector3(), []);
  
  const meteorsRef = useRef(new Array(MAX_METEORS).fill(null).map(() => ({
    active: false,
    x: 0,
    y: -1000,
    z: 0,
    speed: 0,
    strength: 0,
  })));
  const meteorIndex = useRef(0);
  const lastMeteorSpawnTime = useRef(-Infinity);
  const lastClickMeteorTime = useRef(-Infinity);

  const addMeteor = (strength: number) => {
     const now = clock.getElapsedTime();
     const cooldownSeconds = engine.meteorTrigger.cooldown / 60;
     if (now - lastMeteorSpawnTime.current < cooldownSeconds) return;
     lastMeteorSpawnTime.current = now;

     const idx = meteorIndex.current;
     const angle = Math.random() * Math.PI * 2;
     const dist = 10 + Math.random() * 35;
     
     const m = meteorsRef.current[idx];
     m.active = true;
     m.x = Math.cos(angle) * dist;
     m.z = Math.sin(angle) * dist;
     m.y = 30 + Math.random() * 10;
     m.speed = 1.0 + Math.random() * 0.5 + (strength * 2.5);
     m.strength = strength;
     
     meteorIndex.current = (idx + 1) % MAX_METEORS;
  };
  
  // Pulse anchor: keep kick ripples clustered in groups of 3~7 per anchor position
  const pulseAnchorRef = useRef({ x: 0, z: 0, initialized: false, lastTriggerTime: 0, hitsRemaining: 0 });
  const PULSE_ANCHOR_EXPIRE_MS = 1500; // 超过此间隔则重新开始新簇计数

  // Wire up audio engine beat detection
  // Strength is already scaled by engine's pulseStrength/meteorStrength config in evaluateTrigger,
  // 这里再乘以用户配置的波纹/流星强度倍率
  useEffect(() => {
    engine.onFreqTrigger = (strength, mode, action) => {
       if (action === 'Meteor') {
          addMeteor(Math.min(strength * 20, 4.0) * triggerIntensityRef.current.meteor);
       } else {
          const now = performance.now();

          if (!pulseAnchorRef.current.initialized || 
              (now - pulseAnchorRef.current.lastTriggerTime) > PULSE_ANCHOR_EXPIRE_MS ||
              pulseAnchorRef.current.hitsRemaining <= 0) {
             pulseAnchorRef.current.x = (Math.random() - 0.5) * 50;
             pulseAnchorRef.current.z = (Math.random() - 0.5) * 50;
             pulseAnchorRef.current.hitsRemaining = 5 + Math.floor(Math.random() * 9);
             pulseAnchorRef.current.initialized = true;
          }
          pulseAnchorRef.current.hitsRemaining--;
          pulseAnchorRef.current.lastTriggerTime = now;

          let rx: number, rz: number;
          if (mode === 'Kick') {
             rx = pulseAnchorRef.current.x + (Math.random() - 0.5) * 8;
             rz = pulseAnchorRef.current.z + (Math.random() - 0.5) * 8;
          } else {
             const angle = Math.random() * Math.PI * 2;
             const dist = 15 + Math.random() * 45;
             rx = Math.cos(angle) * dist;
             rz = Math.sin(angle) * dist;
          }
          addRipple(rx, rz, Math.min(strength * 40, 8.0) * triggerIntensityRef.current.ripple);
       }
    };
  }, [theme]);

  useImperativeHandle(ref, () => ({
    triggerMeteorAt: (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectionPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectionPoint);

      if (intersectionPoint) {
        const now = clock.getElapsedTime();
        if (now - lastClickMeteorTime.current < 0.3) return;
        lastClickMeteorTime.current = now;

        const idx = meteorIndex.current;
        const m = meteorsRef.current[idx];
        m.active = true;
        m.x = intersectionPoint.x;
        m.z = intersectionPoint.z;
        m.y = 30 + Math.random() * 10;
        m.speed = 1.0 + Math.random() * 0.5 + 2.5;
        m.strength = 1.0 * triggerIntensityRef.current.meteor;

        meteorIndex.current = (idx + 1) % MAX_METEORS;
      }
    },
  }), [camera, gl, clock]);

  // Camera position controlled by distance + two-axis angle
  const updateCameraPosition = useCallback((angleX: number, angleY: number, dist: number) => {
    const azimuth = angleX * Math.PI / 180;
    const elevation = angleY * Math.PI / 180;
    const horizontalDist = dist * Math.cos(elevation);
    camera.position.x = horizontalDist * Math.sin(azimuth);
    camera.position.z = horizontalDist * Math.cos(azimuth);
    camera.position.y = dist * Math.sin(elevation);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useEffect(() => {
    // 自动旋转未启用时，始终将 cameraAngleX 同步到 ref，确保启用旋转时从当前角度开始
    if (!autoRotateEnabled) {
      autoRotateAngleRef.current = cameraAngleX;
    }
    // 自动旋转未启用时，由 prop 控制相机位置；启用时由逻辑帧控制
    if (!autoRotateEnabled) {
      updateCameraPosition(cameraAngleX, cameraAngleY, cameraDistance);
    }
  }, [cameraAngleX, cameraAngleY, cameraDistance, autoRotateEnabled, updateCameraPosition]);

  // 逻辑帧缓冲区：逻辑帧写入，渲染帧读取
  const logicBufferRef = useRef({
    audioData: null as AudioData | null,
    idleIntensity: 0,
  });

  /* 逻辑帧：固定 1000fps，独立于渲染帧率，保证位置更新平滑跟手 */
  useEffect(() => {
    const LOGIC_FPS = 1000;
    let lastTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const elapsed = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(elapsed, 0.1);

      // 音频数据采样
      logicBufferRef.current.audioData = engine.getAudioData(dt);
      logicBufferRef.current.idleIntensity = engine.getIdleWaveIntensity(dt);

      // 流星位置更新
      for (let i = 0; i < MAX_METEORS; i++) {
        const m = meteorsRef.current[i];
        if (m.active) {
          m.y -= m.speed * 60 * dt;
          if (m.y <= 0) {
            m.active = false;
            addRipple(m.x, m.z, m.strength * 1.5, true);
            for (let pIndex = 0; pIndex < 10; pIndex++) spawnParticle(m.x, 0.5, m.z, m.speed * 1.5);
          }
          // 流星拖尾粒子
          if (m.active && m.y > 0 && Math.random() > 0.3) {
            spawnParticle(m.x, m.y, m.z, m.speed * 0.2);
          }
        }
      }

      // 粒子位置更新
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particlesRef.current[i];
        if (p.active) {
          p.life += dt;
          if (p.life >= p.maxLife) {
            p.active = false;
          } else {
            p.x += p.vx * dt * 10;
            p.y += p.vy * dt * 10;
            p.z += p.vz * dt * 10;
          }
        }
      }

      // 自动旋转 - 从 ref 读取最新参数
      const params = logicParamsRef.current;
      if (params.autoRotateEnabled) {
        autoRotateAngleRef.current = (autoRotateAngleRef.current + params.autoRotateSpeed * dt) % 360;
        updateCameraPosition(autoRotateAngleRef.current, params.cameraAngleY, params.cameraDistance);
      }
    };

    const interval = setInterval(tick, 1000 / LOGIC_FPS);
    tick();
    return () => clearInterval(interval);
  }, [MAX_METEORS, MAX_PARTICLES, addRipple, spawnParticle, updateCameraPosition]);

  /* 渲染帧：按 fpsLimit 频率，只传递 uniform + 更新矩阵 */
  useFrame((state) => {
    if (!materialRef.current) return;
    const mat = materialRef.current;
    const buf = logicBufferRef.current;
    const data = buf.audioData || engine.getAudioData(0.016);
    const t = getThemeColors();

    const isMixedTheme = typeof theme !== 'string';
    const lerpSpeed = isMixedTheme ? 1.0 : 0.05;

    // 浅色模式下柱子基色与雾色替换为浅色目标，响应色仍跟随所选主题
    const targetBase1 = lightMode ? lightBaseColor1 : t.uBaseColor1;
    const targetBase2 = lightMode ? lightBaseColor2 : t.uBaseColor2;
    const targetSky = lightMode ? lightSkyColor : t.uBaseColor1;

    mat.uBaseColor1.lerp(targetBase1, lerpSpeed);
    mat.uBaseColor2.lerp(targetBase2, lerpSpeed);
    mat.uCoolCore.lerp(t.uCoolCore, lerpSpeed);
    mat.uCoolEdge.lerp(t.uCoolEdge, lerpSpeed);
    mat.uWarmCore.lerp(t.uWarmCore, lerpSpeed);
    mat.uWarmEdge.lerp(t.uWarmEdge, lerpSpeed);
    mat.uRippleColor.lerp(t.uRippleColor, lerpSpeed);
    mat.uPeakColor.lerp(t.uPeakColor, lerpSpeed);
    mat.uGlowIntensity = THREE.MathUtils.lerp(mat.uGlowIntensity, t.uGlowIntensity, lerpSpeed);
    mat.uPeakEnabled = peakColorEnabled ? 1.0 : 0.0;
    mat.uPeakIntensity = peakColorIntensity;
    // 浅色模式平滑过渡，用于切换流星波纹的墨色
    mat.uLightMode = THREE.MathUtils.lerp(mat.uLightMode, lightMode ? 1.0 : 0.0, lerpSpeed);

    if (fogRef.current) {
        fogRef.current.color.lerp(targetSky, lerpSpeed);
    }

    mat.uTime = state.clock.getElapsedTime();
    mat.uBass = data.bass;
    mat.uMid = data.mid;
    mat.uTreble = data.treble;
    mat.uEnergy = data.energy;
    mat.uSubBass = data.subBass;
    mat.uLowMid = data.lowMid;
    mat.uHighMid = data.highMid;
    mat.uPresence = data.presence;
    mat.uBrilliance = data.brilliance;
    mat.uAir = data.air;
    mat.uWarmth = data.warmth;
    mat.uBrightness = data.brightness;
    mat.uSharpness = data.sharpness;
    mat.uSmoothness = data.smoothness;
    mat.uDensity = data.density;
    mat.uSpectralCentroid = data.spectralCentroid;
    // 各响应通道强度，关闭时置 0
    mat.uCentralIntensity = centralEnabled ? centralIntensity : 0.0;
    mat.uRingIntensity = ringEnabled ? ringIntensity : 0.0;
    mat.uFlowIntensity = flowEnabled ? flowIntensity : 0.0;
    mat.uRiverIntensity = riverEnabled ? riverIntensity : 0.0;
    mat.uSpikeIntensity = spikeEnabled ? spikeIntensity : 0.0;
    mat.uResponseRange = responseRange;
    mat.uRipples = ripplesRef.current;
    mat.uIdleWave = idleWaveEnabled ? buf.idleIntensity : 0.0;
    mat.uHalfExtent = halfExtent;

    // 流星矩阵更新
    if (meteorMeshRef.current) {
        if (meteorMatRef.current) {
            const mColor = _tempColor.copy(t.uWarmCore).lerp(_whiteColor, 0.7);
            meteorMatRef.current.color.lerp(mColor, lerpSpeed);
        }
        for (let i = 0; i < MAX_METEORS; i++) {
            const m = meteorsRef.current[i];
            if (!m.active) {
                dummyPosition.set(0, -1000, 0);
                dummyScale.set(0, 0, 0);
            } else {
                dummyPosition.set(m.x, Math.max(0, m.y), m.z);
                dummyScale.set(1.5, 1.5, 1.5);
            }
            dummyMatrix.compose(dummyPosition, dummyRotation, dummyScale);
            meteorMeshRef.current.setMatrixAt(i, dummyMatrix);
        }
        meteorMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 粒子矩阵更新
    if (particleMeshRef.current) {
        if (particleMatRef.current) particleMatRef.current.color.copy(meteorMatRef.current ? meteorMatRef.current.color : _whiteColor);
        for (let i = 0; i < MAX_PARTICLES; i++) {
           const p = particlesRef.current[i];
           if (!p.active) {
                dummyPosition.set(0, -1000, 0);
                dummyScale.set(0, 0, 0);
           } else {
                const s = p.scale * (1.0 - (p.life / p.maxLife));
                dummyPosition.set(p.x, p.y, p.z);
                dummyScale.set(s, s, s);
           }
           dummyMatrix.compose(dummyPosition, dummyRotation, dummyScale);
           particleMeshRef.current.setMatrixAt(i, dummyMatrix);
        }
        particleMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const t = getThemeColors();

  return (
    <>
      <fog ref={fogRef} attach="fog" args={[`#${t.uBaseColor1.getHexString()}`, 30, 95]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} />

      <instancedMesh
        ref={meshRef}
        key={gridSize}
        args={[undefined, undefined, count]}
      >
        <boxGeometry args={[pillarWidth, 1, pillarWidth]} />
        {/* @ts-ignore */}
        <mapShaderMaterial ref={materialRef} transparent={true} depthWrite={true} />
      </instancedMesh>

      <instancedMesh ref={meteorMeshRef} args={[undefined as any, undefined as any, MAX_METEORS]} frustumCulled={false}>
         <boxGeometry args={[0.4, 1.2, 0.4]} />
         <meshBasicMaterial ref={meteorMatRef} color="#ffffff" toneMapped={false} /> 
      </instancedMesh>

      <instancedMesh ref={particleMeshRef} args={[undefined as any, undefined as any, MAX_PARTICLES]} frustumCulled={false}>
         <boxGeometry args={[0.8, 0.8, 0.8]} />
         <meshBasicMaterial ref={particleMatRef} color="#ffffff" toneMapped={false} transparent={true} opacity={0.6} /> 
      </instancedMesh>
    </>
  );
});
