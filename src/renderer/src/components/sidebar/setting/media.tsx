import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Spinner,
  Flex,
  Spacer
} from '@chakra-ui/react';
import { Alert } from '../../ui/alert';
import { Button as UIButton } from '../../ui/button';
import { Tag } from '../../ui/tag';
import { Tooltip } from '../../ui/tooltip';
import { getServerConfig, getAdVideoUrl, getTutorialVideoUrl } from '../../../utils/env-config';
import { settingStyles } from './setting-styles';
import { useAdvertisementAudioSettings, AdAudioMode } from '@/hooks/sidebar/setting/use-advertisement-audio-settings';

interface MediaFile {
  id: string;
  name: string;
  filename: string;
  url_path: string;
  size_mb: number;
  format: string;
  size_bytes: number;
  category: string;
}

interface MediaProps {
  onSave?: (callback: () => void) => () => void;
  onCancel?: (callback: () => void) => () => void;
}

function Media({ onSave, onCancel }: MediaProps): JSX.Element {
  // 广告音频设置管理
  const {
    handleAudioModeChange,
    isMutedMode,
    isAudioMode,
    isAudioVADMode,
  } = useAdvertisementAudioSettings({ onSave, onCancel });

  // 状态管理
  const [advertisements, setAdvertisements] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 动态获取服务器配置，避免硬编码
  const serverConfig = getServerConfig();
  
  // 临时忽略未使用的参数
  void onSave;
  void onCancel;

  // 显示消息
  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // 获取广告列表
  const fetchAdvertisements = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${serverConfig.baseUrl}/api/ads`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      console.log('📂 広告リスト取得:', data);
      setAdvertisements(data.advertisements || []);
    } catch (error) {
      console.error('❌ 広告リスト取得失敗:', error);
      showMessage('error', `広告リスト取得失敗: ${String(error)}`);
      setAdvertisements([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 删除广告
  const deleteAdvertisement = async (filename: string) => {
    if (!confirm(`确定要删除广告 "${filename}" 吗？此操作不可撤销！`)) {
      return;
    }

    try {
      const response = await fetch(`${serverConfig.baseUrl}/api/ads/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🗑️ 删除广告成功:', result);
      
      showMessage('success', result.message);
      
      // 刷新列表
      await fetchAdvertisements();
      
      // 🔔 通知广告轮播组件刷新
      window.dispatchEvent(new CustomEvent('advertisementListChanged', {
        detail: { action: 'delete', filename }
      }));
      
    } catch (error) {
      console.error('❌ 删除广告失败:', error);
      showMessage('error', `删除失败: ${String(error)}`);
    }
  };

  // 上传广告视频
  const uploadVideo = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const response = await fetch(`${serverConfig.baseUrl}/api/ads/upload`, {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📤 広告アップロード成功:', result);
      
      showMessage('success', result.message);
      
      // 刷新列表
      await fetchAdvertisements();
      
      // 🔔 通知広告轮播组件刷新
      window.dispatchEvent(new CustomEvent('advertisementListChanged', {
        detail: { action: 'upload', filename: result.file_info?.filename }
      }));
      
    } catch (error) {
      console.error('❌ 広告アップロード失敗:', error);
      showMessage('error', `アップロード失敗: ${String(error)}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 处理文件选择
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 验证文件类型
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/webm', 'video/x-msvideo'];
      if (!allowedTypes.includes(file.type)) {
        showMessage('error', '请选择 MP4、AVI、MOV 或 WebM 格式的视频文件');
        return;
      }
      
      // 验证文件大小（500MB）
      const maxSize = 500 * 1024 * 1024;
      if (file.size > maxSize) {
        showMessage('error', `文件大小不能超过 500MB，当前文件: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
        return;
      }
      
      uploadVideo(file);
    }
    
    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 拖拽上传处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      uploadVideo(videoFile);
    } else {
      showMessage('error', '请拖拽视频文件，只支持视频格式文件');
    }
  };

  // 预览视频
  const previewVideo = (ad: MediaFile) => {
    const videoUrl = getAdVideoUrl(ad.filename);
    window.open(videoUrl, '_blank');
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };


  // 初始加载
  useEffect(() => {
    fetchAdvertisements();
  }, []);

  return (
    <Box {...settingStyles.common.container}>
      
      {/* ✅ 广告播放设置 */}
      {(
        <Box mb={4} p={4} borderWidth={1} borderRadius="md" bg="blue.50" borderColor="blue.200">
          <Heading size="md" mb={3} color="blue.700" fontWeight="600">🎵 広告再生設定</Heading>
          <VStack align="stretch" gap={4}>
            
            {/* 音频模式设置 */}
            <Box>
              <Text fontWeight="bold" mb={2}>オーディオ再生モード</Text>
              <HStack>
                <Button 
                  size="sm" 
                  variant={isMutedMode ? "solid" : "outline"}
                  colorScheme={isMutedMode ? "gray" : "gray"}
                  title="ミュート再生モード - 音声を出力しません"
                  onClick={() => handleAudioModeChange(AdAudioMode.MUTED)}
                >
                  🔇 ミュートモード
                </Button>
                <Button 
                  size="sm" 
                  variant={isAudioVADMode ? "solid" : "outline"}
                  colorScheme={isAudioVADMode ? "blue" : "blue"}
                  title="音声再生モード + インテリジェントVAD調整"
                  onClick={() => handleAudioModeChange(AdAudioMode.AUDIO_VAD)}
                >
                  🎵 音声+VADモード
                </Button>
                <Button 
                  size="sm" 
                  variant={isAudioMode ? "solid" : "outline"}
                  colorScheme={isAudioMode ? "blue" : "blue"}
                  title="音声再生モード - 通常のオーディオ再生"
                  onClick={() => handleAudioModeChange(AdAudioMode.AUDIO)}
                >
                  🎵 音声モード
                </Button>
              </HStack>
              <Text fontSize="sm" color="gray.800" mt={2}>
                • ミュートモード：広告をミュートで再生、音声認識に影響しません<br/>
                • 音声モード：広告を通常の音声で再生<br/>
                • 音声+VADモード：音声を再生し、音声検出感度をインテリジェントに調整
              </Text>
            </Box>

            {/* 播放行为设置 */}
            <Box>
              <Text fontWeight="bold" mb={2}>再生動作</Text>
              <VStack align="start" gap={2}>
                <Text fontSize="sm" color="green.600">
                  ✅ 動画再生完了後に自動的に次へ切り替え
                </Text>
                <Text fontSize="sm" color="green.600">
                  ✅ クリーンな再生体験、インターフェースの遮蔽なし
                </Text>
                <Text fontSize="sm" color="gray.800">
                  ✅ 任意の長さの広告動画をサポート
                </Text>
              </VStack>
            </Box>

            {/* 当前状态显示 */}
            <Box p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
              <Text fontSize="sm" color="gray.800">
                💡 すべての広告制御機能を再生画面からこの設定パネルに移動し、視聴時の完全な無干渉を保証
              </Text>
            </Box>

          </VStack>
        </Box>
      )}
      
      {/* 消息提示 */}
      {message && (
        <Box mb={4}>
          <Alert status={message.type} title={message.type === 'error' ? 'エラー' : message.type === 'success' ? '成功' : 'ヒント'}>
            {message.text}
          </Alert>
        </Box>
      )}
      
      {/* 上传区域 */}
      <Box mb={4} p={4} borderWidth={1} borderRadius="md" borderColor="gray.200">
        <Heading size="md" mb={4} color="gray.700" fontWeight="600">
          📤 新しい広告をアップロード
        </Heading>
        
        <Box
          border="2px dashed"
          borderColor="gray.300"
          borderRadius="md"
          p={6}
          textAlign="center"
          cursor="pointer"
          _hover={{ 
            borderColor: "blue.400", 
            bg: "blue.50"
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            display="none"
          />
          
          {isUploading ? (
            <VStack>
              <Spinner size="lg" color="blue.500" />
              <Text fontWeight="bold">アップロード中...</Text>
              <Box width="200px" height="8px" bg="gray.200" borderRadius="md">
                <Box 
                  width={`${uploadProgress}%`} 
                  height="100%" 
                  bg="blue.500" 
                  borderRadius="md"
                  transition="width 0.3s"
                />
              </Box>
              <Text fontSize="sm" color="gray.800">{uploadProgress}%</Text>
            </VStack>
          ) : (
            <VStack>
              <Text fontSize="3xl">📁</Text>
              <Text fontWeight="bold">ここをクリックまたは動画ファイルをドラッグ</Text>
              <Text fontSize="sm" color="gray.800">
                対応形式: MP4, AVI, MOV, WebM | 最大サイズ: 500MB
              </Text>
            </VStack>
          )}
        </Box>
      </Box>

      {/* 文件列表 */}
      <Box p={4} borderWidth={1} borderRadius="md" borderColor="gray.200">
        <HStack mb={4}>
          <Heading size="md">📋 広告リスト</Heading>
          <Spacer />
          <UIButton 
            size="sm" 
            onClick={fetchAdvertisements}
            loading={isLoading}
            variant="outline"
          >
            🔄 刷新
          </UIButton>
        </HStack>
        
        {isLoading ? (
          <Flex justify="center" p={8}>
            <Spinner size="lg" />
          </Flex>
        ) : advertisements.length === 0 ? (
          <Alert status="info" title="暂无广告视频">
            请上传第一个广告视频开始使用轮播功能
          </Alert>
        ) : (
          <VStack align="stretch">
            {advertisements.map((item) => (
              <Box key={item.id} p={4} borderWidth={1} borderRadius="md" borderColor="gray.300" bg="white">
                <HStack>
                  <Box flex={1}>
                    <HStack mb={2}>
                      <Text fontWeight="bold" fontSize="lg" color="gray.800">
                        {item.name}
                      </Text>
                      <Tag variant="subtle" color="gray.700" bg="gray.100">
                        {item.format}
                      </Tag>
                    </HStack>
                    <Text fontSize="sm" color="gray.800" mb={1}>
                      ファイル名: {item.filename}
                    </Text>
                    <Text fontSize="sm" color="gray.800">
                      サイズ: {formatFileSize(item.size_bytes)}
                    </Text>
                  </Box>
                  
                  <HStack>
                    <Tooltip content="動画プレビュー">
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() => previewVideo(item)}
                      >
                        👁️
                      </Button>
                    </Tooltip>
                    
                    <Tooltip content="動画削除">
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => deleteAdvertisement(item.filename)}
                      >
                        🗑️
                      </Button>
                    </Tooltip>
                  </HStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      {/* 统计信息 */}
      {advertisements.length > 0 && (
        <Box mt={4} p={4} borderWidth={1} borderRadius="md">
          <Heading size="sm" mb={3}>📊 統計情報</Heading>
          <HStack>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {advertisements.length}
              </Text>
              <Text fontSize="sm" color="gray.800">総動画数</Text>
            </VStack>
            <Box mx={8} height="50px" borderLeft="1px solid" borderColor="gray.300" />
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {(advertisements.reduce((total, item) => total + item.size_bytes, 0) / (1024 * 1024)).toFixed(1)}MB
              </Text>
              <Text fontSize="sm" color="gray.800">総サイズ</Text>
            </VStack>
          </HStack>
        </Box>
      )}
    </Box>
  );
}

export default Media;