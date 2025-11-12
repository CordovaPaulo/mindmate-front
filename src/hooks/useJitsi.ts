'use client';
import { useEffect, useRef, useState } from 'react';
import type { JitsiConnection, JitsiLocalTrack, JitsiTrack } from 'lib-jitsi-meet';

export default function useJitsi(roomName: string) {
  const [JitsiMeetJS, setJitsiMeetJS] = useState<any>(null);
  const connectionRef = useRef<any>(null);
  const [localTracks, setLocalTracks] = useState<JitsiLocalTrack[]>([]);
  const [remoteTracks, setRemoteTracks] = useState<Record<string, JitsiTrack[]>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      const Jitsi = await import('lib-jitsi-meet');
      if (!mounted) return;
      setJitsiMeetJS(Jitsi);

      const initOptions = { disableAudioLevels: true };
      Jitsi.init(initOptions);

      const connectionConfig = {
        // Use your XMPP server. For meet.jit.si:
        hosts: { domain: 'meet.jit.si', muc: 'conference.meet.jit.si' },
        bosh: 'https://meet.jit.si/http-bind', // or xmpp-websocket
        serviceUrl: 'wss://meet.jit.si/xmpp-websocket',
      };

      const connection: JitsiConnection = new Jitsi.JitsiConnection(null, null, connectionConfig);
      connectionRef.current = connection;

      connection.addEventListener(Jitsi.events.connection.CONNECTION_ESTABLISHED, async () => {
        const room = connection.initJitsiConference(roomName, {});
        room.on(Jitsi.events.conference.TRACK_ADDED, (track: any) => {
          if (track.isLocal()) return;
          const participantId = track.getParticipantId();
          setRemoteTracks(prev => {
            const next = { ...prev };
            next[participantId] = (next[participantId] || []).concat(track);
            return next;
          });
          track.addEventListener(Jitsi.events.track.TRACK_AUDIO_LEVEL_CHANGED, () => {});
        });
        room.on(Jitsi.events.conference.TRACK_REMOVED, (track: any) => {
          const participantId = track.getParticipantId();
          setRemoteTracks(prev => {
            const next = { ...prev };
            next[participantId] = (next[participantId] || []).filter(t => t !== track);
            return next;
          });
        });

        // create local tracks (audio + video)
        const tracks = await Jitsi.createLocalTracks({ devices: ['audio', 'video'] });
        setLocalTracks(tracks);
        tracks.forEach((t: any) => room.addTrack(t));
        room.join();
      });

      connection.connect();
    })();

    return () => {
      mounted = false;
      // graceful cleanup: dispose tracks and disconnect
      localTracks.forEach(t => t && typeof t.dispose === 'function' && t.dispose());
      if (connectionRef.current) {
        try { connectionRef.current.disconnect(); } catch {}
      }
    };
  }, [roomName]);

  return { JitsiMeetJS, localTracks, remoteTracks };
}