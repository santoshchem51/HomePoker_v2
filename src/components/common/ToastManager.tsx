import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Toast, { ToastData } from './Toast';

interface ToastManagerRef {
  show: (toast: Omit<ToastData, 'id'>) => void;
}

let toastManagerRef: ToastManagerRef | null = null;

export const showToast = (toast: Omit<ToastData, 'id'>) => {
  if (toastManagerRef) {
    toastManagerRef.show(toast);
  }
};

const ToastManager: React.FC = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const show = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Date.now().toString();
    const newToast: ToastData = {
      ...toast,
      id,
    };
    
    setToasts(prevToasts => [...prevToasts, newToast]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Expose methods to global reference
  React.useEffect(() => {
    toastManagerRef = { show };
    return () => {
      toastManagerRef = null;
    };
  }, [show]);

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={dismiss}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
});

export default ToastManager;