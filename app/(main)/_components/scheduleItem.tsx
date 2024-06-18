import { IMonHoc } from "@/types/monHoc";
import React from "react";

const ExamItem = ({ item }: { item: IMonHoc }) => {
  return (
    <div className="flex flex-col p-4 space-y-4">
      <div className="flex flex-col space-y-2">
         <div className="flex items-center">
          <p>Ngày: {item.Ngay}</p>
          <div className="mx-2">•</div>
          <p>Thời gian: {item.ThoiGian}</p>
        </div>
        <div className="bg-muted-foreground w-full h-[1px]"></div> 
        <p className="font-semibold tracking-tight text-2xl text-card-foreground">
          {item.TenHP}
        </p>
        <p>Mã học phần: {item.MaHP}</p>
        <p>Giảng viên: {item.GiangVien}</p>
        <p>Địa điểm: {item.DiaDiem}</p>
        <p>Meet: {item.Meet}</p>
      </div>
    </div>
  );
};

export default ExamItem;
