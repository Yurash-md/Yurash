const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers, jidNormalizedUser } = require('@whiskeysockets/baileys');
const pino = require('pino');

const OWNER = '255743690336'; // WEKA NAMBA YAKO HAPA BILA + , mfano 2556XXXXXXXX
const PREFIX = '.';
const BOT_NAME = 'YURASH-MD 👑';
const OWNER_NAME = 'YURASH';

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS('Chrome'),
        auth: state,
        syncFullHistory: false,
        markOnlineOnConnect: true
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        const phone = process.env.PHONE_NUMBER || '';
        if (phone) {
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phone.replace(/[^0-9]/g, ''));
                    console.log('YURASH PAIRING CODE:', code);
                } catch (e) { console.log('Pair fail', e.message); }
            }, 3000);
        } else console.log('Weka PHONE_NUMBER kwenye Render');
    }

    sock.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Closed, reconnect:', shouldReconnect);
            if (shouldReconnect) start();
        } else if (connection === 'open') {
            console.log(BOT_NAME + ' IMEWAKA! 🔥');
            sock.sendMessage(jidNormalizedUser(OWNER + '@s.whatsapp.net'), { text: `*${BOT_NAME} IMEWAKA! 🔥*\n\nBot yako iko online na iko tayari kutumika.\nTuma *${PREFIX}menu* kuona commands.` }).catch(()=>{});
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = m.key.participant || from;
        const text = (m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || '').trim();
        if (!text.startsWith(PREFIX)) return;
        const args = text.slice(1).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();
        const reply = (t) => sock.sendMessage(from, { text: t }, { quoted: m });

        const menuText = `*${BOT_NAME} - POWERFUL MENU 🔥*\n\n*⚡ GENERAL*\n${PREFIX}menu - Menu hii\n${PREFIX}ping - Speed ya bot\n${PREFIX}alive - Bot iko hai?\n${PREFIX}owner - Mmiliki\n${PREFIX}info - Habari za bot\n${PREFIX}time - Saa na tarehe\n\n*👥 GROUP*\n${PREFIX}tagall - Wataje wote\n${PREFIX}groupinfo - Habari za group\n${PREFIX}link - Link ya group\n\n*🎭 FUN*\n${PREFIX}joke - Joke kali\n${PREFIX}quote - Maneno ya hekima\n${PREFIX}king - Uko king?\n\n*🛡️ OWNER ONLY*\n${PREFIX}broadcast <ujumbe>\n${PREFIX}join <link>\n\n_Powered by ${OWNER_NAME} 👑_`;

        if (cmd === 'menu' || cmd === 'help') return reply(menuText);
        if (cmd === 'ping') {
            let s = Date.now();
            await reply('Testing speed...');
            return reply(`*Pong! 🏓*\nSpeed: ${Date.now() - s}ms\n${BOT_NAME} iko STRONG! 🔥`);
        }
        if (cmd === 'alive') return reply(`*${BOT_NAME} IKO HAI! 👑🔥*\n\n✅ Online\n✅ Strong\n✅ Powerful\n\nMmiliki: ${OWNER_NAME}`);
        if (cmd === 'owner') return reply(`*MMILIKI 👑*\n\nJina: ${OWNER_NAME}\nNamba: wa.me/${OWNER}\nBot: ${BOT_NAME}`);
        if (cmd === 'info') return reply(`*${BOT_NAME} INFO*\n\nVersion: 2.0 POWERFUL\nPrefix: ${PREFIX}\nMmiliki: ${OWNER_NAME}\nStatus: Online 🔥`);
        if (cmd === 'time') return reply(`*SAA ⏰*\n\n${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Dar_es_Salaam' })}\nDar es Salaam`);
        if (cmd === 'joke') {
            const jokes = ['Mwalimu: Kwa nini umechelewa? Mwanafunzi: Nilitaka kuja mapema lakini usingizi ulinivuta 😂','Simu yangu inaniambia storage imejaa, kumbe picha za ex wangu 😭😂','Nilienda gym siku moja tu, sasa nataka kila mtu ajue ninaenda gym 😂'];
            return reply(jokes[Math.floor(Math.random()*jokes.length)]);
        }
        if (cmd === 'quote') {
            const q = ['Usikate tamaa, kila king ana siku yake 👑','Nguvu kubwa inakuja na juhudi kubwa 🔥','Leo ni siku yako ya kushinda!'];
            return reply(q[Math.floor(Math.random()*q.length)]);
        }
        if (cmd === 'king') return reply('Wewe ni KING 👑! Lakini KING wa wote ni ' + OWNER_NAME + ' 🔥');
        if (cmd === 'tagall') {
            if (!isGroup) return reply('Hii ni ya group tu!');
            try {
                const meta = await sock.groupMetadata(from);
                let txt = `*TAG ALL - ${meta.subject} 👥*\n\n`;
                let mentions = [];
                for (let p of meta.participants) { txt += `@${p.id.split('@')[0]} \n`; mentions.push(p.id); }
                return sock.sendMessage(from, { text: txt, mentions }, { quoted: m });
            } catch { return reply('Imeshindikana kutag'); }
        }
        if (cmd === 'groupinfo') {
            if (!isGroup) return reply('Hii ni ya group tu!');
            try { const meta = await sock.groupMetadata(from); return reply(`*GROUP INFO 👥*\n\nJina: ${meta.subject}\nWanachama: ${meta.participants.length}\nImeundwa: ${new Date(meta.creation*1000).toLocaleDateString()}`); } catch { return reply('Imeshindikana'); }
        }
        if (cmd === 'link') {
            if (!isGroup) return reply('Hii ni ya group tu!');
            try { const code = await sock.groupInviteCode(from); return reply(`Group Link:\nhttps://chat.whatsapp.com/${code}`); } catch { return reply('Bot sio admin, haiwezi kutoa link'); }
        }
        if (cmd === 'broadcast') {
            if (!sender.includes(OWNER)) return reply('Wewe sio owner!');
            if (!args.length) return reply('Andika: .broadcast ujumbe wako');
            return reply('Broadcast imepokelewa! (Weka groups zako hapa)');
        }
    });
}
start();
