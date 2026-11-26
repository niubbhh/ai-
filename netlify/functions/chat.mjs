const API_URL = "https://api.agnes-ai.cn/v1/chat/completions";
const MODEL = "agnes-3.0-flash";

// 天猫精灵官方 Webhook 响应格式
function reply(text, status = 200) {
  return new Response(
    JSON.stringify({
      returnCode: "0",
      returnErrorSolution: "",
      returnMessage: "",
      returnValue: {
        reply: String(text),
        resultType: "RESULT",
        executeCode: "SUCCESS",
        msgInfo: ""
      }
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  );
}

// 提取用户输入
function extractText(data) {
  const values = [
    data?.utterance,
    data?.query,
    data?.text,
    data?.request?.utterance,
    data?.request?.query,
    data?.request?.text,
    data?.request?.intent?.query
  ];

  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  const slots = data?.request?.intent?.slots;

  if (Array.isArray(slots)) {
    const value = slots
      .map(x => x?.value || x?.slotValue || "")
      .filter(x => typeof x === "string")
      .join(" ")
      .trim();

    if (value) return value;
  }

  return "你好";
}

// Netlify Function
export default async function handler(request) {

  console.log(
    "AliGenie request:",
    request.method,
    new URL(request.url).pathname
  );

  // 健康检查
  if (request.method === "GET") {
    return new Response("OK", { status: 200 });
  }

  // 只允许 POST
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405
    });
  }

  // 解析天猫精灵请求
  
  let data;
  try {
    data = await request.json();
  } catch {
    return reply("请求格式不正确，请重试。", 400);
  }

  const key = Netlify.env.get("AGNES_API_KEY") || process.env.AGNES_API_KEY;

  if (!key) {
    console.error("Missing AGNES_API_KEY");
    return reply("AI服务尚未配置，请联系管理员。");
  }

  // 调用 AI 接口
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let res;
    try {
      res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: "你是天猫精灵AI语音助手。请用简短自然的中文回答，不要使用Markdown。"
            },
            { role: "user", content: extractText(data) }
          ]
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Agnes HTTP status:", res.status);
      console.error("Agnes error body:", errorBody.slice(0, 1000));
      return reply("AI服务暂时不可用，请稍后再试。");
    }

    const result = await res.json();
    const content = result?.choices?.[0]?.message?.content;
    const answer =
      typeof content === "string" && content.trim()
        ? content.trim()
        : "抱歉，暂时无法回答。";

    return reply(answer);
  } catch (error) {
    console.error("AI call failed", error?.message || "unknown");
    return reply("AI服务暂时不可用，请稍后再试。");
  }
}
