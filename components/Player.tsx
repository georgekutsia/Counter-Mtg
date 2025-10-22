import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions, Platform, Modal, TextInput, StyleSheet } from 'react-native';
import styles from './styles/Player.styles';
import { FontAwesome5 } from '@expo/vector-icons';

type PlayerProps = {
  name: string;
  size?: 'small' | 'medium' | 'large';
  startingLife?: 20 | 30 | 40;
  initialColors?: string[];
  resetSignal?: number;
  allPlayers?: { name: string; color: string }[];
};

export default function Player({ name, size = 'large', startingLife = 20, initialColors, resetSignal = 0, allPlayers }: PlayerProps) {
  const [life, setLife] = useState<number>(startingLife);
  const [poison, setPoison] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [showPalette, setShowPalette] = useState(false);
  const [showPoison, setShowPoison] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const [displayName, setDisplayName] = useState<string>(name);
  const [editingName, setEditingName] = useState<boolean>(false);
  const [nameDraft, setNameDraft] = useState<string>(name);
  const [showTimer, setShowTimer] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0); // ms accumulated when paused
  const [timerMinimized, setTimerMinimized] = useState(false);
  const [timerTick, setTimerTick] = useState(0);
  const seedColors = useMemo(
    () => (initialColors && initialColors.length ? initialColors.slice(0, 3) : ['#1e40af']),
    [initialColors],
  );
  const [colors, setColors] = useState<string[]>(seedColors);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;

  useEffect(() => {
    setLife(startingLife);
    setPoison(0);
  }, [resetSignal, startingLife]);

  const modify = (delta: number) => setLife((v) => v + delta);
  const modifyPoison = (delta: number) =>
    setPoison((v) => {
      const next = Math.max(0, Math.min(10, v + delta));
      return next;
    });
  const reset = () => {
    setLife(startingLife);
    setPoison(0);
    setShowPoison(false);
  };
  const s = useMemo(() => sizesByMode(size), [size]);
  const lost = life <= 0 || poison >= 10;
  const lifePress = (d: number) => {
    setShowPoison(false);
    setShowCmd(false);
    modify(d);
  };
  const opponents = useMemo(() => {
    const set = new Set<string>([name, displayName]);
    return (allPlayers || []).filter((p) => !set.has(p.name));
  }, [allPlayers, name, displayName]);
  const [cmdDamage, setCmdDamage] = useState<Record<string, number>>({});
  useEffect(() => {
    setCmdDamage((prev) => {
      const next = { ...prev } as Record<string, number>;
      for (const p of opponents) if (!(p.name in next)) next[p.name] = 0;
      return next;
    });
  }, [opponents]);
  function adjustCmd(targetName: string, delta: number) {
    setCmdDamage((prev) => {
      const curr = prev[targetName] ?? 0;
      const val = Math.max(0, curr + delta);
      return { ...prev, [targetName]: val };
    });
    // Also mirror to life
    modify(delta > 0 ? -1 : +1);
  }

  // Timer logic
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTimerTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [timerRunning]);

  const displayedElapsedMs = timerRunning && timerStart != null ? (Date.now() - timerStart + timerElapsed) : timerElapsed;
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  const toggleTimerRun = () => {
    if (timerRunning) {
      // stop and accumulate
      if (timerStart != null) setTimerElapsed((e) => e + (Date.now() - (timerStart as number)));
      setTimerStart(null);
      setTimerRunning(false);
    } else {
      setTimerStart(Date.now());
      setTimerRunning(true);
    }
  };
  // Easter egg: when name is "Rayco", auto-open and start the timer
  useEffect(() => {
    if (displayName && displayName.trim().toLowerCase() === 'rayco') {
      setShowTimer(true);
      setTimerMinimized(false);
      if (!timerRunning) {
        setTimerStart(Date.now());
        setTimerRunning(true);
      }
    }
  }, [displayName]);
  const closeTimer = () => {
    setShowTimer(false);
    setTimerMinimized(false);
    setTimerRunning(false);
    setTimerStart(null);
  };

  return (
    <View style={styles.container}>
      <BackgroundFill colors={colors} />
      <Pressable
        accessibilityLabel="Girar jugador"
        onPress={() => {
          setShowPoison(false);
          setRotation((r) => (r + 45) % 360);
        }}
        style={({ pressed }) => [styles.rotateBtn, pressed && styles.pressed]}
      >
        <FontAwesome5 name="sync" size={s.icon} color="#e2e8f0" />
      </Pressable>
      <Pressable
        accessibilityLabel="Reiniciar vidas"
        onPress={() => {
          setShowPoison(false);
          setShowCmd(false);
          reset();
        }}
        style={({ pressed }) => [styles.resetIconBtn, pressed && styles.pressed]}
      >
        <FontAwesome5 name="redo" size={s.icon} color="#e2e8f0" />
      </Pressable>
      <Pressable
        accessibilityLabel="Elegir colores"
        onPress={() => {
          setShowPoison(false);
          setShowCmd(false);
          setShowPalette((v) => !v);
        }}
        style={({ pressed }) => [styles.paletteBtn, pressed && styles.pressed]}
      >
        <FontAwesome5 name="palette" size={s.icon} color="#a855f7" />
      </Pressable>

      {/* Toggles under palette (top-left) */}
      <View style={styles.leftTogglesRow}>
        <Pressable onPress={() => { setShowPoison((v) => !v); setShowCmd(false); }} style={({ pressed }) => [styles.poisonToggle, pressed && styles.pressed]} accessibilityLabel="Mostrar/ocultar veneno">
          <FontAwesome5 name="biohazard" size={22} color="#22c55e" />
        </Pressable>
        <Pressable onPress={() => { setShowCmd((v) => !v); setShowPoison(false); }} style={({ pressed }) => [styles.cmdToggle, pressed && styles.pressed]} accessibilityLabel="Daño de comandante">
          <FontAwesome5 name="crown" size={20} color="#facc15" />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pressable onPress={() => { setShowTimer(true); setTimerMinimized(false); }} style={({ pressed }) => [styles.timerToggle, pressed && styles.pressed]} accessibilityLabel="Abrir contador de tiempo">
            <FontAwesome5 name="stopwatch" size={18} color="#e2e8f0" />
          </Pressable>
          {timerMinimized && (
            <Pressable onPress={() => { setShowTimer(true); setTimerMinimized(false); }} style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>{formatTime(displayedElapsedMs)}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={[styles.rotatable, { transform: [{ rotate: `${rotation}deg` }] }]}>
        <Pressable
          accessibilityLabel="Editar nombre"
          onPress={() => {
            setShowPoison(false);
            setShowCmd(false);
            setNameDraft(displayName);
            setEditingName(true);
          }}
        >
          <Text style={[styles.name, { fontSize: s.nameFont }]} numberOfLines={1}>
            {displayName}
          </Text>
        </Pressable>
        <View style={styles.lifeRow}>
          {lost ? (
            <View style={styles.lostWrap}>
              <FontAwesome5 name="skull" size={s.lifeFont} color="#e2e8f0" />
            </View>
          ) : (
            <Text style={[styles.life, { fontSize: s.lifeFont }]}>{life}</Text>
          )}
          <Text style={styles.poisonBadge}>{poison}</Text>
        </View>
        <View style={styles.controlsGrid}>
          <View style={styles.controlsRow}>
            <SquareAdjustButton label="-1" onPress={() => lifePress(-1)} fontSize={s.btnFont} compact={isDesktop} />
            <SquareAdjustButton label="-5" onPress={() => lifePress(-5)} fontSize={s.btnFont} compact={isDesktop} />
          </View>
          <View style={styles.controlsRow}>
            <SquareAdjustButton label="+1" onPress={() => lifePress(+1)} fontSize={s.btnFont} compact={isDesktop} />
            <SquareAdjustButton label="+5" onPress={() => lifePress(+5)} fontSize={s.btnFont} compact={isDesktop} />
          </View>
        </View>
        {showPoison && (
          <View style={styles.poisonRow}>
            <Pressable
              onPress={() => modifyPoison(-1)}
              style={({ pressed }) => [styles.poisonBtn, pressed && styles.pressed]}
              accessibilityLabel="Quitar veneno"
            >
              <Text style={[styles.btnText, { fontSize: s.btnFont }]}>-1</Text>
            </Pressable>
            <Pressable
              onPress={() => modifyPoison(+1)}
              style={({ pressed }) => [styles.poisonBtn, pressed && styles.pressed]}
              accessibilityLabel="Añadir veneno"
            >
              <Text style={[styles.btnText, { fontSize: s.btnFont }]}>+1</Text>
            </Pressable>
          </View>
        )}
        {showCmd && (
          <Modal
            visible
            transparent
            presentationStyle="overFullScreen"
            statusBarTranslucent
            animationType="fade"
            onRequestClose={() => setShowCmd(false)}
          >
            <View style={styles.cmdOverlay}>
              <View style={styles.cmdPanel}>
                <Text style={styles.cmdTitle}>Daño de comandante recibido</Text>
                <ScrollView style={{ maxHeight: 320 }}>
                  {opponents.map((op, i) => (
                    <View key={`${op.name}-${i}`} style={styles.cmdRow}>
                      <View style={[styles.cmdDot, { backgroundColor: op.color }]} />
                      <Text style={styles.cmdName}>{op.name}</Text>
                      <View style={styles.cmdBtns}>
                        <Pressable onPress={() => adjustCmd(op.name, -1)} style={({ pressed }) => [styles.cmdBtn, pressed && styles.pressed]}>
                          <Text style={styles.cmdBtnText}>-1</Text>
                        </Pressable>
                        <Text style={styles.cmdCount}>{cmdDamage[op.name] ?? 0}</Text>
                        <Pressable onPress={() => adjustCmd(op.name, +1)} style={({ pressed }) => [styles.cmdBtn, pressed && styles.pressed]}>
                          <Text style={styles.cmdBtnText}>+1</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <Pressable onPress={() => setShowCmd(false)} style={({ pressed }) => [styles.cmdClose, pressed && styles.pressed]}>
                  <Text style={styles.cmdCloseText}>Cerrar</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        )}

        {showTimer && (
          <Modal visible transparent animationType="fade" onRequestClose={() => { setShowTimer(false); setTimerMinimized(true); }}>
            <View style={styles.cmdOverlay}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => { setShowTimer(false); setTimerMinimized(true); }} />
              <View style={styles.timerPanel}>
                <Text style={styles.cmdTitle}>Contador</Text>
                <Text style={styles.timerDisplay}>{formatTime(displayedElapsedMs)}</Text>
                <View style={styles.cmdBtns}>
                  <Pressable onPress={toggleTimerRun} style={({ pressed }) => [styles.cmdBtn, pressed && styles.pressed]}>
                    <Text style={styles.cmdBtnText}>{timerRunning ? 'Parar' : 'Iniciar'}</Text>
                  </Pressable>
                  <Pressable onPress={() => { setTimerRunning(false); setTimerStart(null); setTimerElapsed(0); }} style={({ pressed }) => [styles.cmdBtn, pressed && styles.pressed]}>
                    <Text style={styles.cmdBtnText}>Reset</Text>
                  </Pressable>
                  <Pressable onPress={() => { setShowTimer(false); setTimerMinimized(true); }} style={({ pressed }) => [styles.cmdBtn, pressed && styles.pressed]}>
                    <Text style={styles.cmdBtnText}>Minimizar</Text>
                  </Pressable>
                  <Pressable onPress={closeTimer} style={({ pressed }) => [styles.cmdBtn, pressed && styles.pressed]} accessibilityLabel="Cerrar contador">
                    <Text style={styles.cmdBtnText}>Cerrar</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>

      {editingName && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setEditingName(false)}>
          <View style={styles.cmdOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditingName(false)} />
            <View style={styles.namePanel}>
              <TextInput
                value={nameDraft}
                onChangeText={(v) => setNameDraft(v.slice(0, 20))}
                onSubmitEditing={() => {
                  setDisplayName(nameDraft.trim());
                  setEditingName(false);
                }}
                onBlur={() => {
                  setDisplayName(nameDraft.trim());
                  setEditingName(false);
                }}
                autoFocus
                maxLength={20}
                allowFontScaling={false}
                style={[styles.nameInput, { fontSize: 22 }]}
                placeholder="Nombre"
                placeholderTextColor="#cbd5e1"
              />
            </View>
          </View>
        </Modal>
      )}

      {showPalette && (
        <ColorPicker
          selected={colors}
          onToggle={(c) =>
            setColors((curr) => {
              const has = curr.includes(c);
              if (has) return curr.filter((x) => x !== c);
              const isSeed = arraysEqual(curr, seedColors);
              if (isSeed) return [c];
              if (curr.length >= 3) return curr;
              return [...curr, c];
            })
          }
          onReset={() => setColors([])}
          onClose={() => setShowPalette(false)}
        />
      )}
    </View>
  );
}

function SquareAdjustButton({
  label,
  onPress,
  fontSize,
  compact,
}: {
  label: string;
  onPress: () => void;
  fontSize: number;
  compact?: boolean;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longRef = useRef(false);

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stop();
  }, []);

  return (
    <Pressable
      onPress={() => {
        if (longRef.current) {
          longRef.current = false;
          return;
        }
        onPress();
      }}
      onLongPress={() => {
        longRef.current = true;
        stop();
        intervalRef.current = setInterval(() => {
          onPress();
        }, 500);
      }}
      delayLongPress={2000}
      onPressOut={() => {
        stop();
      }}
      style={({ pressed }) => [compact ? styles.squareBtnCompact : styles.squareBtn, pressed && styles.pressed]}
    >
      <Text style={[styles.btnText, { fontSize }]}>{label}</Text>
    </Pressable>
  );
}

/* styles moved to components/styles/Player.styles.ts */
/* const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 12,
    overflow: 'hidden',
  },
  rotatable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '700',
  },
  nameInput: {
    color: '#e2e8f0',
    backgroundColor: '#00000055',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 120,
    textAlign: 'center',
  },
  life: {
    color: '#f8fafc',
    fontSize: 64,
    fontWeight: '800',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 3,
    width: '100%',
    justifyContent: 'center',
  },
  controlsGrid: {
    width: '100%',
    gap: 3,
    alignItems: 'center',
  },
  btn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  squareBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareBtnCompact: {
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#0b1020',
    fontWeight: '800',
    fontSize: 16,
  },
  lifeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  poisonBadge: {
    color: '#22c55e',
    fontWeight: '900',
    fontSize: 18,
  },
  poisonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00000055',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  poisonToggleText: {
    color: '#e2e8f0',
    fontWeight: '800',
  },
  lostWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  poisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  poisonBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  poisonCount: {
    color: '#e2e8f0',
    fontWeight: '900',
    minWidth: 56,
    textAlign: 'center',
  },
  poisonLabel: {
    color: '#e2e8f0',
    fontWeight: '800',
    paddingHorizontal: 6,
  },
  pressed: {
    opacity: 0.9,
  },
  rotateBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#00000055',
    padding: 8,
    borderRadius: 9999,
  },
  resetIconBtn: {
    position: 'absolute',
    top: 56,
    right: 8,
    backgroundColor: '#00000055',
    padding: 8,
    borderRadius: 9999,
  },
  paletteBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#00000055',
    padding: 8,
    borderRadius: 9999,
  },
  cmdToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00000055',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  leftTogglesRow: {
    position: 'absolute',
    top: 56,
    left: 8,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    zIndex: 2,
  },
  togglesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginTop: 6,
  },
  cmdToggleText: {
    color: '#e2e8f0',
    fontWeight: '800',
  },
  timerToggle: {
    backgroundColor: '#00000055',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  timerBadge: {
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#374151',
  },
  timerBadgeText: {
    color: '#e5e7eb',
    fontWeight: '800',
    fontSize: 12,
  },
  cmdOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000aa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cmdPanel: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#0b1020',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timerPanel: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#0b1020',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  cmdTitle: {
    color: '#e2e8f0',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  timerDisplay: {
    color: '#e2e8f0',
    fontWeight: '900',
    fontSize: 28,
    marginBottom: 8,
  },
  cmdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
  },
  cmdDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#111',
  },
  cmdName: {
    flex: 1,
    color: '#e2e8f0',
    fontWeight: '800',
    marginLeft: 8,
  },
  cmdBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cmdBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cmdBtnText: {
    color: '#e2e8f0',
    fontWeight: '800',
  },
  cmdCount: {
    color: '#e2e8f0',
    fontWeight: '900',
    minWidth: 28,
    textAlign: 'center',
  },
  cmdClose: {
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: '#334155',
    borderRadius: 10,
    alignItems: 'center',
  },
  cmdCloseText: {
    color: '#e2e8f0',
    fontWeight: '800',
  },
  namePanel: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: '#0b1020',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
}); */

function BackgroundFill({ colors }: { colors: string[] }) {
  if (!colors || colors.length === 0) return null;
  if (colors.length === 1) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors[0] }]} pointerEvents="none" />;
  }
  const strips = 24;
  const views = [] as JSX.Element[];
  for (let i = 0; i < strips; i++) {
    const t = i / (strips - 1);
    const color = mixStops(colors, t);
    views.push(<View key={i} style={{ flex: 1, backgroundColor: color }} />);
  }
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={{ flex: 1, flexDirection: 'column' }}>{views}</View>
    </View>
  );
}

function ColorPicker({ selected, onToggle, onReset, onClose }: { selected: string[]; onToggle: (c: string) => void; onReset: () => void; onClose: () => void }) {
  const mains = ['#000000', '#ffffff', '#ff0000', '#0000ff', '#00ff00', '#808080'];
  const extras = [
    '#1e40af', '#2563eb', '#3b82f6',
    '#b91c1c', '#ef4444', '#f97316',
    '#f59e0b', '#facc15',
    '#0f766e', '#10b981', '#22c55e',
    '#7e22ce', '#a855f7', '#ec4899',
    '#06b6d4', '#14b8a6',
    '#b45309', '#8b5a2b',
    '#334155', '#94a3b8',
  ];
  const Swatch = (c: string) => {
    const active = selected.includes(c);
    return (
      <Pressable key={c} onPress={() => onToggle(c)} style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: c, borderWidth: 2, borderColor: active ? '#e2e8f0' : '#1f2937' }} />
    );
  };
  const [showExtras, setShowExtras] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;
  const extrasScrollStyle = isDesktop
    ? { marginTop: 8, maxWidth: 300, alignSelf: 'center' as const }
    : { marginTop: 8 };
  return (
    <View style={{ position: 'absolute', bottom: 8, left: `50%`,transform: [{ translateX: '-50%' }], backgroundColor: '#0b1020cc', padding: 10, borderRadius: 12, maxWidth:'400px' }}>
      <Text style={{ color: '#e2e8f0', marginBottom: 6, fontWeight: '700', textAlign: 'center' }}>Colores (hasta 3)</Text>
      <Text style={{ color: '#cbd5e1', marginBottom: 4, fontWeight: '700' }}>Principales</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3, justifyContent: 'center', marginBottom: 6 }}>
        {mains.map(Swatch)}
      </View>
      {showExtras && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={extrasScrollStyle}
          contentContainerStyle={{ paddingHorizontal: 8, gap: 3, alignItems: 'center' }}
        >
          {extras.map(Swatch)}
        </ScrollView>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 8 }}>
      <Pressable onPress={() => setShowExtras((v) => !v)} style={{ alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#334155', borderRadius: 8 }}>
        {showExtras? <FontAwesome5 name="minus" size={16} color="#e2e8f0" /> : <FontAwesome5 name="plus" size={16} color="#e2e8f0" />}
      </Pressable>
        <Pressable onPress={onReset} style={{ paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#475569', borderRadius: 8 }}>
          <FontAwesome5 name="redo" size={16} color="#e2e8f0" />
        </Pressable>
        <Pressable onPress={onClose} style={{ paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#334155', borderRadius: 8 }}>
          <FontAwesome5 name="times" size={16} color="#e2e8f0" />
        </Pressable>
      </View>
    </View>
  );
}

function mixStops(stops: string[], t: number) {
  if (stops.length === 2) return mixHex(stops[0], stops[1], t);
  if (stops.length >= 3) {
    if (t <= 0.5) return mixHex(stops[0], stops[1], t / 0.5);
    return mixHex(stops[1], stops[2], (t - 0.5) / 0.5);
  }
  return stops[0];
}

function mixHex(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const bch = Math.round(ca.b + (cb.b - ca.b) * t);
  return rgbToHex(r, g, bch);
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const norm = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(norm, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function sizesByMode(mode: 'small' | 'medium' | 'large') {
  switch (mode) {
    case 'small':
      return { lifeFont: 40, nameFont: 14, btnPadH: 10, btnPadV: 8, btnFont: 24, icon: 18 };
    case 'medium':
      return { lifeFont: 52, nameFont: 16, btnPadH: 12, btnPadV: 10, btnFont: 16, icon: 20 };
    default:
      return { lifeFont: 64, nameFont: 18, btnPadH: 16, btnPadV: 12, btnFont: 16, icon: 22 };
  }
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
