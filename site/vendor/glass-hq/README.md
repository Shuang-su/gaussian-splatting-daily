# Glass HQ material renderer

MIT-licensed subset of Glass HQ at upstream `9f5bfc7daa7be5d20a41b94d841b8f065de655fc` with the WebGL2 port from Guangcai's `a24ffb03`. The local import uses a TypeScript GLSL string for Next.js and defines the small pixel-buffer type locally so the WebGPU renderer stays out of the dependency graph. The independently licensed `@lisse/core` v0.7.2 path distribution in `../lisse-core/` provides the continuous-corner outline. The application renders the optical source in DOM and uses the generated displacement and rim planes with SVG filters.
