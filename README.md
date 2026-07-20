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

`src/main.ts` shows the v1 surface (typed via [`types/glyph.d.ts`](types/glyph.d.ts)):

- `ctx.commands.register({ id, title, run })` — add a command to the palette.
- `ctx.ui.addStatusBarItem({ id, mount })` — add a status bar item; `mount(el, registerCleanup)` is framework-agnostic.
- `ctx.notify(message)` — show a toast.
- `ctx.registerTranslations(locale, namespace, resources)` — ship and read your own i18n strings.
- `ctx.apiVersion` — the host's plugin API version.

Don't bundle React or Glyph internals; the host provides what you need through `ctx`.

Plugins run sandboxed by default (an isolated worker): `fetch` is limited to your declared `network:<host>` permissions, and the ctx subset is commands, `ui.addStyles`, exporters, workspace, assets, settings, notify, and translations. Need the markdown APIs or DOM mounts? Declare `"sandbox": false` in `manifest.json`; users then have to accept a separate full-access warning before your plugin runs. See the [API reference](https://github.com/glyph-md/plugins/blob/main/docs/api-reference.md#sandboxed-plugins).

## Publish

1. Set your `id`, `name`, `version`, and `description` in `manifest.json`, and list every shipped file (entry + assets) in `files`.
2. Push a tag matching the manifest version (`git tag v1.0.0 && git push origin v1.0.0`). The bundled [Release workflow](.github/workflows/release.yml) builds, zips `manifest.json` + the declared files, creates the GitHub release, and prints the zip's `sha256` plus a ready-to-paste registration snippet in the release notes.
3. Open a PR to the [marketplace](https://github.com/glyph-md/plugins) adding `plugins/<your-id>/plugin.json` (copy the snippet from the release notes, pick the right `category`) and a `README.md`. See its [CONTRIBUTING guide](https://github.com/glyph-md/plugins/blob/main/CONTRIBUTING.md).

Per release: bump `version` in `manifest.json`, push the matching tag, then PR the updated `version` + `packageUrl` + `sha256` to the marketplace; Glyph then offers users an in-app update.
