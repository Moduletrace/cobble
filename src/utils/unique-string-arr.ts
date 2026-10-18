export default function uniqueStringArr(arr: string[]): string[] {
    return [...new Set(arr)];
}
