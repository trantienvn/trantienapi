const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const X_APP_ID = "7040BD38-0D02-4CBE-8B0E-F4115C348003"; // Giá trị cố định

/**
 * Hàm tính CRC32 và tạo chữ ký
 * @param {string} input - Chuỗi đầu vào cần tạo chữ ký
 * @returns {string} - Chữ ký CRC32 ở dạng hex viết hoa
 */
function crc32(input) {
    let table = (() => {
        let c, crcTable = [];
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
}

/**
 * Chuyển đổi Date object thành định dạng YYYY-MM-DD HH:mm:00
 * @param {Date} dateObj - Đối tượng Date
 * @returns {string} - Chuỗi định dạng YYYY-MM-DD HH:mm:00
 */
function formatDateTime(dateObj) {
    const date = new Date(dateObj.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const pad = (num) => num.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day} ${hours}:${minutes}:00`;
}

/**
 * Tạo chữ ký x-request-signature
 * @param {string} method - Phương thức HTTP (GET, POST, PUT, DELETE)
 * @param {Object} body - Nội dung body của request (chỉ dùng cho POST/PUT)
 * @param {Date} dateObj - Đối tượng Date dùng để format
 * @returns {string} - x-request-signature
 */
function generateXRequestSignature(method, body, dateObj) {
    const X_APP_ID = '7040BD38-0D02-4CBE-8B0E-F4115C348003';

    // Kiểm tra nếu là POST/PUT thì thêm body JSON, ngược lại bỏ qua
    const bodyString = ["POST", "PUT"].includes(method.toUpperCase()) ? JSON.stringify(body || {}) : '';

    // Định dạng ngày giờ
    const formattedData = formatDateTime(dateObj);

    // Ghép chuỗi theo định dạng yêu cầu
    const rawData = bodyString + X_APP_ID + formattedData;

    // Tạo chữ ký CRC32
    return crc32(rawData);
}




// Middleware xử lý OPTIONS (CORS)
app.options("*", (req, res) => {
    res.status(204).set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }).send();
});

// Route xử lý GET request
app.get("/proxy", async (req, res) => {
    const { url, token } = req.query;

    if (!url || !token) {
        return res.status(400).json({ error: "Missing required parameters: url or token" });
    }

    try {
        const timestamp = new Date();
        const signature = generateXRequestSignature("GET", null, timestamp);

        const apiResponse = await axios.get(url, {
            headers: {
                Authorization: "Bearer " + token,
                Accept: "application/json, text/plain, */*",
                "Accept-Encoding": "gzip, deflate, br, zstd",
                "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "Content-Type": "application/json",
                Origin: "https://lms.ictu.edu.vn",
                Referer: "https://lms.ictu.edu.vn/",
                "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
                "X-App-Id": X_APP_ID,
                "x-request-signature": signature,
            },
        });

        res.json(apiResponse.data);
    } catch (error) {
        res.status(500).json({
            error: "Internal server error",
            details: error.response ? error.response.data : error.message,
            data: error,
        });
    }
});

// Route xử lý POST request
app.post("/proxy", async (req, res) => {
    console.log("Received request with:", req.query, req.body);
    const { url, token, data } = req.body;
    try {
        const timestamp = new Date();
        const signature = generateXRequestSignature("POST", body, timestamp);
        console.log("Generated signature:", signature);
        console.log("Url:", url);
        console.log("Token:", token);
        console.log("Data:", data);
        const apiResponse = await axios.post(url, data, {
            headers: {
                Authorization: "Bearer " + token,
                Accept: "application/json, text/plain, */*",
                "Accept-Encoding": "gzip, deflate, br, zstd",
                "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "Content-Type": "application/json",
                Origin: "https://lms.ictu.edu.vn",
                Referer: "https://lms.ictu.edu.vn/",
                "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
                "X-App-Id": X_APP_ID,
                "x-request-signature": signature,
            },
        });

        res.json(apiResponse.data);
    } catch (error) {
        res.status(500).json({
            error: "Internal server error",
            details: error.response ? error.response.data : error.message,
            data: error,
        });
    }
});
// Route xử lý GET request
app.get("/api/lms", (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "Missing required parameter: url" });
    }
    
    res.redirect(url);
});

// Route xử lý POST request
app.post("/api/lms", (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "Missing required parameter: url" });
    }
    
    res.redirect(307, url); // Sử dụng mã trạng thái 307 để duy trì phương thức POST
});
// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
