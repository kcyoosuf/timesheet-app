import React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { WorkLogProvider } from './context/WorkLogContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';

export function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <WorkLogProvider>
          <ModalProvider>
            <RouterProvider router={router} />
          </ModalProvider>
        </WorkLogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
