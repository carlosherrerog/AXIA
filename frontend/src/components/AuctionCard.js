import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { watchCardStyles, roleColors } from '../themes/styles';

function formatCountdown(seconds) {
  if (seconds <= 0) return 'Finalizada';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default function AuctionCard({ auction, navigation }) {
  const { colors } = useTheme();
  const [remaining, setRemaining] = useState(auction.seconds_remaining ?? 0);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const isFinished = remaining <= 0;
  const isUrgent   = !isFinished && remaining < 3600;
  const currentBid = auction.highest_bid > 0 ? auction.highest_bid : auction.min_price;

  const timerColor  = isFinished ? colors.textMuted : isUrgent ? '#f59e0b' : colors.primaryLight;
  const timerBg     = isFinished ? colors.surface   : isUrgent ? 'rgba(245,158,11,0.12)' : `${colors.primary}15`;
  const timerBorder = isFinished ? colors.border    : isUrgent ? 'rgba(245,158,11,0.4)'  : `${colors.primary}35`;

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('AuctionScreen', { tokenId: auction.token_id })}
      activeOpacity={0.85}
      style={[watchCardStyles.card, {
        height: 380,
        flexDirection: 'column',
        borderWidth: 1.5,
        borderColor: isFinished ? colors.border : colors.primary,
        backgroundColor: isFinished ? colors.backgroundAlt : '#1a1040',
        marginRight: 0,
        ...(Platform.OS === 'web' && {
          boxShadow: isFinished ? 'none' : `0 0 16px ${colors.primary}25`,
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }),
      }]}
    >
      {/* Fila vendedor */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: roleColors.DEALER + '22',
          alignItems: 'center', justifyContent: 'center', marginRight: 6,
        }}>
          <Ionicons name="storefront" size={11} color={roleColors.DEALER} />
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', flex: 1 }} numberOfLines={1}>
          {auction.seller_name || 'Dealer'}
        </Text>
        <Ionicons name="checkmark-circle" size={16} color={roleColors.FABRICANTE} />
      </View>

      {/* Imagen con badge SUBASTA */}
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: auction.watch?.image || 'https://via.placeholder.com/210x180?text=Watch' }}
          style={watchCardStyles.image}
          resizeMode="cover"
        />
        <View style={{
          position: 'absolute', top: 8, left: 8,
          backgroundColor: isFinished ? 'rgba(0,0,0,0.6)' : colors.primary,
          paddingHorizontal: 8, paddingVertical: 3,
          borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 3,
        }}>
          <Ionicons name={isFinished ? 'ban-outline' : 'hammer-outline'} size={9} color="#FFF" />
          <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
            {isFinished ? 'FINALIZADA' : 'SUBASTA'}
          </Text>
        </View>
      </View>

      {/* Info inferior */}
      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 2, paddingBottom: 5 }}>
        <View>
          <Text style={[watchCardStyles.brandText, { color: '#FFF' }]} numberOfLines={1}>
            {auction.watch?.brand}
          </Text>
          <Text style={[watchCardStyles.modelText, { color: colors.textSecondary }]} numberOfLines={2}>
            {auction.watch?.model}
          </Text>
        </View>

        <View>
          {/* Cronómetro — visible fuera de la imagen */}
          <View style={{ marginBottom: 8 }}>
            <View style={{
              alignSelf: 'flex-start',
              backgroundColor: timerBg,
              borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
              flexDirection: 'row', alignItems: 'center', gap: 4,
              borderWidth: 1, borderColor: timerBorder,
            }}>
              <Ionicons name="timer-outline" size={11} color={timerColor} />
              <Text style={{ color: timerColor, fontSize: 11, fontWeight: '700' }}>
                {formatCountdown(remaining)}
              </Text>
            </View>
          </View>

          {/* Puja */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                {auction.highest_bid > 0 ? 'Puja actual' : 'Precio mínimo'}
              </Text>
              <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 }}>
                {currentBid.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
              </Text>
            </View>
            <View style={{
              backgroundColor: isFinished ? colors.surface : `${colors.primary}15`,
              borderRadius: 20, padding: 6,
            }}>
              <Ionicons
                name="chevron-forward-outline"
                size={14}
                color={isFinished ? colors.textMuted : colors.primary}
              />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
