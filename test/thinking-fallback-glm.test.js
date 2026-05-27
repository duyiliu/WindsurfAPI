// Issue #86 follow-up KLFDan0534: some non-reasoning Cascade routes emit
// their visible answer in step.thinking instead of step.responseText. For those
// models we promote thinking -> content so OpenAI-style clients render text.
//
// GLM-5.x is different: it is an implicit reasoning model even when the model
// key does not include "-thinking". Promoting its reasoning_content to content
// makes Hermes treat internal monologue as the final assistant answer and stops
// multi-turn agent/dialogue flow. Keep GLM-5.x reasoning separate; handle stuck
// cascades via executor-not-idle invalidation instead.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shouldFallbackThinkingToText } from '../src/handlers/chat.js';

describe('shouldFallbackThinkingToText', () => {
  it('does NOT promote GLM 5.1 thinking-only output because it is implicit reasoning', () => {
    assert.equal(shouldFallbackThinkingToText({
      routingModelKey: 'glm-5.1',
      wantThinking: false,
      accText: '',
      accThinking: 'internal reasoning that must not become final content',
      hasToolCalls: false,
    }), false);
  });

  it('does NOT promote GLM 5.1 when wantThinking is omitted', () => {
    assert.equal(shouldFallbackThinkingToText({
      routingModelKey: 'glm-5.1',
      accText: '',
      accThinking: 'internal reasoning',
      hasToolCalls: false,
    }), false);
  });

  it('does NOT promote Gemini 2.5 thinking-only output because it is implicit reasoning', () => {
    assert.equal(shouldFallbackThinkingToText({
      routingModelKey: 'gemini-2.5-flash',
      wantThinking: false,
      accText: '',
      accThinking: 'reasoning content',
      hasToolCalls: false,
    }), false);
  });

  it('still promotes thinking -> content for non-implicit non-reasoning models', () => {
    assert.equal(shouldFallbackThinkingToText({
      routingModelKey: 'glm-4.7',
      wantThinking: false,
      accText: '',
      accThinking: 'visible answer routed through thinking by upstream',
      hasToolCalls: false,
    }), true);
  });

  it('does NOT promote when content was emitted normally', () => {
    assert.equal(shouldFallbackThinkingToText({
      routingModelKey: 'glm-4.7',
      wantThinking: false,
      accText: 'The answer is 42.',
      accThinking: 'I was thinking about this...',
      hasToolCalls: false,
    }), false);
  });

  it('does NOT promote when there was nothing at all (genuine empty)', () => {
    assert.equal(shouldFallbackThinkingToText({
      routingModelKey: 'glm-4.7',
      wantThinking: false,
      accText: '',
      accThinking: '',
      hasToolCalls: false,
    }), false);
  });

  it('does NOT promote when tool calls were emitted (no text expected)', () => {
    assert.equal(shouldFallbackThinkingToText({
      routingModelKey: 'glm-4.7',
      wantThinking: false,
      accText: '',
      accThinking: 'planning the tool call',
      hasToolCalls: true,
    }), false);
  });

  it('does NOT promote when caller explicitly requested thinking (wantThinking=true)', () => {
    assert.equal(shouldFallbackThinkingToText({
      routingModelKey: 'glm-4.7',
      wantThinking: true,
      accText: '',
      accThinking: 'reasoning content',
      hasToolCalls: false,
    }), false);
  });

  it('does NOT promote when routingModelKey already lands on a -thinking variant', () => {
    assert.equal(shouldFallbackThinkingToText({
      routingModelKey: 'claude-sonnet-4.6-thinking',
      wantThinking: false,
      accText: '',
      accThinking: 'reasoning content',
      hasToolCalls: false,
    }), false);
  });

  it('does NOT promote for kimi-k2-thinking — name match blocks regardless of wantThinking', () => {
    assert.equal(shouldFallbackThinkingToText({
      routingModelKey: 'kimi-k2-thinking',
      wantThinking: false,
      accText: '',
      accThinking: 'reasoning',
      hasToolCalls: false,
    }), false);
  });

  it('promotes for kimi-k2 (non-thinking variant)', () => {
    assert.equal(shouldFallbackThinkingToText({
      routingModelKey: 'kimi-k2',
      wantThinking: false,
      accText: '',
      accThinking: 'unexpected thinking content from upstream',
      hasToolCalls: false,
    }), true);
  });

  it('signature has no `body` param — guards against #93 ReferenceError regression', () => {
    const src = shouldFallbackThinkingToText.toString();
    const match = src.match(/^function\s+\w+\s*\(\s*\{([^}]+)\}/);
    assert.ok(match, 'expected function with destructured object arg');
    const args = match[1];
    assert.ok(!/\bbody\b/.test(args), `signature must not include 'body' (got: ${args.trim()})`);
    assert.ok(/\bwantThinking\b/.test(args), `signature must include 'wantThinking' (got: ${args.trim()})`);
  });
});
