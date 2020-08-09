const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://sinebot.glitch.me/`);
}, 280000);

const Discord = require('discord.js');
const converter = require('number-to-words');
const moment = require('moment');
const dateformat = require('dateformat');
const ms = require('parse-ms')
const client = new Discord.Client({ disableEveryone: true});
const fs = require('fs');
const request = require('request');
const jimp = require('jimp')
const pretty = require("pretty-ms");


const prefix = process.env.PREFIX
const PREFIX = process.env.PREFIX
const ownerID = process.env.MYID


client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();


let cmds = {
  play: { cmd: 'play', a: ['p','شغل','تشغيل'] },
  skip: { cmd: 'skip', a: ['s','تخطي','next']},
  stop: { cmd: 'stop', a:['ايقاف','توقف'] },
  pause: { cmd: 'pause', a:['لحظة','مؤقت'] },
  resume: { cmd: 'resume', a: ['r','اكمل','استكمال'] },
  volume: { cmd: 'volume', a: ['vol','صوت'] },
  queue: { cmd: 'queue', a: ['q','list','قائمة'] },
  repeat: { cmd: 'repeat', a: ['re','تكرار','اعادة'] },
  forceskip: { cmd: 'forceskip', a: ['fs', 'fskip'] },
  skipto: { cmd: 'skipto', a: ['st','تخطي الي'] },
  nowplaying: { cmd: 'Nowplaying', a: ['np','الان'] }
};



Object.keys(cmds).forEach(key => {
var value = cmds[key];
  var command = value.cmd;
  client.commands.set(command, command);

  if(value.a) { // 14
    value.a.forEach(alias => {
    client.aliases.set(alias, command)
  })
  }
})

const ytdl = require('ytdl-core');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');
const YouTube = require('simple-youtube-api');
const youtube = new YouTube("AIzaSyAbpo4nSLBVMmBybWk7L_i_Xr2k-Q6CjxI");
 // 14

let active = new Map();

client.on('warn', console.warn);

client.on('error', console.error);

client.on('ready', () => {
    console.log(`Created By: Sine`);
    console.log(`Guilds: ${client.guilds.size}`);
    console.log(`Users: ${client.users.size}`);
    client.user.setActivity(`${process.env.status.replace('[PREFIX]' ,PREFIX).replace('[SERVERS]',client.guilds.size).replace('[USERS]',client.users.size) || `Type ${prefix}help`}`,{type: 'Playing'});
});

client.on('message', async msg => {
    if(msg.author.bot) return undefined;
  if(!msg.content.startsWith(prefix)) return undefined;

  const args = msg.content.slice(prefix.length).trim().split(/ +/g);
const command = args.shift().toLowerCase();

    const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';

    let cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command))

    let s;

    if(cmd === 'play') {
        const voiceChannel = msg.member.voiceChannel;
        if(!voiceChannel) return msg.channel.send(`<a:734271956521582663:740931922334711901> **You must be listening in a voice channel to use that!**`);
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if(!permissions.has('CONNECT')) {
            return msg.channel.send(`:no_entry_sign: I can't join Your voiceChannel because i don't have ` + '`' + '`CONNECT`' + '`' + ` permission!`);
        }

        if(!permissions.has('SPEAK')) {
            return msg.channel.send(`:no_entry_sign: I can't SPEAK in your voiceChannel because i don't have ` + '`' + '`SPEAK`' + '`' + ` permission!`);
        }
      voiceChannel.join()
      if(!args[0]) return msg.channel.send(`
  <:Hashtag:739883015077101619> To play the music type :
**+play** [Name of the music] **/** [URL of the music] <:734856656189390849:739154127925280872> 
`)

        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();

			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
			return msg.channel.send(`Added to queue: ${playlist.title}`);
		} else {
			try {
// Wéxi
				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(args, 1);

					// eslint-disable-next-line max-depth
					var video = await youtube.getVideoByID(videos[0].id);
				} catch (err) {
					console.error(err);
					return msg.channel.send('I can\'t find any thing');
				}
			}

			return handleVideo(video, msg, voiceChannel);
		}

        async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = active.get(msg.guild.id);


//	console.log('yao: ' + Util.escapeMarkdown(video.thumbnailUrl));

let hrs = video.duration.hours > 0 ? (video.duration.hours > 9 ? `${video.duration.hours}:` : `0${video.duration.hours}:`) : '';
let min = video.duration.minutes > 9 ? `${video.duration.minutes}:` : `0${video.duration.minutes}:`;
let sec = video.duration.seconds > 9 ? `${video.duration.seconds}` : `0${video.duration.seconds}`;
let dur = `${hrs}${min}${sec}`

  let ms = video.durationSeconds * 1000;

	const song = {  // 04
		id: video.id,
		title: video.title,
    duration: dur,
    msDur: ms,
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 50,
      requester: msg.author,
			playing: true,
      repeating: false
		};
		active.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			active.delete(msg.guild.id);
			return msg.channel.send(`I cant join this voice channel`);
		} // 04
	} else {
		serverQueue.songs.push(song);

		if (playlist) return undefined;
		if(!args) return msg.channel.send('no results.');
		else return msg.channel.send(':watch: Loading... [`' + args + '`]').then(m => {
      setTimeout(() => {//:watch: Loading... [let]
        m.edit(`<a:555:740534493135241237>  Added **${song.title}**` + '(` ' + song.duration + ')`' + ` to the queue at position ` + `${serverQueue.songs.length}`);
      }, 500)
    }) 
	}
	return undefined;
}

function play(guild, song) {
	const serverQueue = active.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		active.delete(guild.id);
		return;
	}
	//console.log(serverQueue.songs);
  if(serverQueue.repeating) {
	console.log('Repeating');
  } else {
	serverQueue.textChannel.send('<a:555:740534493135241237> Added **' + song.title + '** (`' + song.duration + '`) to begin playing.');
}
	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			//if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
			//else console.log(reason);
      if(serverQueue.repeating) return play(guild, serverQueue.songs[0])
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 100);


}
} else if(cmd === 'stop') {
        if(msg.guild.me.voiceChannel !== msg.member.voiceChannel) return msg.channel.send(`You must be in ${msg.guild.me.voiceChannel.name}`)
        if(!msg.member.hasPermission('ADMINISTRATOR')) {
          msg.react('❌')
          return msg.channel.send('You don\'t have permission `ADMINSTRATOR`');
        }
        let queue = active.get(msg.guild.id);
        if(queue.repeating) return msg.channel.send('Repeating Mode is on, you can\'t stop the music, run `' + `${prefix}repeat` + '` to turn off it.')
        queue.songs = [];
        queue.connection.dispatcher.end();
        return msg.channel.send('<a:734271911881605212:740932043889836152> **The player has stopped and the queue has been cleared.**');
                              

    } else if(cmd === 'skip') {

      let vCh = msg.member.voiceChannel;

      let queue = active.get(msg.guild.id);

        if(!vCh) return msg.channel.send('<a:734271956521582663:740931922334711901> **Sorry, but you can\'t because you are not in voice channel.**');

        if(!queue) return msg.channel.send('<a:734271956521582663:740931922334711901> **No music playing to skip it.**');

        if(queue.repeating) return msg.channel.send('<a:734271956521582663:740931922334711901> **You can\'t skip it, because repeating mode is on, run.** ' + `\`${prefix}forceskip\``);

        let req = vCh.members.size - 1;

        if(req == 1) {
            msg.channel.send('**<a:734271911881605212:740932043889836152> Skipped **' + args);
            return queue.connection.dispatcher.end('Skipping ..')
        }

        if(!queue.votes) queue.votes = [];

        if(queue.votes.includes(msg.member.id)) return msg.say(`You already voted for skip! ${queue.votes.length}/${req}`);

        queue.votes.push(msg.member.id);

        if(queue.votes.length >= req) {
            msg.channel.send('**<a:734271911881605212:740932043889836152> Skipped **' + args);

            delete queue.votes;

            return queue.connection.dispatcher.end('**Skipping ..**')
        }

        msg.channel.send(`**You have successfully voted for skip! ${queue.votes.length}/${req}**`)

    } else if(cmd === 'pause') {

      let queue = active.get(msg.guild.id);

        let vCh = msg.member.voiceChannel;

        if(!vCh || vCh !== msg.guild.me.voiceChannel) return msg.channel.send(`You are not in my voice channel.`);

        if(!queue) {
            return msg.channel.send('<a:734271956521582663:740931922334711901> **No music playing to pause.**')
        }

        if(!queue.playing) return msg.channel.send(':no_entry_sign: There must be music playing to use that!')

        let disp = queue.connection.dispatcher;

        disp.pause('Pausing..')

        queue.playing = false;

        msg.channel.send('<a:734271911881605212:740932043889836152> Paused ' + args + '. **Type** `' + prefix + 'resume` to unpause!')

    } else if (cmd === 'resume') {

      let queue = active.get(msg.guild.id);

        let vCh = msg.member.voiceChannel;

        if(!vCh || vCh !== msg.guild.me.voiceChannel) return msg.channel.send(`You are not in my voice channel.`);

        if(!queue) return msg.channel.send('<a:734271956521582663:740931922334711901> **No music paused to resume.**')

        if(queue.playing) return msg.channel.send('<a:734271956521582663:740931922334711901> **No music paused to resume.**')

        let disp = queue.connection.dispatcher;

        disp.resume('**Resuming..**')
// 2-0-0-2
        queue.playing = true;

        msg.channel.send('<a:734271911881605212:740932043889836152> **Resumed.**')

    } else if(cmd === 'volume') {
      
      if(!msg.member.hasPermissions("ADMINISTRATOR")) return;

      let queue = active.get(msg.guild.id);

      if(!queue || !queue.songs) return msg.channel.send('<a:734271956521582663:740931922334711901> **There is no music playing to set volume.**');

      let vCh = msg.member.voiceChannel;

      if(!vCh || vCh !== msg.guild.me.voiceChannel) return msg.channel.send('<a:734271956521582663:740931922334711901> **You are not in my voice channel.**');

      let disp = queue.connection.dispatcher;

      if(isNaN(args[0])) return msg.channel.send('<a:734271956521582663:740931922334711901> **Numbers only!**');

      if(parseInt(args[0]) > 100) return msg.channel.send('<a:734271956521582663:740931922334711901> **You can\'t set the volume more than __100__.**')
//:speaker: Volume changed from 20 to 20 ! The volume has been changed from ${queue.volume} to ${args[0]}
      msg.channel.send('🔊 Volume has been **changed** from (`' + queue.volume + '`) to (`' + args[0] + '`)');

      queue.volume = args[0];

      disp.setVolumeLogarithmic(queue.volume / 100);

    } else if (cmd === 'queue') {

      let queue = active.get(msg.guild.id);

      if(!queue) return msg.channel.send('<a:734271956521582663:740931922334711901> **There must be music playing to use that!**');

      let embed = new Discord.RichEmbed()
      .setAuthor(`${client.user.username}`, client.user.displayAvatarURL)
      let text = '';

      for (var i = 0; i < queue.songs.length; i++) {
        let num;
        if((i) > 8) {
          let st = `${i+1}`
          let n1 = converter.toWords(st[0])
          let n2 = converter.toWords(st[1])
          num = `:${n1}::${n2}:`
        } else {
        let n = converter.toWords(i+1)
        num = `:${n}:`
      }
        text += `${num} ${queue.songs[i].title} [${queue.songs[i].duration}]\n`
      }
      embed.setDescription(`Songs Queue | ${msg.guild.name}\n\n ${text}`)
      msg.channel.send(embed)

    } else if(cmd === 'repeat') {

      let vCh = msg.member.voiceChannel;

      if(!vCh || vCh !== msg.guild.me.voiceChannel) return msg.channel.send('<a:734271956521582663:740931922334711901> **You are not in my voice channel.**');

      let queue = active.get(msg.guild.id);

      if(!queue || !queue.songs) return msg.channel.send('<a:734271956521582663:740931922334711901> **There is no music playing to repeat it.**');

      if(queue.repeating) {
        queue.repeating = false;
        return msg.channel.send('<a:734271911881605212:740932043889836152> **Repeating Mode** (`False`)');
      } else {
        queue.repeating = true;
        return msg.channel.send('<a:734271911881605212:740932043889836152> **Repeating Mode** (`True`)');
      }

    } else if(cmd === 'forceskip') {
      if(!msg.member.hasPermissions("ADMINISTRATOR")) return;

      let vCh = msg.member.voiceChannel;

      if(!vCh || vCh !== msg.guild.me.voiceChannel) return msg.channel.send('<a:734271956521582663:740931922334711901> **You are not in my voice channel.**');

      let queue = active.get(msg.guild.id);

      if(queue.repeating) {

        queue.repeating = false;

        msg.channel.send('<a:734271911881605212:740932043889836152> **ForceSkipped, Repeating mode is on.**')

        queue.connection.dispatcher.end('**ForceSkipping..**')
// 2-0-0-2
        queue.repeating = true;

      } else {

        queue.connection.dispatcher.end('**ForceSkipping..**')

        msg.channel.send('<a:734271911881605212:740932043889836152> **ForceSkipped.**')

      }

     } else if(cmd === 'skipto') {  
       
      if(!msg.member.hasPermissions("ADMINISTRATOR")) return;
      

      let vCh = msg.member.voiceChannel;

      if(!vCh || vCh !== msg.guild.me.voiceChannel) return msg.channel.send('<a:734271956521582663:740931922334711901> **You are not in my voice channel.**');

      let queue = active.get(msg.guild.id);

      if(!queue.songs || queue.songs < 2) return msg.channel.send('<a:734271956521582663:740931922334711901> **There is no music to skip to.**');

    if(queue.repeating) return msg.channel.send('<a:734271956521582663:740931922334711901> **You can\'t skip, because repeating mode is on, run** ' + `\`${prefix}repeat\` to turn off.`);

      if(!args[0] || isNaN(args[0])) return msg.channel.send('<:Thx:739187785579364434> **Please input song number to skip to it, run** ' + prefix + `queue` + ' **to see songs numbers.**');

      let sN = parseInt(args[0]) - 1;

      if(!queue.songs[sN]) return msg.channel.send('**<a:734271956521582663:740931922334711901> **There is no song with this number.**');

      let i = 1;

      msg.channel.send(`Skipped to: **${queue.songs[sN].title}[${queue.songs[sN].duration}]**`)

      while (i < sN) {
        i++;
        queue.songs.shift();
      }

      queue.connection.dispatcher.end('**SkippingTo..**')

    } else if(cmd === 'Nowplaying') {

      let q = active.get(msg.guild.id);

      let now = npMsg(q)

      msg.channel.send(now.mes, now.embed)
      .then(me => {
        setInterval(() => {
          let noww = npMsg(q)
          me.edit(noww.mes, noww.embed)
        }, 5000)
      })

      function npMsg(queue) {

        let m = !queue || !queue.songs[0] ? 'No music playing.' : "Now Playing..."

      const eb = new Discord.RichEmbed();

      eb.setColor(msg.guild.me.displayHexColor)

      if(!queue || !queue.songs[0]){
// 04
        eb.setTitle("No music playing");
            eb.setDescription("\u23F9 "+bar(-1)+" "+volumeIcon(!queue?100:queue.volume));
      } else if(queue.songs) {

        if(queue.requester) {

          let u = msg.guild.members.get(queue.requester.id);

          if(!u)
            eb.setAuthor('Unkown (ID:' + queue.requester.id + ')')
          else
            eb.setAuthor(u.user.tag, u.user.displayAvatarURL)
        }

        if(queue.songs[0]) {
        try {
            eb.setTitle(queue.songs[0].title);
            eb.setURL(queue.songs[0].url);
        } catch (e) {
          eb.setTitle(queue.songs[0].title);
        }
}
        eb.setDescription(embedFormat(queue))

      }

      return {
        mes: m,
        embed: eb
      }

    }

      function embedFormat(queue) {

        if(!queue || !queue.songs) {
          return "No music playing\n\u23F9 "+bar(-1)+" "+volumeIcon(100);
        } else if(!queue.playing) {
          return "No music playing\n\u23F9 "+bar(-1)+" "+volumeIcon(queue.volume);
        } else { // 2-0-0-2


          let progress = (queue.connection.dispatcher.time / queue.songs[0].msDur);
          let prog = bar(progress);
          let volIcon = volumeIcon(queue.volume);
          let playIcon = (queue.connection.dispatcher.paused ? "\u23F8" : "\u25B6")
          let dura = queue.songs[0].duration;

          return playIcon + ' ' + prog + ' `[' + formatTime(queue.connection.dispatcher.time) + '/' + dura + ']`' + volIcon;


        }

      }

      function formatTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = parseInt((duration / 1000) % 60),
    minutes = parseInt((duration / (1000 * 60)) % 60),
    hours = parseInt((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return (hours > 0 ? hours + ":" : "") + minutes + ":" + seconds;
}
// -0-4-
      function bar(precent) {

        var str = '';

        for (var i = 0; i < 12; i++) {

          let pre = precent
          let res = pre * 12;

          res = parseInt(res)

          if(i == res){
            str+="\uD83D\uDD18";
          }
          else {
            str+="▬";
          }
        }

        return str;

      }

      function volumeIcon(volume) {

        if(volume == 0)
           return "\uD83D\uDD07";
       if(volume < 30)
           return "\uD83D\uDD08";
       if(volume < 70)
           return "\uD83D\uDD09";
       return "\uD83D\uDD0A";

      }

    }

});


client.on("message", m => {
  if (m.content === "+help") {
    let Dashboard = "test";
    var addserver ="test ";
    var SUPPORT = "test";
    let embed = new Discord.RichEmbed().setTitle(`Sine Commands <a:Emoji_15:673312752949002270> `)
.setThumbnail("https://images-ext-2.discordapp.net/external/7rh8g8D5Q9HVXsVGiuKUg23NECXbCFlWkF822xKGU1w/%3Fsize%3D2048/https/cdn.discordapp.com/avatars/739504468332249138/a04fa8d64de422bac8f725b963e34542.png?width=406&height=406")
.setDescription(` 
<:Hashtag:739883015077101619> __Musical Orders__ :

<a:Loading:739877053934862427> **+play لتشغيل الاغاني  **

<a:Loading:739877053934862427> **+skip لتخطي الاغاني **

<a:Loading:739877053934862427> **+stop لتوقيف البوت**

<a:Loading:739877053934862427> **+pause توقيف المؤقت للاغاني **

<a:Loading:739877053934862427> **+resume إستكمال الاغنيه**

<a:Loading:739877053934862427> **+queue قائمة الاغاني**

<a:Loading:739877053934862427> **+repeat اعادة الاغاني**

<a:Loading:739877053934862427> **+forceskip تخطي السريع**

<a:Loading:739877053934862427> **+skipto تخطي إلي **

<a:Loading:739877053934862427> ** +np الاغنية الحالية**

<:Hashtag:739883015077101619> __Additional Orders__ :

<a:Loading:739877053934862427> ** +ping لمعرفة سرعة اتصال البوت **

<a:Loading:739877053934862427> ** +inv لدعوة البوت إالى سيرفرك **

<a:Loading:739877053934862427> ** +avatar لإظهار صورة بروفايلك أو صورة بروفايل شخص **

<:Hashtag:739883015077101619> __Important Orders__ :

<a:Loading:739877053934862427> **Support : https://discord.gg/NryfUVp**

<a:Loading:739877053934862427> **Developers : <@432214211997859851> | <@700921117942218814> | <@732017149530472579> | <@560090054228181002> | <@711977973485666305> | <@415260178166972416>** <:Verifieted_Bot:739187298171879496>

`);
    m.react("✅");
    m.author.send(embed);
  }
});



const devs = ["432214211997859851","415260178166972416","581128161018904586","732017149530472579","700921117942218814","615170593393868801","711977973485666305","560090054228181002"]
client.on('message', msg => {
 if(!msg.channel.guild) return;
      if (!devs.includes(msg.author.id)) return;
 if (msg.content.startsWith('+bot')) {
    const pera = new Discord.RichEmbed()
.setColor('GREEN')
.setTitle('> <a:Loading:739877053934862427> ** Bot Status :**')
.addField(' <:Hashtag:739883015077101619> ** __Servers Count__ :**', [client.guilds.size], true)
.addField(' <:Hashtag:739883015077101619> ** __Members Count__ :**', `[ ${client.users.size} ]`, true)
msg.channel.send(pera)
  }
});






client.on('guildCreate', guild => {
var joined = new Discord.RichEmbed()
                  .setColor('GREEN')
                  .setTitle('**bot Joined A New Server✅**')
                  .setDescription(`__${guild.name}__`)
                  .addField('**Server Owner**', `__${guild.owner}__`)
                  .addField('**Server ID**', `__${guild.id}__`)
                  .addField('**Server Count**', `__${guild.memberCount}__`)
                            client.channels.get("739547894830596217").send({embed:joined});

});

                            client.on('guildDelete', guild => {
                   var left = new Discord.RichEmbed()
                  .setColor('GREEN')
                  .setTitle('**bot Left A Server** ❎')
                  .setDescription(`__${guild.name}__`)
                  .addField('>**Server Owner**', `__${guild.owner}__`)
                  .addField('>**Server ID**', `__${guild.id}__`)
                  .addField('>**Server Count**', `__${guild.memberCount}__`)
                              client.channels.get("739547916473204818").send({embed:left})
                            });
  client.on('guildCreate', guild => {
    if (guild.memberCount < 25) {
        guild.leave();
    }
});

//By Wéxi

client.on('message', msg => {   if (msg.content === '+inv') {     msg.reply('https://discord.com/api/oauth2/authorize?client_id=739504468332249138&permissions=0&scope=bot');   } });
client.on('message', msg => {   if (msg.content === '+support') {     msg.reply('https://discord.gg/cP3H7U5');   } });





client.on('message', message => { 
                                if(!message.channel.guild) return;
                        if (message.content.startsWith(prefix + 'ping')) {
                            if(!message.channel.guild) return;
                            var msg = `${Date.now() - message.createdTimestamp}`
                            var api = `${Math.round(client.ping)}`
                            if (message.author.bot) return;
                        let embed = new Discord.RichEmbed()
                        .setAuthor(message.author.username,message.author.avatarURL)
                        .setColor('GREEN')
                        .addField('<:logo_sine_beta:739880265928802346>**BOT:**',msg + " ms <a:Search:739876264680095755> ")
                        .addField('<a:Loading:739877053934862427>**API:**',api + " ms <a:Search:739876264680095755> ")
                        .setTimestamp()
        message.channel.send({embed:embed});
                        }
                    });







client.on('message', message => {
    if (message.content.startsWith("+avatar")) {
        if (message.author.bot) return
        var mentionned = message.mentions.users.first();
    var cutie;
      if(mentionned){
          var cutie = mentionned;
      } 
      
      else {
          var cutie = message.author;
          
      }
        const embed = new Discord.RichEmbed()
        .setAuthor(cutie.tag, cutie.avatarURL)
        .setColor("GREEN")
        .setTitle('Avatar Link')
        .setURL(`${cutie.avatarURL}`)
        .setImage(`${cutie.avatarURL}`)
        .setFooter("Requested by" + message.author.tag, message.author.avatarURL)
      message.channel.sendEmbed(embed);
    }
});








client.login(process.env.BOT_TOKEN).catch(err=> console.log("**قد لا يوجد توكن او التوكن متوقف**"));