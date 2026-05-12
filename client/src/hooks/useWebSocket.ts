import { useEffect, useRef, useCallback, useState } from "react";
import type { WSMessageIn, WSMessageOut } from "../types";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3001/ws";

type MessageHandler = (msg: WSMessageOut) => void;

export interface UseWebSocketReturn {
  sendMessage: (msg: WSMessageIn) => void;
  isConnected: boolean;
  isConnecting: boolean;
}

export function useWebSocket(onMessage: MessageHandler): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const onMessageRef = useRef(onMessage);
  const mountedRef = useRef(true);

  // Keep handler ref fresh without re-connecting
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setIsConnecting(true);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setIsConnected(true);
      setIsConnecting(false);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data) as WSMessageOut;
        onMessageRef.current(msg);
      } catch {
        console.error("Failed to parse WS message:", event.data);
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      setIsConnecting(true);
      // Auto-reconnect after 2 seconds
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((msg: WSMessageIn) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn("WebSocket not connected. Message dropped:", msg.type);
    }
  }, []);

  return { sendMessage, isConnected, isConnecting };
}
