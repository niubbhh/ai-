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
  
