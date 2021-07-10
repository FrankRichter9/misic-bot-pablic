


var express = require("express")
var app = express()

// var LINKS = ['11', '22'];

var oldValue = ''

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    
    next();
  });

app.use(express.urlencoded({
    extended: true
  }));
app.use(express.json());



// app.get("/data", function (req, res) {

//     res.send(JSON.stringify(LINKS));
  
// })

app.post("/data", function (req, res) {
        console.log('Получены данные', req.body);
        if(req.body.link != oldValue){
            oldValue = req.body.link;
            // Message.content = '!play '+ req.body.link;
            // Play(Message)

            PlaySongVk(req.body.link)

            
        }else console.log("ЕТО СТАРЫЕ ДАННЫЕ!")
        

        
        // LINKS.shift()
})




// let port = process.env.PORT | 80

app.listen(process.env.PORT);


async function PlaySongVk(msg){
    const {videos} = await yts(msg);
    if (!videos.length) return message.channel.send("No songs were found!");
    const song = {
        title: videos[0].title,
        url: videos[0].url
    };
    // serverQueue = queue.get(Message.guild.id);

    
    if(!serverQueue){
        let queueConst = {
            textChannel: Message.channel,
            voiceChannel: vc.channel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queue.set(Message.guild.id, queueConst);
        queueConst.songs.push(song);

        try {
            let connection = await vc.channel.join();
            queueConst.connection = connection
            play(Message.guild, queueConst.songs[0])
        } catch (error) {
            console.log(error);
            queue.delete(Message.guild.id);
            Message.channel.send("Ошибка: " + error);
        }
    }else{
        serverQueue.songs.push(song);
        // console.log('add ' + msg)
        Message.channel.send(`${msg} добавлен в очередь!`)
    }

    
}




const Discord = require('discord.js');
const client = new Discord.Client();
const {prefix, token} = require("./config.json")
var serverQueue = '';
let vc = '';
const yts = require("yt-search");

FFMPEG_OPTIONS = {
    'before_options': '-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5',
    'options': '-vn',
}


var queue = new Map();

const ytdl = require('ytdl-core');

client.on('ready', () => console.log("ready"));

client.on('message', Play)

var Message;

async function Play(message){
    // Message = message;
    console.log(message.content)
    if(message.author.bot) return;
    if(message.content.indexOf(prefix) !== 0) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    // if(command == "a")return message.channel.send(`>play sfdsfsd`)
    if(command == "play") {
        Message = message;
        if(!args[0]) return;
        let url = args.join(" ");

        // if(!url.match(/(youtube.com|youtu.be)\/(watch)?(\?v=)?(\S+)?/)) return message.channel.send("Ссылка не работает!");

        serverQueue = queue.get(message.guild.id);
        vc = message.member.voice;

        if(!vc) return message.channel.send("Вы не в голосовом канале!");

        if(!vc.channel.permissionsFor(client.user).has('CONNECT') || !vc.channel.permissionsFor(client.user).has('SPEAK')) return message.channel.send("У меня недостаточно прав на подключению к каналу.");

        const {videos} = await yts(url);
        if (!videos.length) return message.channel.send("No songs were found!");
        const song = {
            title: videos[0].title,
            url: videos[0].url
        };

        // let songinfo = await ytdl.getInfo(url);
        // let song = {
        //     title: songinfo.title,
        //     url: songinfo.video_url
        // }

        if(!serverQueue){
            let queueConst = {
                textChannel: message.channel,
                voiceChannel: vc.channel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };

            queue.set(message.guild.id, queueConst);
            queueConst.songs.push(song);

            try {
                let connection = await vc.channel.join();
                queueConst.connection = connection
                play(message.guild, queueConst.songs[0])
            } catch (error) {
                console.log(error);
                queue.delete(message.guild.id);
                return message.channel.send("Ошибка: " + error);
            }
        }else{
            serverQueue.songs.push(song);
            console.log(serverQueue.songs)
            return message.channel.send(`**${song.title}** добавлен в очередь!`)
        }
        
    }
    if(command == "skip") {
        // let serverQueue = queue.get(message.guild.id);
        skip(message, serverQueue)
    }
    if(command == "stop") {
        let serverQueue = queue.get(message.guild.id);
        stop(message, serverQueue)
    }
 
}

async function PlaySong(message){
    const {videos} = await yts(message);
        if (!videos.length) return message.channel.send("No songs were found!");
        const song = {
            title: videos[0].title,
            url: videos[0].url
        };

        queueConst.songs.push(song);
}

/**
 * 
 * @param {Discord.Guild} guild 
 * @param {Object} song 
 */
// async function playSong(guild, song) {
//     let serverQueue = queue.get(guild.id);

//     if(!song){
//         serverQueue.voiceChannel.leave();
//         queue.delete(guild.id);
//         return;
//     }

//     const dispatcher = serverQueue.connection.play(ytdl(song.url)).on('end', () => {
//         serverQueue.songs.shift();
        
//         playSong(guild, serverQueue.songs[0]);
//     })
//     .on('error', () => {
//         console.log(error)
//     })

//     dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
// }

function play(guild, song, skip = false) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
     serverQueue.voiceChannel.leave();
     queue.delete(guild.id);
     return;
    }
    const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    if(!skip)serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}


async function skip(message, serverQueue) {
    // if (!message.member.voiceChannel) return message.channel.send('You have to be in a voice channel to stop the music!');
    if (!serverQueue) return message.channel.send('There is no song that I could skip!');
    if(serverQueue){
        await serverQueue.connection.dispatcher.end();
        // await serverQueue.songs.shift();
        play(message.guild, serverQueue.songs[0], true);
    }
   }

   function stop(message, serverQueue) {
    // if (!message.member.voiceChannel) return message.channel.send('You have to be in a voice channel to stop the music!');
    // if (!serverQueue) return message.channel.send('There is no song that I could skip!');
    if(serverQueue){
        serverQueue.connection.dispatcher.end();
        serverQueue.songs = [];
    }
    
   }

client.login(token)


