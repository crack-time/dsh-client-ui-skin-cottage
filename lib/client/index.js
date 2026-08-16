import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { ArchiveView } from './archive.js';
// Wallpaper served by the host route (src/index.ts registers it).
const BG = 'url("/plugins/@crack/dsh-client-ui-skin-cottage/bg.jpg") center center / cover no-repeat fixed #3a6ea5';
export function apply(ctx) {
    const body = document.body;
    body.dataset.dshCottage = '';
    // Inline style beats CSS rules. DSH theme may re-set body.style.background
    // on token overrides, so we guard with a MutationObserver.
    function setBg() {
        body.style.background = BG;
    }
    setBg();
    const obs = new MutationObserver(() => {
        if (body.style.background !== BG)
            setBg();
    });
    obs.observe(body, { attributes: true, attributeFilter: ['style'] });
    // Move the composer seat OUT of the scrolling .wSkVaW_scrollBody (it
    // becomes a sibling right after it). scrollBody keeps scrolling natively
    // so dsh's own scroll tracking / auto-follow / back-to-bottom button
    // stay intact, while the scrollport now ends exactly at the input box
    // top: message text can never pass underneath the input box.
    function moveSeat() {
        document.querySelectorAll('.wSkVaW_scrollBody').forEach((sb) => {
            // Overlay mode keeps dsh's own layout (seat overlays content).
            if (sb.querySelector('[data-conversation-composer-overlay]'))
                return;
            // Only relocate the seat in the active chat phase; hero/settling
            // keep dsh's original layout (hero composer stays centered).
            const root = sb.closest('.wSkVaW_root');
            const active = !!root && root.dataset.phase === 'active';
            const seat = sb.querySelector(':scope > [data-composer-seat]');
            if (active && seat && seat.parentNode === sb) {
                sb.insertAdjacentElement('afterend', seat);
            }
            else if (!active) {
                // Phase left "active": put the seat back inside the scroll body.
                const moved = sb.parentNode
                    ? sb.parentNode.querySelectorAll(':scope > [data-composer-seat]')
                    : [];
                moved.forEach((s) => {
                    if (s.parentNode !== sb)
                        sb.appendChild(s);
                });
            }
        });
    }
    function atBottomNow(panel) {
        const floor = Math.max(0, panel.scrollHeight - panel.clientHeight);
        return panel.scrollTop >= floor - 25;
    }
    // Compensate dsh's composer-resize follow (it looks the seat up inside
    // the scroll body, which we moved out): keep the list pinned to the
    // bottom when the input box grows/shrinks while the user is at bottom.
    let seatRO = null;
    let lastSeat = null;
    function onSeatResize() {
        const sb = document.querySelector('.wSkVaW_scrollBody');
        if (sb && atBottomNow(sb)) {
            ;
            sb.scrollTop = sb.scrollHeight;
        }
    }
    // Sidebar archive entry: a button injected right after the native
    // "Add workspace" button (headerActions row). It toggles the in-place
    // archive view over the workspace tree region (ArchiveView).
    function ensureArchiveButton() {
        if (document.querySelector('[data-cottage-archive-btn]'))
            return;
        const labels = ['添加工作区', 'Add workspace', 'Add workspace…'];
        for (const btn of document.querySelectorAll('button[aria-label]')) {
            const label = (btn.getAttribute('aria-label') || '').trim();
            if (labels.includes(label)) {
                const b = document.createElement('button');
                b.type = 'button';
                b.dataset.cottageArchiveBtn = '';
                b.title = '归档会话';
                b.setAttribute('aria-label', '归档会话');
                b.textContent = '📦';
                b.addEventListener('click', () => toggleArchiveView());
                btn.insertAdjacentElement('afterend', b);
                return;
            }
        }
    }
    // ChatView keeps its instance across session switches (slot key is the
    // registration entry, not the session id), so dsh's "first open" scroll
    // logic never runs again and switching conversations inherits the old
    // scroll position. Detect the switch via the header breadcrumbs and
    // settle at the bottom once; afterwards only keep the list pinned
    // while the user is already at the bottom (streaming content).
    let lastCrumbs = null;
    function onDomChange() {
        ensureArchiveButton();
        moveSeat();
        const seat = document.querySelector('[data-composer-seat]');
        if (seat !== lastSeat) {
            if (seatRO)
                seatRO.disconnect();
            seatRO =
                typeof ResizeObserver !== 'undefined'
                    ? new ResizeObserver(onSeatResize)
                    : null;
            if (seatRO && seat)
                seatRO.observe(seat);
            lastSeat = seat;
        }
        const chatActive = !!document.querySelector('.wSkVaW_scrollBody .Md3f7G_root');
        const crumb = document.querySelector('.wSkVaW_crumbs');
        const crumbText = crumb ? crumb.textContent : '';
        const sb = document.querySelector('.wSkVaW_scrollBody');
        if (chatActive && sb) {
            if (crumbText !== lastCrumbs) {
                // Session switched (or first load): settle at the bottom once.
                lastCrumbs = crumbText;
                sb.scrollTop = sb.scrollHeight;
            }
        }
        else if (!chatActive) {
            lastCrumbs = crumbText;
        }
    }
    onDomChange();
    // Archive view: mounted IN PLACE over the workspace tree region (the same
    // spot the native session list occupies), toggled by the sidebar button.
    let archiveRoot = null;
    let archiveHost = null;
    let archiveTarget = null;
    let hiddenNative = [];
    function openArchiveView() {
        const btn = document.querySelector('button[data-cottage-archive-btn]');
        // headerActions → sectionHeader → the tree region (its next sibling).
        const header = btn?.parentElement?.parentElement;
        const target = header?.nextElementSibling ?? header?.parentElement;
        if (!target || archiveRoot)
            return;
        const host = document.createElement('div');
        host.dataset.cottageArchiveView = '';
        target.style.position = 'relative';
        // Hide the native tree content (the overlay is fully transparent, so the
        // native rows must not show through underneath).
        hiddenNative = [];
        for (const child of Array.from(target.children)) {
            child.style.display = 'none';
            hiddenNative.push(child);
        }
        target.appendChild(host);
        archiveTarget = target;
        archiveHost = host;
        archiveRoot = createRoot(host);
        archiveRoot.render(createElement(ArchiveView, {
            onClose: closeArchiveView,
            onOpenSession: (id) => {
                try {
                    ;
                    ctx.sessions?.open?.(id);
                }
                catch { }
            },
        }));
    }
    function closeArchiveView() {
        archiveRoot?.unmount();
        archiveRoot = null;
        archiveHost?.remove();
        archiveHost = null;
        if (archiveTarget)
            archiveTarget.style.position = '';
        archiveTarget = null;
        for (const el of hiddenNative)
            el.style.display = '';
        hiddenNative = [];
    }
    function toggleArchiveView() {
        if (archiveRoot)
            closeArchiveView();
        else
            openArchiveView();
    }
    const obs2 = new MutationObserver(onDomChange);
    obs2.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-phase', 'data-conversation-composer-overlay'],
    });
    try {
        ctx.effect(() => () => {
            obs.disconnect();
            obs2.disconnect();
            if (seatRO)
                seatRO.disconnect();
            delete body.dataset.dshCottage;
            body.style.removeProperty('background');
            document.querySelectorAll('[data-cottage-archive-btn]').forEach((el) => el.remove());
            closeArchiveView();
        }, 'ui-skin-cottage: background');
    }
    catch { }
}
