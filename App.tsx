import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaView, View, Text, Pressable, StyleSheet } from 'react-native';

type Player = {
  id: number;
  name: string;
  life: number;
};

const STARTING_LIFE = 20;

export default function App() {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Player 1', life: STARTING_LIFE },
    { id: 2, name: 'Player 2', life: STARTING_LIFE },
  ]);

  const modifyLife = (id: number, delta: number) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, life: p.life + delta } : p)));
  };

  const reset = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, life: STARTING_LIFE })));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Counter MTG</Text>
      <View style={styles.board}>
        {players.map((p) => (
          <View key={p.id} style={styles.playerCard}>
            <Text style={styles.playerName}>{p.name}</Text>
            <Text style={styles.life}>{p.life}</Text>

            <View style={styles.controlsRow}>
              <AdjustButton label="-5" onPress={() => modifyLife(p.id, -5)} />
              <AdjustButton label="-1" onPress={() => modifyLife(p.id, -1)} />
              <AdjustButton label="+1" onPress={() => modifyLife(p.id, +1)} />
              <AdjustButton label="+5" onPress={() => modifyLife(p.id, +5)} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Reset" onPress={reset} />
      </View>
    </SafeAreaView>
  );
}

function AdjustButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e2e8f0',
    textAlign: 'center',
    marginTop: 12,
  },
  board: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  playerCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
  },
  playerName: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '600',
  },
  life: {
    color: '#f8fafc',
    fontSize: 64,
    fontWeight: '800',
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  btn: {
    flex: 1,
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnPressed: {
    opacity: 0.8,
  },
  btnText: {
    color: '#0b1020',
    fontWeight: '800',
    fontSize: 16,
  },
  footer: {
    padding: 12,
  },
  primaryBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnPressed: {
    opacity: 0.9,
  },
  primaryBtnText: {
    color: '#052e12',
    fontWeight: '800',
    fontSize: 18,
  },
});
