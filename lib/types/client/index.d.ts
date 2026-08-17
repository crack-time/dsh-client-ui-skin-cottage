import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** Client-side service dependencies (runtime inject declaration; the
 * package.json dsh.client.inject metadata mirrors this for the loader). */
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
