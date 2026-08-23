"""Shared rate limiter.

Lives here rather than in ``main`` so routers do not have to import the
application module they are mounted on — that cycle worked only because the
router imports were deferred until after the limiter was constructed.
"""
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from core.config import settings


def client_ip(request: Request) -> str:
    """Rate-limit key.

    Behind Vercel/Render the socket peer is the proxy, not the caller, so
    keying on it puts every user in a single shared bucket.  When
    ``TRUST_PROXY_HEADERS`` is enabled we key on the address the proxy
    forwarded instead.
    """
    if settings.trust_proxy_headers:
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("x-real-ip", "")
        if real_ip:
            return real_ip.strip()
    return get_remote_address(request)


limiter = Limiter(key_func=client_ip, default_limits=[])
