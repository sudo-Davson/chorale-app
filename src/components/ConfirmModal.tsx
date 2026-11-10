'use client';

export default function ConfirmModal({
  isOpen, onClose, onConfirm, title, message, isDestructive = false
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDestructive?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl font-medium transition-colors"
          >
            Annuler
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className={`flex-1 p-3 rounded-xl font-bold transition-colors ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
            }`}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}