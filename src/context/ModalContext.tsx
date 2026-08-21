import React, { createContext, useContext, useState } from 'react';

interface ModalContextType {
  isWarningsModalOpen: boolean;
  openWarningsModal: () => void;
  closeWarningsModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isWarningsModalOpen, setIsWarningsModalOpen] = useState(false);

  return (
    <ModalContext.Provider
      value={{
        isWarningsModalOpen,
        openWarningsModal: () => setIsWarningsModalOpen(true),
        closeWarningsModal: () => setIsWarningsModalOpen(false),
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
