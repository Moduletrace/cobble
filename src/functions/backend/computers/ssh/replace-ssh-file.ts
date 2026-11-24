/**
 * Replaces `to` with `from` over SFTP.
 *
 * OpenSSH's plain RENAME refuses when `to` already exists, which is the
 * normal case for us (an env file, a report written before). Its
 * `posix-rename@openssh.com` extension replaces atomically; without it the
 * target is removed first, leaving a moment with no file.
 */
type SftpLike = {
    ext_openssh_rename?: (from: string, to: string, callback: (error?: Error | null) => void) => void;
    unlink: (path: string, callback: (error?: Error | null) => void) => void;
    rename: (from: string, to: string, callback: (error?: Error | null) => void) => void;
};

const NoSuchFile = 2;

export default function replaceSshFile({ sftp, from, to }: { sftp: SftpLike; from: string; to: string }) {
    return new Promise<void>((resolve, reject) => {
        const plain = () =>
            sftp.unlink(to, (unlinkError) => {
                const code = (unlinkError as { code?: number } | null)?.code;
                if (unlinkError && code !== NoSuchFile) return reject(unlinkError);
                sftp.rename(from, to, (error) => (error ? reject(error) : resolve()));
            });

        if (!sftp.ext_openssh_rename) return plain();

        try {
            sftp.ext_openssh_rename(from, to, (error) => {
                if (error) return plain();
                resolve();
            });
        } catch {
            plain();
        }
    });
}