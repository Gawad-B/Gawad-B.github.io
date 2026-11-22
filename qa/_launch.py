"""Shared launch settings for the QA suites. Suites run as `python qa/<name>.py`."""
import os

BASE = os.environ.get("QA_BASE", "http://localhost:3000")
PRO_URL = BASE + "/"
UNIVERSE_URL = BASE + "/universe/"

_SYSTEM_CHROMIUM = "/usr/bin/chromium-browser"
_GL_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]


def launch(p, **kwargs):
    """Launch the system Chromium (the bundled one no longer starts after the OS upgrade)."""
    extra = list(kwargs.pop("args", []))
    exe = os.environ.get("QA_CHROMIUM") or (_SYSTEM_CHROMIUM if os.path.exists(_SYSTEM_CHROMIUM) else None)
    if exe:
        kwargs["executable_path"] = exe
    return p.chromium.launch(headless=True, args=_GL_ARGS + extra, **kwargs)
