"""Provider-neutral interface used by every agent."""
import dataclasses
import json
import re
from typing import Protocol

from pydantic import BaseModel


class LLMError(Exception):
    """A provider call failed. `retryable` says whether trying again can help."""

    def __init__(self, message: str, retryable: bool = False):
        super().__init__(message)
        self.retryable = retryable


@dataclasses.dataclass
class LLMResult:
    text: str | None
    parsed: BaseModel | None
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None


class Provider(Protocol):
    def complete(self, model: str, system: str, user: str, schema: type[BaseModel] | None = None,
                 max_tokens: int = 16000) -> LLMResult: ...

    def embed(self, model: str, texts: list[str]) -> list[list[float]]: ...

    def list_models(self) -> list[str]: ...


def extract_json(text: str) -> str:
    """Local models often wrap JSON in code fences or prose; take the outermost object."""
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
    start, end = text.find("{"), text.rfind("}")
    return text[start:end + 1] if start != -1 and end > start else text


def schema_instruction(schema: type[BaseModel]) -> str:
    return ("Respond with a single JSON object and nothing else. It must validate against this JSON Schema:\n"
            + json.dumps(schema.model_json_schema()))
