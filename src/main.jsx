import { auth, provider, firestore } from './config';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { query, addDoc, collection, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore'

let buttonsDiv = document.getElementById('buttons');
let profileImageWrapper = document.getElementById('profileImageWrapper');
let profileImage = document.getElementById('profileImage');
let logoutBtn = document.getElementById('logoutBtn');
let loginBtn = document.getElementById('loginBtn');
let profileDropdown = document.getElementById('profileDropdown');
let messageInput = document.getElementById('message-input');
let sendMessageBtn = document.getElementById('send-button');
let messagesContainer = document.getElementById('messagesContainer');

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    const userRef = {
      name: user.displayName,
      image: user.photoURL
    };

    currentUser = user;

    profileImage.src = userRef.image;

    buttonsDiv.style.display = 'none';
    messageInput.removeAttribute('disabled');
    sendMessageBtn.removeAttribute('disabled');
  } else {
    currentUser = null;
    buttonsDiv.style.display = 'flex';
    profileImage.src = "";
    messageInput.setAttribute('disabled', 'disabled');
    sendMessageBtn.setAttribute('disabled', 'disabled');
  }
});

profileImageWrapper.addEventListener('click', () => {
  profileDropdown.classList.toggle('is-active');
});

logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    profileDropdown.classList.remove('is-active');
    buttonsDiv.style.display = 'flex';

    profileImage.src = "";
  }).catch((error) => {
    console.error('Error signing out:', error.message);
  });
});

loginBtn.addEventListener('click', () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;

      const userRef = {
        name: user.displayName,
        image: user.photoURL
      }

      console.log(userRef);
    })
    .catch((err) => {
      console.log(err.message);
    });
});

sendMessageBtn.addEventListener('click', async () => {
  const messageText = messageInput.value.trim();

  if (messageText !== '' && currentUser) {
    try {
      // Add the message to Firestore
      const docRef = await addDoc(collection(firestore, 'messages'), {
        text: messageText,
        userId: currentUser.uid,
        name: currentUser.displayName,
        timestamp: serverTimestamp(),
      });

      console.log('Message written with ID: ', docRef.id);

      // Clear the message input
      messageInput.value = '';
    } catch (error) {
      console.error('Error adding message: ', error.message);
    }
  }
});

const messagesCollection = collection(firestore, 'messages');
const messagesQuery = query(messagesCollection, orderBy('timestamp'));

onSnapshot(messagesQuery, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    const messageData = change.doc.data();
    if (change.type === 'added') {
      renderMessage(messageData);
    }
  });
});

function renderMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.textContent = `${message.name}: ${message.text}`;
  messagesContainer.appendChild(messageElement);
}