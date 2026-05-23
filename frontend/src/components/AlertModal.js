import React, { useRef, useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const TYPE_CONFIG = {
  error:   { icon: 'close-circle',       color: '#ef4444' },
  warning: { icon: 'warning',             color: '#f59e0b' },
  success: { icon: 'checkmark-circle',   color: '#10b981' },
  info:    { icon: 'information-circle', color: '#8b5cf6' },
};

// Componente principal
export default function AlertModal({
  visible,
  type = 'info',
  title,
  message,
  onClose,
  confirmLabel = 'Confirmar',
  onConfirm,
  cancelLabel = 'Cancelar',
  onCancel,
}) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1,    useNativeDriver: true, bounciness: 5 }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.92);
      opacity.setValue(0);
    }
  }, [visible]);

  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const hasTwoButtons = !!onConfirm && !!onCancel;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' && { backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }),
      }}>
        <Animated.View style={{
          transform: [{ scale }],
          opacity,
          backgroundColor: colors.backgroundAlt,
          borderRadius: 28,
          padding: 28,
          width: '88%',
          maxWidth: 360,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          ...(Platform.OS === 'web' && {
            boxShadow: `0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px ${cfg.color}18`,
          }),
        }}>
          {/* Icono con halo */}
          <View style={{
            width: 68, height: 68, borderRadius: 34,
            backgroundColor: `${cfg.color}12`,
            borderWidth: 1.5,
            borderColor: `${cfg.color}30`,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 18,
          }}>
            <Ionicons name={cfg.icon} size={34} color={cfg.color} />
          </View>

          {title && (
            <Text style={{
              color: colors.text, fontWeight: '700', fontSize: 17,
              textAlign: 'center', marginBottom: 8, letterSpacing: -0.2,
            }}>
              {title}
            </Text>
          )}

          {message && (
            <Text style={{
              color: colors.textSecondary, fontSize: 14,
              textAlign: 'center', lineHeight: 21, marginBottom: 24,
            }}>
              {message}
            </Text>
          )}

          {hasTwoButtons ? (
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <TouchableOpacity
                onPress={onCancel}
                style={{
                  flex: 1, paddingVertical: 13, borderRadius: 24,
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderWidth: 1, borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 14 }}>
                  {cancelLabel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onConfirm}
                style={{
                  flex: 1, paddingVertical: 13, paddingHorizontal: 8, borderRadius: 24,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: cfg.color,
                }}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  style={{ color: '#fff', fontWeight: '700', fontSize: 14, textAlign: 'center' }}
                >
                  {confirmLabel}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: '100%', paddingVertical: 14, borderRadius: 24,
                alignItems: 'center',
                backgroundColor: cfg.color,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                Entendido
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// Hook de conveniencia
export function useAlert() {
  const [alertState, setAlertState] = useState({
    visible: false, type: 'info', title: '', message: '',
  });

  const showAlert = (title, message, type = 'info') =>
    setAlertState({ visible: true, type, title, message });

  const hideAlert = () =>
    setAlertState(s => ({ ...s, visible: false }));

  const alertProps = {
    visible:  alertState.visible,
    type:     alertState.type,
    title:    alertState.title,
    message:  alertState.message,
    onClose:  hideAlert,
  };

  return { alertProps, showAlert, hideAlert };
}
