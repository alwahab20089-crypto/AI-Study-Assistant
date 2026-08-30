import Groq from "groq-sdk";

let groqClient = null;

const getClient = () => {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return groqClient;
};

// Custom error type so services/controllers can distinguish
// Groq/API failures from application-level failures.
export class GroqServiceError extends Error {
  constructor(message, { status, retryable } = {}) {
    super(message);
    this.name = "GroqServiceError";
    this.status = status;
    this.retryable = retryable;
  }
}

const REQUEST_TIMEOUT_MS = 90000;

/**
 * Sends a chat completion request to Groq.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>} assistant reply text
 */
export const getChatCompletion = async (messages, options = {}) => {
  const client = getClient();
  
  const model = process.env.GROQ_MODEL;

  if (!model) {
    throw new GroqServiceError(
      "AI model is not configured.",
      {
        retryable: false,
      }
    );
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const completion = await client.chat.completions.create(
      {
        model,
        messages,

        temperature: options.temperature ?? 0.2,

        max_completion_tokens: options.max_completion_tokens ?? 4096,

        ...(options.json
          ? {
            response_format: {
              type: "json_object",
            },
          }
          : {}),

        reasoning_effort: "low",
      },
      {
        signal: controller.signal,
      }
    );

    const choice = completion.choices?.[0];

    const answer = choice?.message?.content;

    if (!answer || !answer.trim()) {
      throw new GroqServiceError(
        "The AI service returned an empty response.",
        {
          retryable: true,
        }
      );
    }

    // Useful debugging information during development.
    console.log("✅ Groq response received");
    console.log(
      "Finish reason:",
      choice?.finish_reason || "unknown"
    );

    if (completion.usage) {
      console.log("Groq usage:", {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      });
    }

    return answer.trim();
  } catch (error) {
    // Preserve our own application errors.
    if (error instanceof GroqServiceError) {
      throw error;
    }

    // Request timeout.
    if (error?.name === "AbortError") {
      throw new GroqServiceError(
        "The AI service took too long to respond. Please try again.",
        {
          status: 504,
          retryable: true,
        }
      );
    }

    const status =
      error?.status ||
      error?.response?.status ||
      error?.statusCode;

    // Rate limit.
    if (status === 429) {
      console.error(
        "Groq rate limit:",
        error?.message
      );

      throw new GroqServiceError(
        "The AI service is temporarily busy. Please try again shortly.",
        {
          status: 429,
          retryable: true,
        }
      );
    }

    // Authentication/configuration problem.
    if (status === 401 || status === 403) {
      console.error(
        "Groq authentication error:",
        error?.message
      );

      throw new GroqServiceError(
        "The AI service is currently unavailable.",
        {
          status,
          retryable: false,
        }
      );
    }

    // Groq/server-side errors.
    if (status && status >= 500) {
      console.error(
        "Groq server error:",
        error?.message
      );

      throw new GroqServiceError(
        "The AI service is temporarily unavailable. Please try again shortly.",
        {
          status,
          retryable: true,
        }
      );
    }

    // Unexpected error.
    console.error(
      "Unexpected Groq error:",
      error
    );

    throw new GroqServiceError(
      "Something went wrong while generating a response.",
      {
        status: status || 500,
        retryable: false,
      }
    );
  } finally {
    clearTimeout(timeout);
  }
};