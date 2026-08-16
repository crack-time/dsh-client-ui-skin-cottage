export declare function apply(ctx: {
    effect: (fn: () => () => void, label?: string) => unknown;
}): void;
