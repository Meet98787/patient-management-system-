const socketio = require("socket.io");
const Message = require("../models/messageModel"); // Update with your file structure

let io;

module.exports = {
    init: (server) => {
        io = socketio(server, {
            cors: {
                origin: "https://patient-management-system-pink.vercel.app", // Change to match your frontend deployment URL
                methods: ["GET", "POST"],
                allowedHeaders: ["Authorization"],
                credentials: true,
            },
        });

        io.on("connection", (socket) => {
            console.log("A user connected:", socket.id);

            // Error handling for connection issues
            socket.on("connect_error", (err) => {
                console.error("Connection error:", err.message);
            });

            socket.on("joinTeleconsultation", ({ roomId, userId }) => {
                try {
                    socket.join(roomId);
                    console.log(`User ${userId} joined teleconsultation room ${roomId}`);

                    // Notify others in the room
                    socket.broadcast.to(roomId).emit("userJoined", { userId });
                } catch (err) {
                    console.error("Error joining teleconsultation room:", err);
                    socket.emit("error", { message: "Failed to join teleconsultation room" });
                }
            });

            socket.on("toggleAudio", ({ roomId, userId, isMuted }) => {
                try {
                    io.to(roomId).emit("audioToggled", { userId, isMuted });
                } catch (err) {
                    console.error("Error toggling audio:", err);
                    socket.emit("error", { message: "Failed to toggle audio" });
                }
            });

            socket.on("toggleVideo", ({ roomId, userId, isVideoOff }) => {
                try {
                    io.to(roomId).emit("videoToggled", { userId, isVideoOff });
                } catch (err) {
                    console.error("Error toggling video:", err);
                    socket.emit("error", { message: "Failed to toggle video" });
                }
            });

            socket.on("raiseHand", ({ roomId, userId }) => {
                try {
                    io.to(roomId).emit("handRaised", { userId });
                } catch (err) {
                    console.error("Error raising hand:", err);
                    socket.emit("error", { message: "Failed to raise hand" });
                }
            });

            socket.on("startScreenShare", ({ roomId, userId }) => {
                try {
                    io.to(roomId).emit("screenShareStarted", { userId });
                } catch (err) {
                    console.error("Error starting screen share:", err);
                    socket.emit("error", { message: "Failed to start screen sharing" });
                }
            });

            socket.on("stopScreenShare", ({ roomId, userId }) => {
                try {
                    io.to(roomId).emit("screenShareStopped", { userId });
                } catch (err) {
                    console.error("Error stopping screen share:", err);
                    socket.emit("error", { message: "Failed to stop screen sharing" });
                }
            });

            socket.on("sendFile", async (data) => {
                const { roomId, senderId, fileUrl, fileType } = data;

                try {
                    const newMessage = await Message.create({
                        chat: roomId,
                        sender: senderId,
                        fileUrl,
                        fileType,
                    });

                    io.to(roomId).emit("fileReceived", newMessage);
                } catch (error) {
                    console.error("Error sending file:", error);
                    socket.emit("error", { message: "Failed to send file" });
                }
            });

            socket.on("disconnect", (reason) => {
                console.log(`User disconnected: ${socket.id}, Reason: ${reason}`);
            });

            // Fallback for unhandled errors
            socket.on("error", (err) => {
                console.error("Unhandled socket error:", err.message);
                socket.emit("error", { message: "An unexpected error occurred" });
            });
        });
    },

    getIO: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    },
};
