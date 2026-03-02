import { HistoryVideosSection } from "../sections/history-videos-section";

export const HistoryView = () => {
  return (
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
      <div>
        <h1 className="text-twxl font-bold">History</h1>
        <p className="text-m text-muted-foreground">Videos you have watched</p>
      </div>

      <HistoryVideosSection />
    </div>
  );
};
