// src/components/WatchSections.js (o el nombre que tenga tu archivo)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WatchCard from './WatchCard';
import PublicWatchCard from './PublicWatchCard';
import AuctionCard from './AuctionCard';
import { colors, globalStyles, userStyles } from '../themes/styles.js';

export default function WatchSections({
  myNfts,
  walletAddress,
  userRoles,
  onOpenImportModal,
  removeNFT,
  navigation,
  onRefresh,
  refreshing,
  myBids,
}) {
  const isDealer = (userRoles || []).includes('DEALER');
  const isParticular = !isDealer;
  const [activeTab, setActiveTab] = useState('collection');
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Lógica de rotación del mini-reloj
  useEffect(() => {
    if (refreshing) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    }
  }, [refreshing]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const listedNfts  = myNfts.filter(nft => nft.is_listed && !nft.is_buyer && !nft.is_auction);

  const tabs = [
    { key: 'collection', label: isDealer ? 'Stock' : 'Mi Colección' },
    { key: 'listed',     label: 'En Venta' },
    ...(isParticular ? [{ key: 'bids', label: 'Subastas' }] : []),
  ];

  return (
    <View style={{ marginBottom: 30 }}>
      {/* BARRA DE PESTAÑAS */}
      <View style={globalStyles.tabBar}>

        {/* LADO IZQUIERDO: Pestañas */}
        <View style={{ flexDirection: 'row' }}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                globalStyles.tabButton,
                activeTab === tab.key && { borderBottomWidth: 2, borderBottomColor: colors.primary }
              ]}
            >
              <Text style={[
                globalStyles.tabText,
                { color: activeTab === tab.key ? colors.primary : colors.textSecondary,
                  fontWeight: activeTab === tab.key ? 'bold' : 'normal' }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LADO DERECHO: Refresh + Importar */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          
          <TouchableOpacity
            onPress={onRefresh}
            disabled={refreshing}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 8, marginRight: 5, gap: 4 }}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons
                name="watch-outline"
                size={22}
                color={refreshing ? colors.primaryLight : colors.textSecondary}
              />
            </Animated.View>
            <Text style={{ color: refreshing ? colors.primaryLight : colors.textSecondary, fontSize: 11 }}>
              Actualizar
            </Text>
          </TouchableOpacity>

          {walletAddress && (
            <TouchableOpacity 
              onPress={onOpenImportModal} 
              style={globalStyles.importButton}
            >
              <Ionicons name="add-circle" size={20} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={globalStyles.importText}>Importar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CONTENIDO DE LAS PESTAÑAS */}
      <View style={{ paddingHorizontal: 20 }}>
        {activeTab === 'collection' && (
          myNfts.length === 0 ? (
            <View style={userStyles.emptyCard}>
              <Ionicons name="watch-outline" size={40} color={colors.border} />
              <Text style={userStyles.emptyText}>
                Aún no has importado ningún reloj.
              </Text>
            </View>
          ) : (
            <View style={globalStyles.grid}>
              {myNfts.map((nft) => (
                <View key={nft.id} style={{ width: 210, overflow: 'visible', marginTop: 12, marginLeft: 12, marginBottom: 10 }}>
                  {nft.is_auction && nft.auction_data ? (
                    <AuctionCard
                      navigation={navigation}
                      auction={{
                        token_id: nft.id,
                        highest_bid: nft.auction_data.highest_bid,
                        min_price: nft.auction_data.min_price,
                        seconds_remaining: nft.auction_data.seconds_remaining,
                        seller_name: null,
                        watch: { image: nft.image, brand: nft.brand, model: nft.model },
                      }}
                    />
                  ) : (
                    <WatchCard
                      nft={nft}
                      removeNFT={removeNFT}
                      navigation={navigation}
                      isAdminView={false}
                      isBuyer={nft.is_buyer}
                      onRefresh={onRefresh}
                      walletConnected={!!walletAddress}
                    />
                  )}
                </View>
              ))}
            </View>
          )
        )}

        {activeTab === 'listed' && (
          listedNfts.length === 0 ? (
            <View style={userStyles.emptyCard}>
              <Ionicons name="pricetag-outline" size={40} color={colors.border} />
              <Text style={userStyles.emptyText}>No tienes relojes en venta actualmente.</Text>
            </View>
          ) : (
            <View style={globalStyles.grid}>
              {listedNfts.map((nft) => (
                <View key={nft.id} style={{ width: 200, overflow: 'visible', marginTop: 12, marginLeft: 12, marginBottom: 10 }}>
                  <WatchCard
                    nft={nft}
                    removeNFT={removeNFT}
                    navigation={navigation}
                    isAdminView={false}
                    isBuyer={nft.is_buyer}
                    onRefresh={onRefresh}
                    walletConnected={!!walletAddress}
                  />
                </View>
              ))}
            </View>
          )
        )}

        {isParticular && activeTab === 'bids' && (
          (!myBids || myBids.length === 0) ? (
            <View style={userStyles.emptyCard}>
              <Ionicons name="hammer-outline" size={40} color={colors.border} />
              <Text style={userStyles.emptyText}>No estás pujando en ninguna subasta.</Text>
            </View>
          ) : (
            <View style={globalStyles.grid}>
              {myBids.map((auction) => (
                <View key={auction.token_id} style={{ width: 210, overflow: 'visible', marginTop: 12, marginLeft: 12, marginBottom: 10 }}>
                  <AuctionCard
                    navigation={navigation}
                    auction={auction}
                  />
                </View>
              ))}
            </View>
          )
        )}

      </View>
    </View>
  );
}

export function MarketplaceWatchSection({ watches, navigation }) {
  const { width } = useWindowDimensions();

  let cols = 2; 
  if (width >= 1200) cols = 5; 
  else if (width >= 960) cols = 4; 
  else if (width >= 720) cols = 3; 

  return (
    <View style={{ flex: 1, paddingTop: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 20 }}>
        <Ionicons name="globe-outline" size={22} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
          Todos los relojes en venta
        </Text>
      </View>

      <FlatList
        key={`grid-${cols}`} 
        data={watches}
        keyExtractor={(item) => (item.token_id || item.id).toString()}
        numColumns={cols} 
        columnWrapperStyle={{ 
          justifyContent: 'flex-start',
          gap: 20 
        }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 25 }}
        renderItem={({ item }) => (
          <View style={{ width: 210, marginBottom: 25 }}>
            {item.auction_data ? (
              <AuctionCard
                navigation={navigation}
                auction={{
                  token_id: item.token_id,
                  highest_bid: item.auction_data.highest_bid,
                  min_price: item.auction_data.min_price,
                  seconds_remaining: item.auction_data.seconds_remaining,
                  seller_name: item.seller_name,
                  watch: { image: item.image, brand: item.brand, model: item.model },
                }}
              />
            ) : (
              <PublicWatchCard nft={item} navigation={navigation} />
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={userStyles.emptyCard}>
            <Ionicons name="search-outline" size={40} color={colors.border} />
            <Text style={userStyles.emptyText}>
              No hay relojes públicos disponibles en este momento.
            </Text>
          </View>
        }
      />
    </View>
  );
}