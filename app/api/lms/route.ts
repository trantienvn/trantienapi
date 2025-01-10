import axios from "axios";

export const GET = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const requrl = url.searchParams.get("url");
  const token = url.searchParams.get("token");

  if (!requrl || !token) {
    return new Response(
      JSON.stringify({ error: "Missing required parameters: url or token" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Sử dụng axios.get thay vì axios.post và truyền dữ liệu qua tham số truy vấn
    const apiResponse = await axios.get(requrl, {
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,fr-FR;q=0.6,fr;q=0.5",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Type": "application/json",
        Origin: "https://lms.ictu.edu.vn",
        Referer: "https://lms.ictu.edu.vn/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "X-App-Id": "7040BD38-0D02-4CBE-8B0E-F4115C348003",
      },
    });

    const data = apiResponse.data;
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    // Xử lý lỗi cụ thể
    const errorDetails = error.response
      ? {
        status: error.response.status,
        message: error.response.data || error.message,
      }
      : { message: error.message };

    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorDetails }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json(); // Lấy dữ liệu từ thân yêu cầu
    const url = new URL(req.url);
    const requrl = url.searchParams.get("url");
    const token = url.searchParams.get("token");
    if (!requrl || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: url, token, or data" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Sử dụng axios.post để gửi dữ liệu
    const apiResponse = await axios.post(
      requrl,
      body,
      {
        headers: {
          Authorization: "Bearer " + token,
          Accept: "application/json, text/plain, */*",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,fr-FR;q=0.6,fr;q=0.5",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Content-Type": "application/json",
          Origin: "https://lms.ictu.edu.vn",
          Referer: "https://lms.ictu.edu.vn/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "X-App-Id": "7040BD38-0D02-4CBE-8B0E-F4115C348003",
        },
      }
    );

    const responseData = apiResponse.data;
    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    // Xử lý lỗi cụ thể
    const errorDetails = error.response
      ? {
        status: error.response.status,
        message: error.response.data || error.message,
      }
      : { message: error.message };

    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorDetails }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
