declare module 'lib-jitsi-meet' {
  export interface JitsiConnection {
    connect(): void;
    disconnect(): void;
    addEventListener(event: any, handler: (...args: any[]) => void): void;
    initJitsiConference(roomName: string, options?: any): JitsiConference;
  }

  export interface JitsiLocalTrack {
    dispose(): void;
    attach(element: HTMLElement | HTMLMediaElement | Element | null): void;
    detach(element?: HTMLElement | null): void;
    getType(): string;
    isLocal(): boolean;
  }

  export interface JitsiTrack extends JitsiLocalTrack {
    getParticipantId(): string;
    addEventListener(event: any, handler: (...args: any[]) => void): void;
  }

  export interface JitsiConference {
    on(event: any, handler: (...args: any[]) => void): void;
    addTrack(track: JitsiLocalTrack): void;
    join(): void;
  }

  export function init(options?: any): void;
  export function createLocalTracks(opts?: any): Promise<JitsiLocalTrack[]>;
  export const events: any;
  export const JitsiConnection: any;
  const _default: any;
  export default _default;
}