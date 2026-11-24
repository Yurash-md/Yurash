const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req,res)=>res.send('YURASH-MD IS ONLINE 👑'));
app.listen(PORT, ()=>console.log('Server on '+PORT));

const OWNER = '255743690336';
const PHONE = process.env.PHONE_NUMBER || '255743690336';

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('session');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, logger: pino({level:'silent'}), printQRInTerminal: false, auth: state, browser: ['YURASH-MD','Chrome','1.0'] });
  sock.ev.on('creds.update', saveCreds);

  if(!sock.authState.creds.registered){
    await new Promise(r=>setTimeout(r,3000));
    try{
      let code = await sock.requestPairingCode(PHONE);
      console.log('PAIRING CODE YAKO: '+code);
      console.log('PAIRING CODE YAKO: '+code);
    }catch(e){ console.log('Pair fail, retry in 10s', e.message); setTimeout(start,10000); }
  }

  sock.ev.on('connection.update', (u)=>{
    const { connection, lastDisconnect } = u;
    if(connection==='open') console.log('✅ YURASH-MD CONNECTED!');
    if(connection==='close'){
      let reason = lastDisconnect?.error?.output?.statusCode;
      if(reason !== DisconnectReason.loggedOut) setTimeout(start,5000);
      else console.log('Logged out, delete session');
    }
  });

  sock.ev.on('messages.upsert', async ({messages})=>{
    const m = messages[0]; if(!m.message || m.key.fromMe) return;
    const from = m.key.remoteJid;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    if(!text.startsWith('.')) return;
    const cmd = text.slice(1).trim().split(' ')[0].toLowerCase();
    const reply = (t)=>sock.sendMessage(from,{text:t},{quoted:m});
    if(cmd==='ping') reply('Pong! 🏓 YURASH-MD iko fast!');
    if(cmd==='alive') reply('👑 YURASH-MD IKO HAI!\nOwner: @'+OWNER);
    if(cmd==='menu') reply('👑 *YURASH-MD MENU*\n\n.ping\n.alive\n.menu\n.owner\n.time\n.joke\n.quote\n.king\n.groupinfo\n.tagall');
    if(cmd==='owner') reply('👑 Owner: wa.me/'+OWNER);
    if(cmd==='time') reply('Saa sasa: '+new Date().toLocaleString('en-GB',{timeZone:'Africa/Dar_es_Salaam'}));
    if(cmd==='joke') reply('Kwanini simu haipendi kwenda shule? Kwa sababu inaogopa ku-CHARGE-wa! 😂');
    if(cmd==='quote') reply('“Usikate tamaa, kila KING alianza kama kawaida.” 👑');
    if(cmd==='king') reply('WEWE NI KING! 👑 Yusra Mmh, usisahau hilo!');
    if(cmd==='groupinfo' && from.endsWith('@g.us')){ const g = await sock.groupMetadata(from); reply(`Group: ${g.subject}\nMembers: ${g.participants.length}`); }
    if(cmd==='tagall' && from.endsWith('@g.us')){ const g = await sock.groupMetadata(from); const mem = g.participants.map(p=>p.id); await sock.sendMessage(from,{text:'👑 TAGALL BY YURASH-MD\n'+mem.map(x=>'@'+x.split('@')[0]).join('\n'), mentions:mem}); }
  });
}
start();
