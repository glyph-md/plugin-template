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

Need network access or no UI mounts? Set `"sandbox": true` in `manifest.json` to run in an isolated worker: `fetch` is limited to your declared `network:<host>` permissions, and the ctx subset is commands, `ui.addStyles`, exporters, workspace, settings, notify, and translations. See the [API reference](https://github.com/glyph-md/plugins/blob/main/docs/api-reference.md#sandboxed-plugins-api-12).

## Publish

1. Set your `id`, `name`, `version`, and `description` in `manifest.json`.
2. `npm run build`, commit `main.js`, and tag a release (so the file has a stable URL).
3. Open a PR adding your entry to the [marketplace index](https://github.com/glyph-md/plugins) (`mainUrl` points at your tagged `main.js`). See its [CONTRIBUTING guide](https://github.com/glyph-md/plugins/blob/main/CONTRIBUTING.md).

Bump `version` + `mainUrl` per release; Glyph then offers users an in-app update.
