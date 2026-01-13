'use client';

interface LoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export default function Loader({ message = 'Loading...', fullScreen = false }: LoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[#3F9AAE]/30 border-t-[#3F9AAE] rounded-full animate-spin" />
      <p className="text-[#79C9C5] font-medium">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
