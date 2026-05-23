// src/components/MenuDropdown.js
//
// Solución definitiva al z-index:
//  • Web   → ReactDOM.createPortal → se inyecta en document.body
//  • Nativo → React Native Modal → capa nativa por encima de todo
//
// Props:
//   visible    boolean
//   onClose    () => void
//   position   { top?, bottom?, left?, right? }
//   items      Array<{ icon, label, color?, onPress, divider? }>
//   loggedUser object (opcional) — muestra cabecera de perfil

import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Ítem individual
function MenuItem({ icon, label, color, onPress, isActive, colors }) {
  const tint = color ?? colors.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 10,
          marginBottom: 1,
        },
        (pressed || hovered || isActive) && {
          backgroundColor: color === '#f43f5e'
            ? 'rgba(244,63,94,0.12)'
            : colors.primary + '20',
        },
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={{
        width: 30, height: 30, borderRadius: 8,
        backgroundColor: tint + '15',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 10,
      }}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Text style={{
        color: tint,
        fontSize: 14,
        fontWeight: isActive || color === '#f43f5e' ? '600' : '400',
        flex: 1,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

// Cabecera de usuario (opcional) 
function UserHeader({ loggedUser, colors }) {
  if (!loggedUser?.username) return null;
  const initials = (loggedUser.username?.[0] || '?').toUpperCase();

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      marginBottom: 6,
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: colors.primary + '25',
        borderWidth: 1.5, borderColor: colors.primary + '60',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 10,
      }}>
        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>
          {initials}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>
          {loggedUser.full_name || loggedUser.username}
        </Text>
        {loggedUser.email ? (
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }} numberOfLines={1}>
            {loggedUser.email}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// Divisor con etiqueta opcional
function Divider({ label, colors }) {
  if (!label) return (
    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4, marginHorizontal: 4 }} />
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4, paddingHorizontal: 4 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <Text style={{ color: colors.textMuted, fontSize: 10, marginHorizontal: 8, fontWeight: '600', letterSpacing: 0.5 }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
}

// Contenido del menú 
function DropdownContent({ position, items, onClose, isWeb, loggedUser, colors }) {
  const boxStyle = {
    position: isWeb ? 'fixed' : 'absolute',
    width: 250,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 40,
    zIndex: 99999,
    ...(isWeb && {
      boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${colors.border}`,
    }),
    ...(position.top    !== undefined && { top:    position.top }),
    ...(position.bottom !== undefined && { bottom: position.bottom }),
    ...(position.left   !== undefined && { left:   position.left }),
    ...(position.right  !== undefined && { right:  position.right }),
  };

  return (
    <>
      <Pressable
        onPress={onClose}
        style={[
          isWeb
            ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99998 }
            : StyleSheet.absoluteFillObject,
        ]}
      />
      <View style={boxStyle}>
        <UserHeader loggedUser={loggedUser} colors={colors} />
        {items.map((item, i) =>
          item.divider
            ? <Divider key={`d${i}`} label={item.label} colors={colors} />
            : <MenuItem key={`m${i}`} {...item} colors={colors} />
        )}
      </View>
    </>
  );
}

//  Componente principal 
export default function MenuDropdown({ visible, onClose, position = {}, items = [], loggedUser }) {
  const { colors } = useTheme();

  if (!visible) return null;

  if (Platform.OS === 'web') {
    const { createPortal } = require('react-dom');
    return createPortal(
      <DropdownContent
        position={position}
        items={items}
        onClose={onClose}
        isWeb
        loggedUser={loggedUser}
        colors={colors}
      />,
      document.body,
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        <DropdownContent
          position={position}
          items={items}
          onClose={onClose}
          isWeb={false}
          loggedUser={loggedUser}
          colors={colors}
        />
      </View>
    </Modal>
  );
}
