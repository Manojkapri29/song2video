import {Composition, staticFile} from 'remotion';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {Lyrics, Props} from './Lyrics';
import {Kinetic, KProps} from './Kinetic';
import {Premium, PProps} from './Premium';
import {Katha, KathaProps} from './Katha';
import {Brand, BrandProps} from './presets/Brand';
import {Explainer, ExplainerProps, explainerDuration, Card} from './presets/Explainer';
import {SocialPost, SocialProps} from './presets/SocialPost';
import {AudioViz, AudioVizProps} from './AudioViz';
import lyrics from '../public/lyrics.json';
import bhajan from '../public/bhajan.json';
import katha from '../public/katha_final.json';
import explainer from '../public/explainer.json';
import songProps from '../public/song.props.json';
import audiovizProps from '../public/audioviz.props.json';

const FPS = 30;
/** A song takes its length from its audio; a clip edit carries its own `duration`. */
const songFrames = async (props: KathaProps) =>
  Math.ceil((props.duration
    ?? await getAudioDurationInSeconds(staticFile(props.audio ?? 'song.mp3'))) * FPS);
const calc = async () => ({
  durationInFrames: Math.ceil((await getAudioDurationInSeconds(staticFile('song.mp3'))) * FPS),
});

export const Root = () => (
  <>
  <Composition
    id="Lyrics"
    component={Lyrics}
    width={1920}
    height={1080}
    fps={FPS}
    durationInFrames={FPS * 60}
    defaultProps={{lines: lyrics} as Props}
    calculateMetadata={async () => ({
      durationInFrames: Math.ceil((await getAudioDurationInSeconds(staticFile('song.mp3'))) * FPS),
    })}
  />
  <Composition
    id="Kinetic"
    component={Kinetic}
    width={1920}
    height={1080}
    fps={FPS}
    durationInFrames={FPS * 60}
    defaultProps={{lines: lyrics, title: 'GOVIND BOLO', tag: 'BHAJAN'} as KProps}
    calculateMetadata={calc}
  />
  <Composition
    id="Bhajan"
    component={Kinetic}
    width={1920}
    height={1080}
    fps={FPS}
    durationInFrames={FPS * 60}
    defaultProps={{lines: bhajan.lines, title: bhajan.title, tag: 'BHAJAN', audio: 'bhajan.mp3'} as KProps}
    calculateMetadata={async () => ({
      durationInFrames: Math.ceil((await getAudioDurationInSeconds(staticFile('bhajan.mp3'))) * FPS),
    })}
  />
  <Composition
    id="Premium"
    component={Premium}
    width={1920}
    height={1080}
    fps={FPS}
    durationInFrames={FPS * 60}
    defaultProps={{lines: bhajan.lines, title: bhajan.title, tag: 'BHAJAN', audio: 'bhajan_remix.mp3'} as PProps}
    calculateMetadata={async ({props}) => ({
      durationInFrames: Math.ceil((await getAudioDurationInSeconds(staticFile((props as PProps).audio ?? 'bhajan_remix.mp3'))) * FPS),
    })}
  />
  <Composition
    id="Katha"
    component={Katha}
    width={1920}
    height={1080}
    fps={FPS}
    durationInFrames={FPS * 60}
    defaultProps={{lines: katha, title: 'कथा और रहस्य', tag: 'KATHA AUR RAHASYA', audio: 'song.mp3'} as KathaProps}
    calculateMetadata={async () => ({
      durationInFrames: Math.ceil((await getAudioDurationInSeconds(staticFile('song.mp3'))) * FPS),
    })}
  />
  <Composition
    id="KathaShort"
    component={Katha}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={FPS * 60}
    defaultProps={{lines: katha, title: 'कथा और रहस्य', tag: 'KATHA AUR RAHASYA', audio: 'song.mp3'} as KathaProps}
    calculateMetadata={async () => ({
      durationInFrames: Math.ceil((await getAudioDurationInSeconds(staticFile('song.mp3'))) * FPS),
    })}
  />
  <Composition id="Intro" component={Brand} width={1920} height={1080} fps={FPS} durationInFrames={FPS * 6}
    defaultProps={{title: 'कथा और रहस्य', sub: 'KATHA AUR RAHASYA', mark: '🔱', theme: 'katha', variant: 'intro', audio: 'intro_sting.wav'} as BrandProps} />
  <Composition id="Outro" component={Brand} width={1920} height={1080} fps={FPS} durationInFrames={FPS * 8}
    defaultProps={{title: 'जुड़े रहो', sub: 'अगली कथा जल्द', mark: '🔱', theme: 'katha', variant: 'outro', audio: 'outro_sting.wav'} as BrandProps} />
  <Composition id="IntroShort" component={Brand} width={1080} height={1920} fps={FPS} durationInFrames={FPS * 6}
    defaultProps={{title: 'कथा और रहस्य', sub: 'KATHA AUR RAHASYA', mark: '🔱', theme: 'katha', variant: 'intro', audio: 'intro_sting.wav'} as BrandProps} />

  <Composition id="Explainer" component={Explainer} width={1920} height={1080} fps={FPS} durationInFrames={FPS * 19}
    defaultProps={explainer as ExplainerProps}
    calculateMetadata={async ({props}) => ({
      durationInFrames: explainerDuration((props as ExplainerProps).cards as Card[], FPS),
    })} />
  <Composition id="ExplainerShort" component={Explainer} width={1080} height={1920} fps={FPS} durationInFrames={FPS * 19}
    defaultProps={explainer as ExplainerProps}
    calculateMetadata={async ({props}) => ({
      durationInFrames: explainerDuration((props as ExplainerProps).cards as Card[], FPS),
    })} />

  <Composition id="SocialPost" component={SocialPost} width={1080} height={1920} fps={FPS} durationInFrames={FPS * 7}
    defaultProps={{hook: 'जो दिखा वो आधा है', body: 'हर मंदिर की दीवार में एक इंतज़ार है।',
      cta: 'पूरी कथा देखो', handle: '@kathaaurrahasya', theme: 'katha'} as SocialProps} />
  {/* Generic song -> lyric video. tools/song2video.py writes the props file;
      render with --props=out/<slug>.props.json to do any song without touching code. */}
  <Composition id="Song" component={Katha} width={1920} height={1080} fps={FPS} durationInFrames={FPS * 60}
    defaultProps={{...songProps, lines: katha} as KathaProps}
    calculateMetadata={async ({props}) => ({durationInFrames: await songFrames(props as KathaProps)})} />
  <Composition id="SongShort" component={Katha} width={1080} height={1920} fps={FPS} durationInFrames={FPS * 60}
    defaultProps={{...songProps, lines: katha} as KathaProps}
    calculateMetadata={async ({props}) => ({durationInFrames: await songFrames(props as KathaProps)})} />
  {/* One-click: tools/autoviz.py analyses the audio and renders this. Its length comes
      from the audio map, not from a prop anyone has to keep in sync. */}
  <Composition id="AudioViz" component={AudioViz} width={1920} height={1080} fps={FPS}
    durationInFrames={FPS * 60} defaultProps={audiovizProps as unknown as AudioVizProps}
    calculateMetadata={({props}) => ({
      durationInFrames: Math.ceil(((props as AudioVizProps).map?.duration ?? 60) * FPS),
    })} />
  <Composition id="AudioVizShort" component={AudioViz} width={1080} height={1920} fps={FPS}
    durationInFrames={FPS * 60} defaultProps={audiovizProps as unknown as AudioVizProps}
    calculateMetadata={({props}) => ({
      durationInFrames: Math.ceil(((props as AudioVizProps).map?.duration ?? 60) * FPS),
    })} />
  </>
);
