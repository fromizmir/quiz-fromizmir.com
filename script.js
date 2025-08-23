document.addEventListener('DOMContentLoaded', () => {
    // ELEMENT TANIMLAMALARI
    const lobbyScreen = document.getElementById('lobby-screen');
    const competitionScreen = document.getElementById('competition-screen');
    const quizListContainer = document.getElementById('quiz-list-container');
    const searchInput = document.getElementById('quiz-search-input');
    const quizTitleElement = document.getElementById('quiz-title');
    const questionTextElement = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const explanationArea = document.getElementById('explanation-area');
    const nextQuestionBtn = document.getElementById('next-q-btn');
    const questionCounterElement = document.getElementById('question-counter');
    const soloScoreElement = document.getElementById('solo-score');
    
    // GENEL DEĞİŞKENLER VE API AYARLARI
    let allQuizzes = [];
    let currentQuizData = {};
    let currentQuestionIndex = 0;
    let soloScore = 0;

    // ANA FONKSİYONLAR
    async function fetchAndDisplayQuizzes() {
        try {
            const response = await fetch(`/api/getQuizzes`);
            if (!response.ok) {
                // GÜNCELLEME: Hata cevabının JSON olup olmadığını kontrol et
                const errorText = await response.text();
                throw new Error(errorText || 'Sınav listesi alınamadı.');
            }
            allQuizzes = await response.json();
            renderQuizList(allQuizzes);
        } catch (error) {
            if (quizListContainer) quizListContainer.innerHTML = `<p style="color: red;">Hata: ${error.message}</p>`;
        }
    }

    function renderQuizList(quizzes) {
        if (!quizListContainer || !Array.isArray(quizzes)) {
            quizListContainer.innerHTML = '<p>Hiç sınav bulunamadı veya veri formatı yanlış.</p>';
            return;
        }
        quizListContainer.innerHTML = '';
        quizzes.forEach(quiz => {
            const quizItem = document.createElement('div');
            quizItem.className = 'quiz-list-item';
            quizItem.textContent = quiz.title;
            quizItem.dataset.quizId = quiz.id;
            quizItem.addEventListener('click', () => startQuiz(quiz.id));
            quizListContainer.appendChild(quizItem);
        });
    }

    function filterQuizzes() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredQuizzes = allQuizzes.filter(quiz => quiz.title.toLowerCase().includes(searchTerm));
        renderQuizList(filteredQuizzes);
    }

    async function startQuiz(quizId) {
        lobbyScreen.innerHTML = `<h1>Sınav Yükleniyor...</h1>`;
        try {
            const response = await fetch(`/api/getQuiz?id=${quizId}`);
            if (!response.ok) {
                // GÜNCELLEME: Hata cevabının JSON olup olmadığını kontrol et
                const errorText = await response.text();
                throw new Error(errorText || 'Sınav verileri alınamadı.');
            }
            currentQuizData = await response.json();
            if (!currentQuizData.sorular || currentQuizData.sorular.length === 0) { throw new Error('Bu sınavda soru bulunamadı.'); }
            currentQuestionIndex = 0;
            soloScore = 0;
            if (soloScoreElement) soloScoreElement.textContent = '0';
            document.body.className = 'solo-mode';
            showScreen(competitionScreen);
            loadQuestion(0);
        } catch (error) {
            lobbyScreen.innerHTML = `<h1 style="color: red;">Hata: ${error.message}</h1>`;
        }
    }

    function loadQuestion(questionIndex) {
        const question = currentQuizData.sorular[questionIndex];
        currentQuestionIndex = questionIndex;
        quizTitleElement.textContent = currentQuizData.sinavAdi;
        questionTextElement.innerHTML = question.soruMetni;
        optionsContainer.innerHTML = '';
        explanationArea.style.display = 'none';
        nextQuestionBtn.style.display = 'none';
        question.secenekler.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.innerHTML = option;
            button.addEventListener('click', () => handleAnswer(index));
            optionsContainer.appendChild(button);
        });
        questionCounterElement.textContent = `Soru ${questionIndex + 1} / ${currentQuizData.sorular.length}`;
    }

    function handleAnswer(selectedIndex) {
        const allButtons = optionsContainer.querySelectorAll('.option-btn');
        allButtons.forEach(btn => btn.disabled = true);
        const question = currentQuizData.sorular[currentQuestionIndex];
        const isCorrect = selectedIndex === question.dogruCevapIndex;
        if (isCorrect) {
            soloScore += 10;
            if (soloScoreElement) soloScoreElement.textContent = soloScore;
        }
        allButtons[selectedIndex].classList.add(isCorrect ? 'correct' : 'incorrect');
        if (!isCorrect && question.dogruCevapIndex >= 0 && question.dogruCevapIndex < allButtons.length) {
            allButtons[question.dogruCevapIndex].classList.add('correct');
        }
        if (question.aciklama) {
            explanationArea.innerHTML = question.aciklama;
            explanationArea.style.display = 'block';
        }
        if (currentQuestionIndex < currentQuizData.sorular.length - 1) {
            nextQuestionBtn.style.display = 'block';
        } else {
            setTimeout(showFinalScore, 3000);
        }
    }

    function showFinalScore() {
        questionTextElement.textContent = 'Test Bitti!';
        optionsContainer.innerHTML = `<strong>Final Puanınız: ${soloScore}</strong><br><br><button class="next-question-btn" style="display: block;" onclick="location.reload()">Yeni Sınav Seç</button>`;
        explanationArea.style.display = 'none';
        nextQuestionBtn.style.display = 'none';
    }

    function goToNextQuestion() { loadQuestion(currentQuestionIndex + 1); }
    function showScreen(screenToShow) { if (lobbyScreen) lobbyScreen.style.display = 'none'; if (competitionScreen) competitionScreen.style.display = 'none'; if (screenToShow) screenToShow.style.display = 'flex'; }
    
    if (searchInput) searchInput.addEventListener('keyup', filterQuizzes);
    document.body.addEventListener('click', function (event) { if (event.target && event.target.id === 'next-q-btn') { goToNextQuestion(); } });
    
    fetchAndDisplayQuizzes();
});
