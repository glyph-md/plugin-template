// Glyph plugin API (0.17.0). Mirrors what the host passes to `activate(ctx)`.
// Imported as `import type { PluginModule } from "glyph"`; type-only, so the
// bundler drops it (there is no runtime "glyph" package).
//
// The API is unstable until 1.0: your manifest's `apiVersion` must state the
// exact host version ("0.17.0"), a caret grants nothing below 1.0, and any
// bump may break plugins.
//
// Sandboxed plugins ("sandbox": true in manifest.json) run in an isolated
// worker and get a subset of this ctx: commands, ui.addStyles, exporters,
// workspace, assets, settings, notify, and registerTranslations. The markdown APIs
// and DOM mounts (addStatusBarItem/addSidebarPanel/addSettingsPanel) are
// main-context only.
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

  /**
   * An export format. The host prepares the rendered document, asks for a
   * save location, and writes the file; `build` only turns HTML into contents.
   * Appears in the palette as "Export: <label>…".
   */
  export interface ExporterContribution {
    id: string;
    label: string;
    /** File extension without the dot, e.g. "html". */
    extension: string;
    build: (bodyHtml: string) => Promise<Uint8Array | string>;
  }

  /** remark/rehype plugin in the shape react-markdown accepts. */
  export type MarkdownPlugin = unknown;

  export interface GlyphPluginContext {
    readonly apiVersion: string;
    readonly commands: { register(command: CommandContribution): Disposer };
    readonly ui: {
      addStatusBarItem(item: StatusBarItemContribution): Disposer;
      /** API 1.1 */
      addSidebarPanel(panel: SidebarPanelContribution): Disposer;
      /** API 1.1: one settings UI per plugin, shown in Manage Plugins. */
      addSettingsPanel(panel: MountContribution): Disposer;
      /** API 1.2: inject a stylesheet after app styles; removed on unload. */
      addStyles(css: string): Disposer;
    };
    readonly markdown: {
      registerRemarkPlugin(plugin: MarkdownPlugin): Disposer;
      registerRehypePlugin(plugin: MarkdownPlugin): Disposer;
      registerFencedRenderer(
        language: string,
        render: (props: { code: string }) => unknown,
      ): Disposer;
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
    /** Contribute a spell-check dictionary; appears in Settings → Editor. */
    readonly spellcheck: {
      registerDictionary(dictionary: {
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
      }): Disposer;
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
