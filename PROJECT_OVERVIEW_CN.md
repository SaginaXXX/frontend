## AI-PROJECT-X 项目导览（深度理解版，夹点幽默）

> 一句话：这是一个 Electron + React 的跨端桌面应用，内置 Live2D 虚拟角色、语音活动检测（VAD）、WebSocket 实时对话、广告轮播、托盘菜单和“宠物模式”。简单说，就是一只会说话、会卖萌、还能抢你鼠标焦点的小精灵。

### 架构鸟瞰
- **主进程（Electron Main）**: 负责窗口生命周期、系统托盘、全局快捷键、IPC 调度、权限与模式切换。
- **预加载层（Preload）**: 安全桥梁，把有限的 Electron 能力暴露为 `window.api`/`window.electron`。
- **渲染层（Renderer / React）**: UI 与业务逻辑的大本营，Live2D、字幕、侧边栏、广告、洗衣店视频（？）、聊天历史、群组、设置……都在这儿。
- **服务 & 状态**: WebSocket 单例服务 + 一组 Context Providers（暂时保留“Legacy Providers”，逐步迁移到更轻的状态管理）。

### 主进程：窗口与“宠物”的驯兽师
- 入口：`src/main/index.ts`
  - 创建 `WindowManager` 与 `MenuManager`，注册 IPC、托盘、权限处理（麦克风/摄像头）。
  - 开发环境下注册 `F12` 切换 DevTools。
  - 处理全局窗口事件（最小化、最大化、关闭、全屏等）。

- 窗口管理：`src/main/window-manager.ts`
  - 负责创建 `BrowserWindow`，并在两种形态间切换：
    - **window 模式**：普通应用窗口，尊重人类，规规矩矩。
    - **pet 模式**：铺满屏幕，置顶漂浮，可设置鼠标穿透。它不打游戏，但会挡你游戏。
  - 支持根据鼠标是否“悬停在可交互组件上”来动态切换忽略鼠标事件（穿透），并提供“强制忽略鼠标”的全局开关（如同把宠物拴在透明胶带上）。
  - 负责通知渲染层窗口状态变化：最大化/全屏切换等（用以隐藏自定义标题栏）。

- 托盘与菜单：`src/main/menu-manager.ts`
  - 托盘图标 + 右键菜单：切换 Window/Pet 模式、切换鼠标穿透、显示/隐藏、退出。
  - 在 Pet 模式下还有上下文菜单，支持：切麦、打断、滚轮缩放 Live2D、切换角色（从服务端来的配置列表）。

### 预加载层：有文化的“翻译官”
- 文件：`src/preload/index.ts`、`src/preload/index.d.ts`
- 暴露 `window.api` 与 `window.electron`，包括：
  - `toggleFullscreen`、`setIgnoreMouseEvents`、`toggleForceIgnoreMouse` 等主动指令。
  - `onFullscreenChange`、`onMicToggle`、`onInterrupt`、`onToggleInputSubtitle`、`onSwitchCharacter` 等事件订阅。
- 小贴士：这层是安全沙箱（`contextIsolation: true`），只暴露我们允许的“白名单”能力。

### 渲染层：UI、状态与业务的华丽舞台
- 入口：`src/renderer/src/main.tsx` → `App.tsx`
  - `App` 里通过 `MigrationProviders` 包裹整站：
    - 目前默认 `useLegacy={true}`，即加载一整套上下文（WebSocket/Live2D/VAD/字幕/聊天/群组/摄像头/屏幕捕获等）。
    - 逐步迁移目标是 `AppProviders`（更扁平高效）。
  - 主屏根据模式渲染：
    - window 模式：自定义 `TitleBar` + `Canvas`（背景 + Live2D + 字幕）+ `ControlPanel`。
    - pet 模式：全屏 `Live2D` + 可拖拽的 `InputSubtitle` 漂浮输入条。
  - 还内置：广告轮播（有 VAD 音频控制）、“洗衣店”视频播放器（你没看错）。

#### 状态与 Providers（摘几位主角）
- `websocket-service.tsx` + `websocket-handler.tsx`
  - 单例 `wsService` 维护连接 & 事件流；`websocket-handler` 把消息分发到各 Context：
    - `audio` → 音频播放队列（嘴型、表情、字幕）。
    - `full-text` → 字幕。
    - `set-model-and-conf` → Live2D 模型配置 & 角色上下文。
    - `history-*` → 聊天历史列表与内容。
    - `group-*` → 群组变更。
    - `laundry-*` → 洗衣机教学视频（来自后端的“彩蛋”业务）。
    - `wake-word-state` / `advertisement_control` → 广告显隐控制、状态上报等。

- `live2d-config-context.tsx`
  - 管理当前 Live2D 模型信息（URL、缩放、偏移、表情映射、点击动作等）。
  - 会按角色 UID 和模式（window/pet）记忆缩放比例，给用户“看我就要这么大”的尊重。

- `ai-state-context.tsx`
  - AI 的“情绪状态机”：idle / thinking-speaking / interrupted / loading / listening / waiting。
  - waiting 自动 2 秒回落到 idle（别慌，我们很快回到平静）。

- `vad-context.tsx`
  - 基于 `@ricky0123/vad-web`（ONNXRuntime Web + WASM）实现本地 VAD：
    - `startMic`/`stopMic` 控麦，语音开始时自动中断 AI 说话，语音结束时切片推送到服务端。
    - 参数持久化（正/负阈值 & redemption 帧数），支持“对话结束自动开麦”等自动化选项。
  - 相关 WASM/模型文件通过 Vite 插件复制到 `renderer/libs/`，详见配置章节。

- `subtitle-context.tsx`
  - 管理字幕文案与显示开关，默认有一段相当“自信”的开场白。

- `character-config-context.tsx`
  - 存角色名/UID与服务器下发的角色配置列表；托盘菜单的“切换角色”用它。

#### 组件速写
- `components/canvas/`：
  - `Live2D`：基于 `pixi.js` + `pixi-live2d-display-lipsyncpatch`，封装了加载、缩放、表达控制与窗口模式适配。顺便把一组控制方法塞到 `window.live2d.*`，方便手动玩表情包。
  - `Subtitle`：字幕叠层。
  - `Background`：背景管理（与服务器下发背景列表对接）。

- `components/electron/`：
  - `TitleBar`：Windows 自定义标题栏，监听主进程发来的最大化/全屏事件；macOS 用系统原生隐藏标题栏样式。
  - `InputSubtitle`：宠物模式下的悬浮输入条，可拖拽、可切麦、可打断，还会给主进程上报“我正被鼠标摸摸哟”。

- `components/sidebar/`：
  - 聊天历史、设置面板、群组抽屉、底部工具栏等。对话生命周期操作在这边触发（比如“新建会话”）。

- `components/advertisement/AdCarousel`：
  - 广告轮播。受后端 `advertisement_control` 消息驱动，支持带 VAD 的音频开关，尽量不打扰你正嗨的 BGM。

- `components/laundry/VideoPlayer`：
  - 来自“洗衣店”业务的播放器。后端发来 `laundry-video-response` 就自动跳出来教学（谁能想到 AI 也会家务呢）。

#### Hooks 与工具
- `hooks/utils/use-keyboard-shortcuts.ts`
  - 全局快捷键：`F11`/`Ctrl+G` 全屏切换，`Ctrl+Space`/`Ctrl+M` 打开控制面板。

- `hooks/utils/use-ipc-handlers.ts`
  - 在 Pet 模式下注册一堆 IPC：切麦、打断、滚轮缩放 Live2D、切换角色、强制鼠标穿透等。

- `utils/task-queue.ts`
  - 简单的串行任务队列，用于平顺播放音频片段。避免“十个切片同时开口”这种恐怖片效果。

### 配置与打包：把“声音的肌肉”搬到前端
- Electron 构建：`electron.vite.config.ts`
  - 渲染进程里通过 `vite-plugin-static-copy` 把下列文件复制到 `renderer/libs/`：
    - `vad.worklet.bundle.min.js`
    - `silero_vad_v5.onnx`/`silero_vad_legacy.onnx`
    - `onnxruntime-web` 的各类 `*.wasm`
  - 抑制 onnxruntime 的打包警告，以免开发者被“温柔轰炸”。

- 纯 Web 预览/构建：`vite.config.ts`
  - 可独立以 Web 方式启动渲染层（`npm run dev:web`），同样会复制上面的 VAD/ONNX 资源，便于在浏览器调试。

- 应用打包：`electron-builder.yml`
  - Windows、macOS、Linux 都安排了。Windows 图标 `resources/icon.ico`，macOS `resources/icon.icns`。
  - NSIS、DMG、AppImage 等格式齐备，`publish` 指向 GitHub Release。

### 数据流（典型对话一条龙）
1) 用户开麦或触发唤醒 → `vad-context` 捕获语音开始，若 AI 正在说话则 `interrupt`。
2) 语音结束 → 切片上传（`use-send-audio`），`ai-state` 进入“thinking-speaking”。
3) 服务端推送：
   - `full-text` → 字幕更新；
   - `audio` → 进 `audioTaskQueue` 顺序播放（同步嘴型/表情）；
   - `conversation-chain-end` / `backend-synth-complete` → 收尾，必要时自动开麦。
4) 其他事件：背景/角色/历史/群组/广告/洗衣店……都有对应的处理路径并更新 UI。

### 模式切换（window ↔ pet）
- 通过托盘或 IPC 切换。
- 切到 pet：窗口置顶全屏、可选鼠标穿透、隐藏标题栏，悬浮输入条 `InputSubtitle` 现身，可用滚轮缩放模型（如果模型允许）。
- 悬浮组件会把“我被鼠标摸摸啦”上报给主进程，从而临时关闭穿透，给到用户正常交互区域。

### 开发、运行与构建
- 安装依赖：`npm install`
- 开发（全栈 Electron）：`npm run dev`
- 仅渲染层 Web 开发：`npm run dev:web`
- 构建：
  - Windows: `npm run build:win`
  - macOS: `npm run build:mac`
  - Linux: `npm run build:linux`

### 小坑与小贴士
- VAD/ONNX 资源必须被正确复制到 `renderer/libs/` 才能在浏览器/Electron 中工作。
- `websocket-handler.tsx` 会在连接成功后主动拉取背景/配置/历史并创建新会话；如果你看不到数据，先检查服务端 `baseUrl` 与 `wsUrl` 的自动推断是否正确（`context/websocket-context.tsx`）。
- `live2d-config-context.tsx` 会“记仇”你的缩放偏好（按 confUid 与模式分桶），换角色或换模式后看起来“不一样大”是正常的。
- Pet 模式下如果觉得它“挡我鼠标”，试试托盘里的“Toggle Mouse Passthrough”。如果还是挡，那就……先摸摸它（把鼠标移到可交互组件上）。

### 结语
这套工程的关键词大概是：实时、跨端、可爱、强势。主进程像个忙内管家，预加载是翻译，同台演员有 Live2D、字幕、广告、VAD、洗衣店，还有一堆上下文“经纪人”。

愿你开发顺利，Bug 归零。如果它在屏幕上挡住了你，别生气——那是它在用行动提醒你该摸鱼了。


