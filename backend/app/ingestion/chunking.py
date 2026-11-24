"""Splits parsed blocks into retrieval chunks without crossing page or section boundaries."""
import dataclasses
import re

from .parsers import Block

TARGET = 1200   # characters
OVERLAP = 150


@dataclasses.dataclass
class Chunk:
    ordinal: int
    text: str
    page: int | None
    section: str | None


def _split(text: str) -> list[str]:
    text = re.sub(r"[ \t]+", " ", text).strip()
    if len(text) <= TARGET:
        return [text] if text else []
    parts, buf = [], ""
    # paragraphs first, then sentences, so chunks end at natural boundaries
    for piece in re.split(r"(?<=[.!?])\s+|\n{2,}|\n", text):
        while len(piece) > TARGET:  # a single very long run without boundaries
            parts.append(piece[:TARGET])
            piece = piece[TARGET - OVERLAP:]
        if len(buf) + len(piece) + 1 > TARGET and buf:
            parts.append(buf)
            buf = buf[-OVERLAP:] + " " + piece
        else:
            buf = (buf + " " + piece).strip()
    if buf.strip():
        parts.append(buf)
    return parts


def chunk(blocks: list[Block]) -> list[Chunk]:
    chunks = []
    for b in blocks:
        for part in _split(b.text):
            chunks.append(Chunk(len(chunks), part, b.page, b.section))
    return chunks
