/**
 * The protocol (`desired.json`) this script reads. The app writes it; a
 * script older than the app refuses rather than guessing, and the next
 * check rewrites the script.
 */
export const HookRunnerProtocol = 1;

/**
 * Bump with every change to `HookRunnerScript`: every runner restarts once
 * with the new script.
 */
export const HookRunnerVersion = "2";

/**
 * The process keeper the app runs on a computer for a hook's runner
 * (`syncHookRunners`), as the hook bot's own account. It reads
 * `desired.json` beside itself (written by the app: each runner's command,
 * folder and version, plus which to restart), keeps exactly those running
 * and starts nothing else, stops what is no longer wanted (a paused,
 * deleted or changed hook), and prints one JSON line: what each is doing,
 * or why the last start failed. Safe to run again and again, and by hand.
 *
 * The runner's own state (`<id>.json`), its envs (`<id>.env.json`) and its
 * log (`<id>.log`) sit beside it, in the bot's folder.
 */
export const HookRunnerScript = String.raw`#!/usr/bin/env python3
"""Cobble's hook runner keeper (protocol PROTOCOL_PLACEHOLDER).

Keeps the processes a hook needs running, from desired.json beside this
script. Started by the app every 5 minutes; running it by hand is safe.
Prints one JSON line.
"""

import fcntl
import json
import os
import signal
import subprocess
import time

MARKER = "COBBLE_HOOK_RUNNER"
PROTOCOL = PROTOCOL_PLACEHOLDER
BASE = os.path.dirname(os.path.abspath(__file__))
BOT_DIR = os.path.realpath(os.path.dirname(os.path.dirname(BASE)))


def read_json(path, default=None):
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return default


def write_json(path, value):
    temporary = path + ".tmp"
    with open(temporary, "w", encoding="utf-8") as handle:
        json.dump(value, handle)
    os.replace(temporary, path)


def state_path(runner_id):
    return os.path.join(BASE, "%s.json" % runner_id)


def env_path(runner_id):
    return os.path.join(BASE, "%s.env.json" % runner_id)


def log_path(runner_id):
    return os.path.join(BASE, "%s.log" % runner_id)


def marked(pid, runner_id):
    """Whether this pid carries this hook's marker, so a pid the container
    reused for something else is never mistaken for the runner."""
    try:
        with open("/proc/%d/environ" % pid, "rb") as handle:
            return ("%s=%s" % (MARKER, runner_id)).encode() in handle.read().split(b"\0")
    except Exception:
        return False


def alive(state, runner_id):
    pid = state.get("pid") if isinstance(state, dict) else None
    if not isinstance(pid, int) or isinstance(pid, bool) or pid <= 1:
        return None
    try:
        os.kill(pid, 0)
    except Exception:
        return None
    return pid if marked(pid, runner_id) else None


def log_tail(runner_id, chars):
    try:
        with open(log_path(runner_id), "rb") as handle:
            handle.seek(0, os.SEEK_END)
            size = handle.tell()
            handle.seek(max(0, size - chars * 4))
            text = handle.read().decode("utf-8", "replace").strip()
    except Exception:
        return ""
    return text[-chars:]


def stop(runner_id, state, stop_ms):
    """Ends the runner and its whole process group, then forgets it."""
    pid = alive(state, runner_id)
    if pid:
        deadline = time.time() + max(1, stop_ms / 1000.0)
        try:
            os.killpg(pid, signal.SIGTERM)
        except Exception:
            pass
        while time.time() < deadline:
            if not alive(state, runner_id):
                break
            time.sleep(0.1)
        if alive(state, runner_id):
            try:
                os.killpg(pid, signal.SIGKILL)
            except Exception:
                pass
    try:
        os.remove(state_path(runner_id))
    except Exception:
        pass
    try:
        os.remove(env_path(runner_id))
    except Exception:
        pass


def start(runner, env, log_max):
    runner_id = runner["id"]
    cwd = runner["cwd"]
    if not os.path.isdir(cwd):
        return {
            "id": runner_id,
            "pid": None,
            "running": False,
            "started_at": None,
            "error": "Its folder isn't there: %s" % cwd,
        }
    log = log_path(runner_id)
    try:
        if os.path.getsize(log) > log_max:
            open(log, "w", encoding="utf-8").close()
    except OSError:
        pass
    output = open(log, "ab", buffering=0)
    try:
        child = subprocess.Popen(
            ["bash", "-lc", runner["command"]],
            cwd=cwd,
            env=env,
            stdin=subprocess.DEVNULL,
            stdout=output,
            stderr=subprocess.STDOUT,
            start_new_session=True,
            close_fds=True,
        )
    except Exception as error:
        return {
            "id": runner_id,
            "pid": None,
            "running": False,
            "started_at": None,
            "error": "It couldn't start: %s" % error,
        }
    finally:
        output.close()

    time.sleep(0.3)
    started_at = int(time.time() * 1000)
    write_json(
        state_path(runner_id),
        {
            "pid": child.pid,
            "started_at": started_at,
            "version": runner.get("version") or "",
        },
    )
    code = child.poll()
    if code is not None:
        tail = log_tail(runner_id, 400)
        try:
            os.remove(state_path(runner_id))
        except Exception:
            pass
        return {
            "id": runner_id,
            "pid": None,
            "running": False,
            "started_at": None,
            "error": "It exited at once (code %s)%s" % (code, (": " + tail) if tail else "."),
        }
    return {
        "id": runner_id,
        "pid": child.pid,
        "running": True,
        "started_at": started_at,
        "error": None,
    }


def main():
    payload = read_json(os.path.join(BASE, "desired.json"), None)
    if not isinstance(payload, dict) or payload.get("protocol") != PROTOCOL:
        return {
            "ok": False,
            "runners": [],
            "error": "The app and this computer's hook runner script don't match; the next check writes it again.",
        }

    lock = open(os.path.join(BASE, "lock"), "w")
    try:
        deadline = time.time() + 15
        while True:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                break
            except OSError:
                if time.time() > deadline:
                    return {
                        "ok": False,
                        "runners": [],
                        "error": "Another check was still running.",
                    }
                time.sleep(0.2)
    except Exception:
        pass

    stop_ms = int(payload.get("stop_ms") or 5000)
    log_max = int(payload.get("log_max_bytes") or 524288)
    restart = set(int(value) for value in (payload.get("restart") or []))
    wanted = {}
    for runner in payload.get("runners") or []:
        try:
            wanted[int(runner["id"])] = runner
        except Exception:
            continue

    results = []
    for runner_id in sorted(wanted):
        runner = wanted[runner_id]
        state = read_json(state_path(runner_id), {}) or {}
        env = dict(os.environ)
        extra = read_json(env_path(runner_id), {}) or {}
        if isinstance(extra, dict):
            for key, value in extra.items():
                env[str(key)] = str(value)
        env[MARKER] = str(runner_id)
        pid = alive(state, runner_id)
        if pid and runner_id not in restart and state.get("version") == (runner.get("version") or ""):
            results.append(
                {
                    "id": runner_id,
                    "pid": pid,
                    "running": True,
                    "started_at": state.get("started_at"),
                    "error": None,
                }
            )
            continue
        if pid:
            stop(runner_id, state, stop_ms)
        results.append(start(runner, env, log_max))

    stopped = set()
    for name in os.listdir(BASE):
        if name == "desired.json" or not name.endswith(".json"):
            continue
        stem = name[: -len(".json")]
        if stem.endswith(".env"):
            stem = stem[: -len(".env")]
        try:
            runner_id = int(stem)
        except ValueError:
            continue
        if runner_id in wanted or runner_id in stopped:
            continue
        stopped.add(runner_id)
        stop(runner_id, read_json(state_path(runner_id), {}) or {}, stop_ms)

    return {"ok": True, "runners": results}


if __name__ == "__main__":
    try:
        print(json.dumps(main()))
    except Exception as error:
        print(json.dumps({"ok": False, "runners": [], "error": str(error)}))
`.replaceAll("PROTOCOL_PLACEHOLDER", String(HookRunnerProtocol));