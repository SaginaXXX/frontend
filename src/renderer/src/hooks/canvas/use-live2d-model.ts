/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
import { useEffect, useRef, useCallback, useState } from "react";
import * as PIXI from "pixi.js";
import {
  Live2DModel,
  MotionPreloadStrategy,
  MotionPriority,
} from "pixi-live2d-display-lipsyncpatch";
import {
  ModelInfo,
  useLive2DConfig,
  MotionWeightMap,
  TapMotionMap,
} from "@/context/live2d-config-context";
import { useLive2DModel as useModelContext } from "@/context/live2d-model-context";
import { setModelSize, resetModelPosition } from "./use-live2d-resize";
import { audioTaskQueue } from "@/utils/task-queue";
import { useAiStore } from "@/store";
import { toaster } from "@/components/ui/toaster";
import { useForceIgnoreMouse } from "../utils/use-force-ignore-mouse";

interface UseLive2DModelProps {
  isPet: boolean; // Whether the model is in pet mode
  modelInfo: ModelInfo | undefined; // Live2D model configuration information
}

export const useLive2DModel = ({
  isPet,
  modelInfo,
}: UseLive2DModelProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<Live2DModel | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const kScaleRef = useRef<string | number | undefined>(undefined);
  const { setCurrentModel } = useModelContext();
  const { setIsLoading } = useLive2DConfig();
  const loadingRef = useRef(false);
  const { setAiState, status: aiState } = useAiStore();
  const [isModelReady, setIsModelReady] = useState(false);
  const { forceIgnoreMouse } = useForceIgnoreMouse();

  // Cleanup function for Live2D model
  const cleanupModel = useCallback(() => {
    if (modelRef.current) {
      modelRef.current.removeAllListeners();
      setCurrentModel(null);
      if (appRef.current) {
        appRef.current.stage.removeChild(modelRef.current);
        modelRef.current.destroy({
          children: true,
          texture: true,
          baseTexture: true,
        });
        PIXI.utils.clearTextureCache();
        modelRef.current = null;
      }
    }
    setIsModelReady(false);
  }, [setCurrentModel]);

  // Cleanup function for PIXI application
  const cleanupApp = useCallback(() => {
    if (appRef.current) {
      if (modelRef.current) {
        cleanupModel();
      }
      appRef.current.stage.removeChildren();
      PIXI.utils.clearTextureCache();
      appRef.current.renderer.clear();
      appRef.current.destroy(true, {
        children: true,
        texture: true,
        baseTexture: true,
      });
      PIXI.utils.destroyTextureCache();
      appRef.current = null;
    }
  }, [cleanupModel]);

  // Initialize PIXI application with canvas (only once)
  useEffect(() => {
    if (!appRef.current && canvasRef.current && containerRef.current) {
      const cw = Math.max(1, containerRef.current.clientWidth || window.innerWidth);
      const ch = Math.max(1, containerRef.current.clientHeight || window.innerHeight);
      const app = new PIXI.Application({
        view: canvasRef.current, // canvas element to render on
        autoStart: true,
        width: cw,
        height: ch,
        backgroundAlpha: 0, // transparent background
        antialias: true, // antialiasing
        clearBeforeRender: true, // clear before render
        preserveDrawingBuffer: false, // don't preserve drawing buffer
        powerPreference: "high-performance", // high performance, use GPU if available
        resolution: window.devicePixelRatio || 1,
        autoDensity: true, // auto adjust resolution to fit the screen
      });

      // Render on every frame
      app.ticker.add(() => {
        if (app.renderer) {
          app.renderer.render(app.stage);
        }
      });

      // Ensure event system picks events from our canvas
      try {
        // @ts-ignore
        app.view.style.touchAction = 'none';
        // @ts-ignore
        app.view.style.pointerEvents = 'auto';
      } catch {}

      // Enable stage to receive and dispatch pointer events to children
      try {
        // @ts-ignore
        app.stage.eventMode = 'static';
        // @ts-ignore
        app.stage.interactive = true;
        // @ts-ignore
        app.stage.interactiveChildren = true;
        app.stage.hitArea = new PIXI.Rectangle(0, 0, app.renderer.width, app.renderer.height);
      } catch {}

      // Event system setup complete

      appRef.current = app;
    }

    return () => {
      cleanupApp();
    };
  }, [cleanupApp]);

  const setupModel = useCallback(
    async (model: Live2DModel) => {
      if (!appRef.current || !modelInfo) return;

      if (modelRef.current) {
        modelRef.current.removeAllListeners();
        appRef.current.stage.removeChild(modelRef.current);
        modelRef.current.destroy({
          children: true,
          texture: true,
          baseTexture: true,
        });
        PIXI.utils.clearTextureCache();
      }

      modelRef.current = model;
      setCurrentModel(model);
      appRef.current.stage.addChild(model);

      // Pixi v7: use eventMode; ensure interactive flag for compatibility
      // @ts-ignore - eventMode exists in PIXI v7
      (model as any).eventMode = 'static'; // static improves hit test stability for drag
      // @ts-ignore
      (model as any).interactive = true;
      model.cursor = "grab";

      setIsModelReady(true);
    },
    [setCurrentModel],
  );

  const setupModelSizeAndPosition = useCallback(() => {
    if (!modelRef.current) return;
    setModelSize(modelRef.current, kScaleRef.current);

    const { width, height } = isPet
      ? { width: window.innerWidth, height: window.innerHeight }
      : containerRef.current?.getBoundingClientRect() || {
        width: 0,
        height: 0,
      };

    resetModelPosition(modelRef.current, width, height, modelInfo?.initialXshift, modelInfo?.initialYshift);
  }, [modelInfo?.initialXshift, modelInfo?.initialYshift]);

  // Load Live2D model with configuration
  const loadModel = useCallback(async () => {
    if (!modelInfo?.url || !appRef.current) return;

    if (loadingRef.current) return; // Prevent multiple simultaneous loads

    try {
      loadingRef.current = true;
      setIsLoading(true);
      setAiState('loading');

      // Initialize Live2D model with settings
      const model = await Live2DModel.from(modelInfo.url, {
        autoHitTest: true,
        autoFocus: modelInfo.pointerInteractive ?? false,
        autoUpdate: true,
        ticker: PIXI.Ticker.shared,
        motionPreload: MotionPreloadStrategy.IDLE,
        idleMotionGroup: modelInfo.idleMotionGroupName,
      });

      await setupModel(model);
    } catch (error) {
      console.error("Failed to load Live2D model:", error);
      toaster.create({
        title: `Failed to load Live2D model: ${error}`,
        type: "error",
        duration: 2000,
      });
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
      setAiState('idle');
    }
  }, [
    modelInfo?.url,
    modelInfo?.pointerInteractive,
    setIsLoading,
    setupModel,
  ]);

  const setupModelInteractions = useCallback(
    (model: Live2DModel) => {
      if (!model) return;

      // Clear all previous listeners
      model.removeAllListeners("pointerenter");
      model.removeAllListeners("pointerleave");
      model.removeAllListeners("rightdown");
      model.removeAllListeners("pointerdown");
      model.removeAllListeners("pointermove");
      model.removeAllListeners("pointerup");
      model.removeAllListeners("pointerupoutside");

      // If force ignore mouse is enabled, disable interaction
      if (forceIgnoreMouse && isPet) {
        // @ts-ignore
        (model as any).eventMode = 'none';
        model.cursor = "default";
        return;
      }

      // Enable interactions and expand hit area to the model's bounding box
      // @ts-ignore
      (model as any).eventMode = 'dynamic';
      model.cursor = "pointer";
      try {
        const lb = model.getLocalBounds();
        model.hitArea = new PIXI.Rectangle(lb.x, lb.y, lb.width, lb.height);
      } catch (_) {
        // Fallback: no-op if bounds not ready yet
      }

      let dragging = false;
      let pointerX = 0;
      let pointerY = 0;
      let isTap = false;
      const dragThreshold = 5;

      if (isPet) {
        model.on("pointerenter", () => {
          (window.api as any)?.updateComponentHover("live2d-model", true);
        });

        model.on("pointerleave", () => {
          if (!dragging) {
            (window.api as any)?.updateComponentHover("live2d-model", false);
          }
        });

        model.on("rightdown", (e: any) => {
          e.data.originalEvent.preventDefault();
          (window.api as any).showContextMenu();
        });
      }

      model.on("pointerdown", (e: any) => {
        try { e.stopPropagation?.(); } catch {}
        // Be robust across PIXI versions and input types (mouse/touch/pen)
        const isPrimaryPointer =
          e?.button === 0 ||
          e?.buttons === 1 ||
          e?.data?.originalEvent?.button === 0 ||
          e?.data?.originalEvent?.buttons === 1 ||
          e?.pointerType === "touch" ||
          e?.data?.originalEvent?.pointerType === "touch";

        if (isPrimaryPointer) {
          dragging = true;
          isTap = true;
          pointerX = e.global.x - model.x;
          pointerY = e.global.y - model.y;
          model.cursor = "grabbing";
        }
      });

      model.on("pointermove", (e) => {
        try { (e as any).stopPropagation?.(); } catch {}
        if (dragging) {
          const newX = e.global.x - pointerX;
          const newY = e.global.y - pointerY;
          const dx = newX - model.x;
          const dy = newY - model.y;

          if (Math.hypot(dx, dy) > dragThreshold) {
            isTap = false;
          }

          model.position.x = newX;
          model.position.y = newY;
        }
      });

      model.on("pointerup", (e) => {
        try { (e as any).stopPropagation?.(); } catch {}
        if (dragging) {
          dragging = false;
          model.cursor = "grab";
          if (isTap) {
            handleTapMotion(model, e.global.x, e.global.y);
          }
        }
      });

      model.on("pointerupoutside", () => {
        dragging = false;
        model.cursor = "grab";
      });
    },
    [isPet, forceIgnoreMouse],
  );

  const handleTapMotion = useCallback(
    (model: Live2DModel, x: number, y: number) => {
      if (!modelInfo?.tapMotions) return;

      // Convert global coordinates to model's local coordinates
      const localPos = model.toLocal(new PIXI.Point(x, y));
      const hitAreas = model.hitTest(localPos.x, localPos.y);

      const foundMotion = hitAreas.find((area) => {
        const motionGroup = modelInfo?.tapMotions?.[area];
        if (motionGroup) {
          playRandomMotion(model, motionGroup);
          return true;
        }
        return false;
      });

      if (!foundMotion && Object.keys(modelInfo.tapMotions).length > 0) {
        const mergedMotions = getMergedMotionGroup(modelInfo.tapMotions);
        playRandomMotion(model, mergedMotions);
      }
    },
    [modelInfo?.tapMotions],
  );

  // Reset expression when AI state changes to IDLE (like finishing a conversation)
  useEffect(() => {
    if (aiState === 'idle') {
      if (modelInfo?.defaultEmotion) {
        modelRef.current?.internalModel.motionManager.expressionManager?.setExpression(
          modelInfo.defaultEmotion,
        );
      } else {
        modelRef.current?.internalModel.motionManager.expressionManager?.resetExpression();
      }
    }
  }, [modelRef.current, aiState, modelInfo?.defaultEmotion]);

  // Load model when URL changes and cleanup on unmount
  useEffect(() => {
    if (modelInfo?.url) {
      loadModel();
    }
    return () => {
      cleanupModel();
    };
  }, [modelInfo?.url, modelInfo?.pointerInteractive, loadModel, cleanupModel]);

  useEffect(() => {
    kScaleRef.current = modelInfo?.kScale;
  }, [modelInfo?.kScale]);

  useEffect(() => {
    setupModelSizeAndPosition();
  }, [isModelReady, setupModelSizeAndPosition]);

  useEffect(() => {
    if (modelRef.current && isModelReady) {
      setupModelInteractions(modelRef.current);
    }
  }, [isModelReady, setupModelInteractions, forceIgnoreMouse]);

  return {
    canvasRef,
    appRef,
    modelRef,
    containerRef,
  };
};

const playRandomMotion = (model: Live2DModel, motionGroup: MotionWeightMap) => {
  if (!motionGroup || Object.keys(motionGroup).length === 0) return;

  const totalWeight = Object.values(motionGroup).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  Object.entries(motionGroup).find(([motion, weight]) => {
    random -= weight;
    if (random <= 0) {
      const priority = audioTaskQueue.hasTask()
        ? MotionPriority.NORMAL
        : MotionPriority.FORCE;

      model.motion(motion, undefined, priority);
      return true;
    }
    return false;
  });
};

const getMergedMotionGroup = (
  tapMotions: TapMotionMap,
): MotionWeightMap => {
  const mergedMotions: {
    [key: string]: { total: number; count: number };
  } = {};

  Object.values(tapMotions)
    .flatMap((motionGroup) => Object.entries(motionGroup))
    .reduce((acc, [motion, weight]) => {
      if (!acc[motion]) {
        acc[motion] = { total: 0, count: 0 };
      }
      acc[motion].total += weight;
      acc[motion].count += 1;
      return acc;
    }, mergedMotions);

  return Object.entries(mergedMotions).reduce(
    (acc, [motion, { total, count }]) => ({
      ...acc,
      [motion]: total / count,
    }),
    {} as MotionWeightMap,
  );
};
