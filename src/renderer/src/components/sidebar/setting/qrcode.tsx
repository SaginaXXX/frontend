import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Image,
  Code,
} from '@chakra-ui/react';
import { Alert } from '../../ui/alert';
import { useConfigStore } from '@/store';
import { settingStyles } from './setting-styles';

interface QRCodeData {
  client_id: string;
  category: string;
  control_panel_url: string;
  qrcode_base64: string;
  display_text: string;
  domain_type: string;
}

interface QRCodeManagerProps {
  onSave?: (callback: () => void) => () => void;
  onCancel?: (callback: () => void) => () => void;
}

function QRCodeManager({ onSave, onCancel }: QRCodeManagerProps): JSX.Element {
  const [qrCodeData, setQRCodeData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { baseUrl } = useConfigStore();
  
  // 获取当前容器的CLIENT_ID
  const currentClientId = import.meta.env.VITE_CLIENT_ID || 'client_001';

  // 生成当前客户的控制面板二维码
  const generateQRCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${baseUrl}/api/qrcode/upload?client=${currentClientId}`
      );
      const data = await response.json();

      if (data.status === 'success') {
        setQRCodeData(data);
      } else {
        setError(`生成失败: ${data.error || '未知错误'}`);
      }
    } catch (err) {
      setError(`生成失败: ${err instanceof Error ? err.message : '网络错误'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 组件加载时自动生成二维码
  useEffect(() => {
    generateQRCode();
  }, []);

  // 下载二维码
  const downloadQRCode = () => {
    if (!qrCodeData) return;

    const link = document.createElement('a');
    link.href = qrCodeData.qrcode_base64;
    link.download = `${currentClientId}_control_panel_qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 打印二维码
  const printQRCode = () => {
    if (!qrCodeData) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>控制面板访问二维码 - ${currentClientId}</title>
            <style>
              body {
                text-align: center;
                font-family: Arial, sans-serif;
                padding: 40px;
              }
              h1 {
                color: #333;
                margin-bottom: 10px;
              }
              h2 {
                color: #666;
                font-weight: normal;
                margin-bottom: 30px;
              }
              img {
                max-width: 400px;
                margin: 20px auto;
                border: 2px solid #eee;
                padding: 10px;
              }
              .url {
                color: #666;
                font-size: 14px;
                word-break: break-all;
                margin-top: 20px;
              }
              .info {
                color: #999;
                font-size: 12px;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <h1>控制面板访问二维码</h1>
            <h2>${qrCodeData.display_text}</h2>
            <img src="${qrCodeData.qrcode_base64}" alt="控制面板访问二维码" />
            <p class="url">访问链接: ${qrCodeData.control_panel_url}</p>
            <p class="info">客户ID: ${qrCodeData.client_id}</p>
            <p class="info">扫码可直接访问控制面板进行设置和上传</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Box {...settingStyles.container}>
      <VStack align="stretch" gap={6}>
        {/* 标题和说明 */}
        <Box>
          <Heading size="md" mb={2}>
            控制面板访问二维码
          </Heading>
          <Text fontSize="sm" color="gray.600">
            当前客户：<Code colorPalette="purple">{currentClientId}</Code>
          </Text>
          <Text fontSize="sm" color="gray.600" mt={2}>
            扫描此二维码可直接打开控制面板，进行设置、上传广告等操作。
          </Text>
        </Box>

        {/* 错误提示 */}
        {error && (
          <Alert status="error" title="错误">
            {error}
          </Alert>
        )}

        {/* 二维码显示区域 */}
        <Box
          p={6}
          borderWidth="2px"
          borderRadius="lg"
          borderColor="purple.200"
          bg="white"
          textAlign="center"
        >
          {loading ? (
            <VStack py={10}>
              <Text>生成二维码中...</Text>
            </VStack>
          ) : qrCodeData ? (
            <VStack gap={4}>
              {/* 二维码图片 */}
              <Box>
                <Image
                  src={qrCodeData.qrcode_base64}
                  alt="控制面板访问二维码"
                  maxW="300px"
                  mx="auto"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  p={3}
                  bg="white"
                />
              </Box>

              {/* 访问链接 */}
              <Box w="full">
                <Text fontSize="xs" color="gray.500" mb={1}>
                  访问链接：
                </Text>
                <Code
                  fontSize="xs"
                  p={2}
                  borderRadius="md"
                  display="block"
                  wordBreak="break-all"
                  colorPalette="purple"
                >
                  {qrCodeData.control_panel_url}
                </Code>
              </Box>

              {/* 操作按钮 */}
              <HStack gap={3} justify="center" w="full">
                <Button
                  colorPalette="blue"
                  onClick={downloadQRCode}
                  size="sm"
                >
                  📥 下载PNG
                </Button>
                <Button
                  colorPalette="green"
                  onClick={printQRCode}
                  size="sm"
                >
                  🖨️ 打印二维码
                </Button>
                <Button
                  variant="outline"
                  onClick={generateQRCode}
                  size="sm"
                  isLoading={loading}
                >
                  🔄 重新生成
                </Button>
              </HStack>

              {/* 域名类型提示 */}
              <Text fontSize="xs" color="gray.500">
                域名模式：{qrCodeData.domain_type}
              </Text>
            </VStack>
          ) : (
            <VStack py={6}>
              <Text color="gray.600" mb={3}>
                尚未生成二维码
              </Text>
              <Button
                colorPalette="purple"
                onClick={generateQRCode}
                isLoading={loading}
              >
                生成控制面板二维码
              </Button>
            </VStack>
          )}
        </Box>

        {/* 使用说明 */}
        <Box p={4} bg="blue.50" borderRadius="md">
          <Heading size="xs" mb={3} color="blue.800">
            📌 使用说明
          </Heading>
          <VStack align="start" fontSize="sm" gap={2} color="blue.900">
            <Text>• <strong>扫码访问</strong>：手机扫描二维码即可直接打开控制面板</Text>
            <Text>• <strong>快捷键访问</strong>：在前端按快捷键也可呼出控制面板</Text>
            <Text>• <strong>功能完整</strong>：控制面板包含所有设置和上传功能</Text>
            <Text>• <strong>安全隔离</strong>：每个客户的数据完全隔离</Text>
          </VStack>
        </Box>

        {/* 额外信息 */}
        <Box p={4} bg="gray.50" borderRadius="md">
          <Heading size="xs" mb={2} color="gray.700">
            ℹ️ 二维码信息
          </Heading>
          <VStack align="start" fontSize="xs" gap={1} color="gray.600">
            <Text>客户ID：{currentClientId}</Text>
            <Text>用途：控制面板访问（包含上传、设置等所有功能）</Text>
            <Text>建议：打印贴纸贴在广告屏旁边，或发送给客户保存</Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}

export default QRCodeManager;

