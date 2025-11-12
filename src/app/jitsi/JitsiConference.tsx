'use client';
import React, { useEffect, useRef } from 'react';
import useJitsi from '../../hooks/useJitsi';

export default function JitsiConference({ roomName = 'NextJsRoom' }: { roomName?: string }) {
  const { localTracks, remoteTracks } = useJitsi(roomName);
  const localVideoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // attach local video track to element
    const videoTrack = localTracks.find(t => t.getType && t.getType() === 'video');
    if (videoTrack && localVideoRef.current) {
      videoTrack.attach(localVideoRef.current);
      return () => videoTrack.detach(localVideoRef.current!);
    }
  }, [localTracks]);

  return (
    <div>
      <div ref={localVideoRef} style={{ width: 320, height: 240, background: '#000' }} />
      <div>
        {Object.entries(remoteTracks).map(([participantId, tracks]) =>
          tracks.map((t, i) => {
            const key = `${participantId}-${i}`;
            return <RemoteTrack key={key} track={t} />;
          })
        )}
      </div>
    </div>
  );
}

function RemoteTrack({ track }: { track: any }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!track || !ref.current) return;
    track.attach(ref.current);
    return () => track.detach(ref.current);
  }, [track]);
  return <div ref={ref} style={{ width: 320, height: 240 }} />;
}