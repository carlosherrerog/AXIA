import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, ScrollView, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/api';
import GlobalHeader from '../components/GlobalHeader';
import PublicWatchCard from '../components/PublicWatchCard';
import { useTheme } from '../context/ThemeContext';

const BRANDS = ['Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'IWC', 'Cartier', 'Breitling', 'TAG Heuer', 'Hublot', 'Panerai'];

const SELLER_TYPES = [
  { label: 'Todos',      value: null       },
  { label: 'Joyería',    value: 'DEALER'   },
  { label: 'Particular', value: 'PARTICULAR' },
];

export default function SearchScreen({ navigation }) {
  const { colors } = useTheme();

  const [loggedUser, setLoggedUser] = useState(null);
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searched, setSearched]     = useState(false);

  // Filtros
  const [sellerType, setSellerType] = useState(null);
  const [minPrice, setMinPrice]     = useState('');
  const [maxPrice, setMaxPrice]     = useState('');
  const [selBrand, setSelBrand]     = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const debounceTimer = useRef(null);

  useFocusEffect(useCallback(() => {
    api.get('/users/me').then(r => setLoggedUser(r.data)).catch(() => {});
  }, []));

  const doSearch = useCallback(async (overrideQuery) => {
    const q = overrideQuery !== undefined ? overrideQuery : query;
    setLoading(true);
    setSearched(true);
    try {
      const params = {};
      if (q.trim())   params.brand = q.trim();
      if (selBrand)   params.brand = selBrand;
      if (sellerType) params.seller_type = sellerType;
      if (minPrice)   params.min_price = parseInt(minPrice, 10);
      if (maxPrice)   params.max_price = parseInt(maxPrice, 10);

      const res = await api.get('/marketplace', { params });
      setResults(res.data);
    } catch (e) {
      console.error('Error buscando:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query, selBrand, sellerType, minPrice, maxPrice]);

  const handleQueryChange = (text) => {
    setQuery(text);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => doSearch(text), 500);
  };

  const handleApplyFilters = () => { setShowFilters(false); doSearch(); };

  const handleClearFilters = () => {
    setSellerType(null); setMinPrice(''); setMaxPrice(''); setSelBrand(null);
  };

  const activeFiltersCount = [sellerType, selBrand, minPrice, maxPrice].filter(Boolean).length;

  const inputBase = {
    flex: 1, backgroundColor: colors.backgroundAlt, color: colors.text,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, borderWidth: 1, borderColor: colors.border,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GlobalHeader
        loggedUser={loggedUser}
        navigation={navigation}
        title="Buscar"
        onWalletChange={setLoggedUser}
      />

      <View style={{ flex: 1, paddingHorizontal: 16 }}>

        {/* ── BARRA DE BÚSQUEDA ─────────────────────────────────────────── */}
        <View style={{ marginTop: 16, marginBottom: 12 }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
            Buscar relojes
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{
              flex: 1, flexDirection: 'row', alignItems: 'center',
              backgroundColor: colors.surface, borderRadius: 14,
              borderWidth: 1, borderColor: colors.border,
              paddingHorizontal: 12,
            }}>
              <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                value={query}
                onChangeText={handleQueryChange}
                placeholder="Marca o modelo..."
                placeholderTextColor={colors.textMuted}
                style={{
                  flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12,
                  ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
                }}
                returnKeyType="search"
                onSubmitEditing={() => doSearch()}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => { setQuery(''); doSearch(''); }}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              style={{
                backgroundColor: activeFiltersCount > 0 ? colors.primary : colors.surface,
                borderRadius: 14, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center',
                borderWidth: 1, borderColor: activeFiltersCount > 0 ? colors.primary : colors.border,
                flexDirection: 'row', gap: 4,
              }}
            >
              <Ionicons name="options-outline" size={18} color={activeFiltersCount > 0 ? '#FFF' : colors.textSecondary} />
              {activeFiltersCount > 0 && (
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>{activeFiltersCount}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* PANEL DE FILTROS */}
        {showFilters && (
          <View style={{
            backgroundColor: colors.surface, borderRadius: 16,
            borderWidth: 1, borderColor: colors.border,
            padding: 16, marginBottom: 14,
          }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8, fontWeight: '600', letterSpacing: 0.5 }}>
              TIPO DE VENDEDOR
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {SELLER_TYPES.map(opt => (
                <TouchableOpacity
                  key={String(opt.value)}
                  onPress={() => setSellerType(opt.value)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                    backgroundColor: sellerType === opt.value ? colors.primary : colors.backgroundAlt,
                    borderWidth: 1, borderColor: sellerType === opt.value ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: sellerType === opt.value ? '#FFF' : colors.textSecondary, fontSize: 13 }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8, fontWeight: '600', letterSpacing: 0.5 }}>
              RANGO DE PRECIO (USDC)
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <TextInput
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
                placeholder="Mínimo"
                placeholderTextColor={colors.textMuted}
                style={inputBase}
              />
              <TextInput
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
                placeholder="Máximo"
                placeholderTextColor={colors.textMuted}
                style={inputBase}
              />
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8, fontWeight: '600', letterSpacing: 0.5 }}>
              MARCA
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setSelBrand(null)}
                style={{
                  marginRight: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                  backgroundColor: selBrand === null ? colors.primary : colors.backgroundAlt,
                  borderWidth: 1, borderColor: selBrand === null ? colors.primary : colors.border,
                }}
              >
                <Text style={{ color: selBrand === null ? '#FFF' : colors.textSecondary, fontSize: 12 }}>Todas</Text>
              </TouchableOpacity>
              {BRANDS.map(b => (
                <TouchableOpacity
                  key={b}
                  onPress={() => setSelBrand(b === selBrand ? null : b)}
                  style={{
                    marginRight: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                    backgroundColor: selBrand === b ? colors.primary : colors.backgroundAlt,
                    borderWidth: 1, borderColor: selBrand === b ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: selBrand === b ? '#FFF' : colors.textSecondary, fontSize: 12 }}>{b}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={handleClearFilters}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 24, alignItems: 'center',
                  backgroundColor: colors.backgroundAlt, borderWidth: 1, borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApplyFilters}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 24, alignItems: 'center', backgroundColor: colors.primary }}
              >
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* RESULTADOS  */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !searched ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="search-circle-outline" size={72} color={colors.border} />
            <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 16, textAlign: 'center' }}>
              Busca relojes por marca, modelo{'\n'}o filtra por precio y tipo de vendedor
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="sad-outline" size={72} color={colors.border} />
            <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 16 }}>
              No se encontraron resultados
            </Text>
            <TouchableOpacity onPress={handleClearFilters} style={{ marginTop: 12 }}>
              <Text style={{ color: colors.primaryLight, fontSize: 14 }}>Limpiar filtros</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
              {results.length} resultado{results.length !== 1 ? 's' : ''}
            </Text>
            <FlatList
              data={results}
              keyExtractor={item => String(item.token_id)}
              numColumns={2}
              columnWrapperStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <View style={{ flex: 1 }}>
                  <PublicWatchCard nft={item} navigation={navigation} />
                </View>
              )}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); doSearch(); }} tintColor={colors.primary} />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          </>
        )}
      </View>
    </View>
  );
}
