export default {
  async fetch(request, env) {
    try {
      // 处理OPTIONS预检请求
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      // 获取请求路径
      const url = new URL(request.url);
      const path = url.pathname;

      // 处理不同的路由
      if (path.endsWith('/download')) {
        // 下载测试 - 生成随机数据
        const size = Math.min(
          parseInt(url.searchParams.get('size')) || 1024 * 1024,
          10 * 1024 * 1024  // 最大10MB
        );
        
        // 分块生成数据
        const chunkSize = 65536; // 64KB
        const chunks = [];
        for (let i = 0; i < size; i += chunkSize) {
          const chunk = new Uint8Array(Math.min(chunkSize, size - i));
          crypto.getRandomValues(chunk);
          chunks.push(chunk);
        }
        
        // 合并所有数据块
        const data = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        
        return new Response(data.buffer, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': size.toString(),
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store',
          },
        });
      } else if (path.endsWith('/upload')) {
        if (request.method !== 'POST') {
          return new Response('Method not allowed', { status: 405 });
        }
        // 上传测试 - 仅返回接收到的数据大小
        const blob = await request.blob();
        return new Response(JSON.stringify({ size: blob.size }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store',
          },
        });
      } else {
        // 返回HTML页面
        return new Response(HTML, {
          headers: {
            'Content-Type': 'text/html;charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store',
          },
        });
      }
    } catch (error) {
      console.error('Error:', error);
      return new Response('Internal Server Error: ' + error.message, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/plain',
        }
      });
    }
  },
};

const HTML = `
<!DOCTYPE html>
<html>
<head>
    <title>网速测试</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            text-align: center;
            background-color: #141526;
            color: white;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            overflow: hidden;
        }
        
        .test-area {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 20px 0;
        }
        
        .speed-test-button {
            width: 200px;  /* 稍微减小按钮尺寸 */
            height: 200px;
            border-radius: 50%;
            border: 2px solid #00b3b3;
            background: none;
            color: white;
            font-size: 48px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .speed-test-button:hover {
            background-color: rgba(0, 179, 179, 0.1);
        }
        
        .speed-test-button:disabled {
            border-color: #666;
            cursor: not-allowed;
        }
        
        .progress-ring {
            position: absolute;
            top: -2px;
            left: -2px;
            width: 200px;  /* 对应按钮新尺寸 */
            height: 200px;
            transform: rotate(-90deg);
        }
        
        .progress-ring circle {
            r: 99;  /* 调整圆圈大小 */
            cx: 100;
            cy: 100;
        }
        
        .server-info {
            margin-top: 20px;
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .server-detail {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #888;
        }
        
        .server-icon {
            width: 30px;  /* 稍微减小图标尺寸 */
            height: 30px;
            border-radius: 50%;
            background-color: #333;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }
        
        .result {
            margin-top: 15px;
            font-size: 24px;
            color: #00b3b3;
        }
        
        .progress {
            margin-top: 10px;
            font-size: 16px;
            color: #888;
        }
        
        .speed-results {
            margin-top: 20px;
            display: flex;
            gap: 40px;
            justify-content: center;
        }
        
        .speed-item {
            text-align: center;
        }
        
        .speed-label {
            color: #888;
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .speed-value {
            color: #00b3b3;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .speed-unit {
            color: #888;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="test-area">
        <button id="testButton" class="speed-test-button" onclick="startTest()">
            开始
            <svg class="progress-ring" id="progressRing">
                <circle r="99" cx="100" cy="100" fill="none" stroke="#00b3b3" stroke-width="2" 
                        stroke-dasharray="621.7" stroke-dashoffset="621.7" id="progressCircle"/>
            </svg>
        </button>
        <div class="progress" id="progress"></div>
        <div class="result" id="result"></div>
        <div class="speed-results" id="speedResults" style="display: none;">
            <div class="speed-item">
                <div class="speed-label">下载速度</div>
                <div class="speed-value" id="downloadResult">--</div>
                <div class="speed-unit">MB/s</div>
            </div>
            <div class="speed-item">
                <div class="speed-label">上传速度</div>
                <div class="speed-value" id="uploadResult">--</div>
                <div class="speed-unit">MB/s</div>
            </div>
        </div>
    </div>
    
    <div class="server-info">
        <div class="server-detail">
            <div class="server-icon">CF</div>
            <div>
                <div>Cloudflare</div>
                <div id="serverId">Workers</div>
            </div>
        </div>
        <div class="server-detail">
            <div class="server-icon">🌍</div>
            <div>
                <div id="serverLocation">自动选择</div>
            </div>
        </div>
    </div>

    <script>
    let isTestRunning = false;
    let downloadSpeed = 0;
    let uploadSpeed = 0;
    
    function updateProgress(percent, type) {
        const progress = document.getElementById('progress');
        const progressCircle = document.getElementById('progressCircle');
        const circumference = 621.7;  // 更新为新的周长值 (2 * π * 99)
        
        if (progress) {
            progress.textContent = type + '测试: ' + percent.toFixed(1) + '%';
        }
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = (circumference - (percent / 100) * circumference).toString();
        }
    }
    
    function showFinalResults() {
        const speedResults = document.getElementById('speedResults');
        const downloadResult = document.getElementById('downloadResult');
        const uploadResult = document.getElementById('uploadResult');
        
        if (speedResults && downloadResult && uploadResult) {
            speedResults.style.display = 'flex';
            downloadResult.textContent = downloadSpeed;
            uploadResult.textContent = uploadSpeed;
        }
    }
    
    async function runSpeedTest(type, testFn) {
        const result = document.getElementById('result');
        const progress = document.getElementById('progress');
        
        if (progress) {
            progress.textContent = type === 'download' ? '准备下载测试...' : '准备上传测试...';
        }
        const speedMbps = await testFn();
        
        // 将 Mbps 转换为 MB/s (1 MB/s = 8 Mbps)
        const speedMBps = (speedMbps / 8).toFixed(2);
        
        // 保存测试结果
        if (type === 'download') {
            downloadSpeed = speedMBps;
        } else {
            uploadSpeed = speedMBps;
        }
        
        if (result) {
            result.textContent = (type === 'download' ? '下载' : '上传') + '测试完成';
        }
        return speedMBps;
    }
    
    async function startTest() {
        if (isTestRunning) return;
        
        const testButton = document.getElementById('testButton');
        const result = document.getElementById('result');
        const progress = document.getElementById('progress');
        const progressCircle = document.getElementById('progressCircle');
        const speedResults = document.getElementById('speedResults');
        
        if (!testButton || !result || !progress || !progressCircle) {
            console.error('Required elements not found');
            return;
        }
        
        // 重置显示
        testButton.textContent = '测试中';
        result.textContent = '';
        speedResults.style.display = 'none';
        isTestRunning = true;
        progressCircle.style.strokeDashoffset = '621.7';
        
        try {
            // 下载测试
            await runSpeedTest('download', async () => {
                const size = 5 * 1024 * 1024;
                const response = await fetch(new URL('download', window.location.href).href + '?size=' + size);
                if (!response.ok) throw new Error('下载请求失败: ' + response.status);
                
                const reader = response.body.getReader();
                let receivedLength = 0;
                const startTime = performance.now();
                
                while(true) {
                    const {done, value} = await reader.read();
                    if (done) break;
                    receivedLength += value.length;
                    const progress_percent = (receivedLength / size) * 100;
                    updateProgress(progress_percent, '下载');
                }
                
                const duration = (performance.now() - startTime) / 1000;
                return (receivedLength * 8 / duration / 1024 / 1024).toFixed(2);
            });
            
            // 上传测试
            await runSpeedTest('upload', async () => {
                const size = 5 * 1024 * 1024;
                const data = new Uint8Array(size);
                const chunkSize = 65536;
                
                for (let i = 0; i < size; i += chunkSize) {
                    const chunk = new Uint8Array(Math.min(chunkSize, size - i));
                    crypto.getRandomValues(chunk);
                    data.set(chunk, i);
                }
                
                const startTime = performance.now();
                const response = await fetch(new URL('upload', window.location.href).href, {
                    method: 'POST',
                    body: data
                });
                
                if (!response.ok) throw new Error('上传请求失败: ' + response.status);
                
                const duration = (performance.now() - startTime) / 1000;
                return (size * 8 / duration / 1024 / 1024).toFixed(2);
            });
            
            // 显示最终结果
            testButton.textContent = '开始';
            result.textContent = '测试完成';
            showFinalResults();
            
        } catch (error) {
            result.textContent = '测试失败: ' + error.message;
            testButton.textContent = '重试';
        } finally {
            isTestRunning = false;
            progress.textContent = '';
            progressCircle.style.strokeDashoffset = '621.7';
        }
    }
    </script>
</body>
</html>
`;
