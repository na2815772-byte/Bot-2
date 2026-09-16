/* =========================================================
NELOY AI VOICE ASSISTANT
No API
No Gemini
No Node.js
No Terminal
Local predefined Q&A system
========================================================= */

const FALLBACK_ANSWER =
"Sorry, this question is not in my system.";

const DEFAULT_LANGUAGE = "en-US";
const BANGLA_LANGUAGE = "bn-BD";

const SPEECH_RATE = 1.2;

let questionDatabase = [];

let mediaRecorder = null;
let recordedChunks = [];
let recordedBlob = null;

let recognition = null;
let isRecording = false;

let recognizedText = "";

let answerLanguage =
localStorage.getItem("answerLanguage") || "english";

/* =========================================================
VOICE GENDER SELECTION
NEW LOGIC ONLY
========================================================= */

let selectedVoiceGender =
localStorage.getItem("neloy_voice_gender") || "female";


/* =========================================================
PARTICLES
========================================================= */

function createParticles() {

const container =
    document.getElementById("particles");

if (!container) return;

container.innerHTML = "";

for (let i = 0; i < 45; i++) {

    const particle =
        document.createElement("div");

    particle.className = "particle";

    particle.style.left =
        Math.random() * 100 + "%";

    particle.style.animationDuration =
        (5 + Math.random() * 12) + "s";

    particle.style.animationDelay =
        Math.random() * 10 + "s";

    particle.style.opacity =
        0.2 + Math.random() * 0.7;

    const size =
        2 + Math.random() * 3;

    particle.style.width =
        size + "px";

    particle.style.height =
        size + "px";

    container.appendChild(particle);
}

}


/* =========================================================
VOICE SELECTION LOGIC
NEW
========================================================= */

function getVoiceForGender() {

if (!("speechSynthesis" in window)) {
    return null;
}

const voices =
    window.speechSynthesis.getVoices();

if (!voices.length) {
    return null;
}

/*
   Current language
*/

const currentLanguage =
    answerLanguage === "bangla"
        ? BANGLA_LANGUAGE
        : DEFAULT_LANGUAGE;

const languagePrefix =
    currentLanguage
        .split("-")[0]
        .toLowerCase();

/*
   First find voices matching
   current language.
*/

let languageVoices =
    voices.filter(
        voice =>
            voice.lang &&
            voice.lang
                .toLowerCase()
                .startsWith(languagePrefix)
    );

/*
   If current language voice is not
   available, use English voices.
*/

if (!languageVoices.length) {

    languageVoices =
        voices.filter(
            voice =>
                voice.lang &&
                voice.lang
                    .toLowerCase()
                    .startsWith("en")
        );
}

/*
   Final fallback.
*/

if (!languageVoices.length) {
    languageVoices = voices;
}


/*
   Female voice name keywords.
*/

const femaleKeywords = [

    "female",
    "woman",
    "girl",

    "samantha",
    "karen",
    "zira",
    "susan",
    "victoria",

    "ava",
    "allison",
    "aria",
    "jenny",
    "sara",

    "moira",
    "fiona",
    "hazel",

    "siri"

];


/*
   Male voice name keywords.
*/

const maleKeywords = [

    "male",
    "man",
    "boy",

    "david",
    "mark",
    "daniel",
    "alex",
    "fred",
    "george",

    "james",
    "guy",
    "brian",
    "michael",
    "arthur",

    "thomas",
    "richard"

];


/*
   Select keywords according
   to selected gender.
*/

const keywords =
    selectedVoiceGender === "female"
        ? femaleKeywords
        : maleKeywords;


/*
   Find matching voice.
*/

const genderVoice =
    languageVoices.find(
        voice => {

            const voiceName =
                voice.name
                    .toLowerCase();

            return keywords.some(
                keyword =>
                    voiceName.includes(
                        keyword
                    )
            );
        }
    );


if (genderVoice) {

    return genderVoice;

}


/*
   If browser does not expose gender
   information/name, use available
   voice as fallback.
*/

return languageVoices[0] || null;

}


/* =========================================================
SET VOICE GENDER
NEW
========================================================= */

function setVoiceGender(gender) {

if (
    gender !== "female" &&
    gender !== "male"
) {
    return;
}

selectedVoiceGender =
    gender;

localStorage.setItem(
    "neloy_voice_gender",
    gender
);


/*
   Make sure browser loads
   available voices.
*/

if (
    "speechSynthesis" in window
) {

    window.speechSynthesis
        .getVoices();

}


/*
   Confirmation voice.
*/

const message =
    gender === "female"
        ? "Female voice selected."
        : "Male voice selected.";

speak(message);

}


/* =========================================================
VOICE GENDER SETUP
NEW
========================================================= */

function setupVoiceGender() {

const female =
    document.getElementById(
        "femaleVoice"
    );

const male =
    document.getElementById(
        "maleVoice"
    );


/*
   If the controls are not present,
   do nothing.
*/

if (!female && !male) {
    return;
}


/*
   Restore previous selection.
*/

if (
    selectedVoiceGender === "female"
) {

    if (female) {
        female.checked = true;
    }

    if (male) {
        male.checked = false;
    }

} else {

    if (female) {
        female.checked = false;
    }

    if (male) {
        male.checked = true;
    }

}


/*
   Female click.
*/

if (female) {

    female.addEventListener(
        "change",
        () => {

            if (female.checked) {

                if (male) {
                    male.checked = false;
                }

                setVoiceGender(
                    "female"
                );

            }

        }
    );

}


/*
   Male click.
*/

if (male) {

    male.addEventListener(
        "change",
        () => {

            if (male.checked) {

                if (female) {
                    female.checked = false;
                }

                setVoiceGender(
                    "male"
                );

            }

        }
    );

}

}


/* =========================================================
SPEAK
========================================================= */

function speak(text) {

if (!("speechSynthesis" in window)) {
    return;
}

window.speechSynthesis.cancel();

const utterance =
    new SpeechSynthesisUtterance(text);

utterance.lang =
    answerLanguage === "bangla"
        ? BANGLA_LANGUAGE
        : DEFAULT_LANGUAGE;


/*
   NEW:
   Select Female / Male voice.
*/

const selectedVoice =
    getVoiceForGender();

if (selectedVoice) {

    utterance.voice =
        selectedVoice;

    console.log(
        "Speaking with voice:",
        selectedVoice.name,
        "| Gender:",
        selectedVoiceGender,
        "| Language:",
        utterance.lang
    );

}


utterance.rate =
    SPEECH_RATE;

utterance.pitch = 1;

utterance.volume = 1;

window.speechSynthesis.speak(
    utterance
);

}


/* =========================================================
SHOW MESSAGE
========================================================= */

function showMessage(
elementId,
message,
type = "success"
) {

const element =
    document.getElementById(elementId);

if (!element) return;

element.textContent =
    message;

element.className =
    `message-box show ${type}`;

}


/* =========================================================
HIDE MESSAGE
========================================================= */

function hideMessage(elementId) {

const element =
    document.getElementById(elementId);

if (!element) return;

element.className =
    "message-box";

}


/* =========================================================
MENU
========================================================= */

function setupMenu() {

const button =
    document.getElementById("menuButton");

const menu =
    document.getElementById("sideMenu");

if (!button || !menu) return;

button.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        button.classList.toggle("active");

        menu.classList.toggle("active");
    }
);

document.addEventListener(
    "click",
    event => {

        if (
            !menu.contains(event.target) &&
            !button.contains(event.target)
        ) {

            button.classList.remove("active");

            menu.classList.remove("active");
        }
    }
);

}


/* =========================================================
PLUS
========================================================= */

function setupPlus() {

const button =
    document.getElementById("plusButton");

if (!button) return;

button.addEventListener(
    "click",
    () => {

        const message =
            "Plus features are coming soon.";

        speak(message);

        alert(message);
    }
);

}


/* =========================================================
LOGOUT
========================================================= */

function logout() {

localStorage.removeItem(
    "neloy_logged_in"
);

localStorage.removeItem(
    "neloy_current_email"
);

localStorage.removeItem(
    "neloy_current_user"
);

/*
   Remove pending welcome message
   when user logs out.
*/

localStorage.removeItem(
    "neloy_home_welcome"
);

speak(
    "You have been logged out."
);

setTimeout(
    () => {
        window.location.href =
            "registration.html";
    },
    1000
);

}


function setupLogout() {

const button =
    document.getElementById("logoutButton");

const homeLogout =
    document.getElementById(
        "homeLogoutButton"
    );

if (button) {
    button.addEventListener(
        "click",
        logout
    );
}

if (homeLogout) {
    homeLogout.addEventListener(
        "click",
        logout
    );
}

}


/* =========================================================
HOME
========================================================= */

function setupHome() {

const button =
    document.getElementById(
        "createStart"
    );

/*
   =====================================================
   NEW:
   Welcome voice after successful login
   =====================================================
*/

const welcomeAfterLogin =
    localStorage.getItem(
        "neloy_home_welcome"
    );

if (
    welcomeAfterLogin === "true"
) {

    /*
       Remove the flag immediately
       so the welcome message plays
       only once.
    */

    localStorage.removeItem(
        "neloy_home_welcome"
    );

    const welcomeMessage =
        "Welcome to Neloy’s website. It’s a pleasure to have you here.";

    /*
       Small delay allows the Home page
       to finish loading before speech starts.
    */

    setTimeout(
        () => {

            /*
               Make sure the response
               is spoken in English.
            */

            answerLanguage =
                "english";

            localStorage.setItem(
                "answerLanguage",
                "english"
            );

            speak(
                welcomeMessage
            );

        },
        500
    );
}


if (!button) return;

button.addEventListener(
    "click",
    () => {

        const message =
            "Please complete your registration first, then come back and continue.";

        speak(message);

        setTimeout(
            () => {
                window.location.href =
                    "registration.html";
            },
            1800
        );
    }
);

}


/* =========================================================
LOAD QUESTIONS
========================================================= */

async function loadQuestions() {

try {

    const response =
        await fetch(
            "questions.json",
            {
                cache: "no-cache"
            }
        );

    if (!response.ok) {
        throw new Error(
            "Could not load questions.json"
        );
    }

    questionDatabase =
        await response.json();

    console.log(
        "Neloy AI database loaded:",
        questionDatabase
    );

    return true;

} catch (error) {

    console.error(
        "Database error:",
        error
    );

    questionDatabase = [];

    return false;
}

}


/* =========================================================
TEXT NORMALIZATION
========================================================= */

function normalizeText(text) {

return String(text || "")
    .toLowerCase()
    .normalize("NFKC")

    .replace(
        /[.,!?;:'"()[\]{}<>/\\|@#$%^&*_+=~`-]/g,
        " "
    )

    .replace(
        /\s+/g,
        " "
    )

    .trim();

}


/* =========================================================
WORDS
========================================================= */

function getWords(text) {

return normalizeText(text)
    .split(" ")
    .filter(
        word => word.length > 0
    );

}


/* =========================================================
QUESTION SCORE
========================================================= */

function calculateScore(
userQuestion,
databaseQuestion
) {

const input =
    normalizeText(userQuestion);

const question =
    normalizeText(databaseQuestion);

if (!input || !question) {
    return 0;
}

/* Exact */

if (input === question) {
    return 1;
}

/* Contains */

if (
    input.includes(question) ||
    question.includes(input)
) {
    return 0.94;
}

const inputWords =
    getWords(input);

const questionWords =
    getWords(question);

if (
    !inputWords.length ||
    !questionWords.length
) {
    return 0;
}

let matched = 0;

inputWords.forEach(
    word => {

        if (
            questionWords.includes(word)
        ) {
            matched++;
        }

    }
);

const union =
    new Set([
        ...inputWords,
        ...questionWords
    ]).size;

if (!union) {
    return 0;
}

return matched / union;

}


/* =========================================================
SEARCH DATABASE
========================================================= */

function findAnswer(
userQuestion
) {

let bestMatch = null;

let bestScore = 0;

for (
    const category
    of questionDatabase
) {

    if (
        !Array.isArray(
            category.entries
        )
    ) {
        continue;
    }

    for (
        const entry
        of category.entries
    ) {

        if (
            !Array.isArray(
                entry.questions
            )
        ) {
            continue;
        }

        for (
            const question
            of entry.questions
        ) {

            const score =
                calculateScore(
                    userQuestion,
                    question
                );

            if (
                score > bestScore
            ) {

                bestScore =
                    score;

                bestMatch = {
                    category:
                        category.category,

                    answers:
                        entry.answers || []
                };
            }
        }
    }
}

/*
   Threshold:
   Question must have a reasonable match.
*/

if (
    !bestMatch ||
    bestScore < 0.50
) {

    return {
        matched: false,

        answer:
            FALLBACK_ANSWER
    };
}

const answers =
    bestMatch.answers;

if (!answers.length) {

    return {
        matched: false,

        answer:
            FALLBACK_ANSWER
    };
}

const randomIndex =
    Math.floor(
        Math.random() *
        answers.length
    );

return {

    matched: true,

    category:
        bestMatch.category,

    score:
        bestScore,

    answer:
        answers[randomIndex]
};

}


/* =========================================================
TYPE ANSWER
========================================================= */

function typeAnswer(
element,
text
) {

element.textContent = "";

let index = 0;

const timer =
    setInterval(
        () => {

            element.textContent +=
                text.charAt(index);

            index++;

            if (
                index >=
                text.length
            ) {

                clearInterval(
                    timer
                );
            }

        },
        15
    );

}


/* =========================================================
ASK ASSISTANT
========================================================= */

async function askAssistant(
question
) {

const answerElement =
    document.getElementById(
        "aiAnswer"
    );

const loading =
    document.getElementById(
        "loading"
    );

const messageElement =
    document.getElementById(
        "assistantMessage"
    );

if (
    !question ||
    !question.trim()
) {

    const message =
        "Please say or type a question.";

    if (answerElement) {
        answerElement.textContent =
            message;
    }

    showMessage(
        "assistantMessage",
        message,
        "error"
    );

    speak(message);

    return;
}

if (
    questionDatabase.length === 0
) {

    await loadQuestions();
}

if (loading) {
    loading.classList.add(
        "show"
    );
}

if (messageElement) {
    hideMessage(
        "assistantMessage"
    );
}

if (answerElement) {
    answerElement.textContent =
        "Searching my system...";
}

/*
   Small visual delay
   for dynamic effect.
*/

await new Promise(
    resolve =>
        setTimeout(
            resolve,
            350
        )
);

const result =
    findAnswer(question);

if (answerElement) {

    typeAnswer(
        answerElement,
        result.answer
    );
}

if (loading) {
    loading.classList.remove(
        "show"
    );
}

/*
   Always speak the selected answer.
*/

speak(
    result.answer
);

console.log(
    "Question:",
    question
);

console.log(
    "Result:",
    result
);

}


/* =========================================================
REGISTRATION
========================================================= */

function isValidPassword(
password
) {

return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
);

}


function getUsers() {

try {

    return JSON.parse(
        localStorage.getItem(
            "neloy_users"
        )
    ) || [];

} catch {

    return [];
}

}


function saveUsers(users) {

localStorage.setItem(
    "neloy_users",
    JSON.stringify(users)
);

}


function setupRegistration() {

const form =
    document.getElementById(
        "registrationForm"
    );

if (!form) return;

form.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const firstName =
            document
                .getElementById(
                    "firstName"
                )
                .value
                .trim();

        const lastName =
            document
                .getElementById(
                    "lastName"
                )
                .value
                .trim();

        const email =
            document
                .getElementById(
                    "registerEmail"
                )
                .value
                .trim()
                .toLowerCase();

        const password =
            document
                .getElementById(
                    "registerPassword"
                )
                .value;

        const confirmPassword =
            document
                .getElementById(
                    "confirmPassword"
                )
                .value;

        /* Password */

        if (
            !isValidPassword(
                password
            )
        ) {

            const message =
                "Password must contain at least 8 characters, including uppercase, lowercase, a number, and a special character.";

            showMessage(
                "registerStatus",
                message,
                "error"
            );

            speak(message);

            return;
        }

        /* Confirm */

        if (
            password !==
            confirmPassword
        ) {

            const message =
                "Your passwords do not match.";

            showMessage(
                "registerStatus",
                message,
                "error"
            );

            speak(message);

            return;
        }

        let users =
            getUsers();

        /* Duplicate email */

        const exists =
            users.some(
                user =>
                    user.email ===
                    email
            );

        if (exists) {

            const message =
                "Sorry, this email is already registered.";

            showMessage(
                "registerStatus",
                message,
                "error"
            );

            speak(message);

            return;
        }

        /* Save */

        users.push({

            firstName:
                firstName,

            lastName:
                lastName,

            email:
                email,

            password:
                password,

            createdAt:
                new Date().toISOString()

        });

        saveUsers(users);

        const success =
            "Your registration was successful.";

        showMessage(
            "registerStatus",
            success,
            "success"
        );

        speak(success);

        setTimeout(
            () => {

                window.location.href =
                    "login.html";

            },
            1800
        );
    }
);

}


/* =========================================================
LOGIN
========================================================= */

function setupLogin() {

const form =
    document.getElementById(
        "loginForm"
    );

if (!form) return;

form.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const email =
            document
                .getElementById(
                    "loginEmail"
                )
                .value
                .trim()
                .toLowerCase();

        const password =
            document
                .getElementById(
                    "loginPassword"
                )
                .value;

        const users =
            getUsers();

        const user =
            users.find(
                item =>
                    item.email ===
                        email &&
                    item.password ===
                        password
            );

        if (!user) {

            const message =
                "Sorry, your email or password is incorrect.";

            showMessage(
                "loginStatus",
                message,
                "error"
            );

            speak(message);

            return;
        }

        localStorage.setItem(
            "neloy_logged_in",
            "true"
        );

        localStorage.setItem(
            "neloy_current_email",
            user.email
        );

        localStorage.setItem(
            "neloy_current_user",
            JSON.stringify(
                user
            )
        );

        /*
           =================================================
           NEW:
           Tell the Home page to play the welcome voice.
           =================================================
        */

        localStorage.setItem(
            "neloy_home_welcome",
            "true"
        );

        const message =
            "Your login was successful.";

        showMessage(
            "loginStatus",
            message,
            "success"
        );

        speak(message);

        setTimeout(
            () => {

                /*
                   Changed only the destination:
                   Login successful → Record page
                */

                window.location.href =
                    "record.html";

            },
            1500
        );
    }
);

}


/* =========================================================
CHECK LOGIN
========================================================= */

function checkLogin() {

const page =
    document.body.dataset.page;

if (
    page !== "record"
) {
    return;
}

const loggedIn =
    localStorage.getItem(
        "neloy_logged_in"
    );

if (
    loggedIn !== "true"
) {

    window.location.href =
        "login.html";
}

}


/* =========================================================
SPEECH RECOGNITION
========================================================= */

function createSpeechRecognition() {

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (!SpeechRecognition) {

    console.warn(
        "Speech Recognition is not supported."
    );

    return null;
}

const recognizer =
    new SpeechRecognition();

recognizer.continuous = true;

recognizer.interimResults = true;

/*
   Default recognition language.
   User can speak English.
*/

recognizer.lang =
    DEFAULT_LANGUAGE;

recognizer.onresult =
    event => {

        let interim = "";

        let finalText = "";

        for (
            let i =
                event.resultIndex;

            i <
                event.results.length;

            i++
        ) {

            const transcript =
                event.results[i][0]
                    .transcript;

            if (
                event.results[i]
                    .isFinal
            ) {

                finalText +=
                    transcript;

            } else {

                interim +=
                    transcript;
            }
        }

        if (
            finalText.trim()
        ) {

            recognizedText +=
                " " +
                finalText;
        }

        const transcriptElement =
            document.getElementById(
                "liveTranscript"
            );

        if (transcriptElement) {

            transcriptElement.textContent =
                (
                    recognizedText +
                    " " +
                    interim
                ).trim() ||
                "Listening...";
        }
    };

recognizer.onerror =
    event => {

        console.log(
            "Recognition:",
            event.error
        );
    };

recognizer.onend =
    () => {

        if (
            isRecording
        ) {

            try {
                recognizer.start();
            } catch {}
        }
    };

return recognizer;

}


/* =========================================================
START RECORD
========================================================= */

async function startRecording() {

if (isRecording) {
    return;
}

try {

    const stream =
        await navigator
            .mediaDevices
            .getUserMedia({
                audio: true
            });

    recordedChunks = [];

    recordedBlob = null;

    recognizedText = "";

    mediaRecorder =
        new MediaRecorder(
            stream
        );

    mediaRecorder.ondataavailable =
        event => {

            if (
                event.data.size > 0
            ) {

                recordedChunks.push(
                    event.data
                );
            }
        };

    mediaRecorder.onstop =
        () => {

            recordedBlob =
                new Blob(
                    recordedChunks,
                    {
                        type:
                            "audio/webm"
                    }
                );

            const audioURL =
                URL.createObjectURL(
                    recordedBlob
                );

            const audio =
                document.getElementById(
                    "audioPlayer"
                );

            const section =
                document.getElementById(
                    "audioSection"
                );

            if (audio) {

                audio.src =
                    audioURL;
            }

            if (section) {

                section.classList.add(
                    "show"
                );
            }

            stream
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );
        };

    mediaRecorder.start();

    isRecording = true;

    const orb =
        document.getElementById(
            "voiceOrb"
        );

    const status =
        document.getElementById(
            "recordingStatus"
        );

    if (orb) {

        orb.classList.add(
            "recording"
        );
    }

    if (status) {

        status.textContent =
            "● Recording...";
    }

    /*
       Start speech recognition.
    */

    if (!recognition) {

        recognition =
            createSpeechRecognition();
    }

    if (recognition) {

        try {

            recognition.start();

        } catch {}
    }

    const transcript =
        document.getElementById(
            "liveTranscript"
        );

    if (transcript) {

        transcript.textContent =
            "Listening...";
    }

} catch (error) {

    console.error(error);

    const message =
        "Microphone permission is required.";

    showMessage(
        "assistantMessage",
        message,
        "error"
    );

    speak(message);
}

}


/* =========================================================
STOP RECORD
========================================================= */

function stopRecording() {

if (!isRecording) {
    return;
}

isRecording = false;

if (
    mediaRecorder &&
    mediaRecorder.state !==
        "inactive"
) {

    mediaRecorder.stop();
}

if (recognition) {

    try {
        recognition.stop();
    } catch {}
}

const orb =
    document.getElementById(
        "voiceOrb"
    );

const status =
    document.getElementById(
        "recordingStatus"
    );

if (orb) {

    orb.classList.remove(
        "recording"
    );
}

if (status) {

    status.textContent =
        "Recording stopped.";
}

const transcript =
    document.getElementById(
        "liveTranscript"
    );

if (transcript) {

    if (
        recognizedText.trim()
    ) {

        transcript.textContent =
            recognizedText.trim();

    } else {

        transcript.textContent =
            "No speech was recognized.";
    }
}

}


/* =========================================================
RECORD BUTTON SETUP
========================================================= */

function setupRecorder() {

const start =
    document.getElementById(
        "startRecord"
    );

const stop =
    document.getElementById(
        "stopRecord"
    );

const submit =
    document.getElementById(
        "submitRecord"
    );

if (start) {

    start.addEventListener(
        "click",
        startRecording
    );
}

if (stop) {

    stop.addEventListener(
        "click",
        stopRecording
    );
}

if (submit) {

    submit.addEventListener(
        "click",
        () => {

            if (
                !recognizedText.trim()
            ) {

                const message =
                    "I could not understand your recording.";

                showMessage(
                    "assistantMessage",
                    message,
                    "error"
                );

                speak(message);

                return;
            }

            askAssistant(
                recognizedText.trim()
            );
        }
    );
}

}


/* =========================================================
TEXT SUBMIT
========================================================= */

function setupTextInput() {

const button =
    document.getElementById(
        "submitText"
    );

const textarea =
    document.getElementById(
        "textQuestion"
    );

if (!button || !textarea) {
    return;
}

button.addEventListener(
    "click",
    () => {

        askAssistant(
            textarea.value
        );
    }
);

textarea.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            askAssistant(
                textarea.value
            );
        }
    }
);

}


/* =========================================================
LANGUAGE COMMAND
========================================================= */

function detectLanguageCommand(
text
) {

const normalized =
    normalizeText(text);

const banglaCommands = [

    "বাংলায় বলো",
    "বাংলাতে বলো",
    "বাংলা ভাষায় বলো",
    "বাংলায় কথা বলো",
    "বাংলাতে কথা বলো"

];

const englishCommands = [

    "speak in english",
    "speak english",
    "answer in english",
    "talk in english",
    "english please"

];

for (
    const command
    of banglaCommands
) {

    if (
        normalized.includes(
            normalizeText(command)
        )
    ) {

        return "bangla";
    }
}

for (
    const command
    of englishCommands
) {

    if (
        normalized.includes(
            normalizeText(command)
        )
    ) {

        return "english";
    }
}

return null;

}


/* =========================================================
COMMAND-AWARE ASSISTANT
========================================================= */

async function processAssistantQuestion(
question
) {

const language =
    detectLanguageCommand(
        question
    );

if (language) {

    answerLanguage =
        language;

    localStorage.setItem(
        "answerLanguage",
        language
    );

    const message =
        language === "bangla"
            ? "Okay, I will speak in Bangla."
            : "Okay, I will speak in English.";

    const answer =
        document.getElementById(
            "aiAnswer"
        );

    if (answer) {

        answer.textContent =
            message;
    }

    speak(message);

    return;
}

await askAssistant(
    question
);

}


/* =========================================================
OVERRIDE TEXT SUBMIT FOR LANGUAGE COMMAND
========================================================= */

function setupAdvancedTextInput() {

const button =
    document.getElementById(
        "submitText"
    );

const textarea =
    document.getElementById(
        "textQuestion"
    );

if (!button || !textarea) {
    return;
}

/*
   Remove previous listener by cloning.
*/

const newButton =
    button.cloneNode(true);

button.parentNode.replaceChild(
    newButton,
    button
);

newButton.addEventListener(
    "click",
    () => {

        processAssistantQuestion(
            textarea.value
        );
    }
);

textarea.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            processAssistantQuestion(
                textarea.value
            );
        }
    }
);

}


/* =========================================================
INITIALIZE
========================================================= */

document.addEventListener(
"DOMContentLoaded",
async () => {

    createParticles();

    setupMenu();

    setupPlus();

    setupLogout();

    setupHome();

    setupRegistration();

    setupLogin();

    setupRecorder();

    setupTextInput();

    setupAdvancedTextInput();

    /*
       NEW:
       Setup Female / Male voice buttons.
    */

    setupVoiceGender();

    checkLogin();

    /*
       Load predefined Q&A.
    */

    await loadQuestions();

}

);
