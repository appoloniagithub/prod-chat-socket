const express = require("express");
const Server = require("socket.io");
const https = require('https')
const fs = require("fs");
const PORT = process.env.PORT || 8082;
const INDEX = "./index.html";
const cors = require("cors");
var app = express().use((req, res) => res.sendFile(INDEX, { root: __dirname }));


// app.use(
//   cors({
//     origin: ["https://webuat.appoloniaapp.com:7054", "https://chat.appoloniaapp.com:7052"],
//     credentials: true,
//   })
// );

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

  // Certificate
const privateKey = fs.readFileSync('certs/server.key');
const certificate = fs.readFileSync('certs/certificate.crt');
const ca = fs.readFileSync('certs/intermediate.crt');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};
const httpsServer = https.createServer(credentials, app);




// app.get("/chat", function (req, res) {
//   res.render("index.ejs");
// });

// const PORT = process.env.PORT || 7052;
// //const INDEX = "./index.html";

// const server = express()
//   //.use((req, res) => res.sendFile(INDEX, { root: __dirname }))
//   .listen(PORT, () => console.log(`Listening on ${PORT}`));
// const io = new socketIO(httpsServer, {
//   cors: {
//     //origin: "https://appolonia-admin-uat.vercel.app/",
//     //origin: "http://localhost:3000",
//    //origin: "*",
//   origin: "https://webuat.appoloniaapp.com:7054",
//   },
// });

const io = Server(httpsServer, {
  cors: {
    origin: 'https://webuat.appoloniaapp.com:7054',
    methods:['GET','POST']
  }
})


// const { ExpressPeerServer } = require("peer");
// const opinions = {
//   debug: true,
// };

// app.use("/peerjs", ExpressPeerServer(server, opinions));
// app.use(express.static("public"));

// app.get("/", (req, res) => {
//   res.redirect(`/${uuidv4()}`);
// });

// app.get("/:room", (req, res) => {
//   res.render("room", { roomId: req.params.room });
// });
//const httpsServer = https.createServer(credentials, app);

let activeUsers = [];

io.on("connection", (socket) => {
  console.log("Server-Client Connected!");
  // add new User
  socket.on("new-user-add", (newUserId) => {
    // if user is not added previously
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({ userId: newUserId, socketId: socket.id });
      console.log("New User Connected", activeUsers);
    }
    // send all active users to new user
    io.emit("get-users", activeUsers);
  });

  socket.on("disconnect", () => {
    // remove user from active users
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    console.log("User Disconnected", activeUsers);
    // send all active users to all users
    io.emit("get-users", activeUsers);
  });

  // send message to a specific user
  socket.on("send-message", (data) => {
    const { senderId, receiverId,recId, message, conversationId, format, scanId } =
      data;
    const user = activeUsers.find((user) => user.userId === receiverId);
    console.log("Sending from socket to :", receiverId);
    console.log("Data in send message: ", data);
    console.log("active users", activeUsers);
    console.log("user", user);
    if (user) {
      io.to(user.socketId).emit("receive-message", data);
      console.log(data, "in receive message");
    }
  });

  // socket.on("join-room", (roomId, userId, userName) => {
  //   socket.join(roomId);
  //   setTimeout(() => {
  //     socket.to(roomId).broadcast.emit("user-connected", userId);
  //   }, 1000);
  //   socket.on("message", (message) => {
  //     io.to(roomId).emit("createMessage", message, userName);
  //   });
  // });
 
 
     

 

  
});

//server.listen(process.env.PORT || 7052);

httpsServer.listen(7052, () => {
	console.log('HTTPS Server running on port 7052');
});
//io.listen(7070)
