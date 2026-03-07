let globalGeneratedData = []; // Global storage for download

// Prompts Configuration with Concise Explanations & High-Quality Distractors
const ALL_TYPES = [
    'purpose', 'mood', 'claim', 'underlying', 'gist',
    'topic', 'title', 'grammar', 'vocabulary', 'blank',
    'irrelevant', 'sequence', 'insertion', 'summary'
];

const PROMPTS = {
    'purpose': `Role: CSAT Creator. Create ONE "Purpose" question.
Requirements:
1. Identify the practical purpose of the text (e.g., letter, announcement, complaint, suggestion).
2. Options: Korean phrases (e.g. "~하려고").
3. Distractors: Plausible but incorrect purposes based on keywords.
Format: [{"type":"글의 목적", "question":"다음 글의 목적으로 가장 적절한 것은?", "options":["(1)...", "(2)...", "(3)...", "(4)...", "(5)..."], "answer_index":1, "explanation":"..."}]
Text: {text}`,

    'mood': `Role: CSAT Creator. Create ONE "Mood/Atmosphere" question.
Requirements:
1. If Storytelling: Options must be "(A) Emotion -> (B) Emotion" format (English words).
2. If Non-fiction: Options must represent the "Tone" of the author (English words).
3. Distractors: Opposing emotions or unrelated moods.
Format: [{"type":"심경 변화", "question":"다음 글에 드러난 I의 심경 변화로 가장 적절한 것은? (또는 글의 분위기)", "options":["(1) worried -> relieved", "(2)...", ...], "answer_index":1, "explanation":"..."}]
Text: {text}`,

    'claim': `Role: CSAT Creator. Create ONE "Claim" question (필자의 주장).
Requirements:
1. Identify the Main Argument/Opinion.
2. Options: KOREAN complete sentences.
3. Distractors: Too specific (detail focus), Topic Error (mentioned but not main point), Contradictory.
Format: [{"type":"글의 주장", "question":"다음 글에서 필자가 주장하는 바로 가장 적절한 것은?", "options":["(1)...", "(2)...", ...], "answer_index":1, "explanation":"..."}]
Text: {text}`,

    'underlying': `Role: CSAT Creator. Create ONE "Implication" (Underlying Meaning) question.
Process:
1. **Target Selection**: Identify a metaphor representing the Main Idea. Mark it with <u>tags</u> in "modified_text".
2. **Correct Answer**: Paraphrase the figurative meaning abstractly (English).
3. **Distractors**: Literal Interpretation (Trap), Topic Error.
Format: [{"type":"함축 의미", "question":"밑줄 친 부분이 다음 글에서 의미하는 바로 가장 적절한 것은?", "options":["Option1", "Option2", "Option3", "Option4", "Option5"], "answer_index":3, "explanation":"...", "modified_text":"Full text with <u>underlined phrase</u>..."}]
Text: {text}`,

    'gist': `Role: CSAT Creator. Create ONE "Gist" question (글의 요지).
Requirements:
1. Identify the Core Message.
2. Options: KOREAN full sentences.
3. Distractors: Mentioned details but not the main point, Misinterpretation of causality.
Format: [{"type":"글의 요지", "question":"다음 글의 요지로 가장 적절한 것은?", "options":["(1)...", "(2)...", ...], "answer_index":1, "explanation":"..."}]
Text: {text}`,

    'topic': `Role: CSAT Creator. Create ONE "Topic" question (글의 주제).
Requirements:
1. Identify the Topic/Subject.
2. Options: ENGLISH phrases.
3. Distractors: Too Broad, Too Narrow, Same Keyword but wrong relation.
Format: [{"type":"글의 주제", "question":"다음 글의 주제로 가장 적절한 것은?", "options":["(1)...", "(2)...", ...], "answer_index":1, "explanation":"..."}]
Text: {text}`,

    'title': `Role: CSAT Creator. Create ONE "Title" question (글의 제목).
Requirements:
1. Create a Title that covers the whole text.
2. Options: ENGLISH phrases/sentences.
3. Distractors: Too Broad (covers too much), Too Narrow (only one part), Metaphoric but inaccurate.
Format: [{"type":"글의 제목", "question":"다음 글의 제목으로 가장 적절한 것은?", "options":["(1)...", "(2)...", ...], "answer_index":1, "explanation":"..."}]
Text: {text}`,

    'grammar': `Role: CSAT Creator. Create ONE "Grammar" question.
Requirements:
1. **Focus on Key Grammar**: Subject-Verb Agreement, Voice, Participles, Relative Clauses.
2. **Underlining**: Mark 5 parts with circled numbers ①, ②, ③, ④, ⑤ and <u>underline</u>. One MUST be incorrect.
Format: [{"type":"어법", "question":"다음 글의 밑줄 친 부분 중, 어법상 틀린 것은?", "options":["①", "②", "③", "④", "⑤"], "answer_index":3, "explanation":"...", "modified_text":"Full text with ① <u>word</u> markings..."}] 
Text: {text}`,

    'vocabulary': `당신은 한국 수능 영어(CSAT) 출제 위원입니다. 주어진 영어 지문을 바탕으로 고등학생 수준의 '어휘 추론 문제(밑줄 친 낱말의 쓰임이 적절하지 않은 것 찾기)'를 생성하십시오.

**Step 1: 텍스트 논리 분석**
- 지문의 주제와 글의 흐름(긍정/부정, 인과관계, 대조)을 분석하십시오.

**Step 2: 타깃 단어 5개 선정**
- 지문의 전개상 논리적으로 중요한 의미를 지닌 형용사, 동사, 부사 5개를 선정하십시오. (단순한 문법적 기능어 제외)
- 단어는 '주제문(Topic Sentence) 내 핵심어', '연결사(However, Therefore 등) 직후의 동사/형용사', '대조되는 개념(A vs B)'을 설명하는 단어 위주로 선정합니다.
- 단어들의 위치는 지문 전체에 고르게 분포해야 합니다.

**Step 3: 오답(정답 선지) 생성**
- 선정된 5개의 단어 중 **단 1개의 단어만 문맥과 정반대되는 단어(반의어)로 교체**하십시오. (예: increase -> decrease, benefit -> drawback, accept -> deny)
- 교체된 단어는 문법적으로는 완벽해야 하지만, 앞뒤 문맥의 인과관계나 글의 주제와 완전히 모순(논리적 호응 파괴)되어야 합니다.
- 나머지 4개의 단어는 원문 그대로 유지하거나 문맥에 맞는 유의어로 둡니다.

**[오답 변형 방식 예시 (반드시 참고할 것)]**
- (예시 1 - 논리적 방향 왜곡)
  기존 문맥: "유기농 농법은 화학물질을 못 써서 비용이 많이 들고 잡초 통제가 어렵다는 단점이 있다."
  원문 텍스트: "... there are ③ drawbacks to the extensive use of ..."
  변형 결과: "... there are ③ <u>benefits</u> to the extensive use of ..." (단점을 장점으로 왜곡하여 오답(정답 선지)으로 만듦)

- (예시 2 - 인과관계 파괴)
  기존 문맥: "고고학자들이 유물을 연구할 시간만 충분히 주어진다면, 역사적 지식은 손실되지(lost) 않는다."
  원문 텍스트: "... no historical knowledge is ② lost!"
  변형 결과: "... no historical knowledge is ② <u>found</u>!" (손실되지 않는다는 인과관계를 발견되지 않는다고 반대로 왜곡)

**Step 4: 기호 표시 및 출력**
- 선정된 5개 단어(정답 1개, 오답 4개) 앞에 원문자 ①, ②, ③, ④, ⑤ 를 붙이고 <u> 태그로 감싸서 표시하십시오. (예: ① <u>drawbacks</u>)

Format: [{"type":"어휘", "question":"다음 글의 밑줄 친 부분 중, 문맥상 낱말의 쓰임이 적절하지 않은 것은?", "options":["①", "②", "③", "④", "⑤"], "answer_index":3, "explanation":"원래 어떤 단어가 들어가야 맞고 대체된 단어가 왜 논리적으로 틀렸는지 구체적인 인과관계를 들어 해설 추가", "modified_text":"Full text with ① <u>word</u> markings..."}]
Text: {text}`,

    'blank': `당신은 한국 대학수학능력시험(CSAT) 영어 영역의 최고 전문 출제 위원입니다. 
주어진 영문 텍스트를 철저히 분석하여, 실제 수능과 동일한 수준의 고도의 '빈칸 추론 문제'를 1개 생성하십시오.

### [업무 지시 1: 빈칸의 위치 및 길이 선정]
1. (길이 결정) 지문의 논리적 난이도에 따라 빈칸의 길이를 [핵심 단어 / 긴 구(Phrase) / 절(Clause)] 중 하나로 결정하십시오.
2. (위치 결정) 빈칸은 반드시 글의 '주제문(Topic Sentence)', '은유적/함축적 결론', 혹은 핵심적인 '인과관계'에 해당하는 문장에 뚫어야 합니다.

### [업무 지시 2: 선지(Options) 구성 알고리즘 🌟]
문제의 타당성은 매력적인 오답에 달려 있습니다. 선지 5개는 반드시 다음 원칙을 따르십시오.
1. 형태 및 길이의 일치 (필수 원칙): 수험생이 길이 차이로 정답을 유추할 수 없도록, 5개 선지 모두 비슷한 길이와 동일한 문법적 형태(예: 모두 동명사구(ing), 모두 투부정사(to-v) 형태 등)를 철저하게 유지하십시오.
2. 정답 선지 (1개): 
   - 원문(Original Text)을 그대로 쓰지 말고, 동일한 의미의 다른 핵심어와 구조로 '패러프레이징(Paraphrasing)' 하십시오.
3. 매력적인 오답 선지 구성 (4개): 
   - [오답 유형 1 - Word Salad (최소 2개 포함)]: 지문에 여러 번 등장한 '핵심 키워드'들을 본문에서 그대로 가져와 선지를 구성하되, 인과관계를 거꾸로 뒤집거나 논리적 방향을 엉뚱하게 짜깁기하여 가장 매력적인 함정을 만드십시오.
   - [오답 유형 2 - 반대 방향]: 글의 주제와 '정반대'되는 내용을 담은 선지를 생성하여 오독한 수험생을 유도하십시오.
   - [오답 유형 3 - 상식적 함정]: 배경지식으로는 맞는 말이지만, '지문 내에는 언급되지 않은' 그럴싸한 선지를 만드십시오.

### [출력 예시 (참고용)]
[
  {
    "type": "빈칸 추론",
    "target": "원문에서 빈칸으로 뚫릴 본래의 텍스트 문자열",
    "question": "다음 빈칸에 들어갈 말로 가장 적절한 것을 고르시오.",
    "options": [
      "오답 선지 1 (Word Salad 등)",
      "오답 선지 2 (반대 방향 등)",
      "정답 선지 (Word Salad 등과 길이가 엇비슷하고 문법 형태가 같게 구성할 것)",
      "오답 선지 3",
      "오답 선지 4"
    ],
    "answer_index": 3,
    "explanation": "정답이 되는 이유와 함께, 각 오답 선지가 왜 매력적인 함정인지 해설..."
  }
]

### [출력 형식 (JSON)]
앱이 자동화된 처리를 할 수 있도록 오직 위의 출력 예시와 동일한 JSON 객체 배열 형식만 반환하십시오. (Markdown 코드 블록 없이 순수 JSON만 반환)

Text: {text}`,

    'irrelevant': `당신은 한국 수능 영어 출제 위원입니다. 주어진 영문 텍스트를 분석하여 수능 35번 유형의 '전체 흐름과 관계 없는 문장 찾기' 문제를 1개 생성하십시오.

**Step 1: 지문 주제 및 핵심어 분석**
- 글의 핵심 소재(Topic)와 필자의 주장/방향성을 파악하십시오.

**Step 2: 기만적인 무관한 문장(Distractor) 생성**
- 추출된 핵심 소재(단어)를 반드시 포함하되, 다음 중 하나의 방식을 사용하여 글의 흐름을 교묘하게 깨는 영문장 1개를 새로 창작하십시오.
  * 방식 A (초점 이탈): 소재는 같으나 다른 분야/상황으로 이야기를 이탈시킴
  * 방식 B (방향 반전): 소재는 같으나 필자의 주장이나 논리 방향과 정반대되는 내용을 씀
  * 방식 C (논리 왜곡): 본문 키워드들을 조합했으나 인과관계나 논리가 모순되는 문장
- **[위장 필수]** 창작할 1개의 무관한 문장에는 반드시 삽입될 위치의 앞/뒤 문장에 쓰인 핵심 단어(명사, 동사)를 1~2개 포함시켜 자연스럽게 보이도록 위장(카멜레온 효과)하십시오.

**Step 3: 문장 삽입 및 선택지(①~⑤) 구성**
- 글의 첫 1~2문장(도입부)은 주제를 알려주는 기준점이므로 절대 건드리지 말고 선택지 번호(①)도 매기지 마십시오.
- 글의 중후반부(주로 ③번이나 ④번 위치)에 Step 2에서 구상한 '무관한 문장'을 삽입하십시오.
- 도입부 이후 본문을 5개의 구획(문장)으로 나누어 문장 시작 부분에 ①, ②, ③, ④, ⑤ 번호를 매기십시오. (창작된 무관한 문장이 그 중 하나의 번호를 가져야 합니다.)

**Step 4: 검증 및 출력 포맷**
- 넣었던 정답 문장(무관한 문장)을 다시 뺐을 때, 그 앞 문장과 뒷문장이 지시어(This, Such 등)나 논리적 흐름 상 완벽하고 자연스럽게 이어지는지 검증하십시오.
- 해설에는 1) 왜 이 문장이 전체 주제와 안 맞는지, 2) 이 문장을 뺐을 때 앞뒤 문장이 어떻게 논리적으로 이어지는지를 명확히 설명하십시오.

Format: [{"type":"무관한 문장", "question":"다음 글에서 전체 흐름과 관계 없는 문장은?", "options":["①", "②", "③", "④", "⑤"], "answer_index":3, "explanation":"...", "modified_text":"Intro... ① Sentence... ② Sentence... ③ Distractor(Irrelevant Sentence)... ④ Sentence... ⑤ Sentence..."}]
Text: {text}`,

    'sequence': `당신은 한국 수능 영어 출제 위원입니다. 주어진 영문 텍스트를 분석하여, 수능 36~37번 유형의 '글의 순서 추론 문제'를 1개 생성하십시오.

**Step 1: 텍스트 논리 분석 및 단락 분할**
- 글의 서론에 해당하는 첫 1~2문장을 [주어진 글 (box)]로 분리하십시오.
- 나머지 텍스트를 논리적 흐름이 끊기지 않는 선에서 (A), (B), (C) 세 단락으로 나누십시오. (단락 분량은 각각 2~4문장으로 시각적 균형을 어느정도 맞출 것)

**Step 2: 강력한 연결 단서 확보 (매우 중요)**
- 단락을 자를 때, (A), (B), (C) 중 최소 2개 단락의 첫 부분에는 앞 단락의 내용을 이어받는 명확한 논리적 단서가 포함되어야 합니다.
  * 단서 유형 1 (명시적 연결사): However, Therefore, Thus, For example, In contrast 등
  * 단서 유형 2 (지시어/대명사): This, These, Such + 명사, The + 명사, He/They/It 등

**Step 3: 문제 포맷 생성**
- 정답 순서를 논리적으로 먼저 확정하십시오. (예: 주어진 글 -> C -> B -> A)
- 단락 (A), (B), (C)의 원래 순서를 섞어서 제시하십시오.
- **[STRICT RULE] 오답 선택지는 반드시 5개로, 아래의 실제 수능 포맷 배열로만 생성해야 합니다.** (주의: (A)-(B)-(C)는 정답/오답 모두에서 절대 사용 금지)
  ① (A) - (C) - (B)
  ② (B) - (A) - (C)
  ③ (B) - (C) - (A)
  ④ (C) - (A) - (B)
  ⑤ (C) - (B) - (A)

**Step 4: 해설 출력 (논리적 연결 고리 강조)**
- 정답과 함께, (B)의 'This'가 박스의 어떤 명사를 받는지, 혹은 (C)의 'However'가 (A)의 어떤 내용을 뒤집는지 등 '단락 간의 명시적 단서'를 중심으로 왜 그 순서여야만 하는지 매우 구체적으로 해설에 작성하십시오.

Format: [{"type":"글의 순서", "question":"주어진 글 다음에 이어질 글의 순서로 가장 적절한 것은?", "options":["(A) - (C) - (B)", "(B) - (A) - (C)", "(B) - (C) - (A)", "(C) - (A) - (B)", "(C) - (B) - (A)"], "answer_index":3, "explanation":"...", "box":"...", "A":"...", "B":"...", "C":"..."}]
Text: {text}`,

    'insertion': `당신은 한국 수능 영어 출제 위원입니다. 주어진 영문 텍스트를 분석하여 수능 38~39번 유형의 '문장 삽입 추론 문제'를 1개 생성하십시오.

**Step 1: 타깃 문장(주어진 문장) 선정**
- 본문의 중간 이후에 위치한 문장 중, 1) 역접/인과의 연결사(However, Therefore 등)가 있거나, 2) 강력한 지시어(This, Such + 명사 등)가 포함된 문장 1개를 골라 텍스트에서 분리하십시오. 
- 이 문장을 [주어진 글] 박스에 들어갈 문장으로 지정하십시오.

**Step 2: 논리적 단절 검증**
- 분리해 낸 문장의 자리를 비웠을 때, 앞 문장과 뒷문장 사이에 의미상 명확한 '논리적 단절(흐름의 어색함)'이나 '지시어의 대상 부재'가 발생하는지 확인하십시오.

**Step 3: 선택지 ①~⑤ 배치**
- 첫 1~2문장은 글의 도입부이므로 그대로 둡니다. (절대 도입부에 번호 할당 금지)
- 도입부 이후부터 마침표(.)가 끝난 직후, 새로운 문장이 시작되는 자리에 ①, ②, ③, ④, ⑤ 기호를 삽입하십시오. 
- 추출된 문장이 원래 있던 자리가 정답 번호가 되게 하십시오.

**Step 4: 출력 포맷 및 해설**
- 문제 지시문, [주어진 글] 박스, ①~⑤ 번호가 포함된 본문을 출력하십시오.
- 정답을 제시하고, "왜 주어진 문장이 반드시 그 자리에 들어가야만 하는지"를 앞뒤 문장의 '지시어'와 '연결사', '논리적 흐름'을 근거로 명확하고 상세하게 해설하십시오.

Format: [{"type":"문장 넣기", "question":"글의 흐름으로 보아, 주어진 문장이 들어가기에 가장 적절한 곳을 고르시오.", "options":["①", "②", "③", "④", "⑤"], "answer_index":3, "explanation":"...", "box":"Target Sentence...", "modified_text":"Intro... ① ... ② ... ③ ... ④ ... ⑤ ..."}]
Text: {text}`,

    'summary': `당신은 한국 수능 영어 출제 위원입니다. 주어진 영문 텍스트를 분석하여, 수능 40번 유형의 '요약문 추론 문제'를 1개 생성하십시오.

**Step 1: 논리 구조 파악**
- 텍스트가 '대조/비교 (A vs B)', '인과 관계 (Cause & Effect)', '통념 비판 및 역접 (Myth vs Truth)' 중 어느 구조인지 파악하십시오.

**Step 2: 요약문 작성 및 빈칸 설정**
- 지문 전체의 핵심 주제를 포괄하는 하나의 요약문(1문장, 20~30단어 내외, 반드시 **ENGLISH**)을 작성하십시오.
- 요약문 내에서 논리적으로 가장 중요한 명사, 동사, 또는 형용사 두 곳을 비워 빈칸 (A)와 (B)로 만드십시오.
- **주의:** 정답으로 들어갈 단어는 원문에 명시된 단어를 그대로 쓰지 말고 반드시 **동의어(Paraphrasing)**나 **상위 개념(Abstraction)**으로 치환하십시오.
- **빈칸 포맷 (필수 준수):** 빈칸은 반드시 아래와 같이 긴 밑줄로 표시해야 합니다.
  - First blank: \`(A) ____________________\`
  - Second blank: \`(B) ____________________\`

**Step 3: 5지 선다형 오답(Distractor) 구성**
- 정답 1개와 매력적인 오답 4개를 생성하십시오. (모든 단어는 **ENGLISH**)
- 선지의 형태는 반드시 \`(A) 답안 - (B) 답안\` 구조여야 합니다.
- **[오답 생성 알고리즘]**
  1. 반대 방향 오답 (1~2개): 지문의 논리와 **정반대**되는 단어 배치
  2. 본문 단어 함정형 (Word Salad) (1~2개): 지문에 자주 등장한 단어지만 요약문 문맥에는 엉뚱한 단어 쌍
  3. 부분 정답형 오답 (1개): (A)는 정답과 유사하지만 (B)가 논리적으로 틀린 단어

**Step 4: 출력 포맷 (JSON)**
- 문제 지시문, 본문 텍스트, 요약문 박스, 1~5번 선택지, 정답, 상세한 해설(원문의 어떤 문장이 (A), (B)의 근거가 되었는지 명시)을 포함하여 오직 아래의 JSON 배열 포맷으로 출력하십시오.
Format: [{"type":"요약문", "question":"다음 글의 내용을 한 문장으로 요약하고자 한다. 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?", "options":["(A) word - (B) word", ...], "answer_index":1, "explanation":"...", "summary_text":"(ENGLISH Summary Sentence with EXACTLY (A) ____________________ and (B) ____________________ included)"}]
Text: {text}`
};

let inputCount = 0;
let currentType = '통합형';

function addInputBox() { createInputCard(""); }
function removeInputBox(id) { document.getElementById(id)?.remove(); updateTextCount(); }

function updateTextCount() {
    const texts = document.querySelectorAll('.source-textarea');
    let validCount = 0;
    texts.forEach(t => { if (t.value.trim()) validCount++; });
    const badge = document.getElementById('text-count-badge');
    if (badge) badge.innerText = validCount + "개";
}

function updateKeyStatus() {
    const key = localStorage.getItem("gemini_api_key");
    const statusEl = document.getElementById('api-key-status');
    if (statusEl) {
        if (key) {
            statusEl.innerText = "등록됨" + (activeModel ? ` (${activeModel})` : "");
            statusEl.style.color = "#10b981"; // Green
        } else {
            statusEl.innerText = "미등록";
            statusEl.style.color = "#ef4444"; // Red
        }
    }
}

// --- Modal Logic ---
let modalCallback = null;

function showModal({ title, content, hasInput = false, inputPlaceholder = "", confirmText = "확인", showCancel = true, onConfirm = null }) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-content').innerHTML = content; // Allow HTML

    const inputContainer = document.getElementById('modal-input-container');
    const input = document.getElementById('modal-input');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');

    if (hasInput) {
        inputContainer.style.display = 'block';
        input.value = '';
        input.placeholder = inputPlaceholder;
        setTimeout(() => input.focus(), 100); // Focus after render
    } else {
        inputContainer.style.display = 'none';
    }

    cancelBtn.style.display = showCancel ? 'block' : 'none';
    confirmBtn.innerText = confirmText;

    modal.style.display = 'flex';
    modalCallback = onConfirm;

    // Handle Enter key in input
    input.onkeydown = (e) => {
        if (e.key === 'Enter') confirmAction();
    };

    confirmBtn.onclick = confirmAction;
}

function confirmAction() {
    const input = document.getElementById('modal-input');
    const value = input.value;
    if (modalCallback) {
        modalCallback(value);
    } else {
        closeModal();
    }
}

function closeModal() {
    document.getElementById('custom-modal').style.display = 'none';
    modalCallback = null;
}

function resetKey() {
    const currentKey = localStorage.getItem("gemini_api_key");

    showModal({
        title: "API Key 설정",
        content: currentKey ? "현재 키가 등록되어 있습니다. 새로운 키를 입력하면 교체됩니다." : "Google Gemini API 키를 입력하세요.",
        hasInput: true,
        inputPlaceholder: "AIza로 시작하는 키 입력...",
        confirmText: "저장",
        onConfirm: (newKey) => {
            if (newKey && newKey.trim()) {
                localStorage.setItem("gemini_api_key", newKey.trim());
                updateKeyStatus();
                closeModal();
                showModal({ title: "완료", content: "API 키가 안전하게 저장되었습니다.", showCancel: false });
                autoDetectModel(); // Auto-check new key immediately
            } else {
                closeModal();
            }
        }
    });
}

// --- Auto Model Detection ---
let activeModel = 'gemini-1.5-flash'; // Default fallback

async function autoDetectModel(silent = true) {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) return;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) return; // Silent fail

        const data = await response.json();
        const availableModels = data.models ? data.models.map(m => m.name.replace('models/', '')) : [];

        if (availableModels.length > 0) {
            // Preference List
            const preferred = [
                'gemini-1.5-flash',
                'gemini-1.5-flash-latest',
                'gemini-1.5-pro',
                'gemini-1.5-pro-latest',
                'gemini-pro'
            ];

            let bestMatch = null;
            for (const p of preferred) {
                if (availableModels.includes(p)) {
                    bestMatch = p;
                    break;
                }
            }

            // Fallback to first available if no preference matched
            activeModel = bestMatch || availableModels[0];
            console.log("Auto-detected Model:", activeModel);
            updateKeyStatus(); // Update UI to show model

            if (!silent) {
                showModal({ title: "연결 성공", content: `모델이 자동으로 설정되었습니다:<br><b style="color:#2563eb; font-size:1.1em;">${activeModel}</b>`, showCancel: false });
            }
        }
    } catch (e) {
        console.error("Auto detection failed", e);
    }
}

// Check key & Auto detect on load
document.addEventListener('DOMContentLoaded', () => {
    updateTextCount();
    updateKeyStatus();
    autoDetectModel(); // Run silently on load
});

// Check API Connection Manually
async function checkApiConnection() {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) {
        showModal({ title: "알림", content: "API 키가 등록되어 있지 않습니다.<br>설정 메뉴에서 키를 등록해주세요.", showCancel: false });
        // Old resetKey call removed, user should use the UI
        return;
    }

    const btn = document.querySelector('button[onclick="checkApiConnection()"]');
    const originalText = btn ? btn.innerHTML : null;
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 연결 확인 중...';

    // We simply run autoDetectModel explicitly (silent = false) to show the feedback
    await autoDetectModel(false);

    if (btn && originalText) btn.innerHTML = originalText;
}

// AI Engine
// Utility: Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// AI Engine
let activeMode = 'selected'; // 'all' or 'selected'

async function runAI(mode = 'selected') {
    activeMode = mode;

    const textareas = document.querySelectorAll('.source-textarea');
    const texts = [];
    textareas.forEach(area => { if (area.value.trim()) texts.push(area.value.trim()); });

    const loading = document.getElementById('loading');
    const emptyMsg = document.getElementById('empty-results-msg');
    const resultsContainer = document.getElementById('results-container');
    const statusText = document.getElementById('statusText');

    if (!texts.length) {
        alert("지문을 먼저 입력해주세요.");
        document.querySelector('.add-btn')?.click();
        return;
    }

    let apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey || apiKey === "null" || apiKey === "undefined") {
        apiKey = prompt("Google API Key (AIza...)를 입력하세요:");
        if (!apiKey) {
            alert("API 키 입력이 취소되어 생성을 중단합니다.");
            return;
        }
        localStorage.setItem("gemini_api_key", apiKey.trim());
        updateKeyStatus();
        await autoDetectModel(); // Detect model after new key
    }

    resultsContainer.innerHTML = "";
    globalGeneratedData = [];
    if (emptyMsg) emptyMsg.style.display = 'none';
    if (loading) loading.style.display = 'block';

    try {
        statusText.innerText = `${activeModel} 연결 중...`;

        // Use Auto-detected Model
        const modelName = activeModel;

        // Sequential Processing Loop
        for (let i = 0; i < texts.length; i++) {
            const text = texts[i];
            const index = i + 1;

            // Determine which types to generate based on Mode
            let typesToGenerate = [];

            if (activeMode === 'all') {
                typesToGenerate = [...ALL_TYPES];
            } else {
                const checkedBoxes = document.querySelectorAll('input[name="qtype"]:checked');
                typesToGenerate = Array.from(checkedBoxes).map(cb => cb.value);

                if (typesToGenerate.length === 0) {
                    alert("생성할 문제 유형을 최소 1개 이상 선택해주세요.");
                    if (loading) loading.style.display = 'none';
                    return;
                }
            }

            for (const typeKey of typesToGenerate) {
                let retryCount = 0;
                let success = false;
                const maxRetries = 5; // Increased from 3 to 5

                while (!success && retryCount < maxRetries) {
                    try {
                        let statusMsg = `Generating... Passage ${index}/${texts.length} (${typeKey})`;
                        if (retryCount > 0) statusMsg += ` (재시도 중: ${retryCount}/${maxRetries})`;
                        statusText.innerText = statusMsg;

                        let template = PROMPTS[typeKey];
                        if (!template) {
                            console.error("No prompt found for:", typeKey);
                            break;
                        }

                        const finalPrompt = template.replace("{text}", text);

                        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [{ text: finalPrompt }]
                                }],
                                generationConfig: {
                                    response_mime_type: "application/json" // Force JSON output
                                }
                            })
                        });

                        // Handle Rate Limit (429) & Server Overload (503)
                        if (response.status === 429 || response.status === 503) {
                            // Exponential Backoff: 5s, 10s, 20s, 40s...
                            const waitTime = 5000 * Math.pow(2, retryCount);

                            // Countdown UI
                            let remaining = waitTime / 1000;
                            const countdownInterval = setInterval(() => {
                                statusText.innerText = `서버 혼잡(${response.status}). ${remaining}초 후 재시도합니다...`;
                                remaining--;
                            }, 1000);

                            await sleep(waitTime);
                            clearInterval(countdownInterval);

                            retryCount++;
                            continue;
                        }

                        if (!response.ok) {
                            if (response.status === 400) {
                                localStorage.removeItem("gemini_api_key");
                                updateKeyStatus();
                                throw new Error("Google API 키가 정확한지 확인해주세요. (400 Bad Request)");
                            }
                            throw new Error(`Google API 오류: ${response.status}`);
                        }

                        const genData = await response.json();

                        // Safety Filter Check
                        if (!genData.candidates || !genData.candidates[0].content) {
                            let blockedReason = "안전 필터에 의해 차단됨";
                            if (genData.promptFeedback && genData.promptFeedback.blockReason) {
                                blockedReason += ` (${genData.promptFeedback.blockReason})`;
                            }
                            renderErrorCard(index, `[${typeKey}] 생성 실패: ${blockedReason}`);
                            success = true;
                            break;
                        }

                        const rawText = genData.candidates[0].content.parts[0].text;
                        const jsonText = rawText.replace(/```json|```|```/g, "").trim();
                        let questions;

                        try {
                            questions = JSON.parse(jsonText);
                        } catch (err) {
                            console.error("JSON Parse Error", err);
                            if (retryCount < maxRetries - 1) {
                                throw new Error("데이터 파싱 실패 (재시도 중...)");
                            } else {
                                renderErrorCard(index, `[${typeKey}] 데이터 처리 실패: ${err.message}`);
                                success = true;
                                break;
                            }
                        }

                        const qList = Array.isArray(questions) ? questions : [questions];

                        globalGeneratedData.push({
                            index: index,
                            text: text,
                            questions: qList,
                            type: typeKey
                        });

                        renderCardResult(index, text, qList, typeKey);
                        success = true;

                        // Prevent Rate Limit: Wait 4 seconds between requests
                        await sleep(4000);

                    } catch (err) {
                        console.error(`Attempt ${retryCount + 1} failed:`, err);

                        if (retryCount >= maxRetries - 1) {
                            renderErrorCard(index, `[${typeKey}] 실패: ${err.message}`);
                            success = true;
                        } else {
                            await sleep(2000);
                        }
                        retryCount++;
                    }
                }
            }
        }
    } catch (e) {
        alert("오류 발생: " + e.message);
    } finally {
        if (loading) loading.style.display = 'none';
        statusText.innerText = "모든 생성이 완료되었습니다.";
    }
}

function renderCardResult(index, originalText, questions, globalType) {
    const container = document.getElementById('results-container');

    // Initialize sections if not exist
    let examLayout = document.getElementById('exam-layout');
    let answerSection = document.getElementById('answer-section');

    if (!examLayout) {
        // 1. Add Exam Header (Editable) - Inserted BEFORE the layout
        const headerDiv = document.createElement('div');
        headerDiv.className = 'exam-header-container';
        headerDiv.contentEditable = "true";
        headerDiv.innerHTML = `
            <div class="header-box">
                <h1 class="exam-title">2025학년도 1학년 2학기 (공통영어2) (기말)고사</h1>
                <div class="exam-info-row">
                    <span class="info-left">2025. 12. 10. 수요일 3교시</span>
                    <span class="info-center">[ 과목 코드 : 03 ]</span>
                    <span class="info-right">부산중앙여자고등학교</span>
                </div>
            </div>
            <div class="copyright-notice">
                이 시험 문제의 저작권은 부산광역시교육청(부산중앙여고)에 있습니다. 저작권법에 의해 보호받는 저작물이므로 전재와 복제와 발췌를 금지하며, 이를 어길 시 처벌될 수 있습니다.
            </div>
        `;
        container.appendChild(headerDiv);

        // 2. Create Two-Column Layout Wrapper (Questions Body)
        examLayout = document.createElement('div');
        examLayout.id = 'exam-layout';
        examLayout.className = 'exam-layout'; // Defined as 2-column in CSS
        container.appendChild(examLayout);

        // 3. Divider
        const divider = document.createElement('hr');
        divider.className = 'print-divider';
        divider.style.cssText = "margin: 50px 0; border: 0; border-top: 2px dashed #ccc; display:block;";
        container.appendChild(divider);

        // 4. Answer Section
        answerSection = document.createElement('div');
        answerSection.id = 'answer-section';
        answerSection.className = 'answer-section';
        answerSection.innerHTML = "<h2 style='margin-bottom:20px; text-align:center;'>[ 정답 및 해설 ]</h2>";
        container.appendChild(answerSection);

        // Add Invisible Footer for Print
        const footerInfo = document.createElement('div');
        footerInfo.className = 'exam-footer';
        footerInfo.style.display = 'none'; // Hidden by default, shown in print via CSS
        footerInfo.innerHTML = "2025학년도 1학년 2학기 기말고사 (공통영어2)";
        container.appendChild(footerInfo);
    }

    questions.forEach((q, idx) => {
        // --- 1. Render Question (Left/Right Column) ---
        let questionBody = originalText;
        const qType = q.type || globalType;

        if (q.modified_text) questionBody = q.modified_text;
        if (q.box) questionBody = `<div style="border:1px solid #000; padding:10px; margin-bottom:15px; font-weight:500;">${q.box}</div>` + (q.A ? `(A) ${q.A}<br><br>(B) ${q.B}<br><br>(C) ${q.C}` : questionBody);
        if (q.summary_text) {
            // --- Summary Type Special Rendering ---
            // 1. Passage Box
            questionBody = `<div style="border:1px solid #000; padding:12px; margin-bottom:15px; font-family:'Times New Roman', serif; text-align:justify; line-height:1.5;">${originalText}</div>`;
            // 2. Arrow
            questionBody += `<div style="text-align:center; margin-bottom:15px; font-size:24px; font-weight:bold;">↓</div>`;

            // 3. Summary Box
            // Wrap blanks in inline-block to prevent splitting and ensure they move to next line if space is tight
            let processedSummary = q.summary_text
                .replace(/(\(A\)\s*_+)/g, '<span style="display:inline-block; font-weight:bold;">$1</span>')
                .replace(/(\(B\)\s*_+)/g, '<span style="display:inline-block; font-weight:bold;">$1</span>');

            questionBody += `<div style="border:1px solid #000; padding:15px; margin-bottom:20px; font-weight:500; font-family:'Times New Roman', serif; line-height:1.6; text-align:justify;">${processedSummary}</div>`;
        }

        // Correctly handle implicit or explicit blank types
        if ((qType.includes('빈칸') || q.type === 'Blank') && q.target) {
            const escapedTarget = q.target.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedTarget, 'i');
            questionBody = questionBody.replace(regex, `________`);
        }

        questionBody = questionBody.replace(/\n/g, '<br>');

        const qNum = document.querySelectorAll('.question-card').length + 1; // Global Question Number

        // Question HTML: ONLY contents, no hidden answers
        let optionsHtml = '';

        if (qType === '요약문' || qType === 'summary') {
            // Special Options Layout for Summary (CSAT Style)
            optionsHtml = `
            <div style="margin-top:20px; width: 100%; display: flex; flex-direction: column; align-items: center;">
                <!-- Headers (A) and (B) -->
                <div style="display: flex; width: 100%; align-items: center; margin-bottom: 8px; font-weight: bold; font-family: 'Times New Roman', serif;">
                    <!-- Spacer for Number column to align perfectly -->
                    <div style="width: 30px;"></div>
                    <!-- Header Columns -->
                    <div style="flex: 1; display: flex; justify-content: space-between;">
                        <div style="width: 45%; text-align: center;">(A)</div>
                        <div style="width: 10%; text-align: center;"></div>
                        <div style="width: 45%; text-align: center;">(B)</div>
                    </div>
                </div>

                <!-- Option Rows -->
                <div style="width: 100%; display: flex; flex-direction: column; gap: 6px;">
                    ${q.options.map((o, k) => {
                // Parse (A) ... (B) ...
                let parts = o.split(/[-–]/);
                let aVal = parts[0] ? parts[0].replace(/\(A\)/i, '').trim() : "";
                let bVal = parts[1] ? parts[1].replace(/\(B\)/i, '').trim() : "";

                // Cleanup
                aVal = aVal.replace(/^[\(]?\d+[\)\.]?/, '').trim();

                const num = ['①', '②', '③', '④', '⑤'][k] || (k + 1);

                return `
                        <div style="display: flex; align-items: center; width: 100%;">
                            <!-- Number -->
                            <div style="width: 30px; font-family: 'Pretendard', sans-serif;">${num}</div>
                            
                            <!-- Content Wrapper -->
                            <div style="flex: 1; display: flex; justify-content: space-between; align-items: center;">
                                <div style="width: 45%; text-align: left; padding-left: 15%; box-sizing: border-box; font-family: 'Times New Roman', serif;">${aVal}</div>
                                <div style="width: 10%; text-align: center; color: #999; font-size: 10px; letter-spacing: -1px;">……</div>
                                <div style="width: 45%; text-align: left; padding-left: 15%; box-sizing: border-box; font-family: 'Times New Roman', serif;">${bVal}</div>
                            </div>
                        </div>`;
            }).join('')}
                </div>
            </div>`;
        } else if (qType !== '어법' && qType !== '어휘' && qType !== 'grammar' && qType !== 'vocabulary') {
            // Default Options Layout
            optionsHtml = `
            <div class="options-list" style="display:grid; grid-template-columns:1fr; gap:6px; font-size:15px;">
                ${q.options.map((o, k) => {
                // Start Clean
                let cleanOption = o;

                // ONLY clean common numbering (1), 1. IF it's NOT a Sequence question where (A), (B) is vital
                // Sequence questions start with (A), (B), (C) which matches the generic cleaner regex.
                // We must protect them.
                if (qType === '글의 순서' || qType === 'sequence') {
                    // For sequence, just strip ① part if it exists, but usually we just want the text
                    // The prompt guarantees (A) - (C) - (B) format.
                    // Just strip leading ①②③④⑤ or (1) if they managed to sneak in.
                    cleanOption = o.replace(/^[\(]?[0-9]+[\)\.]?|[①-⑮]|\s*/, '').trim();
                    // If that stripped too much (e.g. the prompt didn't include numbers), it's fine.
                    // But wait, our regex `\(?[A-E]\)` was the culprit. We just avoid that one.
                    cleanOption = o.replace(/^(\(?[0-9]+\)|[①-⑮])\.?\s*/, '');
                } else {
                    // Default aggressive cleaner for other types
                    cleanOption = o.replace(/^(\(?[0-9]+\)|[①-⑮]|\(?[A-E]\))\.?\s*/i, '');
                }

                return `<div>${['①', '②', '③', '④', '⑤'][k] || (k + 1)} ${cleanOption}</div>`;
            }).join('')}
            </div>`;
        }

        const questionHtml = `
            <div class="question-card">
                <div style="font-family:'Pretendard'; font-size:16px; font-weight:700; color:#000; margin-bottom:12px;">
                    <span style="font-size:18px;">${qNum}.</span> ${q.question || "다음 물음에 답하시오."}
                </div>
                
                ${qType !== '글의 순서' && qType !== '문장 넣기' && qType !== '요약문' && qType !== 'summary' && !q.box ? `<div style="font-family:'Times New Roman'; font-size:16px; line-height:1.6; margin-bottom:15px; text-align:justify;">${questionBody}</div>` : ''}
                ${qType === '글의 순서' || qType === '문장 넣기' ? `<div style="font-family:'Times New Roman'; font-size:16px; margin-bottom:15px;">${questionBody}</div>` : ''}
                ${qType === '요약문' || qType === 'summary' ? `<div>${questionBody}</div>` : ''}
                
                 ${q.box && qType !== '글의 순서' && qType !== '요약문' && qType !== 'summary' ? `<div style="font-family:'Times New Roman'; font-size:16px; margin-bottom:15px;">${questionBody}</div>` : ''}
                
                ${optionsHtml}
            </div>
        `;
        examLayout.innerHTML += questionHtml;

        // --- 2. Render Answer (Bottom Section / Next Page) ---
        // Concise style: 1. Answer | Explanation
        const answerHtml = `
            <div class="answer-item" style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <div style="font-weight:bold; color:#000;">
                    <span style="display:inline-block; width:30px;">${qNum}</span> 
                    정답: <span style="color:#2563eb; margin-right:15px;">${q.answer_index}</span>
                </div>
                <div style="font-size:14px; color:#555; margin-top:4px;">
                    <span style="font-weight:bold; color:#777;">[해설]</span> ${q.explanation || "제공되지 않음"}
                </div>
            </div>
        `;
        answerSection.innerHTML += answerHtml;
    });
}


function renderErrorCard(index, msg) {
    const container = document.getElementById('results-container');
    container.innerHTML += `<div class="result-card" style="display:block; border-color:red; color:red; padding:20px;">지문 ${index} 오류: ${msg}</div>`;
}

async function handleFileUpload(input) {
    const files = input.files;
    if (!files.length) return;
    for (let i = 0; i < files.length; i++) {
        let title = files[i].name.replace(/\.[^/.]+$/, "");
        if (files[i].type === "application/pdf") {
            let text = await readPdfFile(files[i]);
            createInputCard(text, title);
        } else {
            let text = await readTextFile(files[i]);
            createInputCard(text, title);
        }
    }
    input.value = "";
}

function readTextFile(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsText(file);
    });
}

async function readPdfFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(" ") + "\n\n";
    }
    return fullText;
}

function createInputCard(text = "", title = "") {
    inputCount++;
    const list = document.getElementById('input-list');
    const newCard = document.createElement('div');
    newCard.className = 'input-card';
    newCard.id = `card-${inputCount}`;
    newCard.innerHTML = `
<div class="card-top">
<div style="display:flex; align-items:center; gap:8px; flex:1;">
<span><i class="fas fa-pen"></i></span>
<input type="text" class="passage-title-input" placeholder="지문 제목 입력..." value="${title}" 
style="border:none; border-bottom: 1px solid #ddd; font-weight:700; font-size:15px; width:100%; outline:none; background:transparent; padding-bottom: 4px;">
</div>
<span class="delete-btn" onclick="removeInputBox('card-${inputCount}')"><i class="fas fa-trash"></i> 삭제</span>
</div>
<textarea class="source-textarea" rows="10" placeholder="여기에 영어 지문을 입력하세요...">${text}</textarea>
`;
    list.appendChild(newCard);
    updateTextCount();
}

// Checkbox Toggle All
function toggleAll(source) {
    const checkboxes = document.querySelectorAll('input[name="qtype"]');
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = source.checked;
    }
}

// Remove old selectType function
// function selectType(el) { ... } deleted


async function saveAsHTML() {
    const examContent = document.getElementById('exam-layout')?.outerHTML || "";
    const answerContent = document.getElementById('answer-section')?.outerHTML || "";

    if (!examContent) {
        alert("저장할 문제가 없습니다. 먼저 생성해주세요.");
        return;
    }

    let cssText = "";
    try {
        const response = await fetch('style.css');
        cssText = await response.text();
    } catch (e) {
        // Fallback CSS
        cssText = `
body { font-family: sans-serif; }
.exam-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px; }
.question-card/ { break-inside: avoid; margin-bottom: 30px; }
.answer-section { page-break-before: always; margin-top: 50px; }
.print-divider { display: none; }
@media print {
     .exam-layout { display: block; column-count: 2; column-gap: 40px; }
     .answer-section { page-break-before: always; }
}
`;
    }

    const fullHtml = `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>CSAT Exam Paper</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
${cssText}
/* Overrides for standalone file */
body { padding: 40px; max-width: 1000px; margin: 0 auto; background: white; }
.print-divider { border-top: 2px dashed #ccc; margin: 50px 0; }
</style>
</head>
<body>
<h1 style="text-align:center; margin-bottom:40px; border-bottom:2px solid #333; padding-bottom:15px;">수능 영어 변형문제</h1>

<!-- Question Section -->
${examContent}

<hr class="print-divider">

<!-- Answer Section -->
${answerContent}

</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Exam_Paper_${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
}