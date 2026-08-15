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

\t\t\t// Move the composer seat OUT of the scrolling .wSkVaW_scrollBody (it
\t\t\t// becomes a sibling right after it). scrollBody keeps scrolling natively
\t\t\t// so dsh's own scroll tracking / auto-follow / back-to-bottom button
\t\t\t// stay intact, while the scrollport now ends exactly at the input box
\t\t\t// top: message text can never pass underneath the input box.
\t\t\tfunction moveSeat() {
\t\t\t\tdocument.querySelectorAll(".wSkVaW_scrollBody").forEach((sb) => {
\t\t\t\t\t// Overlay mode keeps dsh's own layout (seat overlays content).
\t\t\t\t\tif (sb.querySelector("[data-conversation-composer-overlay]")) return;
\t\t\t\t\t// Only relocate the seat in the active chat phase; hero/settling
\t\t\t\t\t// keep dsh's original layout (hero composer stays centered).
\t\t\t\t\tconst root = sb.closest(".wSkVaW_root");
\t\t\t\t\tconst active = !!root && root.dataset.phase === "active";
\t\t\t\t\tconst seat = sb.querySelector(":scope > [data-composer-seat]");
\t\t\t\t\tif (active && seat && seat.parentNode === sb) {
\t\t\t\t\t\tsb.insertAdjacentElement("afterend", seat);
\t\t\t\t\t} else if (!active) {
\t\t\t\t\t\t// Phase left "active": put the seat back inside the scroll body.
\t\t\t\t\t\tconst moved = sb.parentNode ? sb.parentNode.querySelectorAll(":scope > [data-composer-seat]") : [];
\t\t\t\t\t\tmoved.forEach((s) => { if (s.parentNode !== sb) sb.appendChild(s); });
\t\t\t\t\t}
\t\t\t\t});
\t\t\t}
\t\t\tfunction atBottomNow(panel) {
\t\t\t\tconst floor = Math.max(0, panel.scrollHeight - panel.clientHeight);
\t\t\t\treturn panel.scrollTop >= floor - 25;
\t\t\t}
\t\t\t// Compensate dsh's composer-resize follow (it looks the seat up inside
\t\t\t// the scroll body, which we moved out): keep the list pinned to the
\t\t\t// bottom when the input box grows/shrinks while the user is at bottom.
\t\t\tlet seatRO = null;
\t\t\tlet lastSeat = null;
\t\t\tfunction onSeatResize() {
\t\t\t\tconst sb = document.querySelector(".wSkVaW_scrollBody");
\t\t\t\tif (sb && atBottomNow(sb)) sb.scrollTop = sb.scrollHeight;
\t\t\t}

\t\t\t// ChatView keeps its instance across session switches (slot key is the
\t\t\t// registration entry, not the session id), so dsh's "first open" scroll
\t\t\t// logic never runs again and switching conversations inherits the old
\t\t\t// scroll position. Detect the switch via the header breadcrumbs and
\t\t\t// settle at the bottom once; afterwards only keep the list pinned
\t\t\t// while the user is already at the bottom (streaming content).
\t\t\tlet lastCrumbs = null;
\t\t\tfunction onDomChange() {
\t\t\t\tmoveSeat();
\t\t\t\tconst seat = document.querySelector("[data-composer-seat]");
\t\t\t\tif (seat !== lastSeat) {
\t\t\t\t\tif (seatRO) seatRO.disconnect();
\t\t\t\t\tseatRO = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onSeatResize) : null;
\t\t\t\t\tif (seatRO && seat) seatRO.observe(seat);
\t\t\t\t\tlastSeat = seat;
\t\t\t\t}
\t\t\t\tconst chatActive = !!document.querySelector(".wSkVaW_scrollBody .Md3f7G_root");
\t\t\t\tconst crumb = document.querySelector(".wSkVaW_crumbs");
\t\t\t\tconst crumbText = crumb ? crumb.textContent : "";
\t\t\t\tconst sb = document.querySelector(".wSkVaW_scrollBody");
\t\t\t\tif (chatActive && sb) {
\t\t\t\t\tif (crumbText !== lastCrumbs) {
\t\t\t\t\t\t// Session switched (or first load): settle at the bottom once.
\t\t\t\t\t\tlastCrumbs = crumbText;
\t\t\t\t\t\tsb.scrollTop = sb.scrollHeight;
\t\t\t\t\t}
\t\t\t\t} else if (!chatActive) {
\t\t\t\t\tlastCrumbs = crumbText;
\t\t\t\t}
\t\t\t}
\t\t\tonDomChange();
\t\t\tconst obs2 = new MutationObserver(onDomChange);
\t\t\tobs2.observe(document.body, {
\t\t\t\tchildList: true,
\t\t\t\tsubtree: true,
\t\t\t\tattributes: true,
\t\t\t\tattributeFilter: ["data-phase", "data-conversation-composer-overlay"]
\t\t\t});

\t\t\ttry {
\t\t\t\tctx.effect(() => () => {
\t\t\t\t\tobs.disconnect();
\t\t\t\t\tobs2.disconnect();
\t\t\t\t\tif (seatRO) seatRO.disconnect();
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