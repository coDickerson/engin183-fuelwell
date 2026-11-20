// The /join demo loop (~12 s): Recipes -> Browse swaps -> Swap & eat out, edited from real captures
// of the live demo (public/frames, 1269x952 each, captured at 2x). Captions are NOT baked in: the page
// draws them in HTML so they follow the language buttons. Shot timings must match SHOTS in
// frontend/scripts/join-demo-video.js.
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';

export const DURATION = 360; // 12 s at 30 fps

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease } as const;

// Frame image coordinates (1269x952) -> composition (1200x900).
const S = 1200 / 1269;

/** A full-frame still with optional fade-in, vertical drift and zoom (origin in image px). */
const Still: React.FC<{
  src: string;
  len: number;
  fadeIn?: number;
  driftFrom?: number; // px, starts lower and settles at 0 (fake scroll)
  zoomTo?: number;
  origin?: [number, number];
  zoomStart?: number;
}> = ({ src, len, fadeIn = 6, driftFrom = 0, zoomTo = 1, origin = [634, 476], zoomStart = 0 }) => {
  const f = useCurrentFrame();
  const opacity = fadeIn ? interpolate(f, [0, fadeIn], [0, 1], clamp) : 1;
  const y = driftFrom ? interpolate(f, [0, 14], [driftFrom, 0], clamp) : 0;
  const scale = interpolate(f, [zoomStart, len], [1, zoomTo], clamp);
  return (
    <AbsoluteFill style={{ opacity }}>
      <Img
        src={staticFile(`frames/${src}.png`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translateY(${y}px) scale(${scale})`,
          transformOrigin: `${origin[0] * S}px ${origin[1] * S}px`,
        }}
      />
    </AbsoluteFill>
  );
};

/** A soft expanding ring, like a tap. x, y in image px. */
const Tap: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  const r = interpolate(f, [0, 12], [10, 70], clamp);
  const o = interpolate(f, [0, 4, 12], [0, 0.55, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute', left: x * S - r, top: y * S - r, width: r * 2, height: r * 2,
        borderRadius: '50%', background: 'rgba(15,110,84,0.35)', border: '3px solid rgba(15,110,84,0.7)', opacity: o,
      }}
    />
  );
};

/** The answer card "arriving": a light veil over everything below the button wipes away downward. */
const Reveal: React.FC<{ fromY: number }> = ({ fromY }) => {
  const f = useCurrentFrame();
  const top = interpolate(f, [4, 22], [fromY * S, 900], clamp);
  return <div style={{ position: 'absolute', left: 0, right: 0, top, bottom: 0, background: '#f4f6f5' }} />;
};

const TYPE = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'];

export const JoinDemo: React.FC = () => (
  <AbsoluteFill style={{ background: '#f4f6f5' }}>
    {/* 1. Recipes: 0-96 */}
    <Sequence from={0} durationInFrames={34}><Still src="r1" len={34} fadeIn={0} zoomTo={1.02} /></Sequence>
    <Sequence from={30} durationInFrames={30}><Still src="r2" len={30} driftFrom={60} fadeIn={5} /></Sequence>
    <Sequence from={56} durationInFrames={44}>
      <Still src="r3" len={44} fadeIn={7} zoomTo={1.08} origin={[400, 300]} zoomStart={10} />
    </Sequence>

    {/* 2. Browse swaps: 96-196 */}
    <Sequence from={96} durationInFrames={34}><Still src="b1" len={34} driftFrom={70} fadeIn={6} /></Sequence>
    <Sequence from={126} durationInFrames={30}><Still src="b1s" len={30} fadeIn={0} zoomTo={1.03} origin={[572, 347]} /></Sequence>
    <Sequence from={126} durationInFrames={14}><Tap x={572} y={347} /></Sequence>
    <Sequence from={152} durationInFrames={48}>
      <Still src="b2" len={48} driftFrom={80} fadeIn={6} zoomTo={1.05} origin={[330, 700]} zoomStart={14} />
    </Sequence>

    {/* 3. Swap & eat out: 196-360 (typing, tap Get swaps, answer arrives, scroll to what to watch) */}
    <Sequence from={196} durationInFrames={10}><Still src="t1" len={10} fadeIn={6} /></Sequence>
    {TYPE.slice(1).map((src, i) => (
      <Sequence key={src} from={206 + i * 4} durationInFrames={i === TYPE.length - 2 ? 16 : 4}>
        <Still src={src} len={4} fadeIn={0} />
      </Sequence>
    ))}
    <Sequence from={250} durationInFrames={42}>
      <Still src="a1" len={42} fadeIn={4} />
      <Reveal fromY={270} />
      <Tap x={663} y={184} />
    </Sequence>
    <Sequence from={288} durationInFrames={72}>
      <Still src="a2" len={72} driftFrom={90} fadeIn={6} zoomTo={1.03} origin={[634, 560]} zoomStart={16} />
    </Sequence>
  </AbsoluteFill>
);
