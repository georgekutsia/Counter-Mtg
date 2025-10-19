import React, { useMemo } from 'react';
import { SafeAreaView, View, StyleSheet, Pressable, Text } from 'react-native';
import Player from '../components/Player';

type GameProps = {
  count: number; // 1..6
  onBack: () => void;
};

export default function Game({ count, onBack }: GameProps) {
  const capped = Math.max(1, Math.min(6, count));
  const topCount = Math.ceil(capped / 2);
  const bottomCount = capped - topCount;

  const palette = useMemo(
    () => ['#1e40af', '#b91c1c', '#0f766e', '#7e22ce', '#b45309', '#2563eb'],
    [],
  );

  const size = useMemo(() => {
    if (capped >= 5) return 'small';
    if (capped >= 3) return 'medium';
    return 'large';
  }, [capped]) as 'small' | 'medium' | 'large';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.rows}>
        <View style={styles.row}>
          {Array.from({ length: topCount }, (_, idx) => {
            const color = palette[idx % palette.length];
            return (
              <View key={`top-${idx}`} style={[styles.cell, { backgroundColor: color }]}>
                <Player name={`Player ${idx + 1}`} size={size} />
              </View>
            );
          })}
        </View>

        <View style={styles.row}>
          {Array.from({ length: bottomCount }, (_, idx) => {
            const color = palette[(topCount + idx) % palette.length];
            return (
              <View key={`bottom-${idx}`} style={[styles.cell, { backgroundColor: color }]}>
                <Player name={`Player ${topCount + idx + 1}`} size={size} />
              </View>
            );
          })}
        </View>
      </View>

      <Pressable onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>Cambiar jugadores</Text>
      </Pressable>
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
  backBtn: {
    margin: 12,
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backText: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 16,
  },
});
