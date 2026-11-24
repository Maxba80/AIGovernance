"""Any OpenAI-compatible endpoint: OpenAI, Azure OpenAI (v1 endpoint), Google Gemini
(OpenAI-compatible endpoint), Ollama, LM Studio, vLLM."""
import openai
from pydantic import BaseModel, ValidationError

from .base import LLMError, LLMResult, extract_json, schema_instruction


class OpenAICompatibleProvider:
    def __init__(self, base_url: str | None, api_key: str | None):
        # local servers ignore the key but the SDK requires a non-empty value
        self.client = openai.OpenAI(base_url=base_url or None, api_key=api_key or "not-needed", timeout=300, max_retries=1)

    def _call(self, fn, **kwargs):
        try:
            return fn(**kwargs)
        except openai.AuthenticationError:
            raise LLMError("The API key was rejected by the provider")
        except openai.NotFoundError:
            raise LLMError(f"Model or endpoint not found: {kwargs.get('model')}")
        except openai.RateLimitError:
            raise LLMError("Provider rate limit reached", retryable=True)
        except openai.BadRequestError as e:
            raise LLMError(f"The provider rejected the request: {e}")
        except openai.APIStatusError as e:
            raise LLMError(f"Provider error {e.status_code}: {e}", retryable=e.status_code >= 500)
        except openai.APIConnectionError:
            raise LLMError("Cannot reach the provider. Check the base URL and that the server is running.", retryable=True)

    def complete(self, model: str, system: str, user: str, schema: type[BaseModel] | None = None,
                 max_tokens: int = 16000) -> LLMResult:
        if schema is not None:
            system = system + "\n\n" + schema_instruction(schema)
        messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
        last_error = None
        for attempt in range(2 if schema is not None else 1):
            kwargs = {"model": model, "messages": messages}
            if schema is not None:
                kwargs["response_format"] = {"type": "json_object"}
            try:
                response = self._call(self.client.chat.completions.create, **kwargs)
            except LLMError as e:
                if schema is None or "response_format" not in str(e):
                    raise
                kwargs.pop("response_format")  # server without JSON mode: rely on the instruction
                response = self._call(self.client.chat.completions.create, **kwargs)
            text = response.choices[0].message.content or ""
            usage = response.usage
            result = LLMResult(text=text, parsed=None, model=response.model or model,
                               input_tokens=getattr(usage, "prompt_tokens", None),
                               output_tokens=getattr(usage, "completion_tokens", None))
            if schema is None:
                return result
            try:
                result.parsed = schema.model_validate_json(extract_json(text))
                return result
            except ValidationError as e:
                last_error = e
                messages = messages + [{"role": "assistant", "content": text},
                                       {"role": "user", "content": f"That was not valid. Errors: {e.errors()[:5]}. Return only the corrected JSON object."}]
        first = last_error.errors()[0] if last_error else {}
        where = ".".join(str(x) for x in first.get("loc", [])) or "response"
        raise LLMError(f"The model did not return output in the required structure, even after a retry "
                       f"({last_error.error_count() if last_error else 0} problem(s); first: '{where}' {first.get('msg', '').lower()}). "
                       "A more capable model usually fixes this.")

    def embed(self, model: str, texts: list[str]) -> list[list[float]]:
        response = self._call(self.client.embeddings.create, model=model, input=texts)
        return [d.embedding for d in sorted(response.data, key=lambda d: d.index)]

    def list_models(self) -> list[str]:
        return sorted(m.id for m in self._call(self.client.models.list))
