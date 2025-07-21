const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const { createHash } = require('crypto');
const { JSDOM } = require('jsdom');
const XLSX = require('xlsx');
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



const jar = new CookieJar();
const client = wrapper(axios.create({
  jar,
  timeout: 30000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
}));

const responseHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const URLS = {
  login: "http://dangkytinchi.ictu.edu.vn/kcntt/login.aspx",
  home: "http://dangkytinchi.ictu.edu.vn/kcntt/Home.aspx",
  studentTimeTable: "http://dangkytinchi.ictu.edu.vn/kcntt/Reports/Form/StudentTimeTable.aspx",
};

const cache = new Map();

function parseDate(dateString) {
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
}
function parseDate2(dateString) {
  const [day, month, year] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

function dateToString(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function tinhtoan(tiethoc) {
  if (!tiethoc || !tiethoc.includes(' --> ')) return undefined;

  const [vao, ra] = tiethoc.split(' --> ').map(str => parseInt(str, 10));
  const gio_vao = ['6:45', '7:40', '8:40', '9:40', '10:35', '13:00', '13:55', '14:55', '15:55', '16:50', '18:15', '19:10', '20:05'][vao - 1];
  const gio_ra = ['7:35', '8:30', '9:30', '10:30', '11:25', '13:50', '14:45', '15:45', '16:45', '17:40', '19:05', '20:00', '20:55'][ra - 1];

  return `${gio_vao} --> ${gio_ra}`;
}

function lichtuan(lich) {
  if (typeof lich !== 'string') return { Tu: "1970-01-01", Den: "1970-01-01" };
  const [tu, den] = lich.split(' đến ');
  return { Tu: tu, Den: den };
}

function thutrongtuan(thu, batdau, ketthuc) {
  const startDate = new Date(batdau);
  const endDate = new Date(ketthuc);
  const thuIndex = parseInt(thu, 10);
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (currentDate.getDay() === thuIndex - 1) {
      return dateToString(currentDate);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return "Không tìm thấy";
}

app.get('/lichhoc', async (req, res) => {
  try {
    const username = req.query.msv;
    const password = req.query.pwd;
    const semesterCode = req.query.hocki;

    const cacheKey = `${username}-${password}-${semesterCode ? semesterCode : 'default'}`;
    if (cache.has(cacheKey)) {
      return res.set(responseHeaders).json(cache.get(cacheKey));
    }

    const loginPage = await client.get(URLS.login);
    const dom = new JSDOM(loginPage.data);
    const form = dom.window.document.getElementById("Form1");

    const inputs = Array.from(form.elements).filter(
      el => ['input', 'select', 'textarea'].includes(el.tagName.toLowerCase()) && el.name
    );

    const formData = new URLSearchParams();
    for (const input of inputs) {
      const name = input.name;
      let value = input.value || '';
      if (name === 'txtUserName') value = username;
      if (name === 'txtPassword') value = createHash('md5').update(password).digest('hex');
      formData.append(name, value);
    }

    const postLogin = await client.post(loginPage.request.res.responseUrl, formData);
    const loginDOM = new JSDOM(postLogin.data);
    const errorText = loginDOM.window.document.getElementById("lblErrorInfo");

    if (errorText && errorText.textContent) {
      return res.status(401).json({ error: true, message: errorText.textContent });
    }

    const homePage = await client.get(URLS.home);
    const nameDOM = new JSDOM(homePage.data);
    const nameText = nameDOM.window.document.getElementById("PageHeader1_lblUserFullName");
    let HoTen = nameText ? nameText.textContent.split("(")[0].trim() : "Khách";

    const lh = await client.get(URLS.studentTimeTable);
    const domLichHoc = new JSDOM(lh.data);
    const doc = domLichHoc.window.document;
    const DOMurl = lh.request.res.responseUrl;

    const hiddenInputs = doc.querySelectorAll('input[type="hidden"]');
    const values = {};
    hiddenInputs.forEach(i => values[i.name] = i.value);

    const semesters = doc.getElementById("drpSemester");
    let semester = semesters.value;
    if (semesterCode) {
      for (let option of semesters.options) {
        if (option.text.includes(semesterCode)) {
          semester = option.value;
          break;
        }
      }
    }
    const term = doc.getElementById("drpTerm").value;
    const type = doc.getElementById("drpType").value;
    const btnView = doc.getElementById("btnView").value;

    const hockiSplit = doc.getElementById("drpSemester").selectedOptions[0].text.split("_");
    const hocki = hockiSplit[0];
    const namhoc = `${hockiSplit[1]} - ${hockiSplit[2]}`;

    const exportRes = await client.post(DOMurl, new URLSearchParams({
      ...values,
      drpSemester: semester,
      drpTerm: term,
      drpType: type,
      btnView
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      responseType: 'arraybuffer'
    });

    const data = new Uint8Array(exportRes.data);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const result = [];
    let ngayhoct = { Tu: "", Den: "" };
    let endDate = "1970-01-01";

    for (let i = 10; i < rows.length; i++) {
      const [STT, TenHP, GiangVien, ThuNgay, tiet, DiaDiem] = rows[i];
      const ThoiGian = tinhtoan(tiet);
      const TTuan = TenHP?.match(/\((.*?)\)/)?.[1];

      if (!ThoiGian && TTuan) {
        ngayhoct = lichtuan(TTuan);
        result.push({
          Tuan: TenHP.split('(')[0].trim(),
          Tu: ngayhoct.Tu,
          Den: ngayhoct.Den,
        });
        continue;
      }

      const gv = GiangVien.split('\n');
      const Meet = gv[1]?.startsWith('http') && gv[1].length > 0 ? gv[1] : `https://${gv[1]}`;
      const Ngay = thutrongtuan(ThuNgay, parseDate(ngayhoct.Tu), parseDate(ngayhoct.Den));
      endDate = dateToString(new Date(parseDate(ngayhoct.Den)));

      //   if (!result[Ngay]) result[Ngay] = [];
      let tieth = '';
      let [start, end] = tiet.split(' --> ').map(Number);

      for (let j = start; j <= end; j++) {
        tieth += j + ', ';
      }

      // Xoá dấu phẩy cuối
      tieth = tieth.slice(0, -2);

      result.push({
        STT,
        Ngay,
        ThuNgay,
        ThoiGian,
        TenHP,
        TietHoc: tieth,
        Tu: ngayhoct.Tu,
        Den: ngayhoct.Den,
        GiangVien: gv[0],
        Meet,
        DiaDiem
      });
    }

    const payload = {
      HocKi: hocki,
      NamHoc: namhoc,
      HoTen,
      MaSV: username.toUpperCase(),
      lichhocdata: result,
      endDate
    };

    cache.set(cacheKey, payload);
    return res.set(responseHeaders).json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: true, message: e.message || 'Internal server error' });
  }
});


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
    const signature = generateXRequestSignature("POST", data, timestamp);
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
app.get("/image", async (req, res) => {
  const { id: imageId, token } = req.query;
  if (!imageId || !token) {
    return res.status(400).json({ error: "Missing required parameters: id or token" });
  }

  try {
    const apiUrl = `https://apps.ictu.edu.vn:9087/ionline/api/aws/file/${imageId}`;
    const timestamp = new Date();
    const signature = generateXRequestSignature("POST", {}, timestamp);

    const apiResponse = await axios.post(apiUrl, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,fr-FR;q=0.6,fr;q=0.5",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Type": "application/json",
        Origin: "https://lms.ictu.edu.vn",
        Referer: "https://lms.ictu.edu.vn/",
        "X-App-Id": X_APP_ID,
        "x-request-signature": signature,
      },
    });

    return res.status(200).json(apiResponse.data);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error", details: error });
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
app.get("/", (req, res) => {
  return res.status(400).send("Chào mừng đến với TranTienAPI lấy api từ lms");
});
// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
