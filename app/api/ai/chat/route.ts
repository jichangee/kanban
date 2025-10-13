import { NextResponse } from 'next/server';

// 配置Google AI API
const PROJECT_ID = process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const MODEL_ID = process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash';

interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

export async function POST(req: Request) {
  try {
    const body: ChatRequest = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // 使用Vertex AI API
    try {
      const vertexAI = await import('@google-cloud/vertexai');
      const { VertexAI } = vertexAI;

      const vertexAIInstance = new VertexAI({
        project: PROJECT_ID,
        location: LOCATION,
      });

      const generativeModel = vertexAIInstance.getGenerativeModel({
        model: MODEL_ID,
      });

      // 转换消息格式
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        parts: [{ text: msg.content }],
      }));

      const lastMessage = messages[messages.length - 1];

      const result = await generativeModel.generateContent({
        contents: [
          ...history,
          {
            role: lastMessage.role === 'system' ? 'user' : lastMessage.role,
            parts: [{ text: lastMessage.content }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      });

      const response = result.response;
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return NextResponse.json({ response: text });
    } catch (vertexError) {
      console.error('Vertex AI failed, trying alternative method:', vertexError);
      return await callVertexAIWithAPIKey(messages);
    }
  } catch (error) {
    console.error('AI Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 备用方法：使用API密钥调用Vertex AI
async function callVertexAIWithAPIKey(messages: ChatMessage[]) {
  try {
    const API_KEY = process.env.GOOGLE_AI_API_KEY;

    if (!API_KEY) {
      throw new Error('API Key not configured');
    }

    // 使用REST API调用
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`;

    // 转换消息格式
    const contents = messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role,
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google AI API Error Response:', errorData);
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('API Key method failed:', error);

    // 最后的备用方案：模拟AI响应
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1].content.toLowerCase();

      // 简单的规则响应
      if (lastMessage.includes('创建') || lastMessage.includes('新建')) {
        const mockResponse = `我理解您想要创建任务。请告诉我：
1. 任务内容是什么？
2. 希望添加到哪一列？
3. 是否需要设置优先级？`;
        return NextResponse.json({ response: mockResponse });
      }

      if (lastMessage.includes('状态') || lastMessage.includes('查看')) {
        const mockResponse = `当前看板状态已加载完成。我可以帮您：
- 创建新任务
- 移动任务到不同列
- 更新任务信息
- 查看任务详情

请告诉我您想要做什么？`;
        return NextResponse.json({ response: mockResponse });
      }

      if (lastMessage.includes('帮助') || lastMessage.includes('怎么用')) {
        const mockResponse = `我是您的AI看板助手，可以帮助您：

📋 任务管理：
• 创建新任务："创建一个任务：设计登录页面"
• 移动任务："把任务A移动到进行中"
• 更新任务："更新任务A的优先级为高"

📊 看板管理：
• 查看状态："显示当前看板状态"
• 创建列："新建一个列名为测试中"

💡 智能分析：
• 任务总结："总结一下当前的任务情况"
• 优先级建议："帮我评估任务优先级"

请问需要我帮您做什么？`;
        return NextResponse.json({ response: mockResponse });
      }
    }

    const mockResponse = `我理解您的需求。由于AI服务暂时不可用，请稍后再试。您可以：
1. 检查网络连接
2. 联系管理员确认AI服务状态
3. 稍后重试

如果您需要立即处理任务，可以直接使用看板界面进行操作。`;

    return NextResponse.json({ response: mockResponse });
  }
}

// 检查API可用性
export async function GET() {
  return NextResponse.json({
    status: 'AI Chat API is running',
    projectId: PROJECT_ID ? 'configured' : 'not configured',
    location: LOCATION,
    model: MODEL_ID
  });
}