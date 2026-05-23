import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Platform, Pressable, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import api from '../api/api';
import { useTheme } from '../context/ThemeContext';
import { roleColors, alertColors } from '../themes/styles';

// ── Datos de roles ────────────────────────────────────────────────────────────
const ROLES = [
  {
    id: 'PARTICULAR',
    label: 'Particular',
    subtitle: 'Acceso inmediato',
    description: 'Compra y vende relojes de lujo como usuario verificado. Todas tus transacciones están protegidas por escrow blockchain.',
    icon: 'person-outline',
    color: roleColors.PARTICULAR,
    requiresApproval: false,
    badge: 'GRATIS',
    badgeColor: '#10b981',
  },
  {
    id: 'DEALER',
    label: 'Joyería / Dealer',
    subtitle: 'Requiere verificación',
    description: 'Vende sin fianza ni peritaje. Crea subastas exclusivas. Ideal para joyerías y comercios especializados.',
    icon: 'storefront-outline',
    color: roleColors.DEALER,
    requiresApproval: true,
    badge: 'PRO',
    badgeColor: roleColors.DEALER,
  },
  {
    id: 'RELOJERO',
    label: 'Relojero',
    subtitle: 'Requiere verificación',
    description: 'Perita la autenticidad de relojes en ventas P2P. Recibe comisión del 2% por cada certificación completada.',
    icon: 'build-outline',
    color: roleColors.RELOJERO,
    requiresApproval: true,
    badge: 'PRO',
    badgeColor: roleColors.RELOJERO,
  },
  {
    id: 'FABRICANTE',
    label: 'Fabricante',
    subtitle: 'Requiere verificación',
    description: 'Acuña NFTs de tus relojes físicos. Recibe regalías automáticas en cada reventa. Para casas oficiales de alta relojería.',
    icon: 'business-outline',
    color: roleColors.FABRICANTE,
    requiresApproval: true,
    badge: 'ENTERPRISE',
    badgeColor: roleColors.FABRICANTE,
  },
];

// ── Tarjeta de rol ─────────────────────────────────────────────────────────────
function RoleCard({ role, isSelected, onPress, colors }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        {
          borderRadius: 18,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? role.color : hovered ? `${role.color}60` : colors.border,
          backgroundColor: isSelected
            ? `${role.color}12`
            : hovered ? `${role.color}08` : colors.backgroundAlt,
          padding: 18,
          marginBottom: 12,
          ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            ...(isSelected && { boxShadow: `0 0 0 3px ${role.color}25, 0 8px 24px ${role.color}20` }),
            ...(!isSelected && hovered && { boxShadow: `0 4px 16px ${role.color}15` }),
          }),
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Icono */}
        <View style={{
          width: 48, height: 48, borderRadius: 14,
          backgroundColor: `${role.color}18`,
          justifyContent: 'center', alignItems: 'center',
          marginRight: 14,
          borderWidth: 1, borderColor: `${role.color}30`,
        }}>
          <Ionicons name={role.icon} size={22} color={role.color} />
        </View>

        {/* Texto */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
              {role.label}
            </Text>
            <View style={{
              backgroundColor: `${role.badgeColor}20`,
              borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
              borderWidth: 1, borderColor: `${role.badgeColor}40`,
            }}>
              <Text style={{ color: role.badgeColor, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>
                {role.badge}
              </Text>
            </View>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17 }}>
            {role.description}
          </Text>
        </View>

        {/* Check / Arrow */}
        <View style={{
          width: 26, height: 26, borderRadius: 13,
          borderWidth: 2,
          borderColor: isSelected ? role.color : colors.border,
          backgroundColor: isSelected ? role.color : 'transparent',
          justifyContent: 'center', alignItems: 'center',
          marginLeft: 12,
        }}>
          {isSelected
            ? <Ionicons name="checkmark" size={14} color="#fff" />
            : <Ionicons name="chevron-forward" size={12} color={colors.textSecondary} />
          }
        </View>
      </View>

      {/* Nota de aprobación */}
      {role.requiresApproval && (
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          marginTop: 10, paddingTop: 10,
          borderTopWidth: 1, borderTopColor: `${role.color}20`,
          gap: 6,
        }}>
          <Ionicons name="shield-checkmark-outline" size={13} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            Verificación requerida · Aprobación del administrador
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ── Pantalla principal ─────────────────────────────────────────────────────────
export default function RoleSelectionScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const initialUser = route?.params?.user || null;
  const hasPendingRole = initialUser?.requested_role && !initialUser?.roles?.includes(initialUser.requested_role);

  const [step, setStep] = useState(hasPendingRole ? 'pending' : 'select');
  const [selectedRole, setSelectedRole] = useState(
    hasPendingRole ? ROLES.find(r => r.id === initialUser.requested_role) : null
  );
  const [requestMessage, setRequestMessage] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'error' });
  const showAlert = (title, message, type = 'error') => setAlert({ visible: true, title, message, type });

  // ── Seleccionar PARTICULAR (acceso inmediato) ──────────────────────────────
  const handleSelectParticular = async () => {
    setLoading(true);
    try {
      await api.post('/users/request-role', { role: 'PARTICULAR', message: '' });
    } catch (e) {
      // Si ya tiene el rol o da error, igual avanzamos
    } finally {
      setLoading(false);
      navigation.replace('UserDashboard');
    }
  };

  // ── Confirmar selección y avanzar al formulario ────────────────────────────
  const handleContinue = () => {
    if (!selectedRole) return;
    if (selectedRole.id === 'PARTICULAR') {
      handleSelectParticular();
      return;
    }
    setStep('form');
  };

  // ── Simular adjunto de archivo ─────────────────────────────────────────────
  const handleAttachFile = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.jpg,.jpeg,.png';
      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) setAttachedFileName(file.name);
      };
      input.click();
    } else {
      setAttachedFileName('documento_acreditativo.pdf');
    }
  };

  // ── Enviar solicitud profesional ───────────────────────────────────────────
  const handleSubmitRequest = async () => {
    if (!requestMessage.trim()) {
      showAlert('Campo requerido', 'Por favor describe tu actividad profesional.', 'warning');
      return;
    }
    setLoading(true);
    try {
      await api.post('/users/request-role', {
        role: selectedRole.id,
        message: requestMessage.trim(),
      });
      setStep('pending');
    } catch (e) {
      const msg = e.response?.data?.detail || 'No se pudo enviar la solicitud.';
      showAlert('Error', String(msg), 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Comprobar si el admin ya aprobó ───────────────────────────────────────
  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await api.get('/users/me');
      const user = res.data;
      if (user.roles?.includes('RELOJERO')) {
        navigation.replace('WatchmakerDashboard', { user });
      } else if (user.roles?.includes('FABRICANTE')) {
        navigation.replace('ManufacturerDashboard', { user });
      } else if (user.roles?.includes('DEALER') || user.roles?.includes('PARTICULAR')) {
        navigation.replace('UserDashboard', { user });
      } else {
        showAlert('Pendiente', 'Tu solicitud aún está en revisión. Recibirás una notificación cuando sea aprobada.', 'info');
      }
    } catch {
      showAlert('Error', 'No se pudo comprobar el estado.', 'error');
    } finally {
      setCheckingStatus(false);
    }
  };

  // ── Cerrar sesión ──────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.clear();
      } else {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('userData');
      }
    } catch {}
    navigation.replace('Login');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const bgColor = colors.background;
  const cardBg = colors.backgroundAlt;

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Header decorativo */}
      <View style={{
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 24,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: cardBg,
        ...(Platform.OS === 'web' && isDark && {
          background: 'linear-gradient(135deg, #13111c 0%, #1a1330 100%)',
        }),
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Text style={{
            fontSize: 26, fontWeight: '900', letterSpacing: 4,
            color: colors.primary,
          }}>
            AXIA
          </Text>
          <View style={{
            backgroundColor: `${colors.primary}20`, borderRadius: 8,
            paddingHorizontal: 8, paddingVertical: 3,
            borderWidth: 1, borderColor: `${colors.primary}40`,
          }}>
            <Text style={{ color: colors.primaryLight, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
              WEB3 · LUXURY
            </Text>
          </View>
        </View>

        {step === 'select' && (
          <>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 4 }}>
              Elige tu perfil
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
              Define cómo participarás en el ecosistema AXIA. Puedes cambiar tu perfil más adelante con aprobación del administrador.
            </Text>
          </>
        )}

        {step === 'form' && (
          <>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 4 }}>
              Solicitud profesional
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              Completa el formulario de acreditación para{' '}
              <Text style={{ color: selectedRole?.color, fontWeight: '600' }}>
                {selectedRole?.label}
              </Text>
            </Text>
          </>
        )}

        {step === 'pending' && (
          <>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 4 }}>
              Solicitud enviada
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              Tu perfil de{' '}
              <Text style={{ color: selectedRole?.color, fontWeight: '600' }}>
                {selectedRole?.label}
              </Text>{' '}
              está siendo verificado.
            </Text>
          </>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100, maxWidth: 520, alignSelf: 'center', width: '100%' }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── STEP 1: SELECCIÓN DE ROL ──────────────────────────────────── */}
        {step === 'select' && (
          <>
            {ROLES.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                isSelected={selectedRole?.id === role.id}
                onPress={() => setSelectedRole(role)}
                colors={colors}
              />
            ))}

            <TouchableOpacity
              onPress={handleContinue}
              disabled={!selectedRole || loading}
              style={{
                backgroundColor: selectedRole ? colors.primary : colors.surface,
                borderRadius: 14, paddingVertical: 15,
                alignItems: 'center', marginTop: 8,
                opacity: selectedRole ? 1 : 0.5,
                ...(Platform.OS === 'web' && { cursor: selectedRole ? 'pointer' : 'default' }),
                shadowColor: colors.primary,
                shadowOpacity: selectedRole ? 0.4 : 0,
                shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
              }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
                      {selectedRole?.id === 'PARTICULAR' ? 'Acceder a AXIA' : 'Continuar'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                )
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} style={{ marginTop: 16, alignSelf: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 2: FORMULARIO PROFESIONAL ───────────────────────────── */}
        {step === 'form' && (
          <>
            {/* Resumen del rol elegido */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: `${selectedRole.color}10`,
              borderRadius: 14, padding: 14, marginBottom: 20,
              borderWidth: 1, borderColor: `${selectedRole.color}30`,
            }}>
              <View style={{
                width: 42, height: 42, borderRadius: 12,
                backgroundColor: `${selectedRole.color}20`,
                justifyContent: 'center', alignItems: 'center', marginRight: 12,
              }}>
                <Ionicons name={selectedRole.icon} size={20} color={selectedRole.color} />
              </View>
              <View>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
                  {selectedRole.label}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  Pendiente de verificación del administrador
                </Text>
              </View>
            </View>

            {/* Área de texto */}
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14, marginBottom: 8 }}>
              Describe tu actividad profesional *
            </Text>
            <TextInput
              multiline
              numberOfLines={5}
              placeholder="Explica brevemente tu empresa, experiencia en relojería, certificaciones o cualquier información relevante para la verificación..."
              placeholderTextColor={colors.textMuted}
              value={requestMessage}
              onChangeText={setRequestMessage}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14, padding: 14,
                borderWidth: 1, borderColor: colors.border,
                color: colors.text, fontSize: 14,
                textAlignVertical: 'top', minHeight: 120,
                marginBottom: 20,
                ...(Platform.OS === 'web' && { outlineStyle: 'none', resize: 'none' }),
              }}
            />

            {/* Adjunto simulado */}
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14, marginBottom: 8 }}>
              Documentación acreditativa
            </Text>
            <TouchableOpacity
              onPress={handleAttachFile}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: colors.surface,
                borderRadius: 12, padding: 14, marginBottom: 6,
                borderWidth: 1,
                borderColor: attachedFileName ? colors.primary : colors.border,
                borderStyle: attachedFileName ? 'solid' : 'dashed',
              }}
            >
              <Ionicons
                name={attachedFileName ? 'document-text' : 'cloud-upload-outline'}
                size={22}
                color={attachedFileName ? colors.primary : colors.textSecondary}
              />
              <View style={{ flex: 1 }}>
                {attachedFileName ? (
                  <>
                    <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
                      {attachedFileName}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                      Archivo adjuntado
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
                      Adjuntar documentos
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      PDF, JPG o PNG · CIF, licencia de comercio, etc.
                    </Text>
                  </>
                )}
              </View>
              {attachedFileName && (
                <TouchableOpacity onPress={() => setAttachedFileName('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 24 }}>
              Los documentos son revisados de forma confidencial y no se almacenan en blockchain.
            </Text>

            {/* Botones */}
            <TouchableOpacity
              onPress={handleSubmitRequest}
              disabled={loading}
              style={{
                backgroundColor: selectedRole.color,
                borderRadius: 14, paddingVertical: 15,
                alignItems: 'center', marginBottom: 12,
                shadowColor: selectedRole.color,
                shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
              }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="send-outline" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                      Enviar solicitud
                    </Text>
                  </View>
                )
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStep('select')}
              style={{ alignItems: 'center', paddingVertical: 12 }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                ← Volver a seleccionar perfil
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 3: ESPERANDO APROBACIÓN ─────────────────────────────── */}
        {step === 'pending' && (
          <View style={{ alignItems: 'center', paddingTop: 20 }}>
            {/* Animación / icono */}
            <View style={{
              width: 90, height: 90, borderRadius: 45,
              backgroundColor: `${selectedRole?.color || colors.primary}15`,
              justifyContent: 'center', alignItems: 'center',
              borderWidth: 2, borderColor: `${selectedRole?.color || colors.primary}40`,
              marginBottom: 24,
            }}>
              <Ionicons name="hourglass-outline" size={44} color={selectedRole?.color || colors.primary} />
            </View>

            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 10 }}>
              Solicitud en revisión
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 340, marginBottom: 32 }}>
              El equipo de AXIA está verificando tu solicitud de perfil{' '}
              <Text style={{ color: selectedRole?.color, fontWeight: '600' }}>
                {selectedRole?.label}
              </Text>
              . Recibirás una notificación por email cuando sea aprobada.
            </Text>

            {/* Pasos del proceso */}
            {[
              { icon: 'checkmark-circle', label: 'Solicitud recibida', done: true },
              { icon: 'time-outline', label: 'Revisión de documentos', done: false },
              { icon: 'shield-checkmark-outline', label: 'Aprobación del administrador', done: false },
              { icon: 'rocket-outline', label: 'Acceso a tu panel profesional', done: false },
            ].map((s, i) => (
              <View key={i} style={{
                flexDirection: 'row', alignItems: 'center',
                width: '100%', paddingVertical: 10,
                borderBottomWidth: i < 3 ? 1 : 0,
                borderBottomColor: colors.border,
              }}>
                <Ionicons
                  name={s.icon}
                  size={20}
                  color={s.done ? '#10b981' : colors.textMuted}
                  style={{ marginRight: 12 }}
                />
                <Text style={{ color: s.done ? colors.text : colors.textMuted, fontSize: 14, flex: 1 }}>
                  {s.label}
                </Text>
                {s.done && <Ionicons name="checkmark" size={16} color="#10b981" />}
              </View>
            ))}

            {/* Botones de acción */}
            <TouchableOpacity
              onPress={handleCheckStatus}
              disabled={checkingStatus}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: colors.primary,
                borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24,
                marginTop: 32, alignSelf: 'stretch',
                shadowColor: colors.primary, shadowOpacity: 0.4,
                shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
              }}
            >
              {checkingStatus
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <Ionicons name="refresh-outline" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'center' }}>
                      Comprobar estado
                    </Text>
                  </>
                )
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                borderWidth: 1, borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24,
                marginTop: 10, alignSelf: 'stretch',
              }}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 15, fontWeight: '600', flex: 1, textAlign: 'center' }}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal de alertas */}
      <Modal visible={alert.visible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            backgroundColor: colors.backgroundAlt, borderRadius: 20,
            padding: 28, width: '85%', maxWidth: 340,
            alignItems: 'center', borderWidth: 1, borderColor: colors.border,
          }}>
            <Ionicons
              name={alert.type === 'success' ? 'checkmark-circle' : alert.type === 'warning' ? 'warning' : alert.type === 'info' ? 'information-circle' : 'alert-circle'}
              size={52}
              color={alert.type === 'success' ? alertColors.success : alert.type === 'warning' ? alertColors.warning : alert.type === 'info' ? alertColors.info : alertColors.error}
            />
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 14, marginBottom: 8, textAlign: 'center' }}>
              {alert.title}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 22 }}>
              {alert.message}
            </Text>
            <TouchableOpacity
              onPress={() => setAlert(a => ({ ...a, visible: false }))}
              style={{
                backgroundColor: colors.primary, borderRadius: 12,
                paddingVertical: 12, width: '100%', alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
