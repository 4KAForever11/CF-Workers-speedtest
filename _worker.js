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
            width: 300px;  /* 增加按钮尺寸 */
            height: 300px; /* 增加按钮尺寸 */
            border-radius: 50%;
            border: 3px solid #00b3b3; /* 增加边框粗细 */
            background: none;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px rgba(0, 179, 179, 0.2); /* 添加柔和的发光效果 */
        }
        
        .current-speed {
            font-size: 64px; /* 增大速度数字的字体 */
            color: #00b3b3;
            margin-bottom: 5px;
            font-weight: 300; /* 使字体更纤细 */
        }
        
        .speed-unit {
            font-size: 20px; /* 增大单位的字体 */
            color: #888;
            margin-bottom: 8px;
        }
        
        .test-status {
            font-size: 18px; /* 增大状态文字的字体 */
            color: #888;
        }
        
        .progress-ring {
            position: absolute;
            top: -3px;
            left: -3px;
            width: 300px;
            height: 300px;
            transform: rotate(-90deg);
            filter: drop-shadow(0 0 6px rgba(0, 255, 255, 0.3)); /* 添加发光效果 */
        }
        
        .progress-ring circle {
            r: 148.5;
            cx: 150;
            cy: 150;
            fill: none;
            stroke: #00b3b3;
            stroke-width: 6px; /* 增加进度条宽度 */
            stroke-linecap: round;
            transition: stroke-dashoffset 0.2s ease;
            filter: url(#glow); /* 应用滤镜效果 */
        }
        
        /* 添加渐变和发光效果 */
        .progress-ring circle {
            stroke: url(#gradient);
        }
        
        /* 添加背景圆环 */
        .progress-ring-background {
            position: absolute;
            top: -3px;
            left: -3px;
            width: 300px;
            height: 300px;
            transform: rotate(-90deg);
        }
        
        .progress-ring-background circle {
            r: 148.5;
            cx: 150;
            cy: 150;
            fill: none;
            stroke: rgba(0, 179, 179, 0.1);
            stroke-width: 6px;
            stroke-linecap: round;
        }
        
        /* 添加悬停效果 */
        .speed-test-button:hover {
            border-color: #00ffff;
            box-shadow: 0 0 30px rgba(0, 179, 179, 0.3);
        }
        
        /* 添加脉动动画 */
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
        
        .speed-test-button:not(:disabled) {
            animation: pulse 2s infinite;
        }
        
        /* 调整结果显示区域的位置 */
        .speed-results {
            margin-top: 40px; /* 增加与按钮的间距 */
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
        
        /* 添加速度计样式 */
        .speedometer {
            position: relative;
            width: 300px;
            height: 150px;
            margin: 20px auto;
            display: none;
        }
        
        .speedometer-gauge {
            position: absolute;
            width: 100%;
            height: 100%;
            background: conic-gradient(
                from 180deg,
                #00b3b3 0deg,
                #00ffff 90deg,
                #00ff00 180deg
            );
            border-radius: 150px 150px 0 0;
            mask: radial-gradient(circle at 50% 100%, transparent 40%, black 41%);
            -webkit-mask: radial-gradient(circle at 50% 100%, transparent 40%, black 41%);
        }
        
        .speedometer-center {
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
        }
        
        .current-speed {
            font-size: 36px;
            color: #00b3b3;
            margin-bottom: 5px;
        }
        
        .speed-unit {
            font-size: 14px;
            color: #888;
        }
        
        .test-status {
            font-size: 16px;
            color: #888;
            margin-top: 5px;
        }
        
        .speed-needle {
            position: absolute;
            bottom: 0;
            left: 50%;
            width: 2px;
            height: 110px;
            background: #ff3366;
            transform-origin: bottom center;
            transform: rotate(-90deg);
            transition: transform 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="test-area">
        <button id="testButton" class="speed-test-button" onclick="startTest()">
            <!-- 添加背景圆环 -->
            <svg class="progress-ring-background">
                <circle r="148.5" cx="150" cy="150"/>
            </svg>
            
            <!-- 进度条圆环 -->
            <svg class="progress-ring" id="progressRing">
                <!-- 添加渐变和发光滤镜定义 -->
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#00ffff;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#00b3b3;stop-opacity:1" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <circle r="148.5" cx="150" cy="150" 
                        stroke-dasharray="933.5" 
                        stroke-dashoffset="933.5" 
                        id="progressCircle"/>
            </svg>
            
            <div class="current-speed" id="currentSpeed">开始</div>
            <div class="speed-unit" id="speedUnit"></div>
            <div class="test-status" id="testStatus"></div>
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

    <div class="speedometer" id="speedometer">
        <div class="speedometer-gauge"></div>
        <div class="speed-needle" id="speedNeedle"></div>
        <div class="speedometer-center">
            <div class="current-speed" id="currentSpeed">0</div>
            <div class="speed-unit">MB/s</div>
        </div>
    </div>

    <script>
    let isTestRunning = false;
    let downloadSpeed = 0;
    let uploadSpeed = 0;
    
    function updateSpeed(speed, type) {
        const currentSpeed = document.getElementById('currentSpeed');
        const speedUnit = document.getElementById('speedUnit');
        const testStatus = document.getElementById('testStatus');
        
        if (currentSpeed && speedUnit && testStatus) {
            // 确保速度是数字并且大于0
            if (typeof speed === 'number' && speed > 0) {
                const speedMBps = (speed / 8).toFixed(2);
                currentSpeed.textContent = speedMBps;
                speedUnit.textContent = 'MB/s';
                testStatus.textContent = type + '测试中';
            }
        }
    }
    
    async function runSpeedTest(type, testFn) {
        const currentSpeed = document.getElementById('currentSpeed');
        const speedUnit = document.getElementById('speedUnit');
        const testStatus = document.getElementById('testStatus');
        
        // 重置显示
        currentSpeed.textContent = '0.00';
        speedUnit.textContent = 'MB/s';
        testStatus.textContent = type + '测试中';
        
        const speedMbps = await testFn();
        
        if (type === 'download') {
            downloadSpeed = speedMbps;
        } else {
            uploadSpeed = speedMbps;
        }
        
        return speedMbps;
    }
    
    async function startTest() {
        if (isTestRunning) return;
        
        const testButton = document.getElementById('testButton');
        const result = document.getElementById('result');
        const progressCircle = document.getElementById('progressCircle');
        const speedResults = document.getElementById('speedResults');
        const currentSpeed = document.getElementById('currentSpeed');
        const speedUnit = document.getElementById('speedUnit');
        const testStatus = document.getElementById('testStatus');
        
        // 重置显示
        currentSpeed.textContent = '准备中';
        speedUnit.textContent = '';
        testStatus.textContent = '';
        result.textContent = '';
        speedResults.style.display = 'none';
        isTestRunning = true;
        
        // 确保进度条完全重置
        if (progressCircle) {
            progressCircle.style.strokeDasharray = '933.5';
            progressCircle.style.strokeDashoffset = '933.5';
        }
        
        try {
            // 下载测试
            await runSpeedTest('download', async () => {
                const size = 5 * 1024 * 1024;
                const response = await fetch(new URL('download', window.location.href).href + '?size=' + size);
                if (!response.ok) throw new Error('下载请求失败: ' + response.status);
                
                const reader = response.body.getReader();
                let receivedLength = 0;
                let lastUpdate = performance.now();
                let lastReceived = 0;
                let speeds = [];
                
                const startTime = performance.now();
                
                while(true) {
                    const {done, value} = await reader.read();
                    if (done) break;
                    receivedLength += value.length;
                    
                    const now = performance.now();
                    if (now - lastUpdate > 100) {
                        const duration = (now - lastUpdate) / 1000;
                        const currentSpeed = ((receivedLength - lastReceived) * 8 / duration / 1024 / 1024);
                        
                        speeds.push(currentSpeed);
                        if (speeds.length > 3) speeds.shift();
                        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
                        
                        const progress_percent = (receivedLength / size) * 100;
                        
                        // 更新显示
                        const currentSpeedElem = document.getElementById('currentSpeed');
                        const speedUnitElem = document.getElementById('speedUnit');
                        const testStatusElem = document.getElementById('testStatus');
                        const progressCircle = document.getElementById('progressCircle');
                        
                        if (currentSpeedElem && speedUnitElem && testStatusElem) {
                            currentSpeedElem.textContent = (avgSpeed / 8).toFixed(2);
                            speedUnitElem.textContent = 'MB/s';
                            testStatusElem.textContent = '下载测试中';
                        }
                        
                        if (progressCircle) {
                            progressCircle.style.strokeDashoffset = (621.7 - (progress_percent / 100) * 621.7).toString();
                        }
                        
                        lastUpdate = now;
                        lastReceived = receivedLength;
                    }
                }
                
                const duration = (performance.now() - startTime) / 1000;
                return (receivedLength * 8 / duration / 1024 / 1024);
            });
            
            // 上传测试
            await runSpeedTest('upload', async () => {
                const size = 5 * 1024 * 1024;
                const data = new Uint8Array(size);
                const chunkSize = 65536;
                let uploadedSize = 0;
                let lastUpdate = performance.now();
                let speeds = [];
                
                // 准备上传数据
                for (let i = 0; i < size; i += chunkSize) {
                    const chunk = new Uint8Array(Math.min(chunkSize, size - i));
                    crypto.getRandomValues(chunk);
                    data.set(chunk, i);
                }
                
                const startTime = performance.now();
                
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', new URL('upload', window.location.href).href);
                    
                    xhr.upload.onprogress = (event) => {
                        const now = performance.now();
                        if (now - lastUpdate > 100) {
                            const duration = (now - lastUpdate) / 1000;
                            const currentSpeed = ((event.loaded - uploadedSize) * 8 / duration / 1024 / 1024);
                            
                            speeds.push(currentSpeed);
                            if (speeds.length > 3) speeds.shift();
                            const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
                            
                            const progress_percent = (event.loaded / event.total) * 100;
                            
                            // 更新显示
                            const currentSpeedElem = document.getElementById('currentSpeed');
                            const speedUnitElem = document.getElementById('speedUnit');
                            const testStatusElem = document.getElementById('testStatus');
                            const progressCircle = document.getElementById('progressCircle');
                            
                            if (currentSpeedElem && speedUnitElem && testStatusElem) {
                                currentSpeedElem.textContent = (avgSpeed / 8).toFixed(2);
                                speedUnitElem.textContent = 'MB/s';
                                testStatusElem.textContent = '上传测试中';
                            }
                            
                            if (progressCircle) {
                                progressCircle.style.strokeDashoffset = (621.7 - (progress_percent / 100) * 621.7).toString();
                            }
                            
                            lastUpdate = now;
                            uploadedSize = event.loaded;
                        }
                    };
                    
                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            const duration = (performance.now() - startTime) / 1000;
                            resolve(size * 8 / duration / 1024 / 1024);
                        } else {
                            reject(new Error('上传失败: ' + xhr.status));
                        }
                    };
                    
                    xhr.onerror = () => reject(new Error('上传失败'));
                    xhr.send(data);
                });
            });
            
            // 显示最终结果
            currentSpeed.textContent = '再次测速';
            speedUnit.textContent = '';
            testStatus.textContent = '';
            showResults();
            
            // 完全隐藏进度条
            if (progressCircle) {
                progressCircle.style.strokeDashoffset = '933.5';
            }
            
        } catch (error) {
            currentSpeed.textContent = '失败';
            speedUnit.textContent = '';
            testStatus.textContent = error.message;
            
            // 错误时也要隐藏进度条
            if (progressCircle) {
                progressCircle.style.strokeDashoffset = '933.5';
            }
        } finally {
            isTestRunning = false;
            // 确保进度条完全隐藏
            if (progressCircle) {
                progressCircle.style.strokeDashoffset = '933.5';
            }
        }
    }
    
    function showResults() {
        const speedResults = document.getElementById('speedResults');
        const downloadResult = document.getElementById('downloadResult');
        const uploadResult = document.getElementById('uploadResult');
        const progressCircle = document.getElementById('progressCircle');
        
        if (speedResults && downloadResult && uploadResult) {
            speedResults.style.display = 'flex';
            downloadResult.textContent = (downloadSpeed / 8).toFixed(2);
            uploadResult.textContent = (uploadSpeed / 8).toFixed(2);
        }
        
        // 确保进度条完全隐藏
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = '933.5';
        }
    }
    </script>
</body>
</html>
`;

const circumference = 2 * Math.PI * 148.5; // 更新周长值

function updateProgress(percent, type, currentSpeed) {
    const progressCircle = document.getElementById('progressCircle');
    const circumference = 933.5; // 新的周长值 (2 * π * 148.5)
    
    if (progressCircle) {
        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = (circumference - (percent / 100) * circumference).toString();
    }
    // ... 其他代码保持不变 ...
}
