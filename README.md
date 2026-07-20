# Glyph Plugin Template

A starter for building a [Glyph](https://github.com/hamidfzm/glyph) plugin. Click **Use this template** to make your own repo.

A plugin is a single ES module (`main.js`) that default-exports `{ activate(ctx) }`, plus a `manifest.json`. Write your source across as many files as you like under `src/`; the build bundles them into one `main.js`.

## Develop

```bash
npm install
npm run build      # bundles src/ into main.js
npm run typecheck  # optional: tsc against the bundled glyph types
```

Try it in Glyph: command palette → **Manage Plugins…** → **Install from folder…** → pick this folder (after `npm run build`).

## The API

Everything lives in the **[plugin docs](https://glyph-md.github.io/plugins/)**: [Getting Started](https://glyph-md.github.io/plugins/getting-started), [Recipes](https://glyph-md.github.io/plugins/recipes), and the full [API Reference](https://glyph-md.github.io/plugins/api-reference), including the sandbox model (plugins run in an isolated worker by default; `"sandbox": false` needs a user-approved full-access grant). `src/main.ts` is a working sample of the surface, typed via [`types/glyph.d.ts`](types/glyph.d.ts).

Don't bundle React or Glyph internals; the host provides what you need through `ctx`.

## Publish

1. Set your `id`, `name`, `version`, and `description` in `manifest.json`, and list every shipped file (entry + assets) in `files`.
2. Push a tag matching the manifest version (`git tag v1.0.0 && git push origin v1.0.0`). The bundled [Release workflow](.github/workflows/release.yml) builds, zips `manifest.json` + the declared files, creates the GitHub release, and prints the zip's `sha256` plus a ready-to-paste registration snippet in the release notes.
3. Open a PR to the [marketplace](https://github.com/glyph-md/plugins) adding `plugins/<your-id>/plugin.json` (copy the snippet from the release notes, pick the right `category`) and a `README.md`. See its [CONTRIBUTING guide](https://github.com/glyph-md/plugins/blob/main/CONTRIBUTING.md).

Per release: bump `version` in `manifest.json`, push the matching tag, then PR the updated `version` + `packageUrl` + `sha256` to the marketplace; Glyph then offers users an in-app update.
