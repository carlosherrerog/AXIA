import React, { useState } from 'react';
import { View, Text, Image, Pressable, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, alertColors, roleColors } from '../themes/styles';
import { resolveImageUri } from '../utils/ipfs';

export default function PublicWatchCard({ nft, navigation, cardWidth }) {
  const [isHovered, setIsHovered] = useState(false);

  const handlePressCard = () => {
    const watchId = nft.token_id || nft.id;
    navigation.navigate('PublicWatch', { watchId: watchId, initialTab: 'details' });
  };

  const handlePressOwner = (e) => {
    e?.stopPropagation?.();
    if (nft.owner_id) navigation.navigate('PublicProfile', { userId: nft.owner_id });
  };

  const isStolen   = nft.security_state === 1;
  const isLost     = nft.security_state === 2;
  const isAltered  = nft.security_state === 4;
  const isEscrowed = nft.marketplace_state >= 2;

  const lostColor    = '#6b7280';
  const escrowColor  = '#f59e0b';
  const alteredColor = '#f97316';

  const cardBorder = isStolen  ? alertColors.error
                   : isLost    ? lostColor
                   : isAltered ? alteredColor
                   : isEscrowed ? escrowColor
                   : nft.is_listed ? colors.primary
                   : colors.border;

  const displayPrice = nft.price ? Number(nft.price) : 0;

  const isMfg    = nft.is_manufacturer;
  const isDlr    = nft.is_dealer;
  const roleKey  = isMfg ? 'FABRICANTE' : isDlr ? 'DEALER' : 'PARTICULAR';
  const roleIcon = isMfg ? 'construct-outline' : isDlr ? 'storefront-outline' : 'person-outline';
  const roleColor = roleColors[roleKey];

  const statusLabel = isStolen  ? { text: 'ROBADO',    color: alertColors.error, icon: 'warning' }
                    : isLost    ? { text: 'PERDIDO',   color: lostColor,         icon: 'help-circle' }
                    : isAltered ? { text: 'ALTERADO',  color: alteredColor,      icon: 'alert-circle' }
                    : isEscrowed ? { text: 'RESERVADO', color: escrowColor,      icon: 'lock-closed' }
                    : nft.is_listed ? { text: 'EN VENTA', color: colors.primary, icon: 'pricetag' }
                    : null;

  const tokenId = nft.token_id || nft.id;

  return (
    <Pressable
      onHoverIn={Platform.OS === 'web' ? () => setIsHovered(true) : null}
      onHoverOut={Platform.OS === 'web' ? () => setIsHovered(false) : null}
      onPress={handlePressCard}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: isHovered ? colors.primary : cardBorder,
        backgroundColor: colors.backgroundAlt,
        opacity: (isEscrowed && !isAltered) ? 0.85 : 1,
        ...(Platform.OS === 'web' && {
          transition: 'all 0.18s ease',
          cursor: 'pointer',
          boxShadow: isHovered ? `0 4px 20px ${colors.primary}55` : '0 1px 6px rgba(0,0,0,0.25)',
        }),
      }}
    >
      {/* Mini-header: propietario */}
      <TouchableOpacity
        onPress={handlePressOwner}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: '#0a0a0f',
          paddingHorizontal: 10, paddingVertical: 7,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}
      >
        <Ionicons name={roleIcon} size={12} color={roleColor} />
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600', flex: 1 }} numberOfLines={1}>
          {nft.seller_name || 'Vendedor'}
        </Text>
        <Ionicons name="checkmark-circle" size={13} color={roleColor} />
      </TouchableOpacity>

      {/* Imagen cuadrada */}
      <View style={{ width: '100%', aspectRatio: 1, backgroundColor: colors.surface, position: 'relative' }}>
        <Image
          source={{ uri: resolveImageUri(nft.image) || 'https://via.placeholder.com/150' }}
          style={{ width: '100%', height: '100%', opacity: (isEscrowed && !isAltered) ? 0.5 : 1 }}
          resizeMode="contain"
        />
        {statusLabel && (
          <View style={{
            position: 'absolute', top: 7, left: 7,
            backgroundColor: statusLabel.color,
            paddingHorizontal: 6, paddingVertical: 2,
            borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 3,
          }}>
            <Ionicons name={statusLabel.icon} size={9} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 }}>
              {statusLabel.text}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ padding: 8 }}>
        {nft.is_listed && (
          <Text style={{ color: isEscrowed ? escrowColor : '#10b981', fontSize: 13, fontWeight: '800', marginBottom: 2 }}>
            {displayPrice.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USDC
          </Text>
        )}
        <Text style={{ color: colors.text, fontSize: 11, fontWeight: '600', lineHeight: 15 }} numberOfLines={2}>
          {nft.model}
        </Text>
        <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '700', marginTop: 4 }}>
          #{tokenId}
        </Text>
      </View>
    </Pressable>
  );
}
