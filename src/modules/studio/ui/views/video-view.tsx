import { FormSection } from "../sections/form-section";

interface VideoPageProps {
  videoId: string;
}

export const VideoView = ({ videoId }: VideoPageProps) => {
  return (
    <div className="px-4 pt-2.5 max-w-screen-lg">
      <FormSection videoId={videoId} />
    </div>
  );
};
