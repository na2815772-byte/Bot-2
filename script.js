/* =========================================================
   NELOY AI VOICE ASSISTANT
   Local Predefined Q&A System
   No API
   No Gemini
   No Node.js
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

let selectedVoiceGender =
    localStorage.getItem("neloy_voice_gender") || "female";

let selectedSpeechVoice = null;


/* =========================================================
   TEXT NORMALIZATION
   ========================================================= */

function normalizeText(text) {

    return String(text || "")
        .toLowerCase()
        .normalize("NFKC")
        .replace(/[.,!?;:'"()[\]{}<>/\\|@#$%^&*_+=~`-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


function getWords(text) {

    return normalizeText(text)
        .split(" ")
        .filter(word => word.length > 0);
}


/* =========================================================
   SCORE
   ========================================================= */

function calculateScore(userQuestion, databaseQuestion) {

    const input = normalizeText(userQuestion);
    const question = normalizeText(databaseQuestion);

    if (!input || !question) {
        return 0;
    }

    /* Exact match */
    if (input === question) {
        return 1;
    }

    /* One contains the other */
    if (
        input.includes(question) ||
        question.includes(input)
    ) {
        return 0.94;
    }

    const inputWords = getWords(input);
    const questionWords = getWords(question);

    if (!inputWords.length || !questionWords.length) {
        return 0;
    }

    let matched = 0;

    inputWords.forEach(word => {

        if (questionWords.includes(word)) {
            matched++;
        }

    });

    const union = new Set([
        ...inputWords,
        ...questionWords
    ]).size;

    if (!union) {
        return 0;
    }

    return matched / union;
}


/* =========================================================
   NORMALIZE JSON DATABASE
   Supports:
   
   1. Old questions.json structure:
      [
        {
          "category": "...",
          "entries": [
            {
              "questions": [],
              "answers": []
            }
          ]
        }
      ]

   2. New bot.json structure:
      {
        "questions": [
          {
            "category": "...",
            "question": "...",
            "answer": "..."
          }
        ]
      ]

   3. Direct array:
      [
        {
          "category": "...",
          "question": "...",
          "answer": "..."
        }
      ]
   ========================================================= */

function normalizeLoadedDatabase(data, fileName) {

    const normalized = [];

    /* -----------------------------------------------------
       CASE 1:
       Object containing "questions"
       
       This is the structure of bot.json
       ----------------------------------------------------- */

    if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        Array.isArray(data.questions)
    ) {

        for (const item of data.questions) {

            if (!item || typeof item !== "object") {
                continue;
            }

            /* New Bot.json format */

            if (
                typeof item.question === "string" &&
                item.question.trim() !== ""
            ) {

                let answers = [];

                if (Array.isArray(item.answers)) {

                    answers = item.answers
                        .filter(answer =>
                            typeof answer === "string" &&
                            answer.trim() !== ""
                        );

                }

                else if (
                    typeof item.answer === "string" &&
                    item.answer.trim() !== ""
                ) {

                    answers = [item.answer];

                }

                if (answers.length > 0) {

                    normalized.push({

                        category:
                            item.category ||
                            "general",

                        questions: [
                            item.question
                        ],

                        answers: answers

                    });

                }

                continue;
            }


            /* If an item itself contains questions[] */

            if (Array.isArray(item.questions)) {

                const answers = [];

                if (Array.isArray(item.answers)) {

                    answers.push(
                        ...item.answers.filter(answer =>
                            typeof answer === "string" &&
                            answer.trim() !== ""
                        )
                    );

                }

                else if (
                    typeof item.answer === "string" &&
                    item.answer.trim() !== ""
                ) {

                    answers.push(item.answer);

                }

                if (
                    item.questions.length > 0 &&
                    answers.length > 0
                ) {

                    normalized.push({

                        category:
                            item.category ||
                            "general",

                        questions:
                            item.questions.filter(question =>
                                typeof question === "string" &&
                                question.trim() !== ""
                            ),

                        answers: answers

                    });

                }

            }

        }

        return normalized;
    }


    /* -----------------------------------------------------
       CASE 2:
       Array
       ----------------------------------------------------- */

    if (Array.isArray(data)) {

        for (const item of data) {

            if (!item || typeof item !== "object") {
                continue;
            }


            /* ------------------------------------------------
               Old category -> entries structure
               ------------------------------------------------ */

            if (Array.isArray(item.entries)) {

                for (const entry of item.entries) {

                    if (!entry || typeof entry !== "object") {
                        continue;
                    }

                    const questions =
                        Array.isArray(entry.questions)
                            ? entry.questions.filter(question =>
                                typeof question === "string" &&
                                question.trim() !== ""
                            )
                            : [];

                    const answers =
                        Array.isArray(entry.answers)
                            ? entry.answers.filter(answer =>
                                typeof answer === "string" &&
                                answer.trim() !== ""
                            )
                            : [];

                    if (
                        questions.length > 0 &&
                        answers.length > 0
                    ) {

                        normalized.push({

                            category:
                                item.category ||
                                "general",

                            questions: questions,

                            answers: answers

                        });

                    }

                }

                continue;
            }


            /* ------------------------------------------------
               Direct question / answer structure
               ------------------------------------------------ */

            if (
                typeof item.question === "string" &&
                item.question.trim() !== ""
            ) {

                let answers = [];

                if (Array.isArray(item.answers)) {

                    answers = item.answers.filter(answer =>
                        typeof answer === "string" &&
                        answer.trim() !== ""
                    );

                }

                else if (
                    typeof item.answer === "string" &&
                    item.answer.trim() !== ""
                ) {

                    answers = [item.answer];

                }

                if (answers.length > 0) {

                    normalized.push({

                        category:
                            item.category ||
                            "general",

                        questions: [
                            item.question
                        ],

                        answers: answers

                    });

                }

            }

        }

    }


    console.log(
        `${fileName}: ${normalized.length} database entries normalized.`
    );

    return normalized;
}


/* =========================================================
   LOAD ALL JSON FILES
   ========================================================= */

async function loadQuestions() {

    const filesToLoad = [
        "questions.json",
        "bot.json",
        "Browser.json"
    ];

    questionDatabase = [];


    for (const file of filesToLoad) {

        try {

            const response =
                await fetch(file, {
                    cache: "no-cache"
                });


            if (!response.ok) {

                console.warn(
                    `${file} could not be loaded.`
                );

                continue;
            }


            const data =
                await response.json();


            const normalized =
                normalizeLoadedDatabase(
                    data,
                    file
                );


            questionDatabase.push(
                ...normalized
            );


            console.log(
                `Loaded ${file}:`,
                normalized.length,
                "entries"
            );

        }

        catch (error) {

            console.warn(
                `Could not load ${file}:`,
                error
            );

        }

    }


    console.log(
        "======================================"
    );

    console.log(
        "NELOY AI DATABASE LOADED"
    );

    console.log(
        "Total entries:",
        questionDatabase.length
    );

    console.log(
        questionDatabase
    );

    console.log(
        "======================================"
    );


    return questionDatabase.length > 0;
}


/* =========================================================
   URL BUILDER
   ========================================================= */

function checkURLBuilder(userQuestion) {

    if (
        typeof parseURLRequest === "function"
    ) {

        try {

            const urlParsed =
                parseURLRequest(userQuestion);


            if (
                urlParsed &&
                urlParsed.success
            ) {

                return {

                    matched: true,

                    category:
                        "URL Builder",

                    score: 1.0,

                    answer:
                        urlParsed.text,

                    html:
                        urlParsed.html,

                    url:
                        urlParsed.url

                };

            }

        }

        catch (error) {

            console.warn(
                "URLBuilder error:",
                error
            );

        }

    }

    return null;
}


/* =========================================================
   FIND ANSWER
   ========================================================= */

function findAnswer(userQuestion) {

    /* ---------------------------------------------
       First check URL Builder
       --------------------------------------------- */

    const urlResult =
        checkURLBuilder(userQuestion);

    if (urlResult) {
        return urlResult;
    }


    if (
        !userQuestion ||
        !String(userQuestion).trim()
    ) {

        return {

            matched: false,

            answer:
                FALLBACK_ANSWER

        };

    }


    let bestScore = 0;

    let bestMatches = [];


    /* ---------------------------------------------
       Search entire normalized database
       --------------------------------------------- */

    for (
        const entry of questionDatabase
    ) {

        if (
            !entry ||
            !Array.isArray(entry.questions) ||
            !Array.isArray(entry.answers)
        ) {

            continue;

        }


        for (
            const question of entry.questions
        ) {

            if (
                typeof question !== "string"
            ) {

                continue;

            }


            const score =
                calculateScore(
                    userQuestion,
                    question
                );


            /* Better match found */

            if (
                score > bestScore
            ) {

                bestScore = score;

                bestMatches = [
                    entry
                ];

            }


            /* Same score:
               keep multiple possible answers */

            else if (
                score === bestScore &&
                score > 0
            ) {

                bestMatches.push(
                    entry
                );

            }

        }

    }


    /* ---------------------------------------------
       Minimum matching threshold
       --------------------------------------------- */

    if (
        bestScore < 0.50 ||
        bestMatches.length === 0
    ) {

        return {

            matched: false,

            score: bestScore,

            answer:
                FALLBACK_ANSWER

        };

    }


    /* ---------------------------------------------
       Collect answers from best matches
       --------------------------------------------- */

    let possibleAnswers = [];

    let categories = [];


    for (
        const match of bestMatches
    ) {

        if (
            Array.isArray(match.answers)
        ) {

            possibleAnswers.push(
                ...match.answers
            );

        }


        if (
            match.category &&
            !categories.includes(match.category)
        ) {

            categories.push(
                match.category
            );

        }

    }


    /* Remove duplicate answers */

    possibleAnswers =
        [...new Set(
            possibleAnswers.filter(answer =>
                typeof answer === "string" &&
                answer.trim() !== ""
            )
        )];


    if (
        possibleAnswers.length === 0
    ) {

        return {

            matched: false,

            score: bestScore,

            answer:
                FALLBACK_ANSWER

        };

    }


    /* ---------------------------------------------
       Random answer
       --------------------------------------------- */

    const randomIndex =
        Math.floor(
            Math.random() *
            possibleAnswers.length
        );


    return {

        matched: true,

        category:
            categories.join(", "),

        score:
            bestScore,

        answer:
            possibleAnswers[randomIndex]

    };

}


/* =========================================================
   TYPE ANSWER
   ========================================================= */

function typeAnswer(
    element,
    text,
    html = null
) {

    if (!element) {
        return;
    }


    element.innerHTML = "";


    if (html !== null) {

        element.innerHTML = html;

        return;
    }


    let index = 0;


    const interval =
        setInterval(() => {

            if (
                index >= text.length
            ) {

                clearInterval(interval);

                return;
            }


            element.textContent +=
                text[index];

            index++;

        }, 15);

}


/* =========================================================
   ASK ASSISTANT
   ========================================================= */

async function askAssistant(question) {

    if (
        !question ||
        !question.trim()
    ) {

        return;

    }


    /* Database not loaded */

    if (
        questionDatabase.length === 0
    ) {

        await loadQuestions();

    }


    const result =
        findAnswer(question);


    console.log(
        "User:",
        question
    );

    console.log(
        "Result:",
        result
    );


    const answer =
        result.answer ||
        FALLBACK_ANSWER;


    /* ---------------------------------------------
       Find answer element
       --------------------------------------------- */

    const answerElement =
        document.getElementById("answer") ||
        document.getElementById("response") ||
        document.querySelector(
            ".answer"
        );


    if (answerElement) {

        if (result.html) {

            typeAnswer(
                answerElement,
                answer,
                result.html
            );

        }

        else {

            typeAnswer(
                answerElement,
                answer
            );

        }

    }


    /* ---------------------------------------------
       Speak answer
       --------------------------------------------- */

    speak(answer);


    return result;
}


/* =========================================================
   LANGUAGE COMMAND
   ========================================================= */

function detectLanguageCommand(text) {

    const normalized =
        normalizeText(text);


    const banglaCommands = [

        "বাংলায় বলো",
        "বাংলাতে বলো",
        "বাংলা ভাষায় বলো",
        "বাংলায় কথা বলো",
        "বাংলাতে কথা বলো",
        "বাংলায় উত্তর দাও",
        "বাংলাতে উত্তর দাও"

    ];


    for (
        const command of banglaCommands
    ) {

        if (
            normalized.includes(
                normalizeText(command)
            )
        ) {

            return "bangla";

        }

    }


    const englishCommands = [

        "speak in english",
        "speak english",
        "answer in english",
        "talk in english",
        "english please",
        "answer me in english"

    ];


    for (
        const command of englishCommands
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
   PROCESS QUESTION
   ========================================================= */

async function processAssistantQuestion(
    question
) {

    if (
        !question ||
        !question.trim()
    ) {

        return;

    }


    const language =
        detectLanguageCommand(
            question
        );


    /* ---------------------------------------------
       Change answer language
       --------------------------------------------- */

    if (language === "bangla") {

        answerLanguage = "bangla";

        localStorage.setItem(
            "answerLanguage",
            "bangla"
        );


        const message =
            "ঠিক আছে। এখন থেকে আমি বাংলায় উত্তর দেব।";


        const answerElement =
            document.getElementById("answer") ||
            document.getElementById("response") ||
            document.querySelector(".answer");


        if (answerElement) {

            typeAnswer(
                answerElement,
                message
            );

        }


        speak(message);

        return;
    }


    if (language === "english") {

        answerLanguage = "english";

        localStorage.setItem(
            "answerLanguage",
            "english"
        );


        const message =
            "Okay. I will answer in English from now on.";


        const answerElement =
            document.getElementById("answer") ||
            document.getElementById("response") ||
            document.querySelector(".answer");


        if (answerElement) {

            typeAnswer(
                answerElement,
                message
            );

        }


        speak(message);

        return;
    }


    /* ---------------------------------------------
       Normal question
       --------------------------------------------- */

    await askAssistant(
        question.trim()
    );

}


/* =========================================================
   SPEECH SYNTHESIS
   ========================================================= */

function getAvailableVoices() {

    if (
        !("speechSynthesis" in window)
    ) {

        return [];

    }


    return window.speechSynthesis
        .getVoices();

}


function getLanguageVoices(
    voices
) {

    let language =
        answerLanguage === "bangla"
            ? BANGLA_LANGUAGE
            : DEFAULT_LANGUAGE;


    let exact =
        voices.filter(
            voice =>
                voice.lang &&
                voice.lang.toLowerCase() ===
                language.toLowerCase()
        );


    if (exact.length > 0) {

        return exact;

    }


    const prefix =
        language
            .split("-")[0]
            .toLowerCase();


    let prefixVoices =
        voices.filter(
            voice =>
                voice.lang &&
                voice.lang
                    .toLowerCase()
                    .startsWith(prefix)
        );


    if (prefixVoices.length > 0) {

        return prefixVoices;

    }


    /* English fallback */

    return voices.filter(
        voice =>
            voice.lang &&
            voice.lang
                .toLowerCase()
                .startsWith("en")
    );

}


function detectVoiceGender(
    voice
) {

    const name =
        String(
            voice.name || ""
        ).toLowerCase();


    const femaleWords = [

        "female",
        "woman",
        "girl",
        "samantha",
        "victoria",
        "karen",
        "zira",
        "susan",
        "moira",
        "fiona",
        "ava",
        "aria"

    ];


    const maleWords = [

        "male",
        "man",
        "boy",
        "david",
        "mark",
        "daniel",
        "alex",
        "george",
        "fred"

    ];


    if (
        femaleWords.some(
            word =>
                name.includes(word)
        )
    ) {

        return "female";

    }


    if (
        maleWords.some(
            word =>
                name.includes(word)
        )
    ) {

        return "male";

    }


    return "unknown";
}


function getVoiceForGender(
    voices,
    gender
) {

    const languageVoices =
        getLanguageVoices(
            voices
        );


    const genderVoice =
        languageVoices.find(
            voice =>
                detectVoiceGender(
                    voice
                ) === gender
        );


    if (genderVoice) {

        return genderVoice;

    }


    return languageVoices[0] ||
        voices[0] ||
        null;
}


function refreshSpeechVoices() {

    const voices =
        getAvailableVoices();


    selectedSpeechVoice =
        getVoiceForGender(
            voices,
            selectedVoiceGender
        );


    console.log(
        "Selected speech voice:",
        selectedSpeechVoice
    );

}


function waitForSpeechVoices() {

    refreshSpeechVoices();


    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis
            .addEventListener(
                "voiceschanged",
                refreshSpeechVoices
            );

    }

}


/* =========================================================
   SET VOICE GENDER
   ========================================================= */

function setVoiceGender(
    gender
) {

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


    refreshSpeechVoices();

}


/* =========================================================
   SPEAK
   ========================================================= */

function speak(text) {

    if (
        !text ||
        !("speechSynthesis" in window)
    ) {

        return;

    }


    window.speechSynthesis.cancel();


    const cleanText =
        String(text)
            .replace(
                /<[^>]*>/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    if (!cleanText) {
        return;
    }


    const utterance =
        new SpeechSynthesisUtterance(
            cleanText
        );


    if (
        answerLanguage === "bangla"
    ) {

        utterance.lang =
            BANGLA_LANGUAGE;

    }

    else {

        utterance.lang =
            DEFAULT_LANGUAGE;

    }


    refreshSpeechVoices();


    if (
        selectedSpeechVoice
    ) {

        utterance.voice =
            selectedSpeechVoice;

    }


    utterance.rate =
        SPEECH_RATE;

    utterance.pitch = 1;

    utterance.volume = 1;


    window.speechSynthesis
        .speak(utterance);

}


/* =========================================================
   VOICE GENDER SETUP
   ========================================================= */

function setupVoiceGender() {

    const femaleButton =
        document.getElementById(
            "femaleVoice"
        );


    const maleButton =
        document.getElementById(
            "maleVoice"
        );


    if (femaleButton) {

        femaleButton.addEventListener(
            "click",
            () =>
                setVoiceGender("female")
        );

    }


    if (maleButton) {

        maleButton.addEventListener(
            "click",
            () =>
                setVoiceGender("male")
        );

    }

}


/* =========================================================
   MESSAGE HELPERS
   ========================================================= */

function showMessage(
    message
) {

    const element =
        document.getElementById(
            "message"
        );


    if (element) {

        element.textContent =
            message;

        element.style.display =
            "block";

    }

}


function hideMessage() {

    const element =
        document.getElementById(
            "message"
        );


    if (element) {

        element.style.display =
            "none";

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

    recognizer.lang =
        DEFAULT_LANGUAGE;


    recognizer.onresult =
        function(event) {

            let finalText = "";


            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                const transcript =
                    event.results[i][0]
                        .transcript;


                if (
                    event.results[i].isFinal
                ) {

                    finalText +=
                        transcript + " ";

                }

            }


            if (finalText.trim()) {

                recognizedText +=
                    finalText;

            }

        };


    recognizer.onerror =
        function(event) {

            console.warn(
                "Speech recognition error:",
                event.error
            );

        };


    recognizer.onend =
        function() {

            if (
                isRecording
            ) {

                try {

                    recognizer.start();

                }

                catch (error) {

                    console.warn(
                        "Could not restart recognition:",
                        error
                    );

                }

            }

        };


    return recognizer;
}


/* =========================================================
   START RECORDING
   ========================================================= */

async function startRecording() {

    try {

        recognizedText = "";

        recordedChunks = [];

        recordedBlob = null;


        const stream =
            await navigator.mediaDevices
                .getUserMedia({
                    audio: true
                });


        mediaRecorder =
            new MediaRecorder(
                stream
            );


        mediaRecorder.ondataavailable =
            function(event) {

                if (
                    event.data &&
                    event.data.size > 0
                ) {

                    recordedChunks.push(
                        event.data
                    );

                }

            };


        mediaRecorder.onstop =
            function() {

                recordedBlob =
                    new Blob(
                        recordedChunks,
                        {
                            type:
                                "audio/webm"
                        }
                    );


                stream
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );

            };


        mediaRecorder.start();

        isRecording = true;


        if (!recognition) {

            recognition =
                createSpeechRecognition();

        }


        if (recognition) {

            try {

                recognition.start();

            }

            catch (error) {

                console.warn(
                    "Recognition start error:",
                    error
                );

            }

        }


        console.log(
            "Recording started."
        );

    }

    catch (error) {

        console.error(
            "Microphone error:",
            error
        );


        showMessage(
            "Microphone access is required."
        );

    }

}


/* =========================================================
   STOP RECORDING
   ========================================================= */

function stopRecording() {

    isRecording = false;


    if (mediaRecorder) {

        try {

            mediaRecorder.stop();

        }

        catch (error) {

            console.warn(
                error
            );

        }

    }


    if (recognition) {

        try {

            recognition.stop();

        }

        catch (error) {

            console.warn(
                error
            );

        }

    }


    console.log(
        "Recording stopped."
    );

}


/* =========================================================
   RECORDER SETUP
   ========================================================= */

function setupRecorder() {

    const recordButton =
        document.getElementById(
            "recordButton"
        );


    const stopButton =
        document.getElementById(
            "stopButton"
        );


    const submitButton =
        document.getElementById(
            "submitButton"
        );


    if (recordButton) {

        recordButton.addEventListener(
            "click",
            startRecording
        );

    }


    if (stopButton) {

        stopButton.addEventListener(
            "click",
            stopRecording
        );

    }


    if (submitButton) {

        submitButton.addEventListener(
            "click",
            async function() {

                const question =
                    recognizedText.trim();


                if (!question) {

                    showMessage(
                        "I could not understand your question."
                    );

                    return;

                }


                await processAssistantQuestion(
                    question
                );

            }
        );

    }

}


/* =========================================================
   TEXT INPUT
   ========================================================= */

function setupTextInput() {

    const input =
        document.getElementById(
            "questionInput"
        );


    const button =
        document.getElementById(
            "askButton"
        );


    if (!input || !button) {
        return;
    }


    button.addEventListener(
        "click",
        async function() {

            const question =
                input.value.trim();


            if (!question) {
                return;
            }


            await processAssistantQuestion(
                question
            );


            input.value = "";

        }
    );


    input.addEventListener(
        "keydown",
        async function(event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                button.click();

            }

        }
    );

}


/* =========================================================
   ADVANCED TEXT INPUT
   ========================================================= */

function setupAdvancedTextInput() {

    const input =
        document.getElementById(
            "advancedQuestion"
        );


    const button =
        document.getElementById(
            "advancedAskButton"
        );


    if (!input || !button) {
        return;
    }


    button.addEventListener(
        "click",
        async function() {

            const question =
                input.value.trim();


            if (!question) {
                return;
            }


            await processAssistantQuestion(
                question
            );


            input.value = "";

        }
    );

}


/* =========================================================
   MENU
   ========================================================= */

function setupMenu() {

    const menuButton =
        document.getElementById(
            "menuButton"
        );


    const menu =
        document.getElementById(
            "menu"
        );


    if (
        menuButton &&
        menu
    ) {

        menuButton.addEventListener(
            "click",
            function() {

                menu.classList.toggle(
                    "active"
                );

            }
        );

    }

}


/* =========================================================
   PLUS BUTTON
   ========================================================= */

function setupPlus() {

    const plusButton =
        document.getElementById(
            "plusButton"
        );


    if (!plusButton) {
        return;
    }


    plusButton.addEventListener(
        "click",
        function() {

            console.log(
                "Plus button clicked."
            );

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

    window.location.href =
        "login.html";

}


function setupLogout() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }

}


/* =========================================================
   HOME
   ========================================================= */

function setupHome() {

    const homeButton =
        document.getElementById(
            "homeButton"
        );


    if (!homeButton) {
        return;
    }


    homeButton.addEventListener(
        "click",
        function() {

            window.location.href =
                "index.html";

        }
    );

}


/* =========================================================
   REGISTRATION
   ========================================================= */

function setupRegistration() {

    const form =
        document.getElementById(
            "registrationForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const name =
                document.getElementById(
                    "name"
                )?.value.trim() || "";


            const email =
                document.getElementById(
                    "email"
                )?.value.trim() || "";


            const password =
                document.getElementById(
                    "password"
                )?.value || "";


            if (!name || !email || !password) {

                showMessage(
                    "Please fill in all fields."
                );

                return;

            }


            if (password.length < 8) {

                showMessage(
                    "Password must contain at least 8 characters."
                );

                return;

            }


            const users =
                JSON.parse(
                    localStorage.getItem(
                        "neloy_users"
                    ) || "[]"
                );


            const exists =
                users.some(
                    user =>
                        user.email === email
                );


            if (exists) {

                showMessage(
                    "An account with this email already exists."
                );

                return;

            }


            users.push({

                name: name,

                email: email,

                password: password

            });


            localStorage.setItem(
                "neloy_users",
                JSON.stringify(users)
            );


            localStorage.setItem(
                "neloy_current_email",
                email
            );


            localStorage.setItem(
                "neloy_logged_in",
                "true"
            );


            window.location.href =
                "record.html";

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


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const email =
                document.getElementById(
                    "email"
                )?.value.trim() || "";


            const password =
                document.getElementById(
                    "password"
                )?.value || "";


            const users =
                JSON.parse(
                    localStorage.getItem(
                        "neloy_users"
                    ) || "[]"
                );


            const user =
                users.find(
                    item =>
                        item.email === email &&
                        item.password === password
                );


            if (!user) {

                showMessage(
                    "Invalid email or password."
                );

                return;

            }


            localStorage.setItem(
                "neloy_logged_in",
                "true"
            );


            localStorage.setItem(
                "neloy_current_email",
                email
            );


            localStorage.setItem(
                "neloy_home_welcome",
                "true"
            );


            window.location.href =
                "record.html";

        }
    );

}


/* =========================================================
   LOGIN CHECK
   ========================================================= */

function checkLogin() {

    const body =
        document.body;


    if (!body) {
        return;
    }


    const page =
        body.dataset.page;


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
   PARTICLES
   ========================================================= */

function createParticles() {

    const container =
        document.querySelector(
            ".particles"
        );


    if (!container) {
        return;
    }


    for (
        let i = 0;
        i < 30;
        i++
    ) {

        const particle =
            document.createElement(
                "span"
            );


        particle.className =
            "particle";


        particle.style.left =
            Math.random() * 100 + "%";


        particle.style.top =
            Math.random() * 100 + "%";


        particle.style.animationDelay =
            Math.random() * 5 + "s";


        container.appendChild(
            particle
        );

    }

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

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

        setupVoiceGender();

        waitForSpeechVoices();

        checkLogin();

        await loadQuestions();

    }
);
