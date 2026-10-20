/**
 * Page scripts and styles bunext names after their content
 * (`chunk-AEHOZS24.js`, `admin/bots/H6VDJMBN.js`, `X4TQCLSA.css`): one
 * at such a path never changes, so it can be cached for good. The
 * vendor files (`/.bunext/public/vendor/react.js`) keep fixed names and
 * are not. The loading page (`public/loading.html`) is generated with
 * this pattern.
 */
export const HashedAssetPattern = /^\/\.bunext\/public\/pages\/(?:.*\/)?(?:chunk-)?[A-Z0-9]{8}\.(?:js|css)$/;

type Params = {
    pathname: string;
};

export default function isHashedAssetPath({ pathname }: Params): boolean {
    return HashedAssetPattern.test(pathname);
}
