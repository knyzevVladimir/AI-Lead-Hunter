"""Shared resilience helpers for web-scraping parsers.

Centralises browser-like header rotation and retry-with-backoff so that
individual parsers (Yandex Maps today, others tomorrow) stay thin and the
anti-bot behaviour is tuned in one place.
"""
from __future__ import annotations

import asyncio
import random

import httpx

# A small pool of modern, real-world desktop User-Agents. Rotating between
# them across *retries* makes a blocked attempt look like an unrelated visit.
USER_AGENTS: list[str] = [
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    ),
    (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    ),
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0"
    ),
    (
        "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0"
    ),
    (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 "
        "(KHTML, like Gecko) Version/17.5 Safari/605.1.15"
    ),
]


class ScraperBlockedError(RuntimeError):
    """Raised when the target serves an anti-bot wall (captcha, smart block).

    The pipeline catches this specifically to (a) fall back to another
    provider and (b) surface a human-actionable message to the UI instead of
    a generic 502.
    """


def pick_user_agent(default: str | None = None, exclude: str | None = None) -> str:
    """Return a UA string: the configured default first, then rotate the pool."""
    if default and default != exclude:
        return default
    pool = [ua for ua in USER_AGENTS if ua != exclude] or USER_AGENTS
    return random.choice(pool)


async def get_with_retries(
    client: httpx.AsyncClient,
    url: str,
    *,
    params: dict | None = None,
    headers: dict | None = None,
    attempts: int = 3,
    base_delay: float = 1.0,
    retry_statuses: tuple[int, ...] = (429, 500, 502, 503, 504),
) -> httpx.Response:
    """GET with exponential backoff on transient failures.

    Retries network errors and rate-limit/5xx statuses. Client errors (4xx
    other than 429) are raised immediately — retrying them is pointless.
    """
    last_exc: Exception | None = None
    for attempt in range(attempts):
        try:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code in retry_statuses and attempt < attempts - 1:
                await asyncio.sleep(base_delay * (2**attempt) + random.uniform(0, 0.5))
                continue
            resp.raise_for_status()
            return resp
        except httpx.HTTPStatusError:
            # 4xx (non-retryable) or final attempt of a retryable status.
            raise
        except httpx.HTTPError as exc:  # network-level: timeout, DNS, conn reset
            last_exc = exc
            if attempt < attempts - 1:
                await asyncio.sleep(base_delay * (2**attempt) + random.uniform(0, 0.5))
                continue
            raise
    assert last_exc is not None  # for type-checkers; loop always returns/raises
    raise last_exc
