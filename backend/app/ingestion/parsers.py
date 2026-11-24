"""Turns an uploaded file into ordered blocks of text, each with the page (or sheet) and
section heading it came from, so every later citation can point to a location."""
import csv
import dataclasses
import io
import json
import re

ACCEPTED = {".pdf", ".docx", ".xlsx", ".csv", ".txt", ".md", ".json"}


@dataclasses.dataclass
class Block:
    text: str
    page: int | None = None
    section: str | None = None


class ParseError(Exception):
    pass


_NUMBERED = re.compile(r"^((\d+(\.\d+){0,3}|[A-Z]\.\d+(\.\d+)*)[.)]?\s+\S|(Article \d+|Annex [IVX]+|ANNEX [IVX]+)\b)")


def looks_like_heading(line: str) -> bool:
    line = line.strip()
    if not 3 <= len(line) <= 90 or line.endswith((".", ",", ";", ":")):
        return False
    return bool(_NUMBERED.match(line)) or (line.isupper() and len(line.split()) <= 10)


def _pdf(data: bytes) -> tuple[list[Block], int]:
    from pypdf import PdfReader
    from pypdf.errors import PdfReadError
    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted and not reader.decrypt(""):
            raise ParseError("The PDF is password-protected")
        blocks, section = [], None
        for n, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            buf = []
            for line in text.splitlines():
                if looks_like_heading(line):
                    if buf:
                        blocks.append(Block("\n".join(buf), n, section))
                        buf = []
                    section = line.strip()
                buf.append(line)
            if "".join(buf).strip():
                blocks.append(Block("\n".join(buf), n, section))
        if not blocks:
            raise ParseError("No text could be extracted. The PDF is probably a scan; OCR is not supported yet.")
        return blocks, len(reader.pages)
    except PdfReadError as e:
        raise ParseError(f"The PDF cannot be read: {e}")


def _docx(data: bytes) -> tuple[list[Block], int | None]:
    import docx
    document = docx.Document(io.BytesIO(data))
    blocks, section, buf = [], None, []

    def flush():
        if buf:
            blocks.append(Block("\n".join(buf), None, section))
            buf.clear()
    for p in document.paragraphs:
        text = p.text.strip()
        if not text:
            continue
        if (p.style.name or "").lower().startswith(("heading", "title")):
            flush()
            section = text
        buf.append(text)
    flush()
    for table in document.tables:
        rows = [" | ".join(c.text.strip() for c in r.cells) for r in table.rows]
        if any(rows):
            blocks.append(Block("\n".join(rows), None, section))
    if not blocks:
        raise ParseError("The document contains no text")
    return blocks, None


def _xlsx(data: bytes) -> tuple[list[Block], int]:
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    blocks = []
    for n, ws in enumerate(wb.worksheets, start=1):
        rows = []
        for row in ws.iter_rows(values_only=True):
            cells = ["" if c is None else str(c) for c in row]
            if any(cells):
                rows.append(" | ".join(cells).rstrip(" |"))
            if len(rows) == 40:
                blocks.append(Block("\n".join(rows), n, f"Sheet: {ws.title}"))
                rows = []
        if rows:
            blocks.append(Block("\n".join(rows), n, f"Sheet: {ws.title}"))
    if not blocks:
        raise ParseError("The workbook contains no data")
    return blocks, len(wb.worksheets)


def _text(data: bytes, markdown: bool = False) -> tuple[list[Block], None]:
    text = data.decode("utf-8", errors="replace")
    blocks, section, buf = [], None, []
    for line in text.splitlines():
        if markdown and re.match(r"^#{1,6}\s+\S", line) or (not markdown and looks_like_heading(line)):
            if buf:
                blocks.append(Block("\n".join(buf), None, section))
                buf = []
            section = line.lstrip("# ").strip()
        buf.append(line)
    if "".join(buf).strip():
        blocks.append(Block("\n".join(buf), None, section))
    if not blocks:
        raise ParseError("The file is empty")
    return blocks, None


def parse(filename: str, data: bytes) -> tuple[list[Block], int | None]:
    """Returns (blocks, page_count)."""
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext == ".pdf":
        return _pdf(data)
    if ext == ".docx":
        return _docx(data)
    if ext == ".xlsx":
        return _xlsx(data)
    if ext == ".csv":
        reader = csv.reader(io.StringIO(data.decode("utf-8", errors="replace")))
        rows = [" | ".join(r) for r in reader if any(r)]
        if not rows:
            raise ParseError("The file is empty")
        return [Block("\n".join(rows[i:i + 40]), None, None) for i in range(0, len(rows), 40)], None
    if ext == ".json":
        try:
            pretty = json.dumps(json.loads(data.decode("utf-8", errors="replace")), indent=1, ensure_ascii=False)
        except json.JSONDecodeError as e:
            raise ParseError(f"Invalid JSON: {e}")
        return _text(pretty.encode())
    if ext in (".txt", ".md"):
        return _text(data, markdown=ext == ".md")
    raise ParseError(f"Unsupported file type: {ext or 'none'}")
