/**
 * ==========================================================================
 * PARADOX ARENA — js/flower-border.js
 * Flower Border Graphic (Originkit Three.js Shader Port)
 * ==========================================================================
 * Three.js procedural flower fan shader running in a full-screen quad.
 * Colorway: Electric Violet (#7C3AED) petals and Acid Lime (#C6FF00) accents.
 * Optimized with IntersectionObserver for 60fps buttery scrolling.
 * ==========================================================================
 */

(function () {
  'use strict';

  const QUAD_VERTEX = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;

  const BORDER_FRAGMENT = `
    precision highp float;

    #define MAX_FLOWERS 9
    #define RANK_SHRINK 0.82
    #define RANK_SINK 0.09
    #define FULLNESS 0.92
    #define TAU 6.28318530718
    #define PI 3.14159265359

    uniform vec2 uResolution;
    uniform float uTime;
    uniform vec3 uPetal;
    uniform vec3 uLine;
    uniform vec3 uHeart;
    uniform vec4 uSides;
    uniform float uCount;
    uniform float uPetals;
    uniform float uSize;
    uniform float uPoint;
    uniform float uWeight;
    uniform float uSpread;
    uniform float uSway;

    varying vec2 vUv;

    /** Oklab back to linear-light RGB. */
    vec3 rgbFromOklab(vec3 lab) {
        float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
        float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
        float s = lab.x - 0.0894841775 * lab.y - 1.291485548 * lab.z;
        l = l * l * l;
        m = m * m * m;
        s = s * s * s;
        return vec3(
            4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
        );
    }

    /*
     * One petal, lying along the positive x axis of the wedge it was folded
     * into: broad where it meets the core, widest about a third of the way out,
     * and pointed at the tip.
     */
    float petalDist(vec2 q, float inner, float outer, float sector) {
        float t = clamp((q.x - inner) / max(outer - inner, 0.0001), 0.0, 1.0);

        /*
         * The room its own wedge has at this radius. Near the core this is the
         * smaller of the two and so the one that decides: the petal fills the
         * ring there and its neighbours meet it, which is what makes the flower
         * read as one thing rather than as petals scattered near a dot.
         */
        float room = q.x * sin(sector * 0.5) * FULLNESS;

        /*
         * And a fixed width, taken from the room at the middle of the reach and
         * shaped by a quarter cosine: full at the base, nothing at the tip.
         * Further out this is the smaller one, which is what stops the petal
         * carrying on widening with the radius the way a plain wedge does.
         *
         * A quarter cosine and not the obvious half sine: a sine closes at both
         * ends, so the petal would come to a point where it meets the core as
         * well as at its tip and float there like a grain of rice.
         *
         * Floored at nought before the power. At the tip the cosine comes out a
         * hair below zero in floating point, and a negative base under a
         * fractional power is undefined — what comes back is not a number, it
         * survives every max and mix after it, and it lands as a ring of white
         * right around the flower.
         */
        float wide = (inner + outer) * 0.5 * sin(sector * 0.5) * FULLNESS;
        float taper = wide * pow(max(cos(PI * 0.5 * t), 0.0), uPoint);

        float d = abs(q.y) - min(room, taper);
        // Cut at both ends, or the petal runs on as a hairline along the axis.
        d = max(d, q.x - outer);
        return max(d, inner - q.x);
    }

    void main() {
        float aspect = uResolution.x / max(uResolution.y, 1.0);

        /*
         * Height units: y runs 0..1 across the frame and x runs 0..aspect. Every
         * radius, gap and half-span below lives in this one space, so nothing has
         * to be converted per edge and a size means the same thing on all four.
         */
        vec2 p = vec2(vUv.x * aspect, vUv.y);

        vec3 petalCol = rgbFromOklab(uPetal);
        vec3 lineCol = rgbFromOklab(uLine);
        vec3 heartCol = rgbFromOklab(uHeart);

        vec3 col = vec3(0.0);
        float cover = 0.0;

        /*
         * The outermost rank in the fan. Spread places THAT one, and every rank
         * inside it divides the same room up — which is what keeps the fan on
         * the frame at any count.
         */
        float maxRank = max(ceil((uCount - 1.0) * 0.5), 1.0);

        /*
         * Walked from the outside of the fan inward, so the middle flower is
         * laid down last and everything else tucks in behind it. Taken in index
         * order, the newest flower would sit on top of the one it is meant to
         * hide behind.
         */
        for (int j = 0; j < MAX_FLOWERS; j++) {
            int i = MAX_FLOWERS - 1 - j;
            float fi = float(i);
            if (fi < uCount) {
                // Nought is the middle; every one after alternates sides and
                // steps one further out.
                float rank = ceil(fi * 0.5);
                float side = mod(fi, 2.0) < 0.5 ? -1.0 : 1.0;

                // Top, bottom, left, right — each with its own phase so no two
                // rows are one row flipped.
                for (int e = 0; e < 4; e++) {
                    // A loop index is a constant-index-expression, so this is a
                    // legal vector subscript in GLSL ES 1.00.
                    if (uSides[e] > 0.5) {
                        float fe = float(e);
                        float seed = fract(sin((fi + fe * 13.0) * 37.13) * 43758.5453);

                        /*
                         * The edge as a frame: a point at the middle of it, the
                         * inward normal, the tangent the fan opens along, and
                         * how much room that tangent has to either side. Past
                         * this nothing below knows which edge it is drawing.
                         */
                        vec2 c, n, t;
                        float halfSpan;
                        if (e == 0) {
                            c = vec2(aspect * 0.5, 0.0);
                            n = vec2(0.0, 1.0);
                            t = vec2(1.0, 0.0);
                            halfSpan = aspect * 0.5;
                        } else if (e == 1) {
                            c = vec2(aspect * 0.5, 1.0);
                            n = vec2(0.0, -1.0);
                            t = vec2(1.0, 0.0);
                            halfSpan = aspect * 0.5;
                        } else if (e == 2) {
                            c = vec2(0.0, 0.5);
                            n = vec2(1.0, 0.0);
                            t = vec2(0.0, 1.0);
                            halfSpan = 0.5;
                        } else {
                            c = vec2(aspect, 0.5);
                            n = vec2(-1.0, 0.0);
                            t = vec2(0.0, 1.0);
                            halfSpan = 0.5;
                        }

                        float radius = uSize * pow(RANK_SHRINK, rank);

                        // Along the edge: the outermost rank lands at Spread of
                        // the half-span, the rest share it out evenly.
                        float along = side * rank * (uSpread * halfSpan / maxRank);
                        /*
                         * And into the frame: rooted outside it, and deeper the
                         * further back in the fan it stands. Both terms scale
                         * with the flower's OWN radius, so a rank can never sink
                         * further out than it is wide however far the shrink has
                         * taken it.
                         */
                        float into = radius * (0.55 - rank * RANK_SINK);

                        vec2 centre = c + t * along + n * into;

                        float tip = sin(uTime * (0.7 + seed * 0.7) + seed * TAU) * uSway;

                        vec2 q0 = p - centre;
                        float r0 = length(q0);
                        float a0 = atan(q0.y, q0.x) - tip;

                        float sector = TAU / uPetals;
                        /*
                         * The fold: the angle taken modulo one petal's share
                         * and mirrored about the middle of it. Every petal is
                         * now the same petal, so the flower is exactly
                         * symmetric.
                         */
                        float a = mod(a0 + sector * 0.5, sector) - sector * 0.5;
                        vec2 q = vec2(cos(a), sin(a)) * r0;

                        /*
                         * Starting at the core's own radius, so the petals
                         * spring from its edge. Started further in they cross
                         * underneath it and the flat cut at their base shows
                         * through.
                         */
                        float d = petalDist(q, radius * 0.2, radius, sector);
                        float aa = max(fwidth(d), 0.0001);
                        float solid = 1.0 - smoothstep(-aa, aa, d);

                        float w = uWeight / uResolution.y;
                        float stroke = 1.0 - smoothstep(w - aa, w + aa, abs(d));

                        // The heart, drawn over its own petals and under the
                        // next flower in front. A shade wider than where the
                        // petals begin, so the cut across each of their bases is
                        // covered by it.
                        float dc = r0 - radius * 0.22;
                        float aac = max(fwidth(dc), 0.0001);
                        float eye = 1.0 - smoothstep(-aac, aac, dc);
                        float eyeLine = 1.0 - smoothstep(w - aac, w + aac, abs(dc));

                        /*
                         * Fill first, then the line over it. Crossfaded between
                         * the two it would be a soft shape; laid in this order
                         * it is a filled shape with a drawn edge, which is what
                         * reads as drawn.
                         */
                        col = mix(col, petalCol, solid);
                        col = mix(col, lineCol, stroke);
                        col = mix(col, heartCol, eye);
                        col = mix(col, lineCol, eyeLine);

                        cover = max(cover, max(max(solid, stroke), max(eye, eyeLine)));
                    }
                }
            }
        }

        if (cover < 0.004) discard;

        // Premultiplied, so the frame shows between the flowers.
        gl_FragColor = vec4(col * cover, cover);
    }
`;

  function toOklab(hex, fallback) {
    if (typeof THREE === 'undefined') return { x: 0, y: 0, z: 0 };
    const c = new THREE.Color(hex || fallback);
    const l = Math.cbrt(0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b);
    const m = Math.cbrt(0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b);
    const s = Math.cbrt(0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b);
    return new THREE.Vector3(
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    );
  }

  window.initFlowerBorder = function () {
    if (typeof THREE === 'undefined') return;

    const container = document.getElementById('flower-border-container');
    if (!container) return;

    let renderer = null;
    let scene = null;
    let camera = null;
    let material = null;
    let mesh = null;
    let isVisible = false;
    let rafId = 0;
    let time = 0;
    let lastT = performance.now();

    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);

      const el = renderer.domElement;
      el.style.position = "absolute";
      el.style.inset = "0";
      el.style.width = "100%";
      el.style.height = "100%";
      container.appendChild(el);

      scene = new THREE.Scene();
      camera = new THREE.Camera();
      const geometry = new THREE.PlaneGeometry(2, 2);

      material = new THREE.ShaderMaterial({
        vertexShader: QUAD_VERTEX,
        fragmentShader: BORDER_FRAGMENT,
        uniforms: {
          uResolution: { value: new THREE.Vector2(1, 1) },
          uTime: { value: 0 },
          uPetal: { value: toOklab("#7C3AED", "#7C3AED") },
          uLine: { value: toOklab("#C6FF00", "#C6FF00") },
          uHeart: { value: toOklab("#C6FF00", "#C6FF00") },
          uSides: { value: new THREE.Vector4(1, 1, 0, 0) }, // top & bottom
          uCount: { value: 9 },
          uPetals: { value: 5 },
          uSize: { value: 0.18 },
          uPoint: { value: 1.4 },
          uWeight: { value: 1.0 },
          uSpread: { value: 0.85 },
          uSway: { value: 0.12 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

      mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      scene.add(mesh);
    } catch (e) {
      console.warn("FlowerBorder initialization skipped:", e);
      return;
    }

    function resize() {
      if (!renderer || !material) return;
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));

      renderer.setSize(w, h, false);
      const dpr = renderer.getPixelRatio();
      material.uniforms.uResolution.value.set(w * dpr, h * dpr);
      material.uniforms.uWeight.value = 1.0 * dpr;
    }

    function step(now) {
      if (!isVisible) return;

      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      time += dt;

      material.uniforms.uTime.value = time;
      renderer.render(scene, camera);

      rafId = requestAnimationFrame(step);
    }

    function start() {
      if (rafId) cancelAnimationFrame(rafId);
      lastT = performance.now();
      rafId = requestAnimationFrame(step);
    }

    function stop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            resize();
            start();
          } else {
            stop();
          }
        });
      }, { threshold: 0.05 });
      observer.observe(container);
    } else {
      isVisible = true;
      start();
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();
  };
})();
