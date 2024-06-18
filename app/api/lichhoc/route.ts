import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { createHash } from "crypto";
import { JSDOM } from "jsdom";
import * as XLSX from 'xlsx';

const jar = new CookieJar();

const client = wrapper(
  axios.create({
    jar,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  })
);

const urlLogin = "http://220.231.119.171/kcntt/login.aspx";

function tinhtoan(tiethoc: string) {
  if (typeof tiethoc !== 'string' || !tiethoc.includes(' --\u003E ')) {
    //console.error("Invalid input format. Expected format: 'startPeriod --\u003E endPeriod'");
    return undefined;
  }
  const vao = parseInt(tiethoc.split(' --\u003E ')[0]);
  const ra = parseInt(tiethoc.split(' --\u003E ')[1]);
  let giovao = "";
  let giora = "";

  switch (vao) {
    case 1:
      giovao = "6:45";
      break;
    case 2:
      giovao = "7:40";
      break;
    case 3:
      giovao = "8:40";
      break;
    case 4:
      giovao = "9:40";
      break;
    case 5:
      giovao = "10:35";
      break;
    case 6:
      giovao = "13:00";
      break;
    case 7:
      giovao = "13:55";
      break;
    case 8:
      giovao = "14:55";
      break;
    case 9:
      giovao = "15:55";
      break;
    case 10:
      giovao = "16:50";
      break;
    case 11:
      giovao = "18:15";
      break;
    case 12:
      giovao = "19:10";
      break;
    case 13:
      giovao = "20:05";
      break;
    default:
      console.error("Invalid start period");
  }

  switch (ra) {
    case 1:
      giora = "7:35";
      break;
    case 2:
      giora = "8:30";
      break;
    case 3:
      giora = "9:30";
      break;
    case 4:
      giora = "10:30";
      break;
    case 5:
      giora = "11:25";
      break;
    case 6:
      giora = "13:50";
      break;
    case 7:
      giora = "14:45";
      break;
    case 8:
      giora = "15:45";
      break;
    case 9:
      giora = "16:45";
      break;
    case 10:
      giora = "17:40";
      break;
    case 11:
      giora = "19:05";
      break;
    case 12:
      giora = "20:00";
      break;
    case 13:
      giora = "20:55";
      break;
    default:
      console.error("Invalid end period");
  }

  return {
    GioVao: giovao,
    GioRa: giora
  };
}

function lichtuan(lich: string) {
  if (typeof lich !== 'string') {
    return {
      Tu: "1970-1-1",
      Den: "1970-1-1"
    };
  }
  const tu = parseDate(lich.split(' đến ')[0]);
  const den = parseDate(lich.split(' đến ')[1]);
  return {
    Tu: tu,
    Den: den
  };
}
function parseDate(dateString: string) {
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
}

function thutrongtuan(thu: string, batdau: string, ketthuc: string) {
  // Check if inputs are strings
  if (typeof thu !== 'string' || typeof batdau !== 'string' || typeof ketthuc !== 'string') {
    return "Invalid input";
  }
  //console.log(thu, batdau, ketthuc);
  // Convert batdau and ketthuc to Date objects
  let startDate = new Date(batdau);
  let endDate = new Date(ketthuc);
  // Validate date parsing
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return "Invalid date format";
  }

  // Validate thu input
  let thuIndex = parseInt(thu, 10); // Convert thu to integer
  if (thuIndex < 2 || thuIndex > 8 || isNaN(thuIndex)) {
    return "Invalid weekday number";
  }

  // Find the first occurrence of the specified weekday within the date range
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (currentDate.getDay() === thuIndex - 1) {
      // Format the date as "dd/mm/yyyy"
      let day = currentDate.getDate().toString().padStart(2, '0');
      let month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      let year = currentDate.getFullYear().toString();
      return `${year}-${month}-${day}`;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return "No such weekday found in the range";
}


export const GET = async (request: Request) => {
  // Lấy thông tin tài khoản từ URLSearchParams
  try {
    const cookieHeader = request.headers.get("cookie");
    const lichhocResponse = await client.get(
      "http://220.231.119.171/kcntt/Reports/Form/StudentTimeTable.aspx",
      {
        headers: {
          Cookie: cookieHeader, // Use cookie from request
        },
      }
    );

    const DOMlichhoc = new JSDOM(lichhocResponse.data);
    const DOMurl = lichhocResponse.request.res.responseUrl;
    const document = DOMlichhoc.window.document;
    const hiddenFields = DOMlichhoc.window.document.querySelectorAll('input[type="hidden"]');
    const hiddenValues: { [key: string]: string } = {};
    hiddenFields.forEach(input => {
      hiddenValues[(input as HTMLInputElement).name] = (input as HTMLInputElement).value;
    });
    //lấy lịch học và trả về api
    const semester = (document.getElementById("drpSemester") as HTMLSelectElement).value;
    const term = (document.getElementById("drpTerm") as HTMLSelectElement).value;
    const type = (document.getElementById("drpType") as HTMLSelectElement).value;
    const btnView = (document.getElementById("btnView") as HTMLButtonElement).value;
    const hockiELM = document.getElementById("drpSemester") as HTMLSelectElement;
    let hocki = hockiELM.options[hockiELM.selectedIndex].text;
    const namhoc = hocki.split("_")[1]+' - '+hocki.split("_")[2];
    hocki = hocki.split("_")[0];
    const exportResponse = await client.post(DOMurl, new URLSearchParams({
      ...hiddenValues,
      drpSemester: semester, // Giá trị cần thiết từ form
      drpTerm: term,
      drpType: type,
      btnView: btnView
    }).toString(), {
      headers: {
        Cookie: cookieHeader, // Use cookie from request
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      responseType: 'arraybuffer'
    });
    const data = new Uint8Array(exportResponse.data);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const LichHoc = [];
    const TuanData = [];
    let Tuan = 0;
    let ngayhoct = {
      Tu: "",
      Den: ""
    }
    for (let i = 10; i < jsonData.length; i++) {
      const STT = parseInt(JSON.parse(JSON.stringify(jsonData[i]))[0]);
      const hocphan = JSON.parse(JSON.stringify(jsonData[i]))[1];
      const MaHP = hocphan.match(/\((.*?)\)/)[1];
      const TenHP = hocphan.replace(/\((.*?)\)/, "").trim();
      const GiangVien = JSON.parse(JSON.stringify(jsonData[i]))[2];
      const ThuNgay = JSON.parse(JSON.stringify(jsonData[i]))[3];
      const tg = JSON.parse(JSON.stringify(jsonData[i]))[4];
      const LetTime = tinhtoan(tg);
      let ThoiGian = "";
      const TTuan = hocphan.match(/\((.*?)\)/)[1];

      if (typeof LetTime !== 'undefined') {
        ThoiGian = `${LetTime.GioVao} - ${LetTime.GioRa}`;
        const DiaDiem = JSON.parse(JSON.stringify(jsonData[i]))[5];
        const Ngay = thutrongtuan(ThuNgay, parseDate(ngayhoct.Tu), parseDate(ngayhoct.Den));
        const gv = GiangVien.split('\n');
        LichHoc.push({
          STT,
          Tuan,
          Ngay,
          ThoiGian,
          TenHP,
          MaHP,
          GiangVien: gv[0],
          Meet: gv[1],
          DiaDiem
        });
      } else {
        Tuan++;
        const STT = 0;

        const NgayHoc = lichtuan(TTuan);
        ngayhoct = NgayHoc;
        TuanData.push({
          STT,
          Tuan,
          NgayHoc
        });
      }


    }



    return new Response(
      JSON.stringify({
        HocKi: hocki,
        NamHoc: namhoc,
        lichhocdata: LichHoc,
        TuanData
      }), {
      headers: {
        "content-type": "application/json",
      },
    }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({
        error: true,
        message: e,

      })
    );
  }
};