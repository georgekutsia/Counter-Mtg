import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type PlayerProps = {
  name: string;
};

const STARTING_LIFE = 20;

export default function Player({ name }: PlayerProps) {
  const [life, setLife] = useState<number>(STARTING_LIFE);

  const modify = (delta: number) => setLife((v) => v + delta);
  const reset = () => setLife(STARTING_LIFE);

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.life}>{life}</Text>
      <View style={styles.controlsRow}>
        <AdjustButton label="-5" onPress={() => modify(-5)} />
        <AdjustButton label="-1" onPress={() => modify(-1)} />
        <AdjustButton label="+1" onPress={() => modify(+1)} />
        <AdjustButton label="+5" onPress={() => modify(+5)} />
      </View>
      <Pressable
        onPress={reset}
        style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
      >
        <Text style={styles.resetText}>Reset</Text>
      </Pressable>
    </View>
  );
}

function AdjustButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
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
});
