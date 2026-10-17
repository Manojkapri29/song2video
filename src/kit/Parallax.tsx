import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * 2.5D parallax backdrop: a still plus its depth map, displaced on a mesh and filmed
 * with a real perspective camera. Unlike a ken-burns zoom, near and far move at
 * different rates, so ridges separate from the sky as the camera drifts.
 *
 * Depth maps come from tools/depthmap.py (<name>.depth.png, white = near).
 * Falls back to the flat image if WebGL2 or the depth map is missing.
 */

const COLS = 160;
const ROWS = 90;
const OVERSCAN = 1.16;      // mesh is wider than the frame so the camera never sees an edge

const VERT = `#version 300 es
in vec2 a_uv;
uniform sampler2D u_depth;
uniform vec2 u_cam;          // camera x/y offset in world units
uniform float u_dist;        // camera distance
uniform float u_aspect;
uniform float u_strength;    // how far the near plane pops toward the camera
out vec2 v_uv;
void main() {
  v_uv = a_uv;
  float d = texture(u_depth, vec2(a_uv.x, 1.0 - a_uv.y)).r;
  vec3 w = vec3((a_uv.x * 2.0 - 1.0) * u_aspect * ${OVERSCAN.toFixed(2)},
                (a_uv.y * 2.0 - 1.0) * ${OVERSCAN.toFixed(2)},
                (d - 0.5) * u_strength);
  float k = u_dist / (u_dist - w.z);
  gl_Position = vec4((w.x - u_cam.x) * k / u_aspect, (w.y - u_cam.y) * k, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
out vec4 o;
void main() { o = vec4(texture(u_tex, vec2(v_uv.x, 1.0 - v_uv.y)).rgb, 1.0); }`;

const mesh = () => {
  const uv: number[] = [];
  const idx: number[] = [];
  for (let r = 0; r <= ROWS; r++)
    for (let c = 0; c <= COLS; c++) uv.push(c / COLS, r / ROWS);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const a = r * (COLS + 1) + c;
      idx.push(a, a + 1, a + COLS + 1, a + 1, a + COLS + 2, a + COLS + 1);
    }
  return {uv: new Float32Array(uv), idx: new Uint32Array(idx)};
};

const compile = (gl: WebGL2RenderingContext, type: number, src: string) => {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
  return s;
};

const texture = (gl: WebGL2RenderingContext, img: HTMLImageElement, unit: number) => {
  const t = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  return t;
};

const load = (src: string) =>
  new Promise<HTMLImageElement>((ok, no) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => ok(i);
    i.onerror = () => no(new Error(`load ${src}`));
    i.src = src;
  });

/**
 * Camera path for one scene: a slow arc plus a push-in, direction alternating by index.
 * The travel is per second, not per shot, so a 4 s cut drifts as calmly as a 16 s one.
 */
export const camera = (p: number, idx: number, sec: number) => {
  const dir = idx % 2 ? -1 : 1;
  const ease = p * p * (3 - 2 * p);
  const swing = idx % 4 < 2 ? 'x' : 'y';
  const amp = Math.min(0.34, 0.03 * sec);
  const t = (ease - 0.5) * dir * amp;
  return {
    cx: swing === 'x' ? t : t * 0.3,
    cy: swing === 'y' ? t * 0.6 : t * 0.2,
    dist: interpolate(ease, [0, 1], [2.75, 2.75 - Math.min(0.33, 0.03 * sec)]),
  };
};

export const Parallax: React.FC<{
  src: string; depth: string; idx: number; dur: number; strength?: number; filter?: string;
}> = ({src, depth, idx, dur, strength = 0.42, filter = 'saturate(.85) contrast(1.05) brightness(.62)'}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const gl = useRef<{
    ctx: WebGL2RenderingContext; u: Record<string, WebGLUniformLocation | null>; count: number;
  } | null>(null);
  const [handle] = useState(() => delayRender(`parallax ${src}`));
  const [failed, setFailed] = useState(false);

  const draw = useCallback(() => {
    const g = gl.current;
    if (!g) return;
    const {cx, cy, dist} = camera(Math.min(1, frame / Math.max(1, dur)), idx, dur / fps);
    g.ctx.uniform2f(g.u.cam, cx, cy);
    g.ctx.uniform1f(g.u.dist, dist);
    g.ctx.drawElements(g.ctx.TRIANGLES, g.count, g.ctx.UNSIGNED_INT, 0);
  }, [frame, dur, idx, fps]);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const [img, dep] = await Promise.all([load(staticFile(src)), load(staticFile(depth))]);
        if (dead) return;
        const ctx = ref.current?.getContext('webgl2', {preserveDrawingBuffer: true, antialias: true});
        if (!ctx) throw new Error('no webgl2');
        const p = ctx.createProgram()!;
        ctx.attachShader(p, compile(ctx, ctx.VERTEX_SHADER, VERT));
        ctx.attachShader(p, compile(ctx, ctx.FRAGMENT_SHADER, FRAG));
        ctx.linkProgram(p);
        if (!ctx.getProgramParameter(p, ctx.LINK_STATUS)) throw new Error(ctx.getProgramInfoLog(p) ?? 'link');
        ctx.useProgram(p);

        const {uv, idx: tris} = mesh();
        ctx.bindVertexArray(ctx.createVertexArray());
        ctx.bindBuffer(ctx.ARRAY_BUFFER, ctx.createBuffer());
        ctx.bufferData(ctx.ARRAY_BUFFER, uv, ctx.STATIC_DRAW);
        const loc = ctx.getAttribLocation(p, 'a_uv');
        ctx.enableVertexAttribArray(loc);
        ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
        ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, ctx.createBuffer());
        ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, tris, ctx.STATIC_DRAW);

        texture(ctx, img, 0);
        texture(ctx, dep, 1);
        ctx.uniform1i(ctx.getUniformLocation(p, 'u_tex'), 0);
        ctx.uniform1i(ctx.getUniformLocation(p, 'u_depth'), 1);
        ctx.uniform1f(ctx.getUniformLocation(p, 'u_aspect'), width / height);
        ctx.uniform1f(ctx.getUniformLocation(p, 'u_strength'), strength);
        ctx.viewport(0, 0, width, height);

        gl.current = {
          ctx, count: tris.length,
          u: {cam: ctx.getUniformLocation(p, 'u_cam'), dist: ctx.getUniformLocation(p, 'u_dist')},
        };
        draw();
      } catch {
        if (!dead) setFailed(true);            // no WebGL2 / no depth map -> plain image below
      } finally {
        if (!dead) continueRender(handle);
      }
    })();
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, depth, width, height, strength]);

  useEffect(draw, [draw]);

  if (failed) {
    return (
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', filter}} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <canvas ref={ref} width={width} height={height}
        style={{width: '100%', height: '100%', display: 'block', filter}} />
    </AbsoluteFill>
  );
};
