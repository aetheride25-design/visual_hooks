# Why Remotion

Before building, three options were compared by reading the npm registry (`npm view`, without installing), the published
source and `.d.ts` files, and the official docs (September 2026).

| | HyperFrames 0.8.69 | **Remotion 4.0.527** | GSAP or Three.js + your own renderer |
|---|---|---|---|
| Preview with a timeline scrubber | `<hyperframes-player controls>` + `seek()` | `<Player controls>` + `seekTo(frame)` | build it yourself |
| Live params in your own app | via `setRuntimeData` (only documented in the code) or reloading | **native**: `inputProps` bound to state | build it yourself |
| Same code for preview and render | yes | yes | up to you |
| Frame-accurate input video | extracts frames with FFmpeg | `<Video>` from `@remotion/media` | up to you |
| ProRes 4444 with alpha | `--format mov` | `codec:'prores'`, `proResProfile:'4444'`, `pixelFormat:'yuva444p10le'` | by hand with `prores_ks` |
| PNG sequence | `--format png-sequence` | `renderFrames({imageFormat:'png'})` | by hand |
| AMD GPU encoding | yes (`--gpu`, AMF) | no (NVIDIA or Mac only); H.264 on the CPU | yes (`h264_amf`) |
| License | Apache-2.0 | free for individuals and companies of up to 3 people ([details](https://www.remotion.dev/license)) | GSAP free (restriction: don't compete with Webflow) |
| Maturity | pre-1.0, near-daily releases, telemetry on by default | mature, well-documented v4 | you maintain everything |
| Downloads | headless Chrome ~114 MB | headless Chrome ~113 MB | Chrome (or yours) |

**Remotion won** because the core of the project is the app: live params plus a timeline, with the same code for export,
and Remotion ships that out of the box. HyperFrames is a good option if you prefer writing HTML + GSAP.

**Learned while building**: `<OffthreadVideo>` failed intermittently when exporting ProRes and PNG ("No frame found at
position…"). The [official guide for that error](https://www.remotion.dev/docs/troubleshooting/no-frame-found-at-position)
recommends `<Video>` from `@remotion/media` for new projects. After switching, every effect exported cleanly.
