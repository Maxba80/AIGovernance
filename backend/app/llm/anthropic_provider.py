"""Anthropic (Claude) through the official SDK."""
import anthropic
from pydantic import BaseModel

from .base import LLMError, LLMResult

# Models for which the API can re-run a declined request on a fallback model (server-side fallback).
_FALLBACK_MODELS = ("claude-fable-5-2", "claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5")
_FALLBACK_BETA = "server-side-fallback-2026-07-01"


class AnthropicProvider:
    def __init__(self, api_key: str, base_url: str | None = None):
        kwargs = {"api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url
        self.client = anthropic.Anthropic(**kwargs)

    def complete(self, model: str, system: str, user: str, schema: type[BaseModel] | None = None,
                 max_tokens: int = 16000) -> LLMResult:
        messages = [{"role": "user", "content": user}]
        try:
            if schema is not None:
                response = self.client.messages.parse(model=model, max_tokens=max_tokens, system=system,
                                                      messages=messages, output_format=schema)
            elif model in _FALLBACK_MODELS:
                response = self.client.beta.messages.create(model=model, max_tokens=max_tokens, system=system,
                                                            messages=messages, betas=[_FALLBACK_BETA], fallbacks="default")
            else:
                response = self.client.messages.create(model=model, max_tokens=max_tokens, system=system, messages=messages)
        except anthropic.BadRequestError as e:
            raise LLMError(f"Anthropic rejected the request: {e.message}")
        except anthropic.AuthenticationError:
            raise LLMError("Anthropic API key is invalid")
        except anthropic.PermissionDeniedError:
            raise LLMError("Anthropic API key lacks permission for this model")
        except anthropic.NotFoundError:
            raise LLMError(f"Anthropic model not found: {model}")
        except anthropic.RateLimitError:
            raise LLMError("Anthropic rate limit reached", retryable=True)
        except anthropic.APIStatusError as e:
            raise LLMError(f"Anthropic API error {e.status_code}: {e.message}", retryable=e.status_code >= 500)
        except anthropic.APIConnectionError:
            raise LLMError("Cannot reach the Anthropic API", retryable=True)

        if response.stop_reason == "refusal":
            category = getattr(response.stop_details, "category", None) if response.stop_details else None
            raise LLMError(f"The model declined this request (category: {category or 'unspecified'})")
        if response.stop_reason == "max_tokens":
            raise LLMError("The model's answer was cut off at the output limit")
        text = "".join(b.text for b in response.content if b.type == "text")
        parsed = getattr(response, "parsed_output", None) if schema is not None else None
        if schema is not None and parsed is None:
            raise LLMError("The model did not return output matching the required structure")
        return LLMResult(text=text or None, parsed=parsed, model=response.model,
                         input_tokens=response.usage.input_tokens, output_tokens=response.usage.output_tokens)

    def embed(self, model: str, texts: list[str]) -> list[list[float]]:
        raise LLMError("Anthropic does not offer an embeddings API. Choose another provider for embeddings (e.g. Ollama or OpenAI).")

    def list_models(self) -> list[str]:
        try:
            return [m.id for m in self.client.models.list()]
        except anthropic.AuthenticationError:
            raise LLMError("Anthropic API key is invalid")
        except anthropic.APIStatusError as e:
            raise LLMError(f"Anthropic API error {e.status_code}: {e.message}")
        except anthropic.APIConnectionError:
            raise LLMError("Cannot reach the Anthropic API", retryable=True)
