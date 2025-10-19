import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

type PlayerProps = {
  name: string;
  size?: 'small' | 'medium' | 'large';
};

const STARTING_LIFE = 20;

export default function Player({ name, size = 'large' }: PlayerProps) {
  const [life, setLife] = useState<number>(STARTING_LIFE);
  const [rotation, setRotation] = useState<number>(0);

  const modify = (delta: number) => setLife((v) => v + delta);
  const reset = () => setLife(STARTING_LIFE);
  const s = useMemo(() => sizesByMode(size), [size]);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Girar jugador"
        onPress={() => setRotation((r) => (r + 90) % 360)}
        style={({ pressed }) => [styles.rotateBtn, pressed && styles.pressed]}
      >
        <FontAwesome5 name="sync" size={s.icon} color="#e2e8f0" />
      </Pressable>

      <View style={[styles.rotatable, { transform: [{ rotate: `${rotation}deg` }] }]}>
        <Text style={[styles.name, { fontSize: s.nameFont }]}>{name}</Text>
        <Text style={[styles.life, { fontSize: s.lifeFont }]}>{life}</Text>
        <View style={styles.controlsRow}>
          <AdjustButton label="-5" onPress={() => modify(-5)} padH={s.btnPadH} padV={s.btnPadV} />
          <AdjustButton label="-1" onPress={() => modify(-1)} padH={s.btnPadH} padV={s.btnPadV} />
          <AdjustButton label="+1" onPress={() => modify(+1)} padH={s.btnPadH} padV={s.btnPadV} />
          <AdjustButton label="+5" onPress={() => modify(+5)} padH={s.btnPadH} padV={s.btnPadV} />
        </View>
        <Pressable
          onPress={reset}
          style={({ pressed }) => [
            styles.resetBtn,
            { paddingVertical: s.btnPadV, paddingHorizontal: s.btnPadH },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.resetText, { fontSize: s.btnFont }]}>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AdjustButton({
  label,
  onPress,
  padH,
  padV,
}: {
  label: string;
  onPress: () => void;
  padH: number;
  padV: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { paddingHorizontal: padH, paddingVertical: padV },
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.btnText}>{label}</Text>
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
  },
  btn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnText: {
    color: '#0b1020',
    fontWeight: '800',
    fontSize: 16,
  },
  resetBtn: {
    marginTop: 8,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  resetText: {
    color: '#052e12',
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
});

function sizesByMode(mode: 'small' | 'medium' | 'large') {
  switch (mode) {
    case 'small':
      return { lifeFont: 40, nameFont: 14, btnPadH: 10, btnPadV: 8, btnFont: 14, icon: 18 };
    case 'medium':
      return { lifeFont: 52, nameFont: 16, btnPadH: 12, btnPadV: 10, btnFont: 16, icon: 20 };
    default:
      return { lifeFont: 64, nameFont: 18, btnPadH: 16, btnPadV: 12, btnFont: 16, icon: 22 };
  }
}
