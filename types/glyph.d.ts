// Glyph plugin API (0.26.0). Mirrors what the host passes to `activate(ctx)`.
// Imported as `import type { PluginModule } from "glyph"`; type-only, so the
// bundler drops it (there is no runtime "glyph" package).
//
// The API is unstable until 1.0: the host accepts any declared `apiVersion`
// inside its compatibility window, from the floor (0.16.0) up to the host's
// own app version. Declare the app version you built against; every release
// widens the window at the top, and only a breaking contract change moves the
// floor, so a plugin keeps working until the contract actually breaks. A
// caret grants nothing below 1.0.
//
// Plugins are sandboxed by default: without a manifest "sandbox" flag (or
// with "sandbox": true) they run in an isolated worker and get a subset of
// this ctx: commands, ui.addStyles, exporters, documents, workspace, assets,
// spellcheck, settings, notify, and registerTranslations. The markdown APIs,
// DOM mounts (addStatusBarItem/addSidebarPanel/addSettingsPanel/openOverlay),
// documents.getRenderedHtml, and reading translations (i18n) are main-context
// only; declaring "sandbox": false unlocks them but requires the user to
// accept a separate full-access warning.
declare module "glyph" {
  export type Disposer = () => void;

  export interface SiteThemeContribution {
    /** Id referenced from .glyph/site.json, e.g. "solarized". */
    id: string;
    /** Human-readable name shown in docs and error messages. */
    label: string;
    css: string;
  }

  export interface CommandContribution {
    id: string;
    title: string;
    run: () => void | Promise<void>;
    /** 0.26.0: also list it in this native menu (desktop). */
    menu?: "view";
  }

  export interface MountContribution {
    id: string;
    mount: (el: HTMLElement, registerCleanup: (cleanup: Disposer) => void) => void;
  }

  export type StatusBarItemContribution = MountContribution;

  /** A titled sidebar section, rendered below the built-in Outline. */
  export interface SidebarPanelContribution extends MountContribution {
    title: string;
  }

  /** 0.26.0: what an exporter needs to make its output look like the app. */
  export interface ExportDocument {
    title: string;
    /** Every style rule the app applies, so the body HTML renders as it does in the app. */
    css: string;
    /** The app's dark colors apply under `html.dark`. */
    dark: boolean;
  }

  /**
   * An export format. The host prepares the rendered document, asks for a
   * save location, and writes the file; `build` only turns HTML into contents.
   * Appears in the palette as "Export: <label>…" and (0.26.0) in File > Export.
   */
  export interface ExporterContribution {
    id: string;
    label: string;
    /** File extension without the dot, e.g. "html". */
    extension: string;
    build: (bodyHtml: string, doc: ExportDocument) => Promise<Uint8Array | string>;
  }

  /** 0.26.0: content shown over the whole app, with the window taken fullscreen. */
  export interface OverlayContribution extends MountContribution {
    /** Accessible name of the overlay. */
    label: string;
  }

  /** remark/rehype plugin in the shape react-markdown accepts. */
  export type MarkdownPlugin = unknown;

  /**
   * 0.25.0: a rehype plugin that loads only once a document needs it, so a heavy
   * renderer (KaTeX for math) costs nothing until then.
   */
  export interface LazyMarkdownPlugin {
    /** A cheap check of a document's markdown. True starts the load. */
    detect(markdown: string): boolean;
    /** Import the plugin. Runs once, for the first document `detect` accepts. */
    load(): Promise<MarkdownPlugin>;
  }

  /** What a fenced renderer receives. */
  export interface FencedRendererProps {
    code: string;
    /**
     * 0.25.0: open an image zoomable over the document. Absent where the host
     * offers no zoom; exports strip the interactive attributes a render adds.
     */
    openLightbox?: (src: string, label: string) => void;
  }

  /**
   * 0.25.0: a framework-agnostic fenced renderer that draws into `el`, like the
   * panel mounts. When the block's props change, the previous cleanups run and
   * it is mounted again over its previous output, so it can keep that on
   * screen until the new render is ready (set aria-busy on `el` meanwhile).
   * Prefer it: a plugin cannot use the host's React.
   */
  export interface FencedRendererMount {
    mount(
      el: HTMLElement,
      props: FencedRendererProps,
      registerCleanup: (cleanup: Disposer) => void,
    ): void;
  }

  export interface FencedRendererOptions {
    /**
     * 0.25.0: light-theme markup (typically an SVG) for print, PDF, and
     * website export, which cannot reuse a live render drawn in the app
     * theme's colors. The host sanitizes it, and a website export drops its
     * image references other than `data:` URLs.
     */
    renderStatic?: (code: string) => Promise<string>;
  }

  /**
   * 0.25.0: a document type your plugin opens. Files with these extensions
   * open in the viewer and render as one fenced `language` block, so pair it
   * with a fenced renderer for that language. The language is letters, digits,
   * `-`, and `_`; the extensions letters and digits; and types Glyph opens
   * itself (markdown, notebooks, canvases, images, media) are refused.
   */
  export interface FileTypeContribution {
    /** Extensions without the dot, e.g. ["d2"]. */
    extensions: readonly string[];
    language: string;
  }

  /** 0.25.0: read the translations you registered. Not available in the sandbox. */
  export interface I18nApi {
    /** Translate `namespace:key` in the app's current language, with i18next `{{name}}` values. */
    t(key: string, values?: Record<string, unknown>): string;
    /** Run `listener` after the app switches language, to refresh strings already on screen. */
    onLanguageChange(listener: () => void): Disposer;
  }

  /** A spell-check dictionary contributed for one language. */
  export interface DictionaryContribution {
    /** Language code stored in the editor setting, e.g. "fa". */
    language: string;
    /** Label shown in the Settings language picker, e.g. "فارسی (Persian)". */
    label: string;
    /** Produce the Hunspell text; called only once the language is selected. */
    load: () => Promise<{ aff: string; dic: string }>;
    /**
     * ISO 15924 script codes this dictionary covers (e.g. ["Arab"]);
     * words in other scripts are never checked against it. Defaults to
     * the language code's likely script, so most dictionaries omit it.
     * Hosts that predate the field ignore it and infer instead.
     */
    scripts?: readonly string[];
  }

  export interface GlyphPluginContext {
    readonly apiVersion: string;
    readonly commands: { register(command: CommandContribution): Disposer };
    readonly ui: {
      addStatusBarItem(item: StatusBarItemContribution): Disposer;
      /** API 1.1 */
      addSidebarPanel(panel: SidebarPanelContribution): Disposer;
      /** API 1.1: one settings UI per plugin, shown in Settings, Plugins. */
      addSettingsPanel(panel: MountContribution): Disposer;
      /** API 1.2: inject a stylesheet after app styles; removed on unload. */
      addStyles(css: string): Disposer;
      /**
       * 0.26.0: open an overlay over the whole app, replacing any open one.
       * Escape closes it and runs its cleanups, as does the returned disposer.
       */
      openOverlay(overlay: OverlayContribution): Disposer;
    };
    readonly markdown: {
      registerRemarkPlugin(plugin: MarkdownPlugin): Disposer;
      /**
       * 0.25.0: a {@link LazyMarkdownPlugin} loads only for documents that need it.
       *
       * Math: wrap rendered math in an element carrying its TeX source in
       * `data-math-source`, plus `data-math-display` for block math. PDF export
       * rasterizes the blocks and PDF and Word fall back to the source.
       */
      registerRehypePlugin(plugin: MarkdownPlugin | LazyMarkdownPlugin): Disposer;
      /**
       * While a render is still pending, mark its element aria-busy="true" so
       * exports wait for it.
       */
      registerFencedRenderer(
        language: string,
        render: FencedRendererMount | ((props: FencedRendererProps) => unknown),
        options?: FencedRendererOptions,
      ): Disposer;
    };
    /** 0.25.0: open files of your own document type. */
    readonly documents: {
      registerFileType(fileType: FileTypeContribution): Disposer;
      /**
       * 0.26.0: the active document's rendered HTML as exporters receive it, or
       * null when nothing is rendered. Main-context only: sandboxed plugins
       * see document content only through an export the user runs.
       */
      getRenderedHtml(): Promise<string | null>;
    };
    /** Read your own bundled files (the manifest's `files` list); no permission needed. */
    readonly assets: {
      readText(path: string): Promise<string>;
      readBinary(path: string): Promise<Uint8Array>;
    };
    /** Requires the `workspace:read` permission in manifest.json. */
    readonly workspace: {
      readFile(path: string): Promise<string>;
      listFiles(): Promise<string[]>;
    };
    /** API 1.1 */
    readonly exporters: {
      register(exporter: ExporterContribution): Disposer;
      /**
       * API 0.17: contribute a theme for the website export. The CSS is
       * appended to the exported site's shared style.css after the chrome
       * (header, nav, outline); workspaces select it via the theme field of
       * .glyph/site.json.
       */
      registerSiteTheme(theme: SiteThemeContribution): Disposer;
    };
    /**
     * API 1.1: per-plugin persisted settings. Hydrated before activate, so
     * `get` is synchronous; `set` persists in the background.
     */
    readonly settings: {
      get<T = unknown>(key: string): T | undefined;
      set(key: string, value: unknown): void;
    };
    /** 0.25.0: read your translations in the app's language. */
    readonly i18n: I18nApi;
    /** Contribute a spell-check dictionary; appears in Settings → Editor. */
    readonly spellcheck: {
      registerDictionary(dictionary: DictionaryContribution): Disposer;
    };
    notify(message: string): void;
    registerTranslations(
      locale: string,
      namespace: string,
      resources: Record<string, unknown>,
    ): void;
  }

  export interface PluginModule {
    activate(ctx: GlyphPluginContext): void | Promise<void>;
    deactivate?(): void;
  }
}
