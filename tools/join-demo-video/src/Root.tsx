import React from 'react';
import { Composition } from 'remotion';
import { JoinDemo, DURATION } from './JoinDemo';

export const Root: React.FC = () => (
  <Composition id="JoinDemo" component={JoinDemo} durationInFrames={DURATION} fps={30} width={1200} height={900} />
);
