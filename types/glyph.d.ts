// Glyph plugin API (v1.3). Mirrors what the host passes to `activate(ctx)`.
// Imported as `import type { PluginModule } from "glyph"`; type-only, so the
// bundler drops it (there is no runtime "glyph" package).
//
// Sandboxed plugins ("sandbox": true in manifest.json) run in an isolated
// worker and get a subset of this ctx: commands, ui.addStyles, exporters,
// workspace, settings, notify, and registerTranslations. The markdown APIs,
// spellcheck dictionaries, and DOM mounts
// (addStatusBarItem/addSidebarPanel/addSettingsPanel) are main-context only.
declare module "glyph" {
  export type Disposer = () => void;

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

  /**
   * A spell-check dictionary for one language. `load` resolves the two
   * Hunspell files as UTF-8 text and runs only when the user first selects
   * the language in Settings → Editor → Spell Check.
   */
  export interface DictionaryContribution {
    /** Language code stored in the editor setting, e.g. "fa". */
    language: string;
    /** Label shown in the Settings language picker, e.g. "فارسی (Persian)". */
    label: string;
    load: () => Promise<{ aff: string; dic: string }>;
  }

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
    /** Requires the `workspace:read` permission in manifest.json. */
    readonly workspace: {
      readFile(path: string): Promise<string>;
      listFiles(): Promise<string[]>;
    };
    /** API 1.1 */
    readonly exporters: { register(exporter: ExporterContribution): Disposer };
    /**
     * API 1.3: contribute spell-check dictionaries. Registering a known code
     * (including the built-in "en") replaces it; the disposer removes the
     * language and drops any cached checker. Main-context only.
     */
    readonly spellcheck: {
      registerDictionary(dictionary: DictionaryContribution): Disposer;
    };
    /**
     * API 1.1: per-plugin persisted settings. Hydrated before activate, so
     * `get` is synchronous; `set` persists in the background.
     */
    readonly settings: {
      get<T = unknown>(key: string): T | undefined;
      set(key: string, value: unknown): void;
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
