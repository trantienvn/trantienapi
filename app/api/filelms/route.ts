import axios from "axios";


export const GET = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const imageId = url.searchParams.get("id");
  const token = url.searchParams.get("token");

  if (!imageId || !token) {
    return new Response(
      JSON.stringify({ error: "Missing required parameters: id or token" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }


  try {
    // Kiểm tra nếu ảnh đã tồn tại trên server
    

    // Nếu ảnh không tồn tại, gửi yêu cầu đến API
    const apiUrl = `https://apps.ictu.edu.vn:9087/ionline/api/aws/file/${imageId}`;

    const apiResponse = await axios.post(apiUrl, {}, {
      headers: {
        Authorization: token,
        Accept: "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,fr-FR;q=0.6,fr;q=0.5",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Type": "application/json",
        Origin: "https://lms.ictu.edu.vn",
        Referer: "https://lms.ictu.edu.vn/",
        "X-App-Id": "7040BD38-0D02-4CBE-8B0E-F4115C348003",
      },
    });

    const data = apiResponse.data;
    return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
