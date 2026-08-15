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
\t\t\t// so dsh's own scroll tracking / auto-follow stay intact, while the
\t\t\t// scrollport now ends exactly at the input box top: message text can
\t\t\t// never pass underneath the input box.
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
\t\t\t// Self-contained centered "back to bottom" button (the native slot is
\t\t\t// hidden via CSS; this one stays centered on the message panel and
\t\t\t// follows its actual center, adapting to sidebar state and resizes).
\t\t\tlet bottomBtn = null;
\t\t\tlet seatEl = null;
\t\t\tlet btnRO = null;
\t\t\tconst panelSel = ".wSkVaW_scrollBody";
\t\t\tfunction qv() { return document.querySelector(panelSel); }
\t\t\tfunction atBottomNow(panel) {
\t\t\t\tconst floor = Math.max(0, panel.scrollHeight - panel.clientHeight);
\t\t\t\treturn panel.scrollTop >= floor - 25;
\t\t\t}
\t\t\tfunction updateBottomBtn() {
\t\t\t\tconst va = qv();
\t\t\t\tif (!bottomBtn) return;
\t\t\t\tif (!va) { bottomBtn.style.display = "none"; return; }
\t\t\t\tbottomBtn.style.display = atBottomNow(va) ? "none" : "flex";
\t\t\t\tconst seatH = seatEl ? seatEl.getBoundingClientRect().height : 0;
\t\t\t\tconst vaRect = va.getBoundingClientRect();
\t\t\t\tbottomBtn.style.left = (vaRect.left + vaRect.width / 2) + "px";
\t\t\t\tbottomBtn.style.right = "auto";
\t\t\t\tbottomBtn.style.transform = "translateX(-50%)";
\t\t\t\tbottomBtn.style.bottom = (seatH + 16) + "px";
\t\t\t}
\t\t\t// Compensate dsh's composer-resize follow (it looks the seat up inside
\t\t\t// the scroll body, which we moved out): keep the list pinned to the
\t\t\t// bottom when the input box grows/shrinks while the user is at bottom.
\t\t\tfunction onPanelOrSeatResize() {
\t\t\t\tconst va = qv();
\t\t\t\tif (va && atBottomNow(va)) va.scrollTop = va.scrollHeight;
\t\t\t\tupdateBottomBtn();
\t\t\t}
\t\t\tfunction ensureBottomButton() {
\t\t\t\tconst va = qv();
\t\t\t\tif (!va) return;
\t\t\t\tif (!bottomBtn) {
\t\t\t\t\tbottomBtn = document.createElement("button");
\t\t\t\t\tbottomBtn.type = "button";
\t\t\t\t\tbottomBtn.setAttribute("aria-label", "回到底部");
\t\t\t\t\tbottomBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5.5 7 9.5 11 5.5"/></svg>';
\t\t\t\t\tbottomBtn.style.cssText = [
\t\t\t\t\t\t"position:fixed",
\t\t\t\t\t\t"z-index:1000",
\t\t\t\t\t\t"width:34px",
\t\t\t\t\t\t"height:34px",
\t\t\t\t\t\t"border-radius:100px",
\t\t\t\t\t\t"border:1px solid var(--dsw-alias-border-l2)",
\t\t\t\t\t\t"background:var(--dsw-alias-button-floating-fill)",
\t\t\t\t\t\t"box-shadow:var(--dsw-shadow-lv2)",
\t\t\t\t\t\t"color:var(--dsw-alias-label-primary)",
\t\t\t\t\t\t"cursor:pointer",
\t\t\t\t\t\t"display:none",
\t\t\t\t\t\t"align-items:center",
\t\t\t\t\t\t"justify-content:center",
\t\t\t\t\t\t"padding:0"
\t\t\t\t\t].join(";");
\t\t\t\t\tbottomBtn.addEventListener("mouseenter", () => { bottomBtn.style.background = "var(--dsw-alias-button-floating-hover)"; });
\t\t\t\t\tbottomBtn.addEventListener("mouseleave", () => { bottomBtn.style.background = "var(--dsw-alias-button-floating-fill)"; });
\t\t\t\t\tbottomBtn.addEventListener("click", () => {
\t\t\t\t\t\tconst va = qv();
\t\t\t\t\t\tif (va) va.scrollTo({ top: va.scrollHeight, behavior: "smooth" });
\t\t\t\t\t});
\t\t\t\t\tdocument.body.appendChild(bottomBtn);
\t\t\t\t\tif (typeof ResizeObserver !== "undefined") {
\t\t\t\t\t\tbtnRO = new ResizeObserver(onPanelOrSeatResize);
\t\t\t\t\t}
\t\t\t\t}
\t\t\t\tseatEl = document.querySelector("[data-composer-seat]");
\t\t\t\tif (btnRO) {
\t\t\t\t\tbtnRO.disconnect();
\t\t\t\t\tbtnRO.observe(va);
\t\t\t\t\tif (seatEl) btnRO.observe(seatEl);
\t\t\t\t}
\t\t\t\tupdateBottomBtn();
\t\t\t}

\t\t\t// ChatView keeps its instance across session switches (slot key is the
\t\t\t// registration entry, not the session id), so dsh's "first open" scroll
\t\t\t// logic never runs again and switching conversations inherits the old
\t\t\t// scroll position. Detect the switch via the header breadcrumbs and pin
\t\t\t// the list to the bottom for a short window while the content settles.
\t\t\tlet lastCrumbs = null;
\t\t\tlet followUntil = 0;
\t\t\tconst switchWindowMs = 2000;
\t\t\tfunction onDomChange() {
\t\t\t\tmoveSeat();
\t\t\t\tensureBottomButton();
\t\t\t\tconst chatActive = !!document.querySelector(".wSkVaW_scrollBody .Md3f7G_root");
\t\t\t\tconst crumb = document.querySelector(".wSkVaW_crumbs");
\t\t\t\tconst crumbText = crumb ? crumb.textContent : "";
\t\t\t\tif (chatActive && crumbText !== lastCrumbs) {
\t\t\t\t\tfollowUntil = Date.now() + switchWindowMs;
\t\t\t\t\tlastCrumbs = crumbText;
\t\t\t\t} else if (!chatActive) {
\t\t\t\t\tlastCrumbs = crumbText;
\t\t\t\t}
\t\t\t\tconst sb = document.querySelector(".wSkVaW_scrollBody");
\t\t\t\tif (sb && (Date.now() < followUntil || atBottomNow(sb))) {
\t\t\t\t\tsb.scrollTop = sb.scrollHeight;
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
\t\t\tdocument.addEventListener("scroll", updateBottomBtn, { capture: true, passive: true });
\t\t\twindow.addEventListener("resize", updateBottomBtn);

\t\t\ttry {
\t\t\t\tctx.effect(() => () => {
\t\t\t\t\tobs.disconnect();
\t\t\t\t\tobs2.disconnect();
\t\t\t\t\tif (btnRO) btnRO.disconnect();
\t\t\t\t\tdocument.removeEventListener("scroll", updateBottomBtn, { capture: true });
\t\t\t\t\twindow.removeEventListener("resize", updateBottomBtn);
\t\t\t\t\tif (bottomBtn && bottomBtn.parentNode) bottomBtn.parentNode.removeChild(bottomBtn);
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