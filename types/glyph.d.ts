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
// DOM mounts (addStatusBarItem/addSidebarPanel/addSettingsPanel), reading
// translations (i18n), and the app state APIs (ui.filterFileTree, the active
// document, workspace.getRoot/onChange, vault, navigation) are main-context
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
  }

  export interface MountContribution {
    id: string;
    mount: (el: HTMLElement, registerCleanup: (cleanup: Disposer) => void) => void;
  }

  export type StatusBarItemContribution = MountContribution;

  /**
   * A titled sidebar section, rendered below the built-in Outline or (0.26.0)
   * as a block in the Files panel.
   */
  export interface SidebarPanelContribution extends MountContribution {
    title: string;
    /**
     * 0.26.0: "files" puts the panel in the Files panel, below the tree, as a
     * block the user can collapse and resize, whether or not the note has
     * headings. Absent or "outline" keeps it below the outline.
     */
    location?: "outline" | "files";
    /**
     * 0.26.0: height bounds of a "files" block in pixels: the smallest the
     * divider allows, and how far the block grows on its own before it scrolls.
     */
    frame?: { min: number; naturalMax?: number };
    /**
     * 0.26.0: fills the heading of a "files" block after its title (a count, a
     * button). While the block is collapsed, the block element around both
     * mounts carries `data-collapsed`, for a stylesheet to key on.
     */
    mountHeading?: MountContribution["mount"];
  }

  /** 0.26.0: a list of workspace files shown in place of the file tree. */
  export interface FileTreeFilter {
    /** Heading above the list, e.g. "#project (3)". */
    label: string;
    /** Absolute paths, in the order to list them. */
    paths: readonly string[];
    /** The user dismissed the list; dispose the filter. */
    onClear: () => void;
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

  /** 0.26.0: the document in the active tab. */
  export interface ActiveDocument {
    /** Absolute path, or the placeholder name of a document not saved yet. */
    path: string;
    /** Its text, unsaved edits included; null while it loads or when it has none (an image). */
    text: string | null;
    /** The text the user has selected in the window, empty when none. */
    selection: string;
  }

  /** 0.26.0: one inbound link to a note. */
  export interface Backlink {
    /** Absolute path of the note the link is in. */
    source: string;
    /** 1-based source line of the link. */
    line: number;
    /** The line's text, trimmed to a readable length. */
    snippet: string;
  }

  /** 0.26.0 */
  export interface TagCount {
    tag: string;
    /** Files carrying the tag or a tag nested under it. */
    count: number;
  }

  /** 0.26.0 */
  export interface GraphNode {
    /** Absolute file path, the unique node id. */
    id: string;
    /** File name without its extension. */
    label: string;
    /** Number of distinct neighbours, in either direction. */
    degree: number;
    orphan: boolean;
  }

  /** 0.26.0: a resolved link; `source` and `target` are node ids. */
  export interface GraphEdge {
    source: string;
    target: string;
  }

  /**
   * 0.26.0: read-only queries over the workspace index. Requires the
   * `workspace:read` permission; paths are absolute. Not available in the
   * sandbox.
   */
  export interface VaultApi {
    /** Every indexed note and the resolved links between them. */
    graph(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }>;
    /** Inbound links to the note at `path`. */
    backlinks(path: string): Promise<Backlink[]>;
    /** Every tag with the number of files carrying it or a tag nested under it. */
    tags(): Promise<TagCount[]>;
    /** Files carrying `tag` or a tag nested under it. */
    pathsWithTag(tag: string): Promise<string[]>;
    /**
     * Whether indexing stopped short of the whole workspace (it is too large).
     * Every other answer then covers only the part that was indexed.
     */
    status(): Promise<{ truncated: boolean }>;
    /** Run `listener` after the index changes: an edit, a rename, another workspace. */
    onChange(listener: () => void): Disposer;
  }

  /** 0.26.0: move the app to a document. Not available in the sandbox. */
  export interface NavigationApi {
    /**
     * Open a workspace file in a tab, or switch to its tab. `path` is absolute
     * or relative to the workspace root; a path outside it throws, as does a
     * call with no workspace open. `line` (1-based) scrolls the rendered
     * document to that source line; it has no effect when the note opens in
     * another window or shows no rendered view. Needs no permission.
     */
    openFile(path: string, options?: { line?: number }): void;
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
      /**
       * 0.26.0: list `paths` in place of the file tree until the returned
       * disposer runs. One filter shows at a time, the newest.
       */
      filterFileTree(filter: FileTreeFilter): Disposer;
      /** API 1.2: inject a stylesheet after app styles; removed on unload. */
      addStyles(css: string): Disposer;
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
       * 0.26.0: the active document, or null when no document tab is active.
       * Needs no permission.
       */
      getActive(): ActiveDocument | null;
      /**
       * 0.26.0: run `listener` when another document becomes active, or none.
       * Typing in the active one does not count.
       */
      onActiveChange(listener: () => void): Disposer;
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
      /** 0.26.0: absolute path of the opened workspace, or null when none is open. */
      getRoot(): string | null;
      /** 0.26.0: run `listener` when the workspace opens, closes, or changes. */
      onChange(listener: () => void): Disposer;
    };
    /** 0.26.0: query the workspace index. Requires `workspace:read`. */
    readonly vault: VaultApi;
    /** 0.26.0: open workspace files. */
    readonly navigation: NavigationApi;
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
