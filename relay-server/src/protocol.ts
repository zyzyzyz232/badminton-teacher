import type { SessionState } from './session.js'

export type ClientToServer =
  | { type: 'join'; role: 'display' | 'mobile'; roomId?: string; token?: string }
  | { type: 'command'; name: string; payload?: Record<string, unknown> }

export type ServerToClient =
  | {
      type: 'joined'
      roomId: string
      token: string
      role: 'display' | 'mobile'
      state: SessionState
    }
  | { type: 'state'; state: SessionState }
  | { type: 'error'; code: string; message: string }
