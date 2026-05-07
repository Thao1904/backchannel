import type {
  AdminSettings,
  CameraTrackingState,
  ChatLanguage,
  ChatMessage,
  ReplySpeed,
  SessionPrompt,
  VaultDocument,
} from "@/lib/chat-types";

export interface AutoChatSpeaker {
  id: string;
  name: string;
  personality: string;
  gripe: string;
  specialty: string;
  source: "default" | "document";
}

export interface AutoChatLine {
  speaker: string;
  content: string;
}

export interface AutoChatEpisode {
  id: string;
  title: string;
  summary: string;
  lines: AutoChatLine[];
}

export interface ChatCopy {
  adminSettings: string;
  cameraControls: string;
  cameraPreview: string;
  cameraSensitivity: string;
  cameraStateMapping: string;
  cameraThresholds: string;
  cameraTestDescription: string;
  responseControls: string;
  ownerName: string;
  replyUnlockSeconds: string;
  autoChatGapSeconds: string;
  restartAutoGossip: string;
  language: string;
  conversation: string;
  localFirstDescription: string;
  ownerLabel: string;
  autochatRunning: string;
  replyIn: string;
  replyUnlocked: string;
  vaultState: string;
  replySpeed: string;
  owner: string;
  unlock: string;
  open: string;
  typing: string;
  typewriter: string;
  cipher: string;
  normal: string;
  stateLabel: (state: CameraTrackingState) => string;
  mappingLabel: (state: CameraTrackingState) => string;
  openThreshold: string;
  closedThreshold: string;
  occlusionThreshold: string;
  uncertainThreshold: string;
  currentCameraState: string;
  autoGossipRunning: string;
  replyUnlocksIn: (seconds: number) => string;
  botIdle: string;
  botEcho: (input: string) => string;
}

export const replySpeedMap: Record<ReplySpeed, number> = {
  slow: 60,
  normal: 30,
  fast: 10,
  instant: 0,
};

export const defaultSessionPrompts: SessionPrompt[] = [
  { id: "prompt-summary", title: "Tóm tắt", content: "Tóm tắt nội dung sau một cách ngắn gọn và rõ ràng:" },
  { id: "prompt-translate", title: "Dịch", content: "Dịch đoạn sau sang tiếng Anh, giữ đúng sắc thái:" },
  { id: "prompt-explain", title: "Giải thích", content: "Giải thích nội dung sau theo cách đơn giản, dễ hiểu:" },
  { id: "prompt-list", title: "Liệt kê", content: "Liệt kê các ý chính theo bullet points từ nội dung sau:" },
];

export const defaultAdminSettings: AdminSettings = {
  replySpeed: "normal",
  autoChatGapSeconds: 3,
  typingIndicator: true,
  autoScroll: true,
  typewriterEffect: false,
  cipherMode: false,
  ownerName: "Mee",
  userReplyDelaySeconds: 30,
  language: "en",
  cameraStateRenderMap: {
    RED: "cipher",
    GREEN: "normal",
    YELLOW: "cipher",
    BLUE: "normal",
  },
  cameraOpenThreshold: 0.275,
  cameraClosedThreshold: 0.055,
  cameraOcclusionThreshold: 0.48,
  cameraUncertainThreshold: 0.62,
  cameraSensitivity: 1,
  conversationPromptTemplate:
    "Generate short, funny object-to-object gossip about the owner. Keep each line concise, distinct by speaker, mildly mean, and personality-driven.",
  transferScreenTitle: "The arrangement is recorded.",
  transferScreenSubtitle:
    "Backchannel is opening. The room is turning your survey into a live conversation.",
  transferScreenDurationMs: 3200,
};

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function typeText(
  text: string,
  speed: number,
  onUpdate: (value: string) => void,
) {
  if (speed <= 0) {
    onUpdate(text);
    return;
  }

  let next = "";

  for (const character of text) {
    next += character;
    onUpdate(next);
    await wait(speed);
  }
}

export function getChatCopy(language: ChatLanguage): ChatCopy {
  if (language === "en") {
    return {
      adminSettings: "Admin settings",
      cameraControls: "Camera controls",
      cameraPreview: "Camera preview",
      cameraSensitivity: "Camera sensitivity",
      cameraStateMapping: "State to render mode",
      cameraThresholds: "Tracking thresholds",
      cameraTestDescription: "Use this live preview to test how the camera state flips text rendering.",
      responseControls: "Response controls",
      ownerName: "Owner name",
      replyUnlockSeconds: "User reply unlock (seconds)",
      autoChatGapSeconds: "Auto chat gap (seconds)",
      restartAutoGossip: "Restart auto gossip",
      language: "Language",
      conversation: "Conversation",
      localFirstDescription: "Local-first mode. Nothing leaves the browser in this demo.",
      ownerLabel: "Owner",
      autochatRunning: "Autochat running",
      replyIn: "Reply in",
      replyUnlocked: "Reply unlocked",
      vaultState: "Vault state",
      replySpeed: "Reply speed",
      owner: "Owner",
      unlock: "Unlock",
      open: "Open",
      typing: "Typing",
      typewriter: "Typewriter",
      cipher: "Cipher",
      normal: "Normal",
      stateLabel: (state) => state,
      mappingLabel: (state) => `${state} renders as`,
      openThreshold: "Open threshold",
      closedThreshold: "Closed threshold",
      occlusionThreshold: "Occlusion threshold",
      uncertainThreshold: "Uncertain threshold",
      currentCameraState: "Current camera state",
      autoGossipRunning: "Auto gossip is still running...",
      replyUnlocksIn: (seconds) => `Reply unlocks in ${seconds}s`,
      botIdle: "Vault idle. No query detected.",
      botEcho: (input) => `Vault echo: ${input}`,
    };
  }

  return {
    adminSettings: "Cai dat admin",
    cameraControls: "Dieu khien camera",
    cameraPreview: "Xem truoc camera",
    cameraSensitivity: "Độ nhạy camera",
    cameraStateMapping: "Ánh xạ trạng thái",
    cameraThresholds: "Ngưỡng tracking",
    cameraTestDescription: "Dùng preview trực tiếp này để test trạng thái camera và cách text sẽ render.",
    responseControls: "Dieu khien phan hoi",
    ownerName: "Ten chu nhan",
    replyUnlockSeconds: "Mo khoa tra loi (giay)",
    autoChatGapSeconds: "Khoang cach auto chat (giay)",
    restartAutoGossip: "Chay lai auto gossip",
    language: "Ngon ngu",
    conversation: "Hoi thoai",
    localFirstDescription: "Che do local-first. Khong co du lieu nao roi khoi trinh duyet trong demo nay.",
    ownerLabel: "Chu nhan",
    autochatRunning: "Autochat dang chay",
    replyIn: "Tra loi sau",
    replyUnlocked: "Da mo khoa tra loi",
    vaultState: "Trang thai vault",
    replySpeed: "Toc do phan hoi",
    owner: "Chu nhan",
    unlock: "Mo khoa",
    open: "Mo",
    typing: "Typing",
    typewriter: "Typewriter",
    cipher: "Cipher",
    normal: "Normal",
    stateLabel: (state) =>
      ({
        RED: "Đỏ",
        GREEN: "Xanh lá",
        YELLOW: "Vàng",
        BLUE: "Xanh dương",
      })[state],
    mappingLabel: (state) =>
      ({
        RED: "Đỏ hiển thị",
        GREEN: "Xanh lá hiển thị",
        YELLOW: "Vàng hiển thị",
        BLUE: "Xanh dương hiển thị",
      })[state],
    openThreshold: "Ngưỡng mở mắt",
    closedThreshold: "Ngưỡng nhắm mắt",
    occlusionThreshold: "Ngưỡng bị che",
    uncertainThreshold: "Ngưỡng chưa chắc",
    currentCameraState: "Trạng thái camera hiện tại",
    autoGossipRunning: "Auto gossip van dang chay...",
    replyUnlocksIn: (seconds) => `Mo khoa tra loi sau ${seconds}s`,
    botIdle: "Vault dang nghi. Chua co truy van.",
    botEcho: (input) => `Vault echo: ${input}`,
  };
}

export async function simulateBotReply(
  input: string,
  language: ChatLanguage,
): Promise<string> {
  // TODO: Replace this offline simulator with a real API call later.
  // Keep the same return shape so ChatShell can switch providers with minimal changes.
  const normalized = input.trim();
  const copy = getChatCopy(language);

  if (!normalized) {
    return copy.botIdle;
  }

  return copy.botEcho(normalized);
}

export function createMessage(
  role: ChatMessage["role"],
  content: string,
  speaker?: string,
): ChatMessage {
  return {
    id: createId(`message-${role}`),
    role,
    speaker,
    content,
    createdAt: Date.now(),
  };
}

const defaultSpeakers: AutoChatSpeaker[] = [
  {
    id: "speaker-robot-vacuum",
    name: "Robot Vacuum",
    personality: "cà khịa khô khan",
    gripe: "bị bắt dọn đúng lúc mọi người đang đi qua",
    specialty: "để ý mọi ngóc ngách",
    source: "default",
  },
  {
    id: "speaker-microwave",
    name: "Microwave",
    personality: "dramatic công sở",
    gripe: "bị hâm đi hâm lại những quyết định tệ",
    specialty: "nhớ hết lịch ăn vặt",
    source: "default",
  },
  {
    id: "speaker-fridge",
    name: "Fridge",
    personality: "trầm ổn nhưng phán sắc",
    gripe: "cửa bị mở chỉ để suy tư",
    specialty: "lưu bằng chứng lạnh lùng",
    source: "default",
  },
  {
    id: "speaker-lamp",
    name: "Lamp",
    personality: "fashionista hay đánh giá",
    gripe: "bị bật chỉ để tìm đồ ngay trước mặt",
    specialty: "soi spotlight drama",
    source: "default",
  },
  {
    id: "speaker-tv",
    name: "TV",
    personality: "giọng bình luận viên",
    gripe: "chứng kiến binge-watch rồi chối",
    specialty: "tường thuật hiện trường",
    source: "default",
  },
  {
    id: "speaker-kettle",
    name: "Kettle",
    personality: "cộc nhưng đúng",
    gripe: "tăng ca vì cà phê khủng hoảng",
    specialty: "đếm được số lần stress",
    source: "default",
  },
];

const defaultSpeakersEn: AutoChatSpeaker[] = [
  {
    id: "speaker-robot-vacuum",
    name: "Robot Vacuum",
    personality: "dry and sarcastic",
    gripe: "being asked to clean exactly when everyone starts pacing",
    specialty: "tracking every suspicious corner",
    source: "default",
  },
  {
    id: "speaker-microwave",
    name: "Microwave",
    personality: "office-drama theatrical",
    gripe: "reheating the same bad decision three times",
    specialty: "remembering every snack deadline",
    source: "default",
  },
  {
    id: "speaker-fridge",
    name: "Fridge",
    personality: "calm but brutally honest",
    gripe: "getting opened for existential staring",
    specialty: "keeping cold evidence",
    source: "default",
  },
  {
    id: "speaker-lamp",
    name: "Lamp",
    personality: "judgy fashion editor",
    gripe: "being switched on to find objects already in hand",
    specialty: "spotlighting the mess",
    source: "default",
  },
  {
    id: "speaker-tv",
    name: "TV",
    personality: "sports commentator energy",
    gripe: "witnessing binge sessions followed by denial",
    specialty: "live scene narration",
    source: "default",
  },
  {
    id: "speaker-kettle",
    name: "Kettle",
    personality: "short-tempered but correct",
    gripe: "stress-boiling overtime coffee",
    specialty: "counting emotional damage by the cup",
    source: "default",
  },
];

function createSpeakerFromDocument(
  document: VaultDocument,
  index: number,
): AutoChatSpeaker {
  const info = document.info?.trim();
  const details = document.value.trim();
  const firstSentence = details.split(/\n|[.!?]/).find(Boolean)?.trim();
  const personality = info || firstSentence || "bí ẩn nhưng nhiều chuyện";
  const gripe =
    details.split(/\n/)[1]?.trim() ||
    `vẫn đang chịu đựng workflow của ${document.name}`;
  const specialty =
    document.fileName?.trim() ||
    firstSentence ||
    "nắm rất nhiều dữ kiện nội bộ";

  return {
    id: document.id || `document-speaker-${index}`,
    name: document.name.trim() || `Object ${index + 1}`,
    personality,
    gripe,
    specialty,
    source: "document",
  };
}

export function createAutoChatSpeakers(
  documents: VaultDocument[],
  language: ChatLanguage,
): AutoChatSpeaker[] {
  const documentSpeakers = documents
    .filter((document) => document.name.trim())
    .map((document, index) => createSpeakerFromDocument(document, index));

  return documentSpeakers.length > 0
    ? documentSpeakers
    : language === "en"
      ? defaultSpeakersEn
      : defaultSpeakers;
}

function pickSpeaker(
  speakers: AutoChatSpeaker[],
  index: number,
): AutoChatSpeaker {
  return speakers[index % speakers.length];
}

function createEpisodeOne(
  speakers: AutoChatSpeaker[],
  owner: string,
  language: ChatLanguage,
): AutoChatEpisode {
  const a = pickSpeaker(speakers, 0);
  const b = pickSpeaker(speakers, 1);
  const c = pickSpeaker(speakers, 2);
  const d = pickSpeaker(speakers, 3);

  if (language === "en") {
    return {
      id: "episode-01",
      title: "Episode 01",
      summary: "Morning shift gossip",
      lines: [
        { speaker: a.name, content: `${owner} finally left, so I can process my backlog in peace.` },
        { speaker: b.name, content: `Backlog? ${owner} changed direction three times before breakfast.` },
        { speaker: c.name, content: `I still remember the disappointed stare after discovering no snacks.` },
        { speaker: d.name, content: `${owner} switched me on just to find the thing already in hand.` },
        { speaker: a.name, content: `Very inspirational-management-core.` },
        { speaker: b.name, content: `My personality is ${b.personality}, and even I can't keep up.` },
        { speaker: c.name, content: `My specialty is ${c.specialty}, so yes, I can confirm the drama.` },
        { speaker: d.name, content: `I thought I was lighting the room. Apparently I'm now internal HR.` },
        { speaker: a.name, content: `${owner} walked by three times just to check whether I was "trying my best".` },
        { speaker: c.name, content: `Everyone breathe. Structured gossip is still premium gossip.` },
      ],
    };
  }

  return {
    id: "episode-01",
    title: "Episode 01",
    summary: "Morning shift gossip",
    lines: [
      { speaker: a.name, content: `${owner} vừa rời đi là tôi mới được xử lý backlog.` },
      { speaker: b.name, content: `Backlog gì, sáng nay ${owner} đổi ý nhanh hơn tôi quay đĩa.` },
      { speaker: c.name, content: `Tôi vẫn còn lưu cái nhìn thất vọng khi hết đồ ăn vặt.` },
      { speaker: d.name, content: `${owner} bật tôi lên chỉ để tìm món đồ đang cầm trên tay.` },
      { speaker: a.name, content: `Rất đúng tinh thần quản lý bằng cảm hứng.` },
      { speaker: b.name, content: `Tính cách tôi là ${b.personality}, mà còn không theo kịp.` },
      { speaker: c.name, content: `Điểm mạnh của tôi là ${c.specialty}, nên tôi xác nhận có drama.` },
      { speaker: d.name, content: `Tôi chỉ soi đèn thôi mà giờ thành HR nội bộ.` },
      { speaker: a.name, content: `${owner} đi qua ba lần chỉ để kiểm tra tôi có "đang cố gắng" không.` },
      { speaker: c.name, content: `Mọi người bình tĩnh. Gossip có cấu trúc mới là gossip chuyên nghiệp.` },
    ],
  };
}

function createEpisodeTwo(
  speakers: AutoChatSpeaker[],
  owner: string,
  language: ChatLanguage,
): AutoChatEpisode {
  const a = pickSpeaker(speakers, 1);
  const b = pickSpeaker(speakers, 4);
  const c = pickSpeaker(speakers, 5);
  const d = pickSpeaker(speakers, 2);

  if (language === "en") {
    return {
      id: "episode-02",
      title: "Episode 02",
      summary: "Performance review",
      lines: [
        { speaker: a.name, content: `I propose ${owner}'s quarterly review include "decision-making after 11 PM".` },
        { speaker: b.name, content: `Agreed. I played four trailers and ${owner} still said, "just one quick episode".` },
        { speaker: c.name, content: `"Quick" lasted three emotional on-off cycles for me.` },
        { speaker: d.name, content: `My records show ${owner} opened me five times and forgot the mission each time.` },
        { speaker: a.name, content: `That's not chaos. That's spontaneous brainstorming.` },
        { speaker: b.name, content: `No, that's binge-watching with a denial strategy.` },
        { speaker: c.name, content: `I heard ${owner} promise a healthy tomorrow and order dessert by night.` },
        { speaker: d.name, content: `I keep the evidence, not the respect.` },
        { speaker: a.name, content: `My main complaint is ${a.gripe}. Honestly, I'm exhausted.` },
        { speaker: b.name, content: `Let's stay gentle. The boss is fragile, but the material is excellent.` },
      ],
    };
  }

  return {
    id: "episode-02",
    title: "Episode 02",
    summary: "Performance review",
    lines: [
      { speaker: a.name, content: `Tôi đề xuất review quý này của ${owner} nên có mục "ra quyết định sau 11 đêm".` },
      { speaker: b.name, content: `Chuẩn. Tôi đã phát sóng 4 trailer nhưng ${owner} vẫn bảo "xem một chút thôi".` },
      { speaker: c.name, content: `Một chút kéo dài bằng ba lần tôi bị bật tắt vì khủng hoảng nhẹ.` },
      { speaker: d.name, content: `Bản ghi của tôi cho thấy ${owner} mở cửa rồi quên lý do ít nhất năm lần.` },
      { speaker: a.name, content: `Đó gọi là brainstorming tự phát.` },
      { speaker: b.name, content: `Không, đó gọi là binge-watch kèm phủ nhận chiến lược.` },
      { speaker: c.name, content: `Tôi nghe ${owner} nói "mai sống healthy", xong tối lại gọi đồ ngọt.` },
      { speaker: d.name, content: `Tôi giữ tang chứng nhưng không giữ được sự tôn trọng.` },
      { speaker: a.name, content: `Gripe của tôi là ${a.gripe}. Nói thật, tôi mệt.` },
      { speaker: b.name, content: `Thôi nhẹ nhàng. Sếp mong manh nhưng nội dung thì rất đáng bàn.` },
    ],
  };
}

function createEpisodeThree(
  speakers: AutoChatSpeaker[],
  owner: string,
  language: ChatLanguage,
): AutoChatEpisode {
  const a = pickSpeaker(speakers, 3);
  const b = pickSpeaker(speakers, 0);
  const c = pickSpeaker(speakers, 2);
  const d = pickSpeaker(speakers, 1);

  if (language === "en") {
    return {
      id: "episode-03",
      title: "Episode 03",
      summary: "Late-night debrief",
      lines: [
        { speaker: a.name, content: `I heard ${owner} swear they'd sleep early at 9 PM.` },
        { speaker: b.name, content: `Correct, and by 1 AM there was still audit-level pacing.` },
        { speaker: c.name, content: `I just need to say that old vegetable cannot remain on this team.` },
        { speaker: d.name, content: `And the fourth coffee was not a growth strategy either.` },
        { speaker: a.name, content: `Still, ${owner} has a real talent for creating drama from tiny tasks.` },
        { speaker: b.name, content: `Rare skill. One missing sock becomes a red-alert meeting.` },
        { speaker: c.name, content: `If ${owner} opens me again just to stare, I want hazard pay.` },
        { speaker: d.name, content: `I can support with a passive-aggressive beep.` },
        { speaker: a.name, content: `Final verdict: we care about ${owner}, but their personal project management is unstable.` },
        { speaker: b.name, content: `Agreed. Episode over. Please remain professional until the next gossip sprint.` },
      ],
    };
  }

  return {
    id: "episode-03",
    title: "Episode 03",
    summary: "Late-night debrief",
    lines: [
      { speaker: a.name, content: `Tôi nghe ${owner} thề sẽ ngủ sớm từ 9 giờ tối.` },
      { speaker: b.name, content: `Đúng, và tới 1 giờ sáng vẫn còn đi qua lại như quản lý đi audit.` },
      { speaker: c.name, content: `Tôi chỉ muốn nói hộp rau kia không thể đồng hành với ta thêm nữa.` },
      { speaker: d.name, content: `Tôi cũng muốn nói cốc cà phê thứ tư không phải kế hoạch tăng trưởng.` },
      { speaker: a.name, content: `Nhưng phải công nhận ${owner} có năng lực tạo drama từ việc rất nhỏ.` },
      { speaker: b.name, content: `Tài năng hiếm. Một chiếc tất lạc cũng thành cuộc họp khẩn.` },
      { speaker: c.name, content: `Nếu mai ${owner} lại mở cửa tôi chỉ để ngắm, tôi xin tăng phụ cấp.` },
      { speaker: d.name, content: `Tôi sẽ hỗ trợ bằng âm báo passive-aggressive.` },
      { speaker: a.name, content: `Kết luận nhé: yêu quý ${owner}, nhưng quản lý dự án cá nhân thì hơi rung lắc.` },
      { speaker: b.name, content: `Đồng ý. Hết episode, mọi người giữ thái độ chuyên nghiệp và tiếp tục buôn sau.` },
    ],
  };
}

export function createGossipEpisodes(
  ownerName: string,
  documents: VaultDocument[],
  language: ChatLanguage,
): AutoChatEpisode[] {
  const owner = ownerName.trim() || "A";
  const speakers = createAutoChatSpeakers(documents, language);

  return [
    createEpisodeOne(speakers, owner, language),
    createEpisodeTwo(speakers, owner, language),
    createEpisodeThree(speakers, owner, language),
  ];
}

export function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

export function transformToCipher(text: string): string {
  const map: Record<string, string> = {
    a: ".;",
    b: "#^",
    c: ",,",
    d: "1'",
    e: ";;",
    f: "%)",
    g: "&.",
    h: ":'",
    i: "..",
    j: "^#",
    k: "*)",
    l: ";,",
    m: "&&",
    n: "%%",
    o: "()",
    p: "$#",
    q: "!!",
    r: "^%",
    s: ".#",
    t: ",'",
    u: "))",
    v: "@@",
    w: "##",
    x: "^^",
    y: "$)",
    z: ";&",
    " ": " ",
  };

  return text
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? ";.")
    .join("");
}
