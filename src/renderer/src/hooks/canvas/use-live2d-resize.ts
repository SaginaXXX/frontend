import { useEffect, useCallback, useRef } from 'react';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';
import * as PIXI from 'pixi.js';
import { ModelInfo, useLive2DConfig } from '@/context/live2d-config-context';

// Speed of model scaling when using mouse wheel
const SCALE_SPEED = 0.01;

// Reset model to center of container with initial offset
export const resetModelPosition = (
  model: Live2DModel,
  width: number,
  height: number,
  initialXshift: number | undefined,
  initialYshift: number | undefined,
) => {
  if (!model) return;
  const initXshift = Number(initialXshift || 0);
  const initYshift = Number(initialYshift || 0);
  const targetX = (width - model.width) / 2 + initXshift;
  const targetY = (height - model.height) / 2 + initYshift;

  model.position.set(targetX, targetY);
};

// Handle model scaling with smooth interpolation
const handleModelScale = (
  model: Live2DModel,
  deltaY: number,
) => {
  const delta = deltaY > 0 ? -SCALE_SPEED : SCALE_SPEED;
  const currentScale = model.scale.x;
  const newScale = currentScale + delta;

  const lerpFactor = 0.3;
  const smoothScale = currentScale + (newScale - currentScale) * lerpFactor;

  model.scale.set(smoothScale);
  return smoothScale;
};

// Set model size based on device pixel ratio and kScale in modelInfo
export const setModelSize = (
  model: Live2DModel,
  kScale: string | number | undefined,
) => {
  if (!model || kScale === undefined || kScale === null) return;
  const dpr = Number(window.devicePixelRatio || 1);
  // 仅支持数值缩放，移除字符串模式（contain/cover 等）
  model.scale.set(Number(kScale));

  // Update filter resolution for retina displays
  if (model.filters) {
    model.filters.forEach((filter) => {
      if ("resolution" in filter) {
        Object.defineProperty(filter, "resolution", { value: dpr });
      }
    });
  }
};

// 移除自适应等比缩放计算，固定由数值 kScale 控制

// Main hook for handling Live2D model resizing and scaling
export const useLive2DResize = (
  containerRef: React.RefObject<HTMLDivElement>,
  appRef: React.RefObject<PIXI.Application>,
  modelRef: React.RefObject<Live2DModel>,
  modelInfo: ModelInfo | undefined,
  isPet: boolean,
) => {
  const { updateModelScale } = useLive2DConfig();
  const scaleUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastScaleRef = useRef<number | null>(null);

  // Handle mouse wheel scaling
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!modelRef.current || !modelInfo?.scrollToResize) return;
    e.preventDefault();
    const smoothScale = handleModelScale(modelRef.current, e.deltaY);

    // Only update scale if change is significant
    const hasSignificantChange = !lastScaleRef.current ||
      Math.abs(smoothScale - lastScaleRef.current) > 0.0001;

    if (hasSignificantChange) {
      if (scaleUpdateTimeout.current) {
        clearTimeout(scaleUpdateTimeout.current);
      }

      // Debounce scale updates
      scaleUpdateTimeout.current = setTimeout(() => {
        updateModelScale(smoothScale);
        lastScaleRef.current = smoothScale;
      }, 500);
    }
  }, [modelRef, modelInfo?.scrollToResize, updateModelScale]);

  // Add wheel event listener
  useEffect(() => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
    return undefined;
  }, [handleWheel, containerRef]);

  // Handle container resize
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (modelRef.current && appRef.current) {
        // Get container dimensions based on mode
        // 注意：containerRef 应为“设计舞台”元素，带 CSS transform 缩放。
        // getBoundingClientRect() 会返回“缩放后的尺寸”，导致坐标系错位。
        // 应使用 clientWidth/Height 获得未缩放（设计分辨率）的尺寸。
        const { width, height } = isPet
          ? { width: window.innerWidth, height: window.innerHeight }
          : {
              width: Math.max(0, containerRef.current?.clientWidth || 0),
              height: Math.max(0, containerRef.current?.clientHeight || 0),
            };

        // 不再根据容器尺寸自适应缩放；保持数值 kScale 行为

        // Resize renderer to match container (viewport)
        const rw = Math.max(1, width);
        const rh = Math.max(1, height);
        appRef.current.renderer.resize(rw, rh);
        appRef.current.renderer.clear();

        // 以 scale=1 量测模型基准尺寸，计算“完全放入舞台”的等比缩放
        try {
          const prevScale = modelRef.current.scale.x;
          modelRef.current.scale.set(1);
          const baseW = Math.max(1, modelRef.current.width);
          const baseH = Math.max(1, modelRef.current.height);
          modelRef.current.scale.set(prevScale);

          const fitScale = Math.min(width / baseW, height / baseH);
          const desiredScale = typeof (modelInfo as any)?.kScale === 'number'
            ? Math.min((modelInfo as any).kScale as number, fitScale)
            : fitScale; // 没有数值 kScale 时，直接使用完全放入的缩放

          if (Math.abs(desiredScale - prevScale) > 1e-6) {
            modelRef.current.scale.set(desiredScale);
          }
        } catch (_) {
          // 忽略量测异常
        }

        // 居中
        resetModelPosition(modelRef.current, width, height, modelInfo?.initialXshift, modelInfo?.initialYshift);

        // 基于实际可见边界做自动居中（水平/垂直），避免偏移（模型留白不对称时生效）
        try {
          const cfg: any = modelInfo || {};
          const enableAutoCenterX = cfg?.autoCenterX !== false; // 默认开
          const enableAutoCenterY = cfg?.autoCenterY === true;  // 默认关（避免顶端标题/字幕被压）

          const bounds = modelRef.current.getBounds(); // 世界坐标边界
          const modelCenterX = bounds.x + bounds.width / 2;
          const modelCenterY = bounds.y + bounds.height / 2;
          const containerCenterX = width / 2;
          const containerCenterY = height / 2;

          if (enableAutoCenterX) {
            const dx = containerCenterX - modelCenterX;
            if (Number.isFinite(dx) && Math.abs(dx) > 0.1) {
              modelRef.current.position.x += dx;
            }
          }
          if (enableAutoCenterY) {
            const dy = containerCenterY - modelCenterY;
            if (Number.isFinite(dy) && Math.abs(dy) > 0.1) {
              modelRef.current.position.y += dy;
            }
          }
        } catch (_) {
          // 忽略自动居中计算异常，保持默认居中
        }

        // 不再进行二次自动缩放，避免抖动
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [modelRef, containerRef, isPet, appRef]);

  // Cleanup timeout on unmount
  useEffect(() => () => {
    if (scaleUpdateTimeout.current) {
      clearTimeout(scaleUpdateTimeout.current);
    }
  }, []);
};
