import React, { useState } from 'react';
import Menu from './pages/Menu';
import Game from './pages/Game';

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [players, setPlayers] = useState<number>(2);
  const [startingLife, setStartingLife] = useState<20 | 30 | 40>(20);

  if (screen === 'menu') {
    return (
      <Menu
        initialPlayers={players}
        initialLife={startingLife}
        onStart={(n, life) => {
          setPlayers(n);
          setStartingLife(life);
          setScreen('game');
        }}
      />
    );
  }

  return (
    <Game
      count={players}
      startingLife={startingLife}
      onBack={() => setScreen('menu')}
      onUpdate={(n, life) => {
        setPlayers(n);
        setStartingLife(life);
      }}
    />
  );
}
