import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-[#152e49] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-white/10 text-sm max-w-sm animate-bounce-in">
      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
      <span className="font-medium">{message}</span>
    </div>
  );
};
