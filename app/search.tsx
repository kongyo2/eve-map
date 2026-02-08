import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSystemSearch, type SearchResult } from '../src/hooks/useSystemSearch';
import { useMapStore } from '../src/store/mapStore';
import { theme, securityColor } from '../src/constants/colors';
import { STRINGS } from '../src/constants/strings';
import { formatSecurity } from '../src/utils/security';

const typeLabel = (type: SearchResult['type']): string => {
  switch (type) {
    case 'system':
      return 'SYS';
    case 'constellation':
      return 'CST';
    case 'region':
      return 'RGN';
  }
};

const typeLabelColor = (type: SearchResult['type']): string => {
  switch (type) {
    case 'system':
      return theme.accent;
    case 'constellation':
      return theme.textSecondary;
    case 'region':
      return '#9c7cff';
  }
};

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const results = useSystemSearch(query);
  const router = useRouter();
  const selectSystem = useMapStore((s) => s.selectSystem);
  const setRouteOrigin = useMapStore((s) => s.setRouteOrigin);
  const setRouteDestination = useMapStore((s) => s.setRouteDestination);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (result.type === 'system') {
        selectSystem(result.id);
      }
      router.back();
    },
    [selectSystem, router],
  );

  const renderItem = useCallback(
    ({ item }: { item: SearchResult }) => {
      const secColor =
        item.securityStatus !== undefined ? securityColor(item.securityStatus) : theme.textDim;

      return (
        <TouchableOpacity
          style={styles.resultItem}
          onPress={() => handleSelect(item)}
          activeOpacity={0.6}
        >
          <View style={styles.resultLeft}>
            {/* Type badge */}
            <View style={[styles.typeBadge, { borderColor: typeLabelColor(item.type) }]}>
              <Text style={[styles.typeText, { color: typeLabelColor(item.type) }]}>
                {typeLabel(item.type)}
              </Text>
            </View>

            {/* Name and breadcrumb */}
            <View style={styles.resultInfo}>
              <View style={styles.nameRow}>
                {item.type === 'system' && (
                  <View style={[styles.secDot, { backgroundColor: secColor }]} />
                )}
                <Text style={styles.resultName}>{item.name}</Text>
                {item.securityStatus !== undefined && (
                  <Text style={[styles.secText, { color: secColor }]}>
                    {formatSecurity(item.securityStatus)}
                  </Text>
                )}
              </View>
              {(item.regionName || item.constellationName) && (
                <Text style={styles.breadcrumb} numberOfLines={1}>
                  {[item.regionName, item.constellationName].filter(Boolean).join(' > ')}
                </Text>
              )}
            </View>
          </View>

          {/* Route action buttons */}
          {item.type === 'system' && (
            <View style={styles.routeActions}>
              <TouchableOpacity
                style={styles.miniAction}
                onPress={() => {
                  setRouteOrigin(item.id);
                  router.back();
                }}
              >
                <View style={[styles.miniDot, { backgroundColor: theme.accent }]} />
                <Text style={styles.miniActionText}>{STRINGS.routeFromShort}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.miniAction}
                onPress={() => {
                  setRouteDestination(item.id);
                  router.back();
                }}
              >
                <View style={[styles.miniDot, { backgroundColor: theme.route }]} />
                <Text style={[styles.miniActionText, { color: theme.route }]}>
                  {STRINGS.routeToShort}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [handleSelect, setRouteOrigin, setRouteDestination, router],
  );

  return (
    <View style={styles.container}>
      {/* Search input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Text style={styles.searchIcon}>&#x2315;</Text>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder={STRINGS.searchPlaceholder}
            placeholderTextColor={theme.textDim}
            autoFocus
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearInput}>
              <Text style={styles.clearInputText}>x</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {query.length < 2 ? (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>{STRINGS.searchHint}</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>{STRINGS.noResults}</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    color: theme.textDim,
    fontSize: 18,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
    fontWeight: '300',
    paddingVertical: 12,
    letterSpacing: 0.5,
  },
  clearInput: {
    padding: 4,
  },
  clearInputText: {
    color: theme.textDim,
    fontSize: 14,
    fontWeight: '300',
  },
  hintContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    color: theme.textDim,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.border}66`,
  },
  resultLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 10,
    minWidth: 32,
    alignItems: 'center',
  },
  typeText: {
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 1,
  },
  resultInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  resultName: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.5,
    marginRight: 6,
  },
  secText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  breadcrumb: {
    color: theme.textDim,
    fontSize: 10,
    fontWeight: '300',
    marginTop: 2,
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  routeActions: {
    flexDirection: 'row',
    gap: 6,
  },
  miniAction: {
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  miniDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  miniActionText: {
    color: theme.accent,
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
