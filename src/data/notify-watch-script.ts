/**
 * Bump with every change to `NotifyWatchScript`: a computer whose running
 * watcher is older gets the new script and a restart.
 */
export const NotifyWatchVersion = "1";

/**
 * The browser-notification watcher the app runs on a computer
 * (`syncComputerNotifyWatch`), as `gem`, with the sandbox's own Python
 * and GLib. It owns `org.freedesktop.Notifications` on the session bus,
 * so Chrome sends its notifications to it instead of its silent built-in
 * message center (Chrome looks for the service only when it starts), and
 * posts each one as JSON to every hook URL in `~/.cobble/notify-hooks`.
 * Nothing is shown on screen. Chrome writes the site on the body's first
 * line; it's split out as `origin`.
 */
export const NotifyWatchScript = String.raw`#!/usr/bin/env python3
"""Cobble's browser notification watcher (version VERSION_PLACEHOLDER).

Forwards Chrome's notifications to the hook URLs in ~/.cobble/notify-hooks.
Started and kept alive by the Cobble app; a second copy exits.
"""

import json
import os
import re
import threading
import time
import urllib.error
import urllib.request
import uuid

from gi.repository import Gio, GLib

VERSION = "VERSION_PLACEHOLDER"
DIR = os.path.join(os.path.expanduser("~"), ".cobble")
HOOKS_FILE = os.path.join(DIR, "notify-hooks")
STATE_FILE = os.path.join(DIR, "notify-watch.json")
BUS_NAME = "org.freedesktop.Notifications"
OBJECT_PATH = "/org/freedesktop/Notifications"
TAG = re.compile(r"<[^>]+>")
CHROME_ACTIONS = {"Activate", "Settings"}

INTROSPECTION = """
<node>
  <interface name="org.freedesktop.Notifications">
    <method name="GetCapabilities"><arg type="as" direction="out"/></method>
    <method name="Notify">
      <arg type="s" direction="in"/><arg type="u" direction="in"/><arg type="s" direction="in"/>
      <arg type="s" direction="in"/><arg type="s" direction="in"/><arg type="as" direction="in"/>
      <arg type="a{sv}" direction="in"/><arg type="i" direction="in"/><arg type="u" direction="out"/>
    </method>
    <method name="CloseNotification"><arg type="u" direction="in"/></method>
    <method name="GetServerInformation">
      <arg type="s" direction="out"/><arg type="s" direction="out"/>
      <arg type="s" direction="out"/><arg type="s" direction="out"/>
    </method>
    <signal name="NotificationClosed"><arg type="u"/><arg type="u"/></signal>
    <signal name="ActionInvoked"><arg type="u"/><arg type="s"/></signal>
  </interface>
</node>
"""

next_id = [0]


def log(message):
    print(time.strftime("%Y-%m-%d %H:%M:%S"), message, flush=True)


def hook_urls():
    try:
        with open(HOOKS_FILE, encoding="utf-8") as f:
            return [line.strip() for line in f if line.strip().startswith("http")]
    except FileNotFoundError:
        return []


def plain(text):
    text = TAG.sub("", text or "")
    return text.replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"').replace("&amp;", "&").strip()


def split_origin(body):
    parts = body.split("\n\n", 1)
    if len(parts) == 2 and parts[0] and " " not in parts[0] and "." in parts[0]:
        return parts[0], parts[1]
    return "", body


def post(url, data, key):
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                url, data=data, method="POST",
                headers={"Content-Type": "application/json", "Idempotency-Key": key},
            )
            with urllib.request.urlopen(req, timeout=10) as res:
                if res.status < 500:
                    return
        except urllib.error.HTTPError as error:
            if error.code < 500 and error.code != 429:
                log("a hook refused a notification: %s" % error.code)
                return
        except Exception as error:
            log("couldn't reach a hook: %s" % error)
        time.sleep(5 * 2 ** attempt)


def forward(payload):
    data = json.dumps(payload).encode("utf-8")
    for url in hook_urls():
        key = "notify-%s" % uuid.uuid4()
        threading.Thread(target=post, args=(url, data, key), daemon=True).start()


def on_call(conn, sender, path, interface, method, params, invocation):
    if method == "GetCapabilities":
        invocation.return_value(GLib.Variant("(as)", (["body", "actions"],)))
    elif method == "GetServerInformation":
        invocation.return_value(GLib.Variant("(ssss)", ("cobble-notify-watch", "Cobble", VERSION, "1.2")))
    elif method == "Notify":
        app_name, replaces_id, _icon, summary, body, actions, _hints, _timeout = params.unpack()
        if replaces_id:
            notification_id = replaces_id
        else:
            next_id[0] += 1
            notification_id = next_id[0]
        invocation.return_value(GLib.Variant("(u)", (notification_id,)))
        origin, text = split_origin(plain(body))
        labels = [actions[i + 1] for i in range(0, len(actions) - 1, 2)]
        forward({
            "source": "browser_notification",
            "app": app_name,
            "origin": origin,
            "title": plain(summary),
            "body": text,
            "actions": [label for label in labels if label not in CHROME_ACTIONS],
            "received_at": int(time.time() * 1000),
        })
    elif method == "CloseNotification":
        (notification_id,) = params.unpack()
        invocation.return_value(None)
        conn.emit_signal(None, OBJECT_PATH, BUS_NAME, "NotificationClosed", GLib.Variant("(uu)", (notification_id, 3)))
    else:
        invocation.return_dbus_error("org.freedesktop.DBus.Error.UnknownMethod", method)


def on_bus(conn, name):
    node = Gio.DBusNodeInfo.new_for_xml(INTROSPECTION)
    conn.register_object(OBJECT_PATH, node.interfaces[0], on_call, None, None)


def on_name(conn, name):
    os.makedirs(DIR, exist_ok=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump({"pid": os.getpid(), "version": VERSION, "started_at": int(time.time())}, f)
    log("watching notifications (version %s)" % VERSION)


def on_lost(conn, name):
    log("the notification service is taken or the bus went away; exiting")
    os._exit(1)


Gio.bus_own_name(Gio.BusType.SESSION, BUS_NAME, Gio.BusNameOwnerFlags.DO_NOT_QUEUE, on_bus, on_name, on_lost)
GLib.MainLoop().run()
`.replaceAll("VERSION_PLACEHOLDER", NotifyWatchVersion);
