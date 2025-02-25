import axios from "axios";

// Hàm định dạng thời gian (thay thế $o().format)
function formatDate(dateObj: Date): string {
  const pad = (num: number): string => num.toString().padStart(2, '0');

  // Chuyển đổi sang múi giờ GMT+7
  const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  const gmt7 = new Date(utc + (7 * 60 * 60000));

  const year = gmt7.getFullYear();
  const month = pad(gmt7.getMonth() + 1);
  const day = pad(gmt7.getDate());
  const hours = pad(gmt7.getHours());
  const minutes = pad(gmt7.getMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes}:00`;
}

// Hàm CRC32 (tương tự Up trong mã của bạn)
const calculateCRC32 = (input: string): string => {
  const table = (() => {
    let c: number;
    const crcTable: number[] = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crcTable[n] = c;
    }
    return crcTable;
  })();

  let crc = 0 ^ (-1);

  for (let i = 0; i < input.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ input.charCodeAt(i)) & 0xFF];
  }

  return ((crc ^ (-1)) >>> 0).toString(16).toUpperCase();
};

// Hàm tạo chữ ký
const generateSignature = (method: string, body: any, timestamp: Date): string => {
  const X_APP_ID = "7040BD38-0D02-4CBE-8B0E-F4115C348003"; // Giá trị cố định
  const bodyString = ["POST", "PUT"].includes(method.toUpperCase()) ? JSON.stringify(body ?? {}) : "";
  const formattedDate = formatDate(timestamp);
  const signatureBase = bodyString + X_APP_ID + formattedDate;
  // console.log(calculateCRC32('7040BD38-0D02-4CBE-8B0E-F4115C3480032025-01-23 12:44:00'));
  return calculateCRC32(signatureBase); // Lấy 8 ký tự đầu tiên
};
export const OPTIONS = async (): Promise<Response> => {
  return new Response(null, {
      status: 204,
      headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
  });
};

export const GET = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const imageId = url.searchParams.get("id");
  const token = url.searchParams.get("token");

  if (!imageId || !token) {
    return new Response(
      JSON.stringify({ error: "Missing required parameters: id or token" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Cho phép từ mọi web
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", // Cho phép các phương thức
          "Access-Control-Allow-Headers": "Content-Type, Authorization" // Cho phép các header đặc biệt
        }
      }
    );
  }


  try {
    // Kiểm tra nếu ảnh đã tồn tại trên server


    // Nếu ảnh không tồn tại, gửi yêu cầu đến API
    const apiUrl = `https://apps.ictu.edu.vn:9087/ionline/api/aws/file/${imageId}`;
    const timestamp = new Date();
    const signature = generateSignature("GET", null, timestamp);
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
        "x-request-signature": signature,
      },
    });

    const data = apiResponse.data;
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Cho phép từ mọi web
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", // Cho phép các phương thức
        "Access-Control-Allow-Headers": "Content-Type, Authorization" // Cho phép các header đặc biệt
      }
    });


  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Cho phép từ mọi web
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", // Cho phép các phương thức
          "Access-Control-Allow-Headers": "Content-Type, Authorization" // Cho phép các header đặc biệt
        },
      }
    );
  }
};
