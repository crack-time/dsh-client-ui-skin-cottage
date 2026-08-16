/** Minimal web route registry surface (no cordis type dependency). */
interface WebRoute {
    kind: 'exact' | 'prefix';
    path: string;
    handler: (req: unknown, res: {
        writeHead: (status: number, headers?: Record<string, string>) => void;
        end: (body?: unknown) => void;
    }) => void | Promise<void>;
}
/** Minimal plugin context surface (no cordis type dependency). */
interface SkinContext {
    webServer: {
        register: (route: WebRoute) => () => void;
    };
    logger: {
        warn: (...args: unknown[]) => void;
    };
    effect: (fn: () => unknown, label?: string) => unknown;
}
/** Required services: the web route registry. */
declare const inject: string[];
declare function apply(ctx: SkinContext): void;
export { apply, inject };
