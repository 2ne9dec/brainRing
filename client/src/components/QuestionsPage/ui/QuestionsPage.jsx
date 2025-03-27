import { questions } from "../../../config/questionsConfig";
import "./QuestionsPage.scss";

export const QuestionsPage = ({ currentQuestionId, onNextQuestion, onPreviousQuestion }) => {
  const currentQuestion = questions[currentQuestionId - 1]; // Получаем текущий вопрос

  if (!currentQuestion) {
    return <div>Вопрос не найден</div>;
  }

  // Переход к следующему вопросу
  const handleNextQuestion = () => {
    const nextQuestionId = currentQuestionId + 1;

    if (nextQuestionId <= questions.length) {
      onNextQuestion(nextQuestionId);
    } else {
      alert("Это был последний вопрос!");
    }
  };

  // Переход к предыдущему вопросу
  const handlePreviousQuestion = () => {
    const prevQuestionId = currentQuestionId - 1;

    if (prevQuestionId >= 1) {
      onPreviousQuestion(prevQuestionId);
    } else {
      alert("Это был первый вопрос!");
    }
  };

  return (
    <div className="questions-page">
      <>
        <h2>Вопрос №{currentQuestionId}</h2>
        <p>{currentQuestion.question}</p>
      </>
      <div className="question-navigation-buttons">
        <button onClick={handlePreviousQuestion} disabled={currentQuestionId === 1}>
          Предыдущий вопрос
        </button>
        <button onClick={handleNextQuestion} disabled={currentQuestionId === questions.length}>
          Следующий вопрос
        </button>
      </div>
    </div>
  );
};
