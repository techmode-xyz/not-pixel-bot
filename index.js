// modules
const conf = require("./conf.js");
const TelegramApi = require("node-telegram-bot-api");
const token = conf.TOKEN;
const bot = new TelegramApi(token, { polling: true });
const canvasBattle = require("./imageDraw.js");
const user = require("./user.js");
const color = require("./color");

cb = new canvasBattle(1000, 1000, "./img.png");
cb.loadImage("./img.png");
setInterval(cb.writeImage, 60000);

const time = 10000;
const sizeDefault = 10;

const commandsDescription = [
  { command: "/start", description: "Hello" },
  { command: "/colorpick", description: "Pick a color r,g,b" },
  { command: "/help", description: "Display the list of commands" },
  { command: "/draw", description: "Draw on the canvas at x y" },
  { command: "/colorlist", description: "Display the default list of colors" },
  {
    command: "/mycolorlist",
    description: "Display the default color list set by the user",
  },
  {
    command: "/setcolorlist",
    description: "Set the color list r,g,b r,g,b r,g,b",
  },
  { command: "/view", description: "Display the canvas itself" },
  { command: "/myinfo", description: "Display all user information" },
  { command: "/mycolor", description: "Display color and image" },
];

bot.setMyCommands(commandsDescription);

const chats = {};

const colorList = [
  { text: "Black color ⚫", callback_data: "Black" },
  { text: "White color ⚪", callback_data: "White" },
  { text: "Red color 🔴", callback_data: "Red" },
  { text: "Yellow color 🟡", callback_data: "Yellow" },
  { text: "Blue color 🔵", callback_data: "Blue" },
  { text: "Green color 🟢", callback_data: "Green" },
];

const colorOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [...colorList.toSpliced(0, 3)],
      [...colorList.toSpliced(3, 3)],
    ],
  }),
};

const commands = {
  "/draw": async (id, x, y) => {
    const date = chats[id].date;
    const dateRemain = Date.now() - date;
    if (dateRemain < time) {
      await bot.sendMessage(
        id,
        "The move is being recharged" + (time - dateRemain)
      );
      return;
    }
    chats[id].date = Date.now();
    cb.drawPixel(chats[id].color, x, y, sizeDefault);
  },
  "/myinfo": async (id) => {
    await bot.sendMessage(id, "current colour");
    await bot.sendMessage(id, chats[id].color);
    await bot.sendMessage(id, "List of colours");
    await bot.sendMessage(
      id,
      chats[id].colorList.map((el) => String(el) + "\n").join("")
    );
  },
  "/colorpick": async (id, color) => {
    try {
      chats[id].color = String(new color(...color.split(",")));
    } catch (e) {
      return;
    }
  },
  "/mycolor": async (id) => {
    const path = `./image/${id}-color.png`;
    const cb2 = new canvasBattle(192, 192, path);
    cb2.drawPixel(chats[id].color, 0, 0, 192);
    cb2.writeImage();
    await bot.sendMessage(id, "current colour");
    await bot.sendMessage(id, chats[id].color);
    await bot.sendPhoto(id, cb2.path);
  },
  "/mycolorlist": async (id) => {
    const colorList = chats[id].colorList.map((el, index) => {
      return [
        {
          text: `цвет №${index + 1} ${String(el)}`,
          callback_data: String(el),
        },
      ];
    });
    const colorOptions = {
      reply_markup: JSON.stringify({
        inline_keyboard: [...colorList],
      }),
    };
    await bot.sendMessage(id, "My list of colours", colorOptions);
  },
  "/setcolorlist": async (id, ...arg) => {
    let colorList = [];
    for (let i = 0; i < 3; i++) {
      if (arg[i] === undefined) {
        colorList.push(new color());
        continue;
      }
      colorList.push(new color(...arg[i].split(",")));
    }
    chats[id].colorList = colorList;
    commands["/myinfo"](id);
  },
  "/colorlist": async (id) => {
    await bot.sendMessage(id, "List of colours", colorOptions);
  },
  "/view": async (id) => {
    cb.writeImage();
    await bot.sendPhoto(id, cb.path);
  },
  "/help": async (id) => {
    const list = Object.keys(commands)
      .map((el) => el + "\n")
      .join("");
    await bot.sendMessage(id, list);
  },
  "/start": async (id) => {
    await bot.sendMessage(id, "Hi");
    commands["/help"](id);
  },
};

const start = () => {
  bot.on("message", async (msg) => {
    const { text } = msg;
    const { id } = msg.from;
    const [command, ...arg] = text.split(" ");
    if (chats[id] === undefined) {
      chats[id] = new user();
    }
    if (Object.keys(commands).includes(command)) {
      commands[command](id, ...arg);
    }
  });
  bot.on("callback_query", async (msg) => {
    const { id } = msg.from;
    const { data } = msg;
    if (chats[id] === undefined) {
      chats[id] = new user();
    }
    chats[id].color = data;
    commands["/mycolor"](id);
  });
};

start();
