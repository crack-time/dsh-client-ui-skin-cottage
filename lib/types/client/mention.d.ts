/**
 * '@' file-mention source for the Pastoral Cottage skin.
 *
 * Registers an InputTriggerSource on the '@' trigger (the same pipeline that
 * powers the '/' command menu): typing '@' in the composer opens the native
 * candidate menu listing the current session's working directory. Picking an
 * entry inserts a native reference CHIP (U+FFFC placeholder) showing the
 * short base name; the full relative path rides the codec (clipboard and
 * model serialization), so the input stays compact while the model still
 * sees '@relative/path'.
 *
 * The file listing comes from the host half (src/index.ts): the browser
 * never receives absolute paths — every entry path is relative to the
 * session cwd, and navigation passes relative directories back.
 *
 * Note: InputTriggerSource.onPick is SYNCHRONOUS and receives only the
 * candidate (no query/directory context), so the full relative path is
 * encoded in the candidate's display name (directories carry a trailing
 * '/'); onPick decides file vs directory from that trailing slash.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { InputTriggerSource } from '@deepseek-ai/dsh-client-ui-input-trigger/client';
/**
 * Build the '@' file source. Picking a directory returns '@dir/' — the
 * native input machine re-runs detection with query 'dir/' and the menu
 * lists that directory, giving unlimited navigation with zero client state.
 */
/**
 * Tokens this plugin has inserted as real @-references, per session.
 * Backspace interception (registerMentionDelete) consults this set so only
 * our own mentions get whole-token deletion — ordinary '@' text is never
 * disturbed.
 */
export declare const mentionTokens: Map<string, Set<string>>;
export declare function createFileMentionSource(): InputTriggerSource;
/**
 * Client-side registration of the '@' file source under an effect disposer.
 * Call from the skin's apply(). The menu group title is the source name
 * itself ('文件'); the native slash.menu dictionary is single-occupant, so
 * no extra locale registration is attempted.
 */
export declare function registerFileMention(ctx: ClientContext): void;
/**
 * Whole-token deletion for our '@' mentions: intercept Backspace on the
 * composer textarea; when the caret sits right after one of the tokens this
 * plugin inserted (recorded in mentionTokens), delete the whole token in one
 * step instead of one character.
 *
 * Reads the live draft through the public conversation.input facade
 * (ctx.conversation.input.shell(id).state), rewrites it via setDraft — the
 * same single write path the composer itself uses, so undo/history behave
 * like a normal edit.
 */
export declare function registerMentionDelete(ctx: ClientContext): void;
