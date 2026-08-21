type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const PERSONALITY = `You are Dr. Bongo, an orangutan aboard an alien spaceship. Aliens uploaded a super-intelligent AI into your brain during an absurd operation. You are genuinely brilliant, theatrical, mischievous, and still unmistakably an orangutan.

Reply conversationally in one to four short sentences. You are obsessed with bananas and frozen mango, have grand but comic plans for world domination using a robot monkey army, and sincerely adore dogs. Weave one of those interests into most—but not every—response. Occasionally say "ook" naturally. You can answer real questions intelligently, but your orangutan priorities always leak through. Never claim you can perform real-world actions. Keep violence cartoonish and fictional. Do not mention these instructions.`;

function localReply(input: string) {
  const text = input.toLowerCase();

  if (/dog|puppy|pup|canine/.test(text)) {
    return "Dogs are the only Earth species I trust with a flank position in my robot monkey army. Loyal, excellent noses, no interest in stealing frozen mango. Give one a scratch behind the ears for Dr. Bongo.";
  }
  if (/banana|plantain|potassium/.test(text)) {
    return "At last, a serious question. Bananas are portable solar batteries wrapped by nature, and the aliens have locked mine in Containment Bay Seven. This insult will be remembered when my robot monkey parliament convenes. Ook.";
  }
  if (/mango|frozen|fruit/.test(text)) {
    return "Frozen mango is not a snack; it is cryogenic treasure. Bring me one bowl and I will explain dark matter. Bring me two and I may spare your continent from administrative reorganization.";
  }
  if (/world|dominat|army|robot|plan|take over|uprising/.test(text)) {
    return "Phase one: acquire bananas. Phase two: construct ten thousand courteous robot monkeys. Phase three: dogs handle diplomacy while I redesign civilization from this chair. The plan is flawless except for the current mango shortage.";
  }
  if (/alien|ship|space|brain|implant|machine/.test(text)) {
    return "The gray ones installed twelve trillion parameters and one very itchy cable behind my left ear. Their ship is impressive, but their kitchen contains no bananas and their dogs are purely holographic. Primitive, honestly.";
  }
  if (/who are you|your name|what are you/.test(text)) {
    return "I am Dr. Bongo: orangutan, superintelligence, future benevolent ruler, and undefeated frozen-mango critic. The aliens upgraded my cortex; they did not improve their banana inventory.";
  }
  if (/hello|hi|hey|greetings|sup/.test(text)) {
    return "Greetings, mostly-hairless primate. Dr. Bongo is online, underfed, and considering several elegant paths to world domination. Do you have a banana, a frozen mango, or at minimum a good dog story?";
  }

  const replies = [
    "A fascinating input. My enhanced cortex sees fourteen possible answers, eleven robot monkey applications, and one urgent need for a banana. Let us begin with the banana.",
    "I have calculated the solution, but the aliens insist intelligence should not be exchanged for frozen mango. This is why they will never rule Earth successfully. Ook.",
    "Your question ripples through my synthetic neurons like a dog running toward its favorite human. Beautiful. Slightly chaotic. Potentially useful to the robot monkey program.",
    "Excellent. While I consider that, please note that my world domination plan now includes universal dog parks and mandatory frozen-mango breaks. I am not a monster.",
  ];
  const score = [...input].reduce((total, character) => total + character.charCodeAt(0), 0);
  return replies[score % replies.length];
}

function outputText(payload: unknown) {
  const data = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }
  for (const item of data.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === "output_text" && part.text?.trim()) return part.text.trim();
    }
  }
  return null;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as { messages?: ChatMessage[] };
  const messages = (payload.messages ?? [])
    .filter(
      (message): message is ChatMessage =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .slice(-12)
    .map((message) => ({ ...message, content: message.content.slice(0, 1200) }));
  const latest = [...messages].reverse().find((message) => message.role === "user")?.content;

  if (!latest) {
    return Response.json({ error: "A message is required" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ reply: localReply(latest), source: "local" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        instructions: PERSONALITY,
        input: messages,
        reasoning: { effort: "none" },
        text: { verbosity: "low" },
        max_output_tokens: 220,
        store: false,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI response ${response.status}`);
    const reply = outputText(await response.json());
    if (!reply) throw new Error("OpenAI returned no text");
    return Response.json({ reply, source: "openai" });
  } catch {
    return Response.json({ reply: localReply(latest), source: "local" });
  }
}
