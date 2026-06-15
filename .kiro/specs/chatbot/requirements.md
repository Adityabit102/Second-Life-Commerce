# ReturnBot Chatbot — Feature Specification

## Overview

A floating AI chatbot widget (bottom-right) powered by Groq `llama-3.3-70b-versatile`. It answers customer questions about the Second Life Commerce platform in 6 languages.

## Requirements

### Languages Supported

| Code      | Label    | Script     |
|-----------|----------|------------|
| hinglish  | Hinglish | Roman      |
| hindi     | हिंदी    | Devanagari |
| english   | English  | Latin      |
| french    | Français | Latin      |
| german    | Deutsch  | Latin      |
| spanish   | Español  | Latin      |

### Language Switching

- Flag + language name button in chat header opens a 3×2 grid picker
- Switching language resets conversation to the new language's greeting
- Language instruction is prepended as the highest-priority system rule

### Conversation

- Last 10 messages passed as history for context
- Suggested questions shown on first open (5 per language, in native language)
- Typing indicator (3 bouncing dots) while awaiting response
- Bold markdown (`**text**`) rendered as `<strong>`

### Knowledge Base

- Platform overview (4 actions: relist, swap, donate, recycle)
- Grading system (Grade A/B/C/Junk with resale percentages)
- Return process, pricing logic, wallet credits, order tracking
- Off-topic questions: redirect to general assistant

## API

`POST /api/v1/chat/message`
```json
{
  "message": "string",
  "history": [{"role": "user|assistant", "content": "string"}],
  "language": "hinglish|hindi|english|french|german|spanish"
}
```
Response: `{ "reply": "string" }`

## Acceptance Criteria

- [ ] Hindi responses use Devanagari script exclusively (no Roman Hindi words)
- [ ] English responses contain no Hindi words
- [ ] Language picker highlights currently selected language in orange
- [ ] Switching language shows new greeting and clears history
- [ ] Suggested questions disappear after first user message
- [ ] Bot responds within 5 seconds for typical questions
