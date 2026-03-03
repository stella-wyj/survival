import { useState, useEffect, useCallback, userRef } from 'react'
import { io } from 'socket.io-client';
import { Lobby, WaitingRoom } from './components/Lobby';
import { GameTable } from './components/GameTable';
import './App.css'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function App() {
    const [screen, setScreen] = useState('waiting');
    const [roomId, setRoomId] = useState(null);
    const [playerId, setPLayerId] = useState(null);
    const [roomInfo, setRoomInfo] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [selectedIds, setSelectedIds] = useState(null);
    const [error, setError] = useState(null);
    const [chatMessages, setChatMessages] = useState(null);
    const [chatInput, setChatInput] = useState(null);

}

export default App
