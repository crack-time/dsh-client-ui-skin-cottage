import { readFileSync, writeFileSync } from 'fs';

const b64 = readFileSync('assets/cottage-bg-b64.txt', 'utf8').trim();

// Load the full skin CSS and strip rules that target DOM nodes that do not exist.
let skinCss = readFileSync('src/client/cottage.module.css', 'utf8');

skinCss = skinCss.replace(/\n{3,}/g, '\n\n');

const BG_VALUE =
  'url("data:image/jpeg;base64,' + b64 + '") center center / cover no-repeat fixed #3a6ea5';

const js = `window.__ModuleLoader__.load({
\tid: "@crack/dsh-client-ui-skin-cottage",
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

\t\tconst css = ${JSON.stringify(skinCss)};
\t\tconst BG = ${JSON.stringify(BG_VALUE)};

\t\tconst tagId = "@crack/dsh-client-ui-skin-cottage/cottage.css";
\t\tif (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
\t\t\tconst tag = document.createElement("style");
\t\t\ttag.dataset.plugin = "@crack/dsh-client-ui-skin-cottage";
\t\t\ttag.dataset.pluginCss = tagId;
\t\t\ttag.textContent = css;
\t\t\tdocument.head.appendChild(tag);
\t\t}

\t\tfunction apply(ctx) {
\t\t\tconst body = document.body;
\t\t\tbody.dataset.dshCottage = "";
\t\t\t// Inline style beats CSS rules. DSH theme may re-set body.style.background
\t\t\t// on token overrides, so we guard with a MutationObserver.
\t\t\tfunction setBg() { body.style.background = BG; }
\t\t\tsetBg();
\t\t\tconst obs = new MutationObserver(() => {
\t\t\t\tif (body.style.background !== BG) setBg();
\t\t\t});
\t\t\tobs.observe(body, { attributes: true, attributeFilter: ["style"] });
\t\t\ttry {
\t\t\t\tctx.effect(() => () => {
\t\t\t\t\tobs.disconnect();
\t\t\t\t\tdelete body.dataset.dshCottage;
\t\t\t\t\tbody.style.removeProperty("background");
\t\t\t\t}, "ui-skin-cottage: background");
\t\t\t} catch {}
\t\t}

\t\texports.apply = apply;
\t\treturn module.exports;
\t}
});
`;

writeFileSync('lib/client.js', js, 'utf8');
console.log('Written', (js.length / 1024).toFixed(0), 'KB');
