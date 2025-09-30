## 为什么要“整文件注释”而不是直接删除

- **灰度与可回滚**: 先注释、保留文件，便于在出现罕见回归时快速对照或局部回滚，无需 Git 历史检索。
- **知识传承**: 老实现记录了历史设计取舍（例如上下文分层、依赖顺序、特定副作用），能为后来者快速提供对比视角。
- **迁移完成度验证**: 注释期内可以观察一轮发布周期，确认无任何隐藏调用与边缘场景后再删除，降低风险。

## 之前 vs 现在（核心差异）

- **状态源**
  - 之前: 多个 React Context 深度嵌套、互相读写（`AiStateContext`、`SubtitleContext`、`AdvertisementContext`、`LaundryContext` 等）。
  - 现在: 以 Zustand 为唯一“单一事实来源”（`src/renderer/src/store/index.ts`），按领域切分为 slice（AI、Chat、Media、VAD、Proactive、Config/Group）。

- **渲染稳定性**
  - 之前: Context 间相互影响 + useEffect 依赖不稳定，常触发“Maximum update depth exceeded”、“getSnapshot should be cached”。
  - 现在: 全面使用 selector 精准订阅 + useRef 固定函数引用，WebSocket 副作用集中在 `websocket-handler.tsx` 并做去抖，避免环回。

- **Provider 结构**
  - 之前: 依赖顺序敏感、链路深（9 层+），某 Provider 内 setState 容易在挂载期触发连锁更新。
  - 现在: Provider 扁平化，仅保留仍承担 UI API 职责的“适配层”（`bgurl`/`chat-history`/`group`）。

- **广告/洗衣店行为**
  - 之前: 广告显示/隐藏与洗衣店视频切换分散在多个 Context 与副作用中。
  - 现在: 全部统一进入 Media slice；AdCarousel 可见时自动恢复音频监听与本地 VAD；
    - 开机默认显示广告（playlist 为空显示占位）。
    - 唤醒词/后端 `advertisement_control` 决定广告显示；播放洗衣机教程时自动隐藏广告。

## 迁移思路与落地策略

1. **单一事实来源**: 先在 Zustand 中定义完整域模型（AI、Chat、Media、VAD、Proactive、Config），再将读写入口集中到 store，避免“双写/双读”。
2. **稳定副作用**: 所有可能引发环回的副作用（特别是 WebSocket）全部用 `useRef` 固定依赖、在 callback 内读取最新值；`useCallback`/`useMemo` 仅闭包稳定引用，不闭包可变状态。
3. **细粒度订阅**: 各组件使用 selector 订阅单个字段/动作，避免对象重建导致的级联重渲染。
4. **渐进切换**: 先引入 `MigrationProviders useLegacy={false}` 的新链路，补齐所需 Provider；待验证通过后将旧 Context 整文件注释，保留一段观察期。

## 具体改动（按文件）

- `src/renderer/src/store/index.ts`
  - 建立统一 store，新增/扩展：Media（`showAdvertisements`、`isLaundryMode`、`currentVideo`、`availableMachines`、`useCameraBackground` 等）、Chat（历史与消息聚合）、Proactive、AI 等动作。
  - 导出 `useAiStore`、`useChatStore`、`useMediaStore` 等 selector Hook。

- `src/renderer/src/services/websocket-handler.tsx`
  - 全量改为通过 Zustand 动作写状态；
  - 为所有 setter/函数建立 `useRef` 以稳定依赖；
  - 将 `handleWebSocketMessage`、`handleControlMessage` 内部只读 refs，避免 effect 依赖抖动；
  - 恢复/停止广告与洗衣店模式统一走 Media slice。

- `src/renderer/src/components/advertisement/ad-carousel.tsx`
  - 可见时重启广告音频监听并向后端发送 `adaptive-vad-control start`；
  - 保证广告可见时本地 VAD 可工作以支持唤醒；
  - 播放列表获取通过 MCP 响应（`get_advertisement_playlist`）。

- `src/renderer/src/context/bgurl-context.tsx`
  - 作为 UI 适配层，读写统一接入 `useMediaStore`；
  - 容忍 `backgroundFiles` 为字符串或对象结构，提升鲁棒性。

- `src/renderer/src/context/chat-history-context.tsx`
  - 仅负责将 Zustand 的 chat API 以 Context 形态向下游组件暴露（UI 友好 API）。

- `src/renderer/src/context/group-context.tsx`
  - 改为读写 `useAppStore().chat` 相关字段，移除内部 useState。

- `src/renderer/src/providers/index.tsx`
  - 扁平化 Provider 顺序，仅保留必要链路；移除已迁移的 Legacy Provider。

## 整文件注释的旧实现（LEGACY）

- 注释/替换为 stub：
  - `src/renderer/src/context/ai-state-context.tsx`（改为 `export {}`）
  - `src/renderer/src/context/subtitle-context.tsx`（改为 `export {}`）
  - `src/renderer/src/context/advertisement-context.tsx`（整文件注释）
  - `src/renderer/src/context/laundry-context.tsx`（整文件注释）

- 保留（Zustand 适配层）：
  - `bgurl-context.tsx`、`chat-history-context.tsx`、`group-context.tsx`

## 验收与验证

- 启动即显示广告；playlist 为空时出现占位提示；
- 唤醒词可从广告切入对话；“再见”返回广告后仍可唤醒；
- 洗衣店教程播放时隐藏广告；
- 设置面板打开不再白屏（`backgroundFiles.map` 容错已处理）。

## 后续计划

- 观察一整个发布周期，如无回归，删除上述已注释的 legacy 文件；
- 新增功能必须仅通过 Zustand 写读，禁止再引入独立可变 Context 以避免重复数据源。
