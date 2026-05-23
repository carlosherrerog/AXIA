import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const TYPE_CONFIG = {
  PENDING:        { icon: 'time-outline',                 color: '#f59e0b', label: 'Pendiente'  },
  APPROVED:       { icon: 'checkmark-done-circle-outline', color: '#10b981', label: 'Aprobada'   },
  REJECTED:       { icon: 'close-circle-outline',          color: '#ef4444', label: 'Rechazada'  },
  SALE:           { icon: 'cash-outline',                  color: '#10b981', label: 'Venta'      },
  MARKET:         { icon: 'storefront-outline',            color: '#8b5cf6', label: 'Mercado'    },
  INFO:           { icon: 'information-circle-outline',    color: '#38bdf8', label: 'Aviso'      },
  SUCCESS:        { icon: 'checkmark-circle-outline',      color: '#10b981', label: 'Éxito'      },
  SECURITY:       { icon: 'alert-circle-outline',          color: '#ef4444', label: 'Seguridad'  },
  WATCH_ASSIGNED: { icon: 'gift-outline',                  color: '#a855f7', label: 'Asignado'   },
  AUCTION:        { icon: 'hammer-outline',                color: '#f59e0b', label: 'Subasta'    },
};

// SALE/SECURITY/SHIPPING/VERIFIED solo son interactivos si tienen reference_id (venta real).
// AUCTION con reference_id también navega a la venta (confirmación de entrega).
const isInteractive = (item) =>
  item.type === 'WATCH_ASSIGNED' ||
  (['SALE', 'SECURITY', 'SHIPPING', 'VERIFIED', 'AUCTION'].includes(item.type) && !!item.reference_id);

const getCTALabel = (type) => {
  if (type === 'SECURITY')       return 'Ver detalles';
  if (type === 'WATCH_ASSIGNED') return 'Importar reloj';
  if (type === 'AUCTION')        return 'Ver entrega';
  return 'Ver venta';
};

export default function NotificationCard({ item, onDelete, onAction }) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);

  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.INFO;

  const relativeDate = (dateStr) => {
    try {
      // Añadir 'Z' si no hay indicador de zona para tratar el timestamp como UTC
      const raw = item.created_at || dateStr || '';
      const normalized = raw && !/Z|[+-]\d{2}:?\d{2}$/.test(raw) ? raw + 'Z' : raw;
      const d = new Date(normalized);
      const hhmm = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const diff = Date.now() - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1)  return `Ahora mismo · ${hhmm}`;
      if (mins < 60) return `Hace ${mins} min · ${hhmm}`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24)  return `Hace ${hrs} h · ${hhmm}`;
      const days = Math.floor(hrs / 24);
      if (days < 7)  return `Hace ${days} d · ${hhmm}`;
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) + ` · ${hhmm}`;
    } catch { return item.date || ''; }
  };

  return (
    <TouchableOpacity
      onPress={() => isInteractive(item) && onAction?.(item)}
      onMouseEnter={() => Platform.OS === 'web' && setHovered(true)}
      onMouseLeave={() => Platform.OS === 'web' && setHovered(false)}
      activeOpacity={isInteractive(item) ? 0.75 : 1}
      style={{
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: hovered ? `${cfg.color}10` : colors.backgroundAlt,
        borderRadius: 14, padding: 14, marginBottom: 8,
        borderWidth: 1,
        borderColor: hovered ? `${cfg.color}50` : colors.border,
        ...(Platform.OS === 'web' && { transition: 'all 0.15s ease' }),
      }}
    >
      {/* Icono de tipo */}
      <View style={{
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: `${cfg.color}18`,
        justifyContent: 'center', alignItems: 'center',
        flexShrink: 0, marginTop: 1,
      }}>
        <Ionicons name={cfg.icon} size={19} color={cfg.color} />
      </View>

      {/* Contenido */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <View style={{
            backgroundColor: `${cfg.color}18`, borderRadius: 5,
            paddingHorizontal: 6, paddingVertical: 2,
          }}>
            <Text style={{ color: cfg.color, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
              {cfg.label.toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 11 }}>
            {relativeDate(item.date)}
          </Text>
        </View>

        <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14, marginBottom: 6 }}>
          {item.title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
          {item.message}
        </Text>

        {/* CTA para notificaciones interactivas */}
        {isInteractive(item) && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10,
            backgroundColor: `${cfg.color}15`, borderRadius: 8,
            paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start',
            borderWidth: 1, borderColor: `${cfg.color}30`,
          }}>
            <Ionicons name="checkmark-circle-outline" size={13} color={cfg.color} />
            <Text style={{ color: cfg.color, fontSize: 12, fontWeight: '700' }}>
              {getCTALabel(item.type)}
            </Text>
          </View>
        )}
      </View>

      {/* Botón eliminar */}
      <TouchableOpacity
        onPress={() => onDelete(item.id)}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        style={{
          width: 28, height: 28, borderRadius: 14,
          backgroundColor: colors.surface,
          justifyContent: 'center', alignItems: 'center',
          borderWidth: 1, borderColor: colors.border,
          flexShrink: 0,
        }}
      >
        <Ionicons name="close" size={13} color={colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
