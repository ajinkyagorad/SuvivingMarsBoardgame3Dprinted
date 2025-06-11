
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-cyan-400">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl font-bold"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="text-slate-300">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
