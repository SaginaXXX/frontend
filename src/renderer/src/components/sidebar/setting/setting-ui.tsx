import {
  Tabs,
  Button,
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
  DrawerBackdrop,
  DrawerCloseTrigger,
} from '@chakra-ui/react';
import { FiSettings, FiAperture, FiMic, FiVolume2, FiCpu, FiFilm, FiInfo } from 'react-icons/fi';
import { useState, useMemo, useCallback } from 'react';
import { CloseButton } from '@/components/ui/close-button';

import { settingStyles } from './setting-styles';
import General from './general';
import Live2D from './live2d';
import ASR from './asr';
import TTS from './tts';
import Agent from './agent';
import Media from './media';
import About from './about';

interface SettingUIProps {
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
}

function SettingUI({ open, onClose }: SettingUIProps): JSX.Element {
  const [saveHandlers, setSaveHandlers] = useState<(() => void)[]>([]);
  const [cancelHandlers, setCancelHandlers] = useState<(() => void)[]>([]);
  const [activeTab, setActiveTab] = useState('general');

  const handleSaveCallback = useCallback((handler: () => void) => {
    setSaveHandlers((prev) => [...prev, handler]);
    return (): void => {
      setSaveHandlers((prev) => prev.filter((h) => h !== handler));
    };
  }, []);

  const handleCancelCallback = useCallback((handler: () => void) => {
    setCancelHandlers((prev) => [...prev, handler]);
    return (): void => {
      setCancelHandlers((prev) => prev.filter((h) => h !== handler));
    };
  }, []);

  const handleSave = useCallback((): void => {
    saveHandlers.forEach((handler) => handler());
    onClose();
  }, [saveHandlers, onClose]);

  const handleCancel = useCallback((): void => {
    cancelHandlers.forEach((handler) => handler());
    onClose();
  }, [cancelHandlers, onClose]);

  const tabsContent = useMemo(
    () => (
      <Tabs.ContentGroup>
        <Tabs.Content value="general" {...settingStyles.settingUI.tabs.content}>
          <General
            onSave={handleSaveCallback}
            onCancel={handleCancelCallback}
          />
        </Tabs.Content>
        <Tabs.Content value="live2d" {...settingStyles.settingUI.tabs.content}>
          <Live2D
            onSave={handleSaveCallback}
            onCancel={handleCancelCallback}
          />
        </Tabs.Content>
        <Tabs.Content value="asr" {...settingStyles.settingUI.tabs.content}>
          <ASR onSave={handleSaveCallback} onCancel={handleCancelCallback} />
        </Tabs.Content>
        <Tabs.Content value="tts" {...settingStyles.settingUI.tabs.content}>
          <TTS />
        </Tabs.Content>
        <Tabs.Content value="agent" {...settingStyles.settingUI.tabs.content}>
          <Agent
            onSave={handleSaveCallback}
            onCancel={handleCancelCallback}
          />
        </Tabs.Content>
        <Tabs.Content value="media" {...settingStyles.settingUI.tabs.content}>
          <Media
            onSave={handleSaveCallback}
            onCancel={handleCancelCallback}
          />
        </Tabs.Content>
        <Tabs.Content value="about" {...settingStyles.settingUI.tabs.content}>
          <About />
        </Tabs.Content>
      </Tabs.ContentGroup>
    ),
    [handleSaveCallback, handleCancelCallback],
  );

  return (
    <DrawerRoot
      open={open}
      onOpenChange={(e) => (e.open ? null : onClose())}
      placement="start"
    >
      <DrawerBackdrop />
      <DrawerContent {...settingStyles.settingUI.drawerContent}>
        <DrawerHeader {...settingStyles.settingUI.drawerHeader}>
          <DrawerTitle {...settingStyles.settingUI.drawerTitle}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <FiSettings /> 設定 / Settings
            </span>
          </DrawerTitle>
          <div {...settingStyles.settingUI.closeButton}>
            <DrawerCloseTrigger asChild onClick={handleCancel}>
              <CloseButton size="sm" />
            </DrawerCloseTrigger>
          </div>
        </DrawerHeader>

        <DrawerBody>
          <Tabs.Root
            defaultValue="general"
            value={activeTab}
            onValueChange={(details) => setActiveTab(details.value)}
            {...settingStyles.settingUI.tabs.root}
          >
            <Tabs.List {...settingStyles.settingUI.tabs.list}>
              <Tabs.Trigger
                value="general"
                {...settingStyles.settingUI.tabs.trigger}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FiSettings /> 一般設定
                </span>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="live2d"
                {...settingStyles.settingUI.tabs.trigger}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FiAperture /> Live2D
                </span>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="asr"
                {...settingStyles.settingUI.tabs.trigger}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FiMic /> 音声認識
                </span>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="tts"
                {...settingStyles.settingUI.tabs.trigger}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FiVolume2 /> 音声合成
                </span>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="agent"
                {...settingStyles.settingUI.tabs.trigger}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FiCpu /> エージェント
                </span>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="media"
                {...settingStyles.settingUI.tabs.trigger}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FiFilm /> メディア
                </span>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="about"
                {...settingStyles.settingUI.tabs.trigger}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FiInfo /> 情報
                </span>
              </Tabs.Trigger>
            </Tabs.List>

            {tabsContent}
          </Tabs.Root>
        </DrawerBody>

        <DrawerFooter {...settingStyles.settingUI.footer}>
          <Button 
            variant="ghost" 
            colorPalette="gray" 
            onClick={handleCancel}
            size="md"
          >
            キャンセル
          </Button>
          <Button 
            variant="solid" 
            colorPalette="blue" 
            onClick={handleSave}
            size="md"
          >
            保存
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>
  );
}

export default SettingUI;
