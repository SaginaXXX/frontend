import { Stack, createListCollection } from '@chakra-ui/react';
import { useMemo } from 'react';
import { useBgUrl } from '@/context/bgurl-context';
import { settingStyles } from './setting-styles';
import { useConfig } from '@/context/character-config-context';
import { useGeneralSettings } from '@/hooks/sidebar/setting/use-general-settings';
import { useWebSocket } from '@/context/websocket-context';
import { SelectField, SwitchField, InputField, NumberField } from './common';
import { useAppStore } from '@/store';

const DEFAULT_SUBTITLE_CFG = {
  enabled: true,
  bgColor: '#000000',
  bgOpacity: 0.45,
  paddingX: 14,
  paddingY: 10,
  borderRadius: 14,
  blur: 0,
  maxWidth: '90%',
};

interface GeneralProps {
  onSave?: (callback: () => void) => () => void
  onCancel?: (callback: () => void) => () => void
}

// Data collection definition
const useCollections = () => {
  const { backgroundFiles } = useBgUrl() || {};
  const { configFiles } = useConfig();

  const languages = createListCollection({
    items: [
      { label: 'English', value: 'en' },
      { label: '中文', value: 'zh' },
    ],
  });

  const backgrounds = createListCollection({
    items: (Array.isArray(backgroundFiles) ? backgroundFiles : []).map((item: any) => {
      if (item && typeof item === 'object') {
        const name = item.name || item.filename || String(item);
        const value = item.url || (item.filename ? `/bg/${item.filename}` : `/bg/${name}`);
        return { label: String(name), value };
      }
      const filename = String(item);
      return { label: filename, value: `/bg/${filename}` };
    }),
  });

  const characterPresets = createListCollection({
    items: configFiles.map((config) => ({
      label: config.name,
      value: config.filename,
    })),
  });

  return {
    languages,
    backgrounds,
    characterPresets,
  };
};

function General({ onSave, onCancel }: GeneralProps): JSX.Element {
  const bgUrlContext = useBgUrl();
  const { confName, setConfName } = useConfig();
  const updateAppConfig = useAppStore((s) => s.updateAppConfig);
  const rawSubtitleCfg = useAppStore((s) => s.config.appConfig?.subtitle);
  const subtitleCfg = useMemo(() => rawSubtitleCfg ?? DEFAULT_SUBTITLE_CFG, [rawSubtitleCfg]);
  const {
    wsUrl, setWsUrl, baseUrl, setBaseUrl,
  } = useWebSocket();
  const collections = useCollections();

  const {
    settings,
    handleSettingChange,
    handleCameraToggle,
    handleCharacterPresetChange,
    showSubtitle,
    setShowSubtitle,
  } = useGeneralSettings({
    bgUrlContext,
    confName,
    setConfName,
    baseUrl,
    wsUrl,
    onWsUrlChange: setWsUrl,
    onBaseUrlChange: setBaseUrl,
    onSave,
    onCancel,
  });

  const showBackgroundControls = false;
  const setSubtitleCfg = (partial: any) => updateAppConfig({ subtitle: { ...subtitleCfg, ...partial } });
  const setSubtitleCfgNumber = (key: string, raw: string, min?: number, max?: number) => {
    if (raw === '' || raw == null) return; // ignore empty typing state
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    let v = num;
    if (typeof min === 'number') v = Math.max(min, v);
    if (typeof max === 'number') v = Math.min(max, v);
    setSubtitleCfg({ [key]: v });
  };

  return (
    <Stack {...settingStyles.common.container}>
      <SelectField
        label="言語 / Language"
        value={settings.language}
        onChange={(value) => handleSettingChange('language', value)}
        collection={collections.languages}
        placeholder="言語を選択 / Select language"
      />

      <SwitchField
        label="カメラ背景を使用"
        checked={settings.useCameraBackground}
        onChange={handleCameraToggle}
      />

      <SwitchField
        label="字幕を表示"
        checked={showSubtitle}
        onChange={setShowSubtitle}
      />

      {/* Subtitle background settings */}
      <SwitchField
        label="字幕背景を有効化"
        checked={subtitleCfg.enabled ?? true}
        onChange={(v) => setSubtitleCfg({ enabled: v })}
      />
      <InputField
        label="背景色 (hex)"
        value={subtitleCfg.bgColor ?? '#000000'}
        onChange={(v) => setSubtitleCfg({ bgColor: v })}
        placeholder="#000000"
      />
      <NumberField
        label="不透明度 (0~1)"
        value={String(subtitleCfg.bgOpacity ?? 0.45)}
        onChange={(v) => setSubtitleCfgNumber('bgOpacity', v, 0, 1)}
        min={0}
        max={1}
        step={0.05}
      />
      <InputField
        label="文字颜色 (hex)"
        value={subtitleCfg.textColor ?? '#ff8ac3'}
        onChange={(v) => setSubtitleCfg({ textColor: v })}
        placeholder="#ff8ac3"
      />
      <NumberField
        label="横Padding(px)"
        value={String(subtitleCfg.paddingX ?? 14)}
        onChange={(v) => setSubtitleCfgNumber('paddingX', v, 0, 400)}
        min={0}
        max={400}
        step={1}
      />
      <NumberField
        label="縦Padding(px)"
        value={String(subtitleCfg.paddingY ?? 10)}
        onChange={(v) => setSubtitleCfgNumber('paddingY', v, 0, 400)}
        min={0}
        max={400}
        step={1}
      />
      <NumberField
        label="圆角(px)"
        value={String(subtitleCfg.borderRadius ?? 14)}
        onChange={(v) => setSubtitleCfgNumber('borderRadius', v, 0, 200)}
        min={0}
        max={200}
        step={1}
      />
      <NumberField
        label="模糊强度(blur px)"
        value={String(subtitleCfg.blur ?? 0)}
        onChange={(v) => setSubtitleCfgNumber('blur', v, 0, 50)}
        min={0}
        max={50}
        step={1}
      />

      {!settings.useCameraBackground && showBackgroundControls && (
        <>
          {bgUrlContext?.backgroundFiles?.length > 0 && (
            <SelectField
              label="背景画像"
              value={settings.selectedBgUrl}
              onChange={(value) => handleSettingChange('selectedBgUrl', value)}
              collection={collections.backgrounds}
              placeholder="利用可能な背景から選択"
            />
          )}

          <InputField
            label="カスタム背景URL"
            value={settings.customBgUrl}
            onChange={(value) => handleSettingChange('customBgUrl', value)}
            placeholder="画像URLを入力"
          />
        </>
      )}

      <SelectField
        label="キャラクタープリセット"
        value={settings.selectedCharacterPreset}
        onChange={handleCharacterPresetChange}
        collection={collections.characterPresets}
        placeholder={confName || 'キャラクターを選択'}
      />

      <InputField
        label="WebSocket URL"
        value={settings.wsUrl}
        onChange={(value) => handleSettingChange('wsUrl', value)}
        placeholder="WebSocket URLを入力"
      />

      <InputField
        label="ベースURL"
        value={settings.baseUrl}
        onChange={(value) => handleSettingChange('baseUrl', value)}
        placeholder="ベースURLを入力"
      />
    </Stack>
  );
}

export default General;
