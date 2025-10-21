import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

type PlayerProps = {
  name: string;
  size?: 'small' | 'medium' | 'large';
  startingLife?: 20 | 30 | 40;
  initialColors?: string[];
  resetSignal?: number;
};

export default function Player({ name, size = 'large', startingLife = 20, initialColors, resetSignal = 0 }: PlayerProps) {
  const [life, setLife] = useState<number>(startingLife);
  const [rotation, setRotation] = useState<number>(0);
  const [showPalette, setShowPalette] = useState(false);
  const seedColors = useMemo(
    () => (initialColors && initialColors.length ? initialColors.slice(0, 3) : ['#1e40af']),
    [initialColors],
  );
  const [colors, setColors] = useState<string[]>(seedColors);

  useEffect(() => {
    setLife(startingLife);
  }, [resetSignal, startingLife]);

  const modify = (delta: number) => setLife((v) => v + delta);
  const reset = () => setLife(startingLife);
  const s = useMemo(() => sizesByMode(size), [size]);

  return (
    <View style={styles.container}>
      <BackgroundFill colors={colors} />
      <Pressable
        accessibilityLabel="Girar jugador"
        onPress={() => setRotation((r) => (r + 45) % 360)}
        style={({ pressed }) => [styles.rotateBtn, pressed && styles.pressed]}
      >
        <FontAwesome5 name="sync" size={s.icon} color="#e2e8f0" />
      </Pressable>
      <Pressable
        accessibilityLabel="Reiniciar vidas"
        onPress={reset}
        style={({ pressed }) => [styles.resetIconBtn, pressed && styles.pressed]}
      >
        <FontAwesome5 name="redo" size={s.icon} color="#e2e8f0" />
      </Pressable>
      <Pressable
        accessibilityLabel="Elegir colores"
        onPress={() => setShowPalette((v) => !v)}
        style={({ pressed }) => [styles.paletteBtn, pressed && styles.pressed]}
      >
        <FontAwesome5 name="palette" size={s.icon} color="#e2e8f0" />
      </Pressable>

      <View style={[styles.rotatable, { transform: [{ rotate: `${rotation}deg` }] }]}>
        <Text style={[styles.name, { fontSize: s.nameFont }]}>{name}</Text>
        <Text style={[styles.life, { fontSize: s.lifeFont }]}>{life}</Text>
        <View style={styles.controlsGrid}>
          <View style={styles.controlsRow}>
            <SquareAdjustButton label="-1" onPress={() => modify(-1)} fontSize={s.btnFont} />
            <SquareAdjustButton label="-5" onPress={() => modify(-5)} fontSize={s.btnFont} />
          </View>
          <View style={styles.controlsRow}>
            <SquareAdjustButton label="+1" onPress={() => modify(+1)} fontSize={s.btnFont} />
            <SquareAdjustButton label="+5" onPress={() => modify(+5)} fontSize={s.btnFont} />
          </View>
        </View>
      </View>

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
}: {
  label: string;
  onPress: () => void;
  fontSize: number;
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
      style={({ pressed }) => [styles.squareBtn, pressed && styles.pressed]}
    >
      <Text style={[styles.btnText, { fontSize }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    gap: 12,
  },
  name: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '700',
  },
  life: {
    color: '#f8fafc',
    fontSize: 64,
    fontWeight: '800',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  controlsGrid: {
    width: '100%',
    gap: 8,
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
  btnText: {
    color: '#0b1020',
    fontWeight: '800',
    fontSize: 16,
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
    top: 8,
    right: 56,
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
});

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
  return (
    <View style={{ position: 'absolute', bottom: 8, left: 8, right: 8, backgroundColor: '#0b1020cc', padding: 10, borderRadius: 12 }}>
      <Text style={{ color: '#e2e8f0', marginBottom: 6, fontWeight: '700', textAlign: 'center' }}>Colores (hasta 3)</Text>
      <Text style={{ color: '#cbd5e1', marginBottom: 4, fontWeight: '700' }}>Principales</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 6 }}>
        {mains.map(Swatch)}
      </View>
      <Pressable onPress={() => setShowExtras((v) => !v)} style={{ alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#334155', borderRadius: 8 }}>
        <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>{showExtras ? 'Ocultar más colores' : 'Mostrar más colores'}</Text>
      </Pressable>
      {showExtras && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8 }}
          contentContainerStyle={{ paddingHorizontal: 8, gap: 8, alignItems: 'center' }}
        >
          {extras.map(Swatch)}
        </ScrollView>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 8 }}>
        <Pressable onPress={onReset} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#475569', borderRadius: 8 }}>
          <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>Reset colores</Text>
        </Pressable>
        <Pressable onPress={onClose} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#334155', borderRadius: 8 }}>
          <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>Cerrar</Text>
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
