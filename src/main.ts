import type { PluginModule } from "glyph";

// A Glyph plugin is an ES module that default-exports `{ activate(ctx) }`.
// Everything registered through `ctx` is torn down automatically on unload.
const plugin: PluginModule = {
  activate(ctx) {
    // Ship your own strings; read them through the host's i18n.
    ctx.registerTranslations("en", "myplugin", { greeting: "Hello from a plugin!" });

    // A command, findable in the palette (Cmd/Ctrl+K).
    ctx.commands.register({
      id: "myplugin.hello",
      title: "My Plugin: Say Hello",
      run: () => ctx.notify(`Hello! (plugin API ${ctx.apiVersion})`),
    });

    // A status bar item. Register any teardown via `registerCleanup`.
    ctx.ui.addStatusBarItem({
      id: "myplugin.status",
      mount(el, registerCleanup) {
        el.textContent = "My Plugin";
        const onClick = () => ctx.notify("status item clicked");
        el.addEventListener("click", onClick);
        registerCleanup(() => el.removeEventListener("click", onClick));
      },
    });
  },
};

export default plugin;
