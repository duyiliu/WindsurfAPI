import re

with open('C:/Users/zhangqianfeng/WindsurfAPI/src/handlers/chat.js', 'r') as f:
    content = f.read()

old = '''                } else {
                  log.warn(`Chat[non-stream]: NLU retry — second pass also produced 0 tool_calls; giving up (model=${modelKey})`);
                }'''

new = '''                } else {
                  log.warn(`Chat[non-stream]: NLU retry — second pass also produced 0 tool_calls; giving up (model=${modelKey})`);
                  // v2.0.93 — GLM-5.1 cascade idle_empty fallback.
                  if (!toolCalls.length && !allText.length && allThinking.length) {
                    const fallback = extractToolArgsFromUserMessage(lastUser, intendedTool || (Array.isArray(tools) && tools.length ? (tools[0].function?.name || tools[0].name || '') : ''), tools);
                    if (fallback) {
                      log.info(`Chat[non-stream]: idle_empty fallback — constructed tool_call from user message (tool=${fallback.name})`);
                      toolCalls = [fallback];
                      allText = '';
                      allThinking = '';
                    }
                  }
                }'''

if old in content:
    content = content.replace(old, new, 1)
    print('NLU retry fallback patched OK')
else:
    print('ERROR: Could not find section')
    # Find for debug
    idx = content.find('second pass also produced')
    if idx >= 0:
        print(f'Found at {idx}')
        print(repr(content[idx-100:idx+80]))

with open('C:/Users/zhangqianfeng/WindsurfAPI/src/handlers/chat.js', 'w') as f:
    f.write(content)
print('Done')
