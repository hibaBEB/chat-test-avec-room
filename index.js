// instanciation d'express
const express = require("express");
const app = express();

//  chargement de "path"
const path = require("path");

// autorisation du dossier "public"
app.use(express.static(path.join(__dirname, "public")));

// créa du serveur http
const http = require("http").createServer(app);

// instanciation de socket.io
const io = require("socket.io")(http);

//  sequelize
const Sequelize = require("sequelize");

// lien de la base de données
const dbPath = path.resolve(__dirname, "chat.sqlite");

// connexion à la bdd
const sequelize = new Sequelize("database", "username", "password", {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    
    // Sqlite seulement
    storage: dbPath
});

// chargement du modèle "Chat"
const Chat = require("./Models/Chat")(sequelize, Sequelize.DataTypes);
// On effectue le chargement "réèl"
Chat.sync();

// créa de la route /
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// évènement "connection" de socket.io
io.on("connection", (socket) => {
    console.log("Une connexion s'active");

    //  les déconnexions
    socket.on("disconnect", () => {
        console.log("Un utilisateur s'est déconnecté");
    });

    // On écoute les entrées dans les salles
    socket.on("enter_room", (room) => {
        // On entre dans la salle demandée
        socket.join(room);
        console.log(socket.rooms);

        // On envoie tous les messages de la salle
        Chat.findAll({
            attributes: ["id", "name", "message", "room", "createdAt"],
            where: {
                room: room
            }
        }).then(list => {
            socket.emit("init_messages", {messages: JSON.stringify(list)});
        });
    });

    // On écoute les sorties dans les salles
    socket.on("leave_room", (room) => {
        // On entre dans la salle demandée
        socket.leave(room);
        console.log(socket.rooms);
    });

    // On gère le chat
    socket.on("chat_message", (msg) => {
        // On stocke le message dans la base
        const message = Chat.create({
            name: msg.name,
            message: msg.message,
            room: msg.room,
            createdAt: msg.createdAt
        }).then(() => {
            // Le message est stocké, on le relaie à tous les utilisateurs dans le salon correspondant
            io.in(msg.room).emit("received_message", msg);
        }).catch(e => {
            console.log(e);
        });    
    });

    // On écoute les messages "typing"
    socket.on("typing", msg => {
        socket.to(msg.room).emit("usertyping", msg);
    })
});

// On va demander au serveur http de répondre sur le port 3000
http.listen(3000, () => {
    console.log("J'écoute le port 3000");
});