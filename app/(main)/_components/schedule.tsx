"use client";
import { CalendarRange } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { IMonHoc } from "@/types/monHoc";
import { GraduationCap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ScheduleItem from "./scheduleItem";
import WeekItem from "./weekItem";
import Spinner from "@/components/spinner";
function have(items: IMonHoc[]){
  var today = new Date();
  items.forEach(item => {
    var datetime = new Date(item.Ngay);
    if (datetime >= today) {
      return true;
    }
  });
  return false;
}
function tin(date: string, item: IMonHoc) {
  var datetime = new Date(date);
  var today = new Date();
  if (datetime >= today) {
    return (<div
      className="rounded-lg border bg-card shadow-sm text-sm text-muted-foreground"
      key={item.STT}
    >
      <ScheduleItem item={item} />
    </div>);
  } else {
    return (null);

  }
}
  const Schedule = () => {
    const [LichHoc, setLichHoc] = useState<IMonHoc[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
      const getLichHoc = async () => {
        setLoading(true);
        try {
          const response = await axios.get("/api/lichhoc");
          setLichHoc(response.data.lichhocdata);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      getLichHoc();
    }, []);
    return (
      <>
        <Dialog>
          <DialogTrigger asChild>
            <div className="group cursor-pointer">
              <div className="p-5 rounded-xl border bg-card shadow w-52 h-52 group-hover:bg-zinc-800 group-hover:scale-125 group-hover:text-muted dark:group-hover:text-muted-foreground transition duration-300 ease-in-out flex flex-col">
                <CalendarRange className="w-16 h-16" />
                <span className="mt-auto ml-auto font-medium text-xl text-card-foreground group-hover:text-card dark:group-hover:text-card-foreground">
                  Lịch học
                </span>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lịch học</DialogTitle>
              <DialogDescription>
                Bạn có thể xem lịch học của các môn học!
              </DialogDescription>
              <div className="max-h-[70vh] overflow-y-auto flex flex-col space-y-2 py-2">
                {loading && (
                  <div className="w-full min-h-40 flex items-center justify-center">
                    <Spinner />
                  </div>
                )}
                {!loading && LichHoc.length > 0 && have(LichHoc) ? (
                  LichHoc.map((item) => (tin(item.Ngay, item)
                  ))
                ) : (
                  <p>Bạn rảnh!</p>
                )}
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </>
    );
  };

  export default Schedule;
