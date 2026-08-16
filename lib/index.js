/**
 * Host loader entry for the Pastoral Cottage skin.
 *
 * Registers one exact route serving the wallpaper asset, so the client bundle
 * references it by URL instead of inlining 3MB of base64 (bundle stays small;
 * the image loads and caches separately).
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const BG_PATH = fileURLToPath(new URL('../assets/cottage-bg.jpg', import.meta.url));
const BG_ROUTE = '/plugins/@crack/dsh-client-ui-skin-cottage/bg.jpg';
/** Required services: the web route registry. */
const inject = ['webServer'];
function apply(ctx) {
    ctx.effect(() => ctx.webServer.register({
        kind: 'exact',
        path: BG_ROUTE,
        handler: async (_req, res) => {
            try {
                const body = await readFile(BG_PATH);
                res.writeHead(200, {
                    'content-type': 'image/jpeg',
                    'cache-control': 'public, max-age=86400',
                });
                res.end(body);
            }
            catch (error) {
                ctx.logger.warn('cottage skin: failed to serve wallpaper', error);
                res.writeHead(404);
                res.end();
            }
        },
    }), 'ui-skin-cottage: wallpaper route');
}
export { apply, inject };
