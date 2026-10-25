type Params = {
    /**
     * The watcher version the script on disk is (`NotifyWatchVersion`): an
     * older one still running is stopped and started again.
     */
    version: string;
    /**
     * Restart Chrome when it started before the watcher (it looks for a
     * notification service only when it starts). Off while a task works
     * on the computer, so its browser isn't pulled away mid-task.
     */
    restart_browser: boolean;
};

/**
 * The shell command that keeps a computer's notification watcher running
 * (`~/.cobble/notify-watch.py`, already written): starts the session bus
 * when the sandbox didn't, starts the watcher when it isn't running (or
 * runs an older version), then restarts Chrome if it started before the
 * watcher. Its sandbox supervisor brings Chrome straight back. Prints one
 * line of JSON: `{ ok, watching, started, browser: "ok" | "restarted" |
 * "needs_restart" | "missing", error? }`.
 */
export default function notifyWatchEnsureCommand({ version, restart_browser }: Params) {
    const script = String.raw`
import json, os, subprocess, time
home = os.path.expanduser("~")
d = os.path.join(home, ".cobble")
state_file = os.path.join(d, "notify-watch.json")
script = os.path.join(d, "notify-watch.py")
out = {"ok": False, "watching": False, "started": False, "browser": "missing"}

def read_state():
    try:
        with open(state_file) as f:
            return json.load(f)
    except Exception:
        return {}

def alive(pid):
    try:
        with open("/proc/%d/cmdline" % int(pid), "rb") as f:
            return b"notify-watch" in f.read()
    except Exception:
        return False

try:
    os.makedirs(d, exist_ok=True)
    os.chmod(d, 0o700)
    if os.path.exists(os.path.join(d, "notify-hooks")):
        os.chmod(os.path.join(d, "notify-hooks"), 0o600)
    env = dict(os.environ)
    try:
        with open("/var/run/gem/browser-supervisor.json") as f:
            browser_env = (json.load(f).get("browser") or {}).get("env") or {}
        for key in ("DBUS_SESSION_BUS_ADDRESS", "XDG_RUNTIME_DIR"):
            if browser_env.get(key):
                env[key] = browser_env[key]
    except Exception:
        pass
    env.setdefault("XDG_RUNTIME_DIR", "/run/user/%d" % os.getuid())
    env.setdefault("DBUS_SESSION_BUS_ADDRESS", "unix:path=%s/dbus-session-bus" % env["XDG_RUNTIME_DIR"])
    socket = env["DBUS_SESSION_BUS_ADDRESS"].split("unix:path=", 1)[-1].split(",")[0]
    if not os.path.exists(socket):
        subprocess.run(["dbus-daemon", "--session", "--fork", "--address=unix:path=" + socket], env=env, check=True, timeout=10)
        time.sleep(1)
    state = read_state()
    pid = state.get("pid")
    if pid and alive(pid) and str(state.get("version")) != __VERSION__:
        os.kill(int(pid), 15)
        time.sleep(1)
    if not (pid and alive(pid)):
        with open(os.path.join(d, "notify-watch.log"), "ab") as log:
            subprocess.Popen(["python3", script], env=env, stdout=log, stderr=log, stdin=subprocess.DEVNULL, start_new_session=True)
        out["started"] = True
        for _ in range(20):
            time.sleep(0.25)
            state = read_state()
            if state.get("pid") and alive(state["pid"]) and str(state.get("version")) == __VERSION__:
                break
    state = read_state()
    out["watching"] = bool(state.get("pid") and alive(state["pid"]))
    if not out["watching"]:
        out["error"] = "The notification watcher didn't start (another notification service may be running)."
    browser_pid_file = "/var/run/gem/browser.pid"
    if out["watching"] and os.path.exists(browser_pid_file):
        browser_started = os.stat(browser_pid_file).st_mtime
        if browser_started >= int(state.get("started_at") or 0):
            out["browser"] = "ok"
        elif __RESTART__:
            with open(browser_pid_file) as f:
                os.kill(int(f.read().strip()), 15)
            out["browser"] = "restarted"
        else:
            out["browser"] = "needs_restart"
    out["ok"] = out["watching"]
except Exception as error:
    out["error"] = str(error)[:300]
print(json.dumps(out))
`
        .replaceAll("__VERSION__", JSON.stringify(version))
        .replaceAll("__RESTART__", restart_browser ? "True" : "False");

    return `python3 - <<'COBBLE_NOTIFY_WATCH'\n${script.trim()}\nCOBBLE_NOTIFY_WATCH`;
}
