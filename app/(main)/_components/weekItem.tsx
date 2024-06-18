import { IMonHoc } from "@/types/monHoc";
import React from "react";

const ExamItem = ({ item }: { item: IMonHoc }) => {
  return (
    <div className="flex flex-col p-4 space-y-4">
      <div className="flex flex-col space-y-2">
      <p className="font-semibold tracking-tight text-2xl text-card-foreground">
         Tuần: {item.Tuan}
        </p>
         <div className="flex items-center">
          <p>Ngày học: từ {item.NgayHoc.Tu} đến {item.NgayHoc.Den}</p>
        </div>
      </div>
    </div>
  );
};

export default ExamItem;
