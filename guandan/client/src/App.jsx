import { useState, useEffect, useCallback, userRef } from 'react'
import { io } from 'socket.io-client';
import { Lobby, WaitingRoom } from './components/Lobby';
import { GameTable } from './components/GameTable';
import './App.css'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function App() {
}

export default App
