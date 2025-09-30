# 🚀 前端部署配置指南

## 📋 环境变量配置

前端支持多种方式配置API服务器地址，按优先级排序：

### 1. 完整API地址（推荐）
```bash
# 最灵活的配置方式
VITE_API_BASE_URL=https://api.example.com
VITE_API_BASE_URL=http://192.168.1.100:12393
VITE_API_BASE_URL=http://localhost:8080
```

### 2. 分别配置主机和端口
```bash
VITE_SERVER_HOST=api.example.com
VITE_SERVER_PORT=12393
```

### 3. React兼容变量（备用）
```bash
REACT_APP_API_BASE_URL=https://api.example.com
REACT_APP_SERVER_HOST=api.example.com
REACT_APP_SERVER_PORT=12393
```

## 🏗️ 部署场景

### 开发环境
```bash
# 前端: http://localhost:5173
# API:   http://localhost:12393
# 自动检测，无需配置
```

### 标准部署（前端+API同一服务器）
```bash
# 前端: http://example.com:12393
# API:   http://example.com:12393
# 自动检测，无需配置
```

### 分离部署（前端和API在不同服务器）
```bash
# 前端: http://web.example.com
# API:   http://api.example.com:12393
VITE_API_BASE_URL=http://api.example.com:12393
```

### 反向代理部署（Nginx等）
```bash
# 前端: https://example.com
# API:   https://example.com/api
VITE_API_BASE_URL=https://example.com
```

### Docker容器部署
```dockerfile
# Dockerfile
ENV VITE_API_BASE_URL=http://api-container:12393

# docker-compose.yml
environment:
  - VITE_API_BASE_URL=http://api-service:12393
```

### CDN部署
```bash
# 前端: https://cdn.example.com
# API:   https://api.example.com
VITE_API_BASE_URL=https://api.example.com
```

## 🔧 构建时配置

### 1. .env 文件
```bash
# .env.production
VITE_API_BASE_URL=https://api.example.com

# .env.staging  
VITE_API_BASE_URL=https://staging-api.example.com
```

### 2. 构建命令
```bash
# 生产构建
VITE_API_BASE_URL=https://api.example.com npm run build

# 测试构建
VITE_API_BASE_URL=https://test-api.example.com npm run build
```

## 🌐 HTTPS支持

系统自动支持HTTPS：
- HTTP → WebSocket (ws://)
- HTTPS → Secure WebSocket (wss://)

```bash
# HTTPS部署
VITE_API_BASE_URL=https://secure-api.example.com
# 自动生成: wss://secure-api.example.com/client-ws
```

## 🐛 故障排除

### 1. 检查配置
前端控制台会显示：
```
🌐 使用环境变量API地址: https://api.example.com
🌐 最终服务器配置: https://api.example.com
```

### 2. 测试API连接
```bash
curl https://api.example.com/api/ads
```

### 3. 常见问题
- **CORS错误**：确保API服务器配置了正确的CORS策略
- **连接超时**：检查防火墙和网络配置  
- **证书错误**：HTTPS部署需要有效的SSL证书

## 📝 配置示例

### 企业内网部署
```bash
VITE_API_BASE_URL=http://internal-server:12393
```

### 云服务部署
```bash
VITE_API_BASE_URL=https://api.cloud-provider.com
```

### 多环境切换
```bash
# 开发
VITE_API_BASE_URL=http://localhost:12393

# 测试
VITE_API_BASE_URL=https://test-api.company.com

# 生产
VITE_API_BASE_URL=https://api.company.com
```