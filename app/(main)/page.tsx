"use client";
import TimeTable from "./_components/timeTable";
import Exam from "./_components/exam";
import Scores from "./_components/scores";
import Schedule from "./_components/schedule";

const HomePage = () => {
  return (
    <div>
      <div className="p-10 flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="grid grid-cols-2 gap-4">
          <TimeTable />
          <Schedule />
          <Exam />
          <Scores />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
