// src/components/UserAndWatchCard.js
import React, { useState } from 'react';
import { View, Text, Pressable, Platform, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../themes/styles';

export default function UserAndWatchCard({ item, type = 'user', isSelected, onPress, customColor = colors.primary, rightElement }) {
  const [isHovered, setIsHovered] = useState(false);

  // Renderizado para Usuarios
  if (type === 'user') {
    return (
      <Pressable
        onPress={onPress}
        onHoverIn={Platform.OS === 'web' ? () => setIsHovered(true) : null}
        onHoverOut={Platform.OS === 'web' ? () => setIsHovered(false) : null}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10, // Un pelín más de padding para que respire con el fondo tintado
          paddingHorizontal: 12,
          marginBottom: 8,
          borderRadius: 8,
          borderWidth: 1,
          
          borderColor: isSelected ? customColor : (isHovered ? customColor : `${customColor}60`),
          backgroundColor: isSelected ? `${customColor}25` : (isHovered ? `${customColor}15` : `${customColor}05`),

          transform: [
            { scale: isHovered && !isSelected ? 1.01 : 1 },
            { translateY: isHovered && !isSelected ? -2 : 0 }
          ],
          
          ...(Platform.OS === 'web' && { 
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', 
            cursor: 'pointer',
            ...(isHovered && !isSelected && {
              boxShadow: `0 8px 16px -4px ${customColor}40`,
            })
          }),
        }}
      >
        <Ionicons name="person-circle" size={30} color={customColor} style={{ marginRight: 10 }} /> 
        
        <View style={{ flex: 1, overflow: 'hidden' }}> 
          {/* Nombre de usuario (se ilumina con el color al pasar el ratón) */}
          <Text 
            style={[
              { fontWeight: 'bold', fontSize: 14 },
              isHovered ? { color: customColor } : { color: colors.text }
            ]} 
            numberOfLines={1}
          >
            {item.username}
          </Text>
          
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation(); // Evita pulsar la carta entera al copiar la wallet
              Clipboard.setStringAsync(item.wallet_address);
              Alert.alert("Copiado", "Dirección de wallet copiada al portapapeles");
            }}
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, alignSelf: 'flex-start', maxWidth: '100%' }}
          >
            <Text 
              style={{ flexShrink: 1, color: '#3b82f6', fontSize: 11, fontFamily: 'monospace', fontWeight: '600' }} 
              numberOfLines={1} 
              ellipsizeMode="middle"
            >
              {item.wallet_address}
            </Text>
            <Ionicons name="copy-outline" size={12} color="#3b82f6" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
        
        {isSelected && <Ionicons name="checkmark-circle" size={20} color={customColor} style={{ marginLeft: 5 }} />}
        {!isSelected && rightElement && <View style={{ marginLeft: 10 }}>{rightElement}</View>}
      </Pressable>
    );
  }

  // Renderizado futuro para Relojes
  if (type === 'watch') {
    return (
      <View style={{ padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}>
        <Text>Componente de reloj en construcción: {item.model}</Text>
      </View>
    );
  }

  return null;
}