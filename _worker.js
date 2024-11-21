export default {
  async fetch(request, env) {
    // 处理OPTIONS预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // 获取请求路径
    const url = new URL(request.url);
    const path = url.pathname;

    // 处理不同的路由
    if (path === '/download') {
      // 下载测试 - 生成随机数据
      const size = parseInt(url.searchParams.get('size')) || 1024 * 1024; // 默认1MB
      const data = new Uint8Array(size);
      crypto.getRandomValues(data);
      
      return new Response(data, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } else if (path === '/upload') {
      // 上传测试 - 仅返回接收到的数据大小
      const size = await request.blob().then(blob => blob.size);
      return new Response(JSON.stringify({ size }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } else {
      // 返回HTML页面
      return new Response(HTML, {
        headers: {
          'Content-Type': 'text/html;charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};

// HTML页面内容
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
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
        }
        .result {
            margin: 20px 0;
            font-size: 24px;
        }
        button {
            padding: 10px 20px;
            font-size: 18px;
            margin: 10px;
        }
    </style>
</head>
<body>
    <h1>网速测试</h1>
    <div>
        <button onclick="testDownload()">测试下载速度</button>
        <button onclick="testUpload()">测试上传速度</button>
    </div>
    <div class="result" id="result">点击按钮开始测试</div>

    <script>
    async function testDownload() {
        const result = document.getElementById('result');
        result.textContent = '测试下载中...';
        
        const startTime = performance.now();
        const response = await fetch('/download?size=' + (5 * 1024 * 1024)); // 5MB
        const data = await response.blob();
        const endTime = performance.now();
        
        const duration = (endTime - startTime) / 1000; // 转换为秒
        const speed = (data.size * 8 / duration / 1024 / 1024).toFixed(2); // Mbps
        
        result.textContent = '下载速度: ' + speed + ' Mbps';
    }

    async function testUpload() {
        const result = document.getElementById('result');
        result.textContent = '测试上传中...';
        
        // 创建测试数据
        const size = 5 * 1024 * 1024; // 5MB
        const data = new Uint8Array(size);
        crypto.getRandomValues(data);
        
        const startTime = performance.now();
        const response = await fetch('/upload', {
            method: 'POST',
            body: data
        });
        const endTime = performance.now();
        
        const duration = (endTime - startTime) / 1000; // 转换为秒
        const speed = (size * 8 / duration / 1024 / 1024).toFixed(2); // Mbps
        
        result.textContent = '上传速度: ' + speed + ' Mbps';
    }
    </script>
</body>
</html>
`;
