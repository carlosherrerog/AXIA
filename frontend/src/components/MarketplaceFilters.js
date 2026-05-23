// src/components/MarketplaceFilters.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { marketplaceStyles, colors } from '../themes/styles';

export default function MarketplaceFilters({ 
  brand, setBrand, 
  minPrice, setMinPrice, 
  maxPrice, setMaxPrice, 
  sellerType, setSellerType 
}) {
  return (
    <View style={marketplaceStyles.filterBar}>
      {/* Buscador de Marca */}
      <View style={marketplaceStyles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput 
          style={marketplaceStyles.searchInput}
          placeholder="Buscar por marca..."
          placeholderTextColor={colors.textSecondary}
          value={brand}
          onChangeText={setBrand}
        />
      </View>

      {/* Rango de Precios */}
      <View style={marketplaceStyles.priceRow}>
        <View style={[marketplaceStyles.priceInput, { marginRight: 8 }]}>
          <Text style={{color: colors.textSecondary, fontSize: 10, marginRight: 4}}>MIN</Text>
          <TextInput 
            style={marketplaceStyles.searchInput} 
            keyboardType="numeric" 
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            value={minPrice}
            onChangeText={setMinPrice}
          />
        </View>
        <View style={marketplaceStyles.priceInput}>
          <Text style={{color: colors.textSecondary, fontSize: 10, marginRight: 4}}>MAX</Text>
          <TextInput 
            style={marketplaceStyles.searchInput} 
            keyboardType="numeric" 
            placeholder="Max"
            placeholderTextColor={colors.textSecondary}
            value={maxPrice}
            onChangeText={setMaxPrice}
          />
        </View>
      </View>

      {/* Chips de tipo de vendedor */}
      <View style={marketplaceStyles.chipRow}>
        <FilterChip label="Todos" active={!sellerType} onPress={() => setSellerType(null)} />
        <FilterChip label="Dealers" active={sellerType === 'DEALER'} onPress={() => setSellerType('DEALER')} />
        <FilterChip label="Particulares" active={sellerType === 'PARTICULAR'} onPress={() => setSellerType('PARTICULAR')} />
      </View>
    </View>
  );
}

function FilterChip({ label, active, onPress }) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[marketplaceStyles.chip, active && marketplaceStyles.chipActive]}
    >
      <Text style={[marketplaceStyles.chipText, active && marketplaceStyles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}