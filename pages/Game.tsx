import React, { useMemo, useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  Pressable,
  Text,
  TextInput,
  Image,
  ImageBackground,
  ActivityIndicator,
  ScrollView,
  Linking,
  useWindowDimensions,
  Modal,
  Platform,
} from 'react-native';
import { Animated, Easing, StatusBar } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Player from '../components/Player';
import {
  fetchCardImageByName,
  fetchCardsByName,
  fetchRulings,
  MtgCard,
  MtgRuling,
} from '../api/mtg';
import BANNED_COMMANDER from '../data/commander-banlist';
import BANNED_PAUPER from '../data/pauper-banlist';
import BANNED_PIONEER from '../data/pioneer-banlist';
import BANNED_BRAWL from '../data/brawl-banlist';
import BANNED_STANDARD from '../data/standard-banlist';
import BANNED_MODERN from '../data/moder-banlist';
import BANNED_LEGACY from '../data/legacy-banlist';

type GameProps = {
  count: number; // 1..6
  startingLife?: 20 | 30 | 40;
  onBack: () => void;
  onUpdate?: (count: number, startingLife: 20 | 30 | 40) => void;
};

export default function Game({ count, startingLife = 20, onBack, onUpdate }: GameProps) {
  const capped = Math.max(1, Math.min(6, count));
  const topCount = Math.ceil(capped / 2);
  const bottomCount = capped - topCount;

  const palette = useMemo(
    () => ['#1e40af', '#b91c1c', '#0f766e', '#7e22ce', '#b45309', '#2563eb'],
    [],
  );
  const playersMeta = useMemo(
    () =>
      Array.from({ length: capped }, (_, i) => ({
        name: `Player ${i + 1}`,
        color: palette[i % palette.length],
      })),
    [capped, palette],
  );

  const size = useMemo(() => {
    if (capped >= 5) return 'small';
    if (capped >= 3) return 'medium';
    return 'large';
  }, [capped]) as 'small' | 'medium' | 'large';

  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingPlayers, setPendingPlayers] = useState<number>(capped);
  const [pendingLife, setPendingLife] = useState<20 | 30 | 40>(startingLife);
  const [resetTick, setResetTick] = useState(0);
  const [activeTab, setActiveTab] = useState<'counter' | 'other' | 'banlist'>('counter');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchUrl, setSearchUrl] = useState<string | undefined>(undefined);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | undefined>(undefined);
  const [results, setResults] = useState<MtgCard[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [rulings, setRulings] = useState<MtgRuling[]>([]);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isDesktop = Platform.OS === 'web' && width >= 900;
  const desktopContainerW = isDesktop ? Math.floor(width * 0.9) : 0;
  const desktopItemW = isDesktop ? Math.floor(desktopContainerW * 0.19) : 0; // ~19% del contenedor
  const desktopImgW = isDesktop ? Math.max(120, desktopItemW - 12) : 0;
  const desktopImgH = isDesktop ? Math.round(desktopImgW / 0.716) : 0;
  const desktopGridWidth = isDesktop ? Math.floor(width * 0.9) : undefined;
  const [banFormat, setBanFormat] = useState<
    'commander' | 'pauper' | 'pioneer' | 'brawl' | 'standard' | 'modern' | 'legacy'
  >('commander');
  const visibleBanlist = React.useMemo(() => {
    switch (banFormat) {
      case 'pauper':
        return BANNED_PAUPER;
      case 'pioneer':
        return BANNED_PIONEER;
      case 'brawl':
        return BANNED_BRAWL;
      case 'standard':
        return BANNED_STANDARD;
      case 'modern':
        return BANNED_MODERN;
      case 'legacy':
        return BANNED_LEGACY;
      case 'commander':
      default:
        return BANNED_COMMANDER;
    }
  }, [banFormat]);
  const banLabel = React.useMemo(() => {
    switch (banFormat) {
      case 'pauper':
        return 'Pauper';
      case 'pioneer':
        return 'Pioneer';
      case 'brawl':
        return 'Brawl';
      case 'standard':
        return 'Standard';
      case 'modern':
        return 'Modern';
      case 'legacy':
        return 'Legacy';
      default:
        return 'Commander';
    }
  }, [banFormat]);
  const [banHorizontal, setBanHorizontal] = useState(false);
  const [banImages, setBanImages] = useState<Record<string, string | undefined>>({});
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [zoomName, setZoomName] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);
  const [diceValue, setDiceValue] = useState<number>(20);
  const diceAnim = React.useRef(new Animated.Value(0)).current;
  const [spotlightIdx, setSpotlightIdx] = useState<number | null>(null);
  const [spotlightFinal, setSpotlightFinal] = useState(false);
  const [spotlightTrigger, setSpotlightTrigger] = useState(0);

  useEffect(() => {
    if (activeTab !== 'banlist') return;
    const controller = new AbortController();
    (async () => {
      const missing = visibleBanlist.filter((n) => !(n in banImages));
      if (!missing.length) return;
      try {
        const results = await Promise.all(
          missing.map(async (name) => ({
            name,
            url: await fetchCardImageByName(name, controller.signal),
          })),
        );
        setBanImages((prev) => {
          const next = { ...prev } as Record<string, string | undefined>;
          for (const r of results) next[r.name] = r.url;
          return next;
        });
      } catch {}
    })();
    return () => controller.abort();
  }, [activeTab, visibleBanlist]);

  // No network or cache for banlist; we render the static data

  function selectCard(idx: number) {
    setSelectedIdx(idx);
    const card = results[idx];
    setSearchUrl(card?.imageUrl);
    setRulings([]);
    if (card?.id) {
      fetchRulings(card.id)
        .then(setRulings)
        .catch(() => setRulings([]));
    }
  }

  React.useEffect(() => {
    if (activeTab !== 'other') return;
    const q = searchQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setSelectedIdx(null);
      setSearchUrl(undefined);
      setRulings([]);
      return;
    }
    let alive = true;
    setSearchLoading(true);
    setSearchError(undefined);
    const t = setTimeout(async () => {
      try {
        const cards = await fetchCardsByName(q);
        if (!alive) return;
        setResults(cards);
        if (cards.length) {
          selectCard(0);
        } else {
          setSelectedIdx(null);
          setSearchUrl(undefined);
        }
      } catch (e) {
        if (!alive) return;
        setSearchError('Error searching card');
      } finally {
        if (alive) setSearchLoading(false);
      }
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [searchQuery, activeTab]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const doc: any = (globalThis as any).document;
    if (!doc) return;
    const onChange = () => setIsFullscreen(!!doc.fullscreenElement);
    try {
      doc.addEventListener('fullscreenchange', onChange);
    } catch {}
    return () => {
      try { doc.removeEventListener('fullscreenchange', onChange); } catch {}
    };
  }, []);

  // Auto-native fullscreen: hide system UI on mobile when in counters
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const toggle = async (on: boolean) => {
      try { StatusBar.setHidden(on, 'fade'); } catch {}
      if (Platform.OS === 'android') {
        try {
          const NavigationBar = require('expo-navigation-bar');
          if (on) {
            await NavigationBar.setVisibilityAsync('hidden');
            await NavigationBar.setBehaviorAsync('overlay-swipe');
          } else {
            await NavigationBar.setVisibilityAsync('visible');
            await NavigationBar.setBehaviorAsync('inset-swipe');
          }
        } catch {}
      }
      setIsNativeFullscreen(on);
    };
    toggle(activeTab === 'counter');
    return () => { toggle(false); };
  }, [activeTab]);

  // Spotlight effect on game start: randomly highlight players for ~3s,
  // at least 8 switches if players >= 3, then settle on one.
  useEffect(() => {
    if (activeTab !== 'counter') return;
    const total = Math.max(1, Math.min(6, capped));
    if (total <= 0) return;
    const minSteps = total >= 3 ? 8 : 4;
    const duration = 3000;
    const stepInterval = 150;
    const steps = Math.max(minSteps, Math.floor(duration / stepInterval));
    let count = 0;
    let prev = -1;
    setSpotlightFinal(false);
    const id = setInterval(() => {
      let idx = prev;
      for (let safe = 0; safe < 10 && total > 1; safe++) {
        idx = Math.floor(Math.random() * total);
        if (idx !== prev) break;
      }
      prev = idx;
      setSpotlightIdx(idx);
      count++;
      if (count >= steps) {
        clearInterval(id);
        // mark final selection, keep highlighted
        setSpotlightFinal(true);
      }
    }, stepInterval);
    return () => clearInterval(id);
  }, [activeTab, capped, spotlightTrigger]);

  function rollD20() {
    const duration = 1200;
    // Shuffle numbers during spin
    const tick = 60;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += tick;
      setDiceValue(Math.floor(Math.random() * 20) + 1);
      if (elapsed >= duration) {
        clearInterval(timer);
        // land on a final value
        setDiceValue(Math.floor(Math.random() * 20) + 1);
      }
    }, tick);
    diceAnim.setValue(0);
    Animated.timing(diceAnim, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      diceAnim.setValue(0);
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.rows}>
        <View style={styles.row}>
          {Array.from({ length: topCount }, (_, idx) => {
            return (
              <View key={`top-${idx}`} style={styles.cell}>
                <View style={styles.topRotated}>
                  <Player
                    name={`Player ${idx + 1}`}
                    size={size}
                    startingLife={startingLife}
                    resetSignal={resetTick}
                    initialColors={[palette[idx % palette.length]]}
                    allPlayers={playersMeta}
                    highlight={spotlightIdx === idx}
                    flash={spotlightFinal && spotlightIdx === idx}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.row}>
          {Array.from({ length: bottomCount }, (_, idx) => {
            return (
              <View key={`bottom-${idx}`} style={styles.cell}>
                <Player
                  name={`Player ${topCount + idx + 1}`}
                  size={size}
                  startingLife={startingLife}
                  resetSignal={resetTick}
                  initialColors={[palette[(topCount + idx) % palette.length]]}
                  allPlayers={playersMeta}
                  highlight={spotlightIdx === (topCount + idx)}
                  flash={spotlightFinal && spotlightIdx === (topCount + idx)}
                />
              </View>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={() => {
          setPendingPlayers(capped);
          setPendingLife(startingLife);
          setMenuOpen(true);
        }}
        style={styles.menuBtn}
        accessibilityLabel={'Open menu'}
      >
        <FontAwesome5 name="bars" size={20} color="#e2e8f0" />
      </Pressable>

      <Pressable
        onPress={() => setActiveTab((t) => (t === 'counter' ? 'other' : 'counter'))}
        style={styles.tabBtn}
        accessibilityLabel={'Search cards'}
      >
        <FontAwesome5 name="search" size={18} color="#e2e8f0" />
      </Pressable>

      <Pressable
        onPress={() => setActiveTab((t) => (t === 'counter' ? 'banlist' : 'counter'))}
        style={styles.banBtn}
        accessibilityLabel={'Open banlist'}
      >
        <FontAwesome5 name="ban" size={18} color="#e2e8f0" />
      </Pressable>

      <Pressable
        onPress={() => setSpotlightTrigger((v) => v + 1)}
        style={styles.chooseBtn}
        accessibilityLabel={'Choose starter'}
      >
        <FontAwesome5 name="dice" size={16} color="#e2e8f0" />
      </Pressable>

      {false && (
        <Pressable
          onPress={() => setDiceOpen(true)}
          style={styles.diceBtn}
          accessibilityLabel={'Roll a D20'}
        >
          <FontAwesome5 name="dice-d20" size={18} color="#e2e8f0" />
        </Pressable>
      )}

      <Pressable
        onPress={async () => {
          if (Platform.OS === 'web') {
            try {
              const doc: any = (globalThis as any).document;
              if (!doc) return;
              if (!doc.fullscreenElement && doc.documentElement?.requestFullscreen) {
                await doc.documentElement.requestFullscreen();
              } else if (doc.exitFullscreen) {
                await doc.exitFullscreen();
              }
            } catch {}
          } else {
            const next = !isNativeFullscreen;
            try { StatusBar.setHidden(next, 'fade'); } catch {}
            if (Platform.OS === 'android') {
              try {
                // Lazy require to avoid hard dependency
                const NavigationBar = require('expo-navigation-bar');
                if (next) {
                  await NavigationBar.setVisibilityAsync('hidden');
                  await NavigationBar.setBehaviorAsync('overlay-swipe');
                } else {
                  await NavigationBar.setVisibilityAsync('visible');
                  await NavigationBar.setBehaviorAsync('inset-swipe');
                }
              } catch {}
            }
            setIsNativeFullscreen(next);
          }
        }}
        style={styles.fullBtn}
        accessibilityLabel={'Toggle fullscreen'}
      >
        <FontAwesome5
          name={Platform.OS === 'web' ? (isFullscreen ? 'compress' : 'expand') : (isNativeFullscreen ? 'compress' : 'expand')}
          size={18}
          color="#e2e8f0"
        />
      </Pressable>

      {menuOpen && (
        <View style={styles.overlay}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Match options</Text>
            <Text style={styles.panelLabel}>Players</Text>
            <View style={styles.grid}>
              {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setPendingPlayers(n)}
                  style={[styles.gridBtn, pendingPlayers === n ? styles.gridBtnActive : null]}
                >
                  <Text style={styles.gridBtnText}>{n}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.panelLabel, { marginTop: 8 }]}>Starting life</Text>
            <View style={styles.lifeRow}>
              {[20, 30, 40].map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setPendingLife(v as 20 | 30 | 40)}
                  style={[styles.lifeBtn, pendingLife === v ? styles.lifeBtnActive : null]}
                >
                  <Text style={styles.lifeBtnText}>{v}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.actionsRow}>
              <Pressable onPress={() => setResetTick((t) => t + 1)} style={styles.actionSecondary}>
                <Text style={styles.actionSecondaryText}>Reset lives</Text>
              </Pressable>
              <Pressable onPress={() => setSpotlightTrigger((v) => v + 1)} style={styles.actionSecondary}>
                <Text style={styles.actionSecondaryText}>Choose starter</Text>
              </Pressable>
              <Pressable onPress={() => setMenuOpen(false)} style={styles.actionSecondary}>
                <Text style={styles.actionSecondaryText}>Close</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onUpdate && onUpdate(pendingPlayers, pendingLife);
                  setMenuOpen(false);
                }}
                style={styles.actionPrimary}
              >
                <Text style={styles.actionPrimaryText}>Apply</Text>
              </Pressable>
            </View>

            <Pressable onPress={onBack} style={styles.exitBtn}>
              <Text style={styles.exitText}>Exit to menu</Text>
            </Pressable>
          </View>
        </View>
      )}

      {false && diceOpen && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setDiceOpen(false)}>
          <View style={styles.zoomOverlay}>
            <View style={styles.dicePanel}>
              <Text style={styles.rulingsTitle}>D20</Text>
            </View>
          </View>
        </Modal>
      )}
      {activeTab === 'other' && (
        <View
          style={[
            styles.otherTab,
            isDesktop ? styles.otherTabDesktop : null,
            !isDesktop && isLandscape ? styles.otherTabLandscape : null,
          ]}
        >
          <ImageBackground
            source={require('../assets/Plans.png')}
            style={styles.bgImage}
            imageStyle={styles.bgImageInner}
            resizeMode={isLandscape ? 'cover' : 'cover'}
          />
          <ScrollView
            style={{ width: '100%' }}
            contentContainerStyle={{
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingBottom: 16,
            }}
          >
            <View style={styles.searchRow}>
              <Pressable
                onPress={() => setActiveTab('counter')}
                style={styles.smallBtn}
                accessibilityLabel={'Back to counters'}
              >
                <FontAwesome5 name="chevron-left" size={16} color="#e2e8f0" />
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL('https://gatherer.wizards.com/')}
                style={styles.smallBtn}
              >
                <Text style={styles.actionSecondaryText}>Gatherer</Text>
              </Pressable>
            </View>
          <View style={[styles.searchRow, isLandscape ? { flexWrap: 'nowrap' } : null]}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={'Card name'}
              placeholderTextColor="#ffffff99"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

              <Pressable
                onPress={async () => {
                  setSearchError(undefined);
                  setSearchLoading(true);
                  setSearchUrl(undefined);
                  try {
                    const url = await fetchCardImageByName(searchQuery);
                    if (!url) setSearchError('No image found');
                    setSearchUrl(url);
                  } catch (e) {
                    setSearchError('Error searching card');
                  } finally {
                    setSearchLoading(false);
                  }
                }}
                style={styles.searchBtn}
              >
                <FontAwesome5 name="search" size={16} color="#fff" style={styles.zoomNavIcon} />
              </Pressable>
            </View>

            {isLandscape ? (
              <View style={styles.searchSplitRow}>
                <View style={styles.searchLeft}>
                  <View style={styles.searchResult}>
                    {searchLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : searchUrl ? (
                      <Image
                        source={{ uri: searchUrl }}
                        style={styles.cardImage}
                        resizeMode="contain"
                      />
                    ) : searchError ? (
                      <Text style={styles.otherSubtitle}>{searchError}</Text>
                    ) : (
                      <Text style={styles.otherSubtitle}>Type a name and press Search</Text>
                    )}
                  </View>
                </View>
                <View style={styles.searchRight}>
                  <View style={[styles.resultsWrap, { height: 240 }]}>
                    {results.length ? (
                      <ScrollView
                        style={styles.resultsScroll}
                        contentContainerStyle={styles.resultsList}
                        showsVerticalScrollIndicator={true}
                      >
                        {results.map((c, idx) => (
                          <Pressable
                            key={`${c.id}-${idx}`}
                            onPress={() => selectCard(idx)}
                            style={[
                              styles.resultItem,
                              selectedIdx === idx ? styles.resultItemActive : null,
                            ]}
                          >
                            <Text style={styles.resultText} numberOfLines={1}>
                              {c.name ?? 'Sin nombre'}
                            </Text>
                            <Text style={styles.resultMeta} numberOfLines={1}>
                              {c.setName ?? ''}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    ) : null}
                  </View>
                  {!!rulings.length && (
                    <View style={[styles.rulingsBox, { marginTop: 10 }]}>
                      <Text style={styles.rulingsTitle}>Rulings</Text>
                      <ScrollView style={{ maxHeight: 200 }}>
                        {rulings.map((r, i) => (
                          <View key={i} style={{ marginBottom: 8 }}>
                            <Text style={styles.rulingDate}>{r.date}</Text>
                            <Text style={styles.rulingText}>{r.text}</Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <>
                <View style={styles.searchResult}>
                  {searchLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : searchUrl ? (
                    <Image
                      source={{ uri: searchUrl }}
                      style={styles.cardImage}
                      resizeMode="contain"
                    />
                  ) : searchError ? (
                    <Text style={styles.otherSubtitle}>{searchError}</Text>
                  ) : (
                    <Text style={styles.otherSubtitle}>Type a name and press Search</Text>
                  )}
                </View>

                <View style={styles.resultsWrap}>
                  {results.length ? (
                    <ScrollView
                      style={styles.resultsScroll}
                      contentContainerStyle={styles.resultsList}
                      showsVerticalScrollIndicator={true}
                    >
                      {results.map((c, idx) => (
                        <Pressable
                          key={`${c.id}-${idx}`}
                          onPress={() => selectCard(idx)}
                          style={[
                            styles.resultItem,
                            selectedIdx === idx ? styles.resultItemActive : null,
                          ]}
                        >
                          <Text style={styles.resultText} numberOfLines={1}>
                            {c.name ?? 'Sin nombre'}
                          </Text>
                          <Text style={styles.resultMeta} numberOfLines={1}>
                            {c.setName ?? ''}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : null}
                </View>

                {!!rulings.length && (
                  <View style={styles.rulingsBox}>
                    <Text style={styles.rulingsTitle}>Rulings</Text>
                    <ScrollView style={{ maxHeight: 180 }}>
                      {rulings.map((r, i) => (
                        <View key={i} style={{ marginBottom: 8 }}>
                          <Text style={styles.rulingDate}>{r.date}</Text>
                          <Text style={styles.rulingText}>{r.text}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      )}

      {activeTab === 'banlist' && (
        <View style={styles.otherTab}>
          <Text style={styles.otherTitle}>{banLabel} Banlist</Text>
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              marginBottom: 8,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Pressable
              onPress={() => setBanFormat('commander')}
              style={[styles.smallBtn, banFormat === 'commander' ? styles.smallBtnActive : null]}
            >
              <Text style={styles.actionSecondaryText}>Commander</Text>
            </Pressable>
            <Pressable
              onPress={() => setBanFormat('pauper')}
              style={[styles.smallBtn, banFormat === 'pauper' ? styles.smallBtnActive : null]}
            >
              <Text style={styles.actionSecondaryText}>Pauper</Text>
            </Pressable>
            <Pressable
              onPress={() => setBanFormat('pioneer')}
              style={[styles.smallBtn, banFormat === 'pioneer' ? styles.smallBtnActive : null]}
            >
              <Text style={styles.actionSecondaryText}>Pioneer</Text>
            </Pressable>
            <Pressable
              onPress={() => setBanFormat('brawl')}
              style={[styles.smallBtn, banFormat === 'brawl' ? styles.smallBtnActive : null]}
            >
              <Text style={styles.actionSecondaryText}>Brawl</Text>
            </Pressable>
            <Pressable
              onPress={() => setBanFormat('standard')}
              style={[styles.smallBtn, banFormat === 'standard' ? styles.smallBtnActive : null]}
            >
              <Text style={styles.actionSecondaryText}>Standard</Text>
            </Pressable>
            <Pressable
              onPress={() => setBanFormat('modern')}
              style={[styles.smallBtn, banFormat === 'modern' ? styles.smallBtnActive : null]}
            >
              <Text style={styles.actionSecondaryText}>Modern</Text>
            </Pressable>
            <Pressable
              onPress={() => setBanFormat('legacy')}
              style={[styles.smallBtn, banFormat === 'legacy' ? styles.smallBtnActive : null]}
            >
              <Text style={styles.actionSecondaryText}>Legacy</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Pressable
              onPress={() => Linking.openURL('https://magic.wizards.com/en/banned-restricted-list')}
              style={[styles.smallBtn, styles.smallBtnTight]}
            >
              <Text style={styles.actionSecondaryText}>Open Wizards Page</Text>
            </Pressable>
            {!isDesktop && (
              <Pressable
                onPress={() => setBanHorizontal((v) => !v)}
                style={[styles.smallBtn, styles.smallBtnTight, banHorizontal ? styles.smallBtnActive : null]}
              >
                <Text style={styles.actionSecondaryText}>
                  {banHorizontal ? 'Vista vertical' : 'Vista horizontal'}
                </Text>
              </Pressable>
            )}
          </View>
          <View
            style={[
              styles.rulingsBox,
              banHorizontal ? styles.rulingsWide : null,
              isDesktop
                ? [
                    styles.rulingsBoxDesktop,
                    { width: desktopContainerW, maxWidth: desktopContainerW },
                  ]
                : null,
            ]}
          >
            {isDesktop ? (
              <ScrollView style={[styles.banGridScroll, { flex: 1 }]} showsVerticalScrollIndicator>
                <View style={styles.banGrid}>
                  {visibleBanlist.map((name, idx) => {
                    const url = banImages[name];
                    return (
                      <View
                        key={`${name}-${idx}`}
                        style={[styles.banGridItem, desktopItemW ? { width: desktopItemW } : null]}
                      >
                        <Pressable
                          onPress={() => {
                            if (url) {
                              setZoomUrl(url);
                              setZoomName(name);
                            }
                            setZoomIndex(idx);
                          }}
                        >
                          {url ? (
                            <Image
                              source={{ uri: url }}
                              style={[
                                styles.banGridThumb,
                                desktopImgW ? { width: desktopImgW, height: desktopImgH } : null,
                              ]}
                              resizeMode="cover"
                            />
                          ) : (
                            <View
                              style={[
                                styles.banGridThumb,
                                { backgroundColor: '#111' },
                                desktopImgW ? { width: desktopImgW, height: desktopImgH } : null,
                              ]}
                            />
                          )}
                        </Pressable>
                        <Text style={styles.banCardNameGrid} numberOfLines={2}>
                          {name}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            ) : banHorizontal ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                style={[styles.banHScroll, isDesktop ? { height: 220 } : null]}
                contentContainerStyle={styles.banHContent}
              >
                {visibleBanlist.map((name, idx) => {
                  const url = banImages[name];
                  return (
                    <View key={`${name}-${idx}`} style={styles.banHItem}>
                      <Pressable
                        onPress={() => {
                          if (url) {
                            setZoomUrl(url);
                            setZoomName(name);
                          }
                          setZoomIndex(idx);
                        }}
                      >
                        {url ? (
                          <Image
                            source={{ uri: url }}
                            style={[
                              styles.banThumb,
                              styles.banThumbLarge,
                              isDesktop ? styles.banThumbLargeDesktop : null,
                            ]}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.banThumb,
                              styles.banThumbLarge,
                              isDesktop ? styles.banThumbLargeDesktop : null,
                              { backgroundColor: '#111' },
                            ]}
                          />
                        )}
                      </Pressable>
                      <Text style={styles.banCardName} numberOfLines={2}>
                        {name}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <ScrollView style={[{ maxHeight: 300 }, isDesktop ? { maxHeight: 480 } : null]}>
                {visibleBanlist.map((name, idx) => {
                  const url = banImages[name];
                  return (
                    <View key={`${name}-${idx}`} style={styles.banItemRow}>
                      <Pressable
                        onPress={() => {
                          if (url) {
                            setZoomUrl(url);
                            setZoomName(name);
                          }
                          setZoomIndex(idx);
                        }}
                      >
                        {url ? (
                          <Image
                            source={{ uri: url }}
                            style={[styles.banThumb, isDesktop ? styles.banThumbDesktop : null]}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.banThumb,
                              isDesktop ? styles.banThumbDesktop : null,
                              { backgroundColor: '#111' },
                            ]}
                          />
                        )}
                      </Pressable>
                      <Text style={styles.resultText}>{name}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <Modal
            visible={zoomIndex !== null}
            transparent
            animationType="fade"
            onRequestClose={() => {
              setZoomIndex(null);
              setZoomUrl(null);
              setZoomName(null);
            }}
          >
            <View style={styles.zoomOverlay}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => {
                  setZoomIndex(null);
                  setZoomUrl(null);
                  setZoomName(null);
                }}
              />
              <View style={styles.zoomContent}>
                {(() => {
                  if (zoomIndex === null) return null;
                  const name = visibleBanlist[zoomIndex] as string | undefined;
                  const url = name ? banImages[name] : undefined;
                  return (
                    <>
                      {url ? (
                        <Image
                          source={{ uri: url }}
                          style={styles.zoomImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={[styles.zoomImage, { backgroundColor: '#111' }]} />
                      )}
                      {!!name && <Text style={styles.zoomCaption}>{name}</Text>}
                    </>
                  );
                })()}
                <Pressable
                  onPress={() => {
                    setZoomIndex(null);
                    setZoomUrl(null);
                    setZoomName(null);
                  }}
                  style={styles.zoomCloseBtn}
                >
                  <Text style={styles.actionSecondaryText}>Close</Text>
                </Pressable>
              </View>
              <Pressable
                style={[styles.zoomNavBase, styles.zoomNavLeft]}
                onPress={() => {
                  if (zoomIndex !== null && zoomIndex > 0) setZoomIndex(zoomIndex - 1);
                }}
              >
                {zoomIndex !== null && zoomIndex > 0 ? (
                  <FontAwesome5
                    name="chevron-left"
                    size={36}
                    color="#fff"
                    style={styles.zoomNavIcon}
                  />
                ) : null}
              </Pressable>
              <Pressable
                style={[styles.zoomNavBase, styles.zoomNavRight]}
                onPress={() => {
                  if (zoomIndex !== null && zoomIndex < visibleBanlist.length - 1)
                    setZoomIndex(zoomIndex + 1);
                }}
              >
                {zoomIndex !== null && zoomIndex < visibleBanlist.length - 1 ? (
                  <FontAwesome5
                    name="chevron-right"
                    size={36}
                    color="#fff"
                    style={styles.zoomNavIcon}
                  />
                ) : null}
              </Pressable>
            </View>
          </Modal>
          <Pressable
            onPress={() => setActiveTab('counter')}
            style={[styles.smallBtn, { marginTop: 10 }]}
            accessibilityLabel={'Back to counters'}
          >
            <FontAwesome5 name="chevron-left" size={16} color="#e2e8f0" />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  rows: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 8,
  },
  cell: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  topRotated: {
    flex: 1,
    transform: [{ rotate: '180deg' }],
  },
  menuBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -32 }, { translateY: -16 }],
    width: 64,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  tabBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: 40 }, { translateY: -16 }],
    width: 64,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  banBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -104 }, { translateY: -16 }],
    width: 64,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  chooseBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -168 }, { translateY: -16 }],
    width: 64,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  diceBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: 0 }, { translateY: 24 }],
    width: 64,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  fullBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: 104 }, { translateY: -16 }],
    width: 64,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  otherTab: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1,
    overflow: 'hidden',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgImageInner: {
    width: '100%',
    height: '100%',
  },
  otherTabLandscape: {
    justifyContent: 'flex-start',
    paddingTop: 2,
    overflow: 'visible',
  },
  otherTabDesktop: {
    justifyContent: 'flex-start',
    paddingTop: 16,
  },
  langRow: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  langBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  langBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  searchSplitRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 3,
    alignItems: 'flex-start',
    marginTop: 3,
    paddingHorizontal: 3,
  },
  searchLeft: {
    flex: 1,
    alignItems: 'center',
  },
  searchRight: {
    flex: 1,
  },
  searchInput: {
    flexGrow: 1,
    minWidth: 180,
    backgroundColor: '#000',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  searchBtn: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  searchResult: {
    width: '100%',
    maxWidth: 420,
    height: 280,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  otherTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 22,
  },
  otherSubtitle: {
    color: '#ffffff',
    marginTop: 6,
    marginBottom: 12,
    fontWeight: '600',
  },
  resultsWrap: {
    width: '100%',
    maxWidth: 420,
    marginTop: 10,
    height: 180,
  },
  resultsScroll: {
    flex: 1,
  },
  resultsList: {
    gap: 8,
  },
  resultItem: {
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  resultItemActive: {
    backgroundColor: '#111',
    borderColor: '#fff',
  },
  resultText: {
    color: '#fff',
    fontWeight: '800',
  },
  resultMeta: {
    color: '#ffffff',
    fontSize: 12,
  },
  banItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  banThumb: {
    width: 72,
    height: 104,
    borderRadius: 6,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
  },
  banThumbLarge: {
    width: 140,
    height: 204,
  },
  banThumbDesktop: {
    width: 90,
    height: 130,
  },
  banThumbLargeDesktop: {
    width: 180,
    height: 261,
  },
  banCardName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
    width: 72,
  },
  banCardNameGrid: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
    width: '100%',
  },
  banHScroll: {
    height: 160,
  },
  banHContent: {
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 10,
  },
  banHItem: {
    alignItems: 'center',
  },
  rulingsBox: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '50%',
    marginTop: 2,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  rulingsWide: {
    maxWidth: undefined,
  },
  dicePanel: {
    width: '90%',
    maxWidth: 320,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  diceKnob: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    position: 'relative',
  },
  diceKnobInner: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#0b1020',
    borderWidth: 1,
    borderColor: '#233044',
  },
  diceKnobNumber: {
    color: '#e2e8f0',
    fontWeight: '900',
    fontSize: 40,
  },
  diceValue: {
    color: '#e2e8f0',
    fontWeight: '900',
    fontSize: 48,
    marginVertical: 12,
  },
  diceRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    justifyContent: 'space-between',
  },
  rulingsBoxDesktop: {
    alignSelf: 'center',
    flex: 1,
    width: '100%',
  },
  banGridScroll: {
    overflow: 'hidden',
  },
  banGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  banGridItem: {
    width: '19%',
    paddingVertical: 6,
    alignItems: 'center',
  },
  banGridThumb: {
    width: '100%',
    aspectRatio: 0.716,
    borderRadius: 6,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
  },
  zoomOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000cc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  zoomContent: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
  },
  zoomImage: {
    width: '100%',
    height: 520,
    borderRadius: 8,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  zoomCaption: {
    color: '#fff',
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  zoomCloseBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#334155',
    borderRadius: 10,
  },
  zoomNavBase: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
    justifyContent: 'center',
    paddingHorizontal: 8,
    zIndex: 2,
  },
  zoomNavLeft: {
    left: 0,
    alignItems: 'flex-start',
  },
  zoomNavRight: {
    right: 0,
    alignItems: 'flex-end',
  },
  zoomNavIcon: {
    opacity: 0.6,
  },
  rulingsTitle: {
    color: '#ffffff',
    fontWeight: '900',
    marginBottom: 8,
  },
  rulingDate: {
    color: '#dddddd',
    fontWeight: '700',
    fontSize: 12,
  },
  rulingText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000088',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  panelTitle: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  panelLabel: {
    color: '#94a3b8',
    fontWeight: '700',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  gridBtn: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridBtnActive: {
    backgroundColor: '#0ea5e9',
  },
  gridBtnText: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 18,
  },
  lifeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 6,
  },
  lifeBtn: {
    minWidth: 80,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  lifeBtnActive: {
    backgroundColor: '#0ea5e9',
  },
  lifeBtnText: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  },
  actionSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#334155',
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  actionSecondaryText: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
  smallBtn: {
    alignSelf: 'center',
    backgroundColor: '#000',
    paddingVertical: 2,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  smallBtnActive: {
    backgroundColor: '#111',
    borderColor: '#fff',
  },
  smallBtnTight: {
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  buttonsWrap: {
    marginTop: 12,
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  actionPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  actionPrimaryText: {
    color: '#052e12',
    fontWeight: '800',
  },
  exitBtn: {
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: '#475569',
    borderRadius: 10,
    alignItems: 'center',
  },
  exitText: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
});

async function fetchCommanderBanlist(): Promise<string[]> {
  const url = 'https://magic.wizards.com/en/banned-restricted-list';
  const res = await fetch(url);
  const html = await res.text();
  // Naive parse: find 'Commander' section and collect <li> items until next heading
  const sectionStart = html.toLowerCase().indexOf('commander');
  if (sectionStart === -1) return [];
  const slice = html.slice(sectionStart, sectionStart + 20000); // slice reasonable chunk
  const ulMatch = slice.match(/<ul[\s\S]*?<\/ul>/i);
  if (!ulMatch) return [];
  const ulHtml = ulMatch[0];
  const items = [] as string[];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m: RegExpExecArray | null;
  while ((m = liRegex.exec(ulHtml))) {
    const txt = m[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (txt) items.push(txt);
  }
  return items;
}
