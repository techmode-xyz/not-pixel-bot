const TelegramApi = require("node-telegram-bot-api");
const token = "";
const bot = new TelegramApi(token, { polling: true });
const { createCanvas } = require("canvas");
const fs = require("fs");

const canvas = createCanvas(192, 192);
const ctx = canvas.getContext("2d");

const range = (value) =>
  [...new Array(value).fill(0)].map((el, index) => index);
const buttonNumber = range(10).map((el) => {
  return { text: el, callback_data: el };
});
const chats = {};
const gameOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [...buttonNumber.toSpliced(0, 5)],
      [...buttonNumber.toSpliced(5, 10)],
    ],
  }),
};
const againOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [[{ text: "again", callback_data: "/game" }]],
  }),
};
const commands = {
  "/start": async (msg) => {
    const { first_name, id } = msg.from;
    await bot.sendMessage(id, `hello ${first_name}`);
  },
  "/info": async (msg) => {
    const { id } = msg.from;
    await bot.sendMessage(id, `info`);
  },
  "/picture": async (msg) => {
    const { id } = msg.from;
    ctx.fillStyle = "green";
    ctx.fillRect(20, 10, 150, 100);
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync("./image.png", buffer);
    await bot.sendPhoto(id, "./image.png");
  },
  "/help": async (msg) => {
    const { id } = msg.from;
    const text = Object.keys(commands).join("\n");
    await bot.sendMessage(id, `command list`);
    await bot.sendMessage(id, text);
  },
  "/game": async (msg) => {
    const { id } = msg.from;
    await bot.sendMessage(id, "0 from 9");
    const randomNumber = Math.floor(Math.random() * 10);
    chats[id] = randomNumber;
    await bot.sendMessage(id, "guess", gameOptions);
  },
};

bot.setMyCommands([
  { command: "/start", description: "Initial greeting" },
  { command: "/info", description: "Get information" },
  { command: "/picture", description: "Send a picture" },
  { command: "/help", description: "Help" },
]);
const start = () => {
  bot.on("message", async (msg) => {
    const { text } = msg;
    if (Object.keys(commands).includes(text)) {
      commands[text](msg);
    }
  });
  bot.on("callback_query", async (msg) => {
    const { data } = msg;
    const { id } = msg.message.chat;
    if (Object.keys(commands).includes(data)) {
      commands[data](msg);
      return;
    }
    await bot.sendMessage(id, `you chose ${data}`);
    if (data == chats[id]) {
      await bot.sendMessage(id, `guessed ${chats[id]}`, againOptions);
    } else {
      await bot.sendMessage(id, `guess wrong ${chats[id]}`, againOptions);
    }
  });
};

start();
