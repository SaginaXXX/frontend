import { useState, useEffect } from 'react';

/* 核心是操作这4个参数：x, y, w, h

也是通过接口描述 Hook最终返回描述的样子，比如：
{
  x: 100,
  y: 100,
  w: 800,
  h: 600
} */

export interface Viewport {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UseViewportReturn {
  viewport: Viewport;
  vpDebug: boolean;
  setViewport: (v: Viewport) => void;
  applyViewport: (v: Viewport) => void;
}

/**
 * 管理视口（Viewport）状态，支持从 URL 参数读取和同步
 */
export function useViewport(): UseViewportReturn {
  const getNum = (k: string, d: number) => {
    const v = new URLSearchParams(location.search).get(k);
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) ? n : d;
  };
  
  const getFlag = (k: string) => (new URLSearchParams(location.search).get(k) ?? '') === '1';

  const [viewport, setViewport] = useState<Viewport>(() => ({
    x: Math.round(getNum('cx', 0)),
    y: Math.round(getNum('cy', 0)),
    w: Math.round(getNum('cw', window.innerWidth)),
    h: Math.round(getNum('ch', window.innerHeight)),
  }));
  
  const [vpDebug, setVpDebug] = useState(getFlag('vpdebug'));

  // 应用视口并同步到 URL
  const applyViewport = (nv: Viewport) => {
    setViewport(nv);
    try {
      const sp = new URLSearchParams(location.search);
      sp.set('cx', String(nv.x));
      sp.set('cy', String(nv.y));
      sp.set('cw', String(nv.w));
      sp.set('ch', String(nv.h));
      if (vpDebug) sp.set('vpdebug', '1');
      const url = `${location.pathname}?${sp.toString()}${location.hash}`;
      history.replaceState(null, '', url);
    } catch { /* noop */ }
  };

  // 初次挂载日志
  useEffect(() => {
    if (vpDebug) {
      // eslint-disable-next-line no-console
      console.log('[Viewport:init]', {
        search: location.search,
        devicePixelRatio: window.devicePixelRatio,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        viewport,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听窗口大小变化
  useEffect(() => {
    const onResize = () => {
      setViewport((v) => ({ 
        x: v.x, 
        y: v.y, 
        w: Math.round(getNum('cw', window.innerWidth)), 
        h: Math.round(getNum('ch', window.innerHeight)) 
      }));
      if (vpDebug) {
        // eslint-disable-next-line no-console
        console.log('[Viewport:resize]', {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        });
      }
    };

    const onNav = () => {
      setViewport({
        x: Math.round(getNum('cx', 0)),
        y: Math.round(getNum('cy', 0)),
        w: Math.round(getNum('cw', window.innerWidth)),
        h: Math.round(getNum('ch', window.innerHeight)),
      });
      setVpDebug(getFlag('vpdebug'));
      if (vpDebug) {
        // eslint-disable-next-line no-console
        console.log('[Viewport:navigation]', { search: location.search });
      }
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('hashchange', onNav);
    window.addEventListener('popstate', onNav);
    
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('hashchange', onNav);
      window.removeEventListener('popstate', onNav);
    };
  }, [vpDebug]);

  // 视口变更日志
  useEffect(() => {
    if (vpDebug) {
      // eslint-disable-next-line no-console
      console.log('[Viewport:apply]', viewport);
    }
  }, [viewport, vpDebug]);

  return { viewport, vpDebug, setViewport, applyViewport };
}

