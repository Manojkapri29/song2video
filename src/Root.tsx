import {Composition, staticFile} from 'remotion';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {Lyrics, Props} from './Lyrics';
import {Kinetic, KProps} from './Kinetic';
import {Premium, PProps} from './Premium';
import {Katha, KathaProps} from './Katha';
import {Brand, BrandProps} from './presets/Brand';
import {Explainer, ExplainerProps, explainerDuration, Card} from './presets/Explainer';
import {SocialPost, SocialProps} from './presets/SocialPost';
import {Sketch, SketchProps} from './Sketch';
import {Story, StoryProps, storyFrames} from './presets/Story';
import {AudioViz, AudioVizProps} from './AudioViz';
import {KailashFilm, FilmData} from './presets/KailashFilm';
import kailashFilm from '../public/kailash_film.json';
import film2027 from '../public/film2027.json';
import filmMerged from '../public/film_merged.json';
import kailashStory from '../public/kailash_story.json';
import kailashPro from '../public/kailash_pro.json';
import {Anant} from './presets/Anant';
import {Moment} from './kit/Moments';
import anantMoments from '../public/anant_moments.json';
import anantLines from '../public/anant_lines.json';
import {Storybook, StorybookProps} from './presets/Storybook';
import pahadiStory from '../public/pahadi.story.json';
import {Garuda, GProps} from './Garuda';
import garudaProps from '../public/garuda/props.json';
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

  <Composition id="KailashFilm" component={KailashFilm} width={1920} height={1080} fps={FPS} durationInFrames={FPS * 394}
    defaultProps={{data: kailashFilm as FilmData, audio: 'kailash_vo.mp3'}}
    calculateMetadata={async () => ({
      durationInFrames: Math.ceil((await getAudioDurationInSeconds(staticFile('kailash_vo.mp3'))) * FPS),
    })} />
  <Composition id="KailashStory" component={KailashFilm} width={1920} height={1080} fps={FPS} durationInFrames={FPS * 394}
    defaultProps={{data: kailashStory as FilmData, audio: 'kailash_vo.mp3'}}
    calculateMetadata={async () => ({
      durationInFrames: Math.ceil((await getAudioDurationInSeconds(staticFile('kailash_vo.mp3'))) * FPS),
    })} />
  <Composition id="KailashPro" component={KailashFilm} width={1920} height={1080} fps={FPS} durationInFrames={FPS * 394}
    defaultProps={{data: kailashPro as FilmData, audio: 'kailash_vo.mp3'}}
    calculateMetadata={async () => ({
      durationInFrames: Math.ceil((await getAudioDurationInSeconds(staticFile('kailash_vo.mp3'))) * FPS),
    })} />
  <Composition id="KailashVox" component={KailashFilm} width={1920} height={1080} fps={FPS} durationInFrames={FPS * 394}
    defaultProps={{data: {...(kailashPro as FilmData), theme: 'vox'}, audio: 'kailash_vo.mp3'}}
    calculateMetadata={async () => ({
      durationInFrames: Math.ceil((await getAudioDurationInSeconds(staticFile('kailash_vo.mp3'))) * FPS),
    })} />
  <Composition id="Anant" component={Anant} width={1280} height={720} fps={FPS} durationInFrames={15613}
    defaultProps={{moments: anantMoments as Moment[], lines: anantLines}} />
  <Composition id="Merged" component={KailashFilm} width={1920} height={1080} fps={FPS} durationInFrames={FPS * 861}
    defaultProps={{data: filmMerged as FilmData, audio: 'merged_vo.mp3'}}
    calculateMetadata={async () => ({
      durationInFrames: Math.ceil((await getAudioDurationInSeconds(staticFile('merged_vo.mp3'))) * FPS),
    })} />
  <Composition id="Film2027" component={KailashFilm} width={1920} height={1080} fps={FPS} durationInFrames={FPS * 454}
    defaultProps={{data: film2027 as FilmData, audio: 'film2027_vo.mp3'}}
    calculateMetadata={async () => ({
      durationInFrames: Math.ceil((await getAudioDurationInSeconds(staticFile('film2027_vo.mp3'))) * FPS),
    })} />
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
  {/* Pencil-sketch lyric video: drawings that sketch themselves, lyrics hand-lettered as sung. */}
  <Composition id="Sketch" component={Sketch} width={1920} height={1080} fps={FPS}
    durationInFrames={FPS * 60}
    defaultProps={{lines: [], title: '', handle: '@kathaaurrahasya', audio: ''} as unknown as SketchProps}
    calculateMetadata={async ({props}) => ({
      durationInFrames: Math.ceil(((props as SketchProps).duration
        ?? await getAudioDurationInSeconds(staticFile((props as SketchProps).audio))) * FPS),
    })} />
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
  {/* Vector storybook for a song: pages turn on beats from tools/audiomap.py. */}
  <Composition id="Storybook" component={Storybook} width={1920} height={1080} fps={FPS}
    durationInFrames={FPS * 180}
    defaultProps={{...pahadiStory, handle: '@KathaAurRahasya'} as unknown as StorybookProps}
    calculateMetadata={async ({props}) => ({
      durationInFrames: Math.ceil(
        (await getAudioDurationInSeconds(staticFile((props as StorybookProps).audio))) * FPS),
    })} />
  <Composition id="StorybookShort" component={Storybook} width={1080} height={1920} fps={FPS}
    durationInFrames={FPS * 180}
    defaultProps={{...pahadiStory, handle: '@KathaAurRahasya'} as unknown as StorybookProps}
    calculateMetadata={async ({props}) => ({
      durationInFrames: Math.ceil(
        (await getAudioDurationInSeconds(staticFile((props as StorybookProps).audio))) * FPS),
    })} />
  <Composition id="GarudaShort" component={Garuda} width={1080} height={1920} fps={FPS}
    durationInFrames={1210} defaultProps={garudaProps as unknown as GProps} />
  {/* Text to narrated cinematic explainer: tools/story2video.py writes the props file. */}
  <Composition id="Story" component={Story} width={1920} height={1080} fps={FPS} durationInFrames={FPS}
    defaultProps={{scenes: []} as StoryProps}
    calculateMetadata={({props}) => ({durationInFrames: storyFrames((props as StoryProps).scenes)})} />
  <Composition id="AudioVizShort" component={AudioViz} width={1080} height={1920} fps={FPS}
    durationInFrames={FPS * 60} defaultProps={audiovizProps as unknown as AudioVizProps}
    calculateMetadata={({props}) => ({
      durationInFrames: Math.ceil(((props as AudioVizProps).map?.duration ?? 60) * FPS),
    })} />
  </>
);
