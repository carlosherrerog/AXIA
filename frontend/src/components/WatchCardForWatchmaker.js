import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, roleColors } from '../themes/styles';

export default function WatchCardForWatchmaker({ watch, onPeritar, walletConnected = true }) {
  const [isHovered, setIsHovered] = useState(false);

  const truncateWallet = (w) => w ? `${w.slice(0, 6)}…${w.slice(-4)}` : '—';

  return (
    <Pressable
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      onPress={() => walletConnected && onPeritar(watch)}
      style={{
        backgroundColor: isHovered && walletConnected ? '#1a1825' : colors.backgroundAlt,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: isHovered && walletConnected ? roleColors.RELOJERO : colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        opacity: walletConnected ? 1 : 0.55,
        position: 'relative',
        ...(Platform.OS === 'web' && {
          transition: 'all 0.2s ease-in-out',
          cursor: walletConnected ? 'pointer' : 'not-allowed',
          transform: isHovered && walletConnected ? 'translateY(-2px)' : 'translateY(0px)',
          boxShadow: isHovered && walletConnected ? `0 8px 24px ${roleColors.RELOJERO}20` : 'none',
        }),
      }}
    >
      {/* IMAGEN */}
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: watch.image || 'https://via.placeholder.com/150' }}
          style={{ width: 90, height: 90, borderRadius: 12, backgroundColor: colors.surface }}
        />
        <View style={{
          position: 'absolute', bottom: -6, left: '50%',
          transform: [{ translateX: -28 }],
          backgroundColor: `${roleColors.RELOJERO}22`,
          borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
          borderWidth: 1, borderColor: `${roleColors.RELOJERO}55`,
        }}>
          <Text style={{ color: roleColors.RELOJERO, fontSize: 9, fontWeight: '900' }}>PERITAJE</Text>
        </View>
      </View>

      {/* INFO CENTRAL */}
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 2 }}>
          {watch.brand}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
          {watch.model}  ·  {watch.manufacturing_year}
        </Text>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View>
            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}>Nº SERIE</Text>
            <Text style={{ color: colors.text, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
              {watch.serial_number}
            </Text>
          </View>
          <View>
            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}>PRECIO</Text>
            <Text style={{ color: colors.primaryLight, fontSize: 11, fontWeight: '700' }}>
              {watch.price ? `${(Number(watch.price) / 1_000_000).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC` : '—'}
            </Text>
          </View>
        </View>

        {/* vendedor */}
        {watch.seller_username ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}>
            <Ionicons name="person-outline" size={11} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>
              Vendedor: <Text style={{ color: colors.textSecondary }}>{watch.seller_username}</Text>
            </Text>
          </View>
        ) : null}
      </View>

      {/* FLECHA / LOCK */}
      <View style={{ paddingLeft: 8, alignItems: 'center', justifyContent: 'center' }}>
        {walletConnected ? (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isHovered ? roleColors.RELOJERO : colors.textMuted}
          />
        ) : (
          <View style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: 'rgba(245,158,11,0.12)',
            borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="lock-closed" size={15} color="#f59e0b" />
          </View>
        )}
      </View>
    </Pressable>
  );
}
