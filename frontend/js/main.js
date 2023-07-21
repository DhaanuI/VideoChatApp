const chatForm = document.getElementById("chat-form")
const chatMessages = document.querySelector(".chat-messages")
const roomName = document.getElementById("room-name")
const userList = document.getElementById("users")

const urlParams = new URLSearchParams(window.location.search)

const username = urlParams.get("username")
const room = urlParams.get("room")

console.log(username, room)

const socket = io("http://localhost:8080/", { transports: ["websocket"] });

socket.emit("joinRoom", { username, room });

socket.on("message", (message) => {
    outputMessage(message)

    chatMessages.scrollTop = chatMessages.scrollHeight;
})

socket.on("roomUsers", ({ room, users }) => {
    outputRoomName(room)
    outputRoomUsers(users)
})

// get message and send

chatForm.addEventListener("submit", (e) => {
    e.preventDefault()

    let msg = e.target.elements.msg.value;

    msg = msg.trim()

    if (!msg) {
        return false;
    }

    socket.emit("chatMessage", msg);

    e.target.elements.msg.value = "";
    e.target.elements.msg.focus();
})


// outPut message 
function outputMessage(message) {
    const div = document.createElement("div");
    div.classList.add("message");

    const p = document.createElement("p");
    p.classList.add("meta");

    p.innerText = message.username;

    p.innerHTML += `<span> ${message.time}</span>`;

    div.appendChild(p);

    const para = document.createElement("p");

    para.classList.add("text");
    para.innerText = message.text;

    div.appendChild(para);

    chatMessages.appendChild(div);
}


function outputRoomName(room) {
    roomName.innerText = room
}

function outputRoomUsers(users) {
    userList.innerHTML = ''
    users.forEach(user => {
        const li = document.createElement("li")
        li.innerText = user.username;
        userList.appendChild(li);
    });
}


document.getElementById("leave-btn").addEventListener("click", (e) => {
    const leaveRoom = confirm("Are you sure you want to leave the chatRoom?");

    if (leaveRoom) {
        window.location.href = "../index.html";
    }

})



/// Video

    const videoGrid = document.getElementById('video-grid')

    const myPeer = new Peer();

    const myVideo = document.createElement('video')
    myVideo.muted = true   // mute our own audio so that we wont be listening to our own speech

    const peers = {}




    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    }).then(stream => {
        addVideoStream(myVideo, stream)   // render video

        // listens or receives other user video to render on our screen
        myPeer.on('call', call => {
            call.answer(stream)                             // it is like answering video call
            const video = document.createElement('video')
            call.on('stream', userVideoStream => {
                addVideoStream(video, userVideoStream)      // and send back video to them
            })
        })

        // sends video to other user
        socket.on('user-connected', userId => {
            connectToNewUser(userId, stream)
        })

        const toggleVideoButton = document.getElementById('toggle-video-button');
        toggleVideoButton.addEventListener('click', toggleVideoStream);

        function toggleVideoStream() {
            const videoTrack = stream.getVideoTracks()[0];

            if (videoTrack.enabled) {
                videoTrack.enabled = false;
                myVideo.srcObject.getVideoTracks()[0].enabled = false;
                toggleVideoButton.textContent = 'Start Video';
            } else {
                videoTrack.enabled = true;
                myVideo.srcObject.getVideoTracks()[0].enabled = true;
                toggleVideoButton.textContent = 'Stop Video';
            }
        }

        const toggleAudioButton = document.getElementById('toggle-audio-button');

        toggleAudioButton.addEventListener('click', toggleAudio);

        function toggleAudio() {
            const audioTrack = stream.getAudioTracks()[0];

            if (audioTrack.enabled) {
                audioTrack.enabled = false;
                toggleAudioButton.textContent = 'Unmute';
            } else {
                audioTrack.enabled = true;
                toggleAudioButton.textContent = 'Mute';
            }
        }
    }).catch((err) => {
        console.log(err);
    });


    socket.on('user-disconnected', userId => {
        if (peers[userId]) peers[userId].close()
    })

    // when user joins 
    myPeer.on('open', id => {
        socket.emit('join-room', room, id) // inturn calls user-connected
    })

    function connectToNewUser(userId, stream) {
        const call = myPeer.call(userId, stream)           // sends our video to others
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {            // they sends their video 
            addVideoStream(video, userVideoStream)        // inturn calls this function to render
        })
        call.on('close', () => {                         // when other left, video will be removed
            video.remove()
        })


        peers[userId] = call
    }

    function addVideoStream(video, stream) {
        video.srcObject = stream
        video.addEventListener('loadedmetadata', () => {
            video.play()
        })
        videoGrid.append(video)
    }

