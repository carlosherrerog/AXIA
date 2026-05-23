import React, { useState } from 'react';
import { View, Text, Pressable, Platform, TouchableOpacity } from 'react-native';
import { adminStyles, roleColors } from '../themes/styles';

export default function AdminUserRow({ user, roleType, isManagement, onRevoke }) {
  const [isHovered, setIsHovered] = useState(false);

  const renderRoleBadge = (role) => (
    <View key={role} style={[adminStyles.roleBadge, { backgroundColor: roleColors[role] || '#333' }]}>
      <Text style={adminStyles.roleBadgeText}>{role}</Text>
    </View>
  );

  return (
    <Pressable
      onHoverIn={Platform.OS === 'web' ? () => setIsHovered(true) : null}
      onHoverOut={Platform.OS === 'web' ? () => setIsHovered(false) : null}
      style={[
        adminStyles.userRowHover,
        {
          backgroundColor: isHovered ? '#f8f9fa' : 'transparent',
          transform: [{ scale: isHovered ? 1.01 : 1 }],
          transition: Platform.OS === 'web' ? 'all 0.2s ease' : undefined,
        }
      ]}
    >
      <View style={adminStyles.userInfo}>
        <Text style={adminStyles.userName}>{user.username}</Text>
        <Text style={adminStyles.userSubtext}>
          {isManagement ? user.email : new Date(user.created_at).toLocaleDateString()}
        </Text>
      </View>

      {isManagement ? (
        <TouchableOpacity onPress={() => onRevoke(user, roleType)} style={adminStyles.revokeBtn}>
          <Text style={adminStyles.revokeBtnText}>Revocar</Text>
        </TouchableOpacity>
      ) : (
        <View style={adminStyles.roleBadgeRow}>
          {user.is_admin ? (
            renderRoleBadge('ADMIN')
          ) : user.roles.length > 0 ? (
            user.roles.map((r) => renderRoleBadge(r))
          ) : (
            renderRoleBadge('PARTICULAR')
          )}
        </View>
      )}
    </Pressable>
  );
}