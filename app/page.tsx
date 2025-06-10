"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Play, Camera } from "lucide-react";

type Question = {
  id: number;
  question: string;
  options?: string[];
  correctAnswer: string;
  type: "multiple-choice" | "fill-in";
  startTime: number;
  answerTime: string;
};

const questions: Question[] = [
  {
    id: 1,
    question: "Which is the nearest big city to Leipzig?",
    options: ["Berlin", "Frankfurt", "Prague", "Munich"],
    correctAnswer: "Berlin",
    type: "multiple-choice",
    startTime: 2,
    answerTime: "3-7s"
  },
  {
    id: 2,
    question: "Which one of the following features about the University was not mentioned in the video?",
    options: ["High Quality", "Modern equipment", "Broad study spectrum", "Great food at Mensa"],
    correctAnswer: "Great food at Mensa",
    type: "multiple-choice",
    startTime: 18,
    answerTime: "19-23s"
  },
  {
    id: 3,
    question: "University of Leipzig has been there for how many years?",
    options: ["More than 300 years", "More than 200 years", "More than 600 years", "More than 1000 years"],
    correctAnswer: "More than 600 years",
    type: "multiple-choice",
    startTime: 23,
    answerTime: "24-27s"
  },
  {
    id: 4,
    question: "Which one of the following was not an alumni at the University of Leipzig?",
    options: ["Angela Merkel", "Nietzsche", "Goethe", "Albert Einstein"],
    correctAnswer: "Albert Einstein",
    type: "multiple-choice",
    startTime: 27,
    answerTime: "28-31s"
  },
  {
    id: 5,
    question: "Leipzig is part of which state in Germany?",
    options: ["Saxony", "Bavaria", "Brandenburg", "Thuringia"],
    correctAnswer: "Saxony",
    type: "multiple-choice",
    startTime: 34,
    answerTime: "35-39s"
  }
];

export default function Home() {
  const [currentPhase, setCurrentPhase] = useState<"instructions" | "video" | "loading" | "complete">("instructions");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<number>>(new Set());
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [nextQuestionCountdown, setNextQuestionCountdown] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = "https://fahyg85j4o.ufs.sh/f/TWfxvOHdIuEQ71513Eg3KFgxzNithZERrdn0j5O46BYGeuby";

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error("Camera permission denied:", error);
      return false;
    }
  };

  const startVideoQuiz = async () => {
    const hasPermission = await requestCameraPermission();
    if (hasPermission) {
      setCurrentPhase("video");
      setCurrentQuestionIndex(-1);
      setUserAnswers({});
      setSubmittedQuestions(new Set());
      setShowCorrectAnswer(false);
      setShowHint(false);
      setNextQuestionCountdown(0);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play();
        }
      }, 100);
    } else {
      alert("Camera permission is required for this demonstration.");
    }
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 1;
    setVideoProgress((currentTime / duration) * 100);

    const applicableQuestions = questions
      .filter(q => currentTime >= q.startTime && !userAnswers[q.id])
      .sort((a, b) => b.startTime - a.startTime);
    
    const latestTimedQuestion = applicableQuestions[0];

    if (latestTimedQuestion && currentQuestionIndex !== questions.findIndex(q => q.id === latestTimedQuestion.id)) {
      const questionIndex = questions.findIndex(q => q.id === latestTimedQuestion.id);
      setCurrentQuestionIndex(questionIndex);
      setShowCorrectAnswer(false);
      setNextQuestionCountdown(0);
      setShowHint(false);
      return;
    }

    if (currentQuestionIndex === -1 || userAnswers[questions[currentQuestionIndex]?.id]) {
      const nextTimedQuestionToAppear = questions.find(q => 
        currentTime < q.startTime && 
        !userAnswers[q.id]
      );
      
      if (nextTimedQuestionToAppear) {
        const timeUntilNext = nextTimedQuestionToAppear.startTime - currentTime;
        if (timeUntilNext <= 3 && timeUntilNext > 0) {
          setNextQuestionCountdown(Math.ceil(timeUntilNext));
        } else {
          setNextQuestionCountdown(0);
        }
      } else {
        setNextQuestionCountdown(0);
      }
    }
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!userAnswers[currentQuestion.id]) return;

    setSubmittedQuestions(prev => new Set([...prev, currentQuestion.id]));
    setShowCorrectAnswer(true);
    
    setTimeout(() => {
      setShowCorrectAnswer(false);
      
      const nextUnansweredQuestion = questions.find(q => !userAnswers[q.id] && q.id !== currentQuestion.id);
      
      if (nextUnansweredQuestion) {
        const nextIndex = questions.findIndex(q => q.id === nextUnansweredQuestion.id);
        setCurrentQuestionIndex(nextIndex);
        setNextQuestionCountdown(0);
        setShowHint(false);
      } else {
        setCurrentQuestionIndex(-1);
      }
    }, 1500);
  };

  const handleVideoEnd = () => {
    setCurrentPhase("loading");
    setTimeout(() => {
      setCurrentPhase("complete");
    }, 2000);
  };

  const resetDemo = () => {
    setCurrentPhase("instructions");
    setCurrentQuestionIndex(-1);
    setUserAnswers({});
    setSubmittedQuestions(new Set());
    setShowCorrectAnswer(false);
    setShowHint(false);
    setNextQuestionCountdown(0);
    setVideoProgress(0);
  };

  if (currentPhase === "instructions") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Eyetracking & Facial Expression Recognition Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Hello! This is a simple demonstration for eyetracking and facial expression recognition 
                that we use at the Process Living Lab at Small Enterprise Promotion and Training.
              </p>
              <Separator />
              <div className="space-y-3 text-left">
                <p className="font-medium">As part of this demo, you will:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Watch a simple video about Leipzig and the University of Leipzig</li>
                  <li>Answer 5 questions that appear at specific moments during the video</li>
                  <li>Take your time - questions stay on screen until you answer them</li>
                  <li>The next question appears when you complete the current one</li>
                  <li>Your face will be recorded via webcam for demonstration purposes</li>
                </ul>
              </div>
              <Alert>
                <Camera className="h-4 w-4" />
                <AlertDescription>
                  Please watch the video carefully as all questions are based on its content. 
                  Camera permission is required to continue.
                </AlertDescription>
              </Alert>
            </div>
            <div className="flex justify-center pt-4">
              <Button onClick={startVideoQuiz} size="lg" className="px-8 py-3 text-lg">
                <Play className="w-5 h-5 mr-2" />
                Start Video & Begin Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentPhase === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (currentPhase === "video") {
    const currentQuestion = currentQuestionIndex >= 0 ? questions[currentQuestionIndex] : null;
    const completedQuestions = submittedQuestions.size;
    const totalQuestions = questions.length;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Leipzig University Demo</h1>
              <div className="text-sm text-muted-foreground">
                Questions Answered: {completedQuestions} of {totalQuestions}
              </div>
            </div>
            <Progress value={(completedQuestions / totalQuestions) * 100} className="h-2" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
            <div className="lg:col-span-3">
              <Card className="h-full">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full object-contain"
                      controls
                      onTimeUpdate={handleVideoTimeUpdate}
                      onEnded={handleVideoEnd}
                    />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>Video Progress</span>
                      <span>{Math.round(videoProgress)}%</span>
                    </div>
                    <Progress value={videoProgress} className="h-1" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Quiz Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentQuestion ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Question {currentQuestion.id}</span>
                          {nextQuestionCountdown > 0 ? (
                            <div className="text-xs text-orange-600 font-medium">
                              Next Q in {nextQuestionCountdown}s
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              Answer when ready
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-medium text-sm">
                          Q{currentQuestion.id}. {currentQuestion.question}
                        </h3>
                        
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowHint(!showHint)}
                            className="w-full text-xs h-8"
                          >
                            {showHint ? "Hide Hint" : "💡 Show Hint"}
                          </Button>
                          
                          {showHint && (
                            <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded animate-in slide-in-from-top-1">
                              💡 Answer appears at <strong>{currentQuestion.answerTime}</strong>
                            </div>
                          )}
                        </div>

                        {!showCorrectAnswer ? (
                          <div className="space-y-3">
                            {currentQuestion.type === "multiple-choice" ? (
                              <RadioGroup
                                value={userAnswers[currentQuestion.id] || ""}
                                onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                              >
                                {currentQuestion.options?.map((option, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <RadioGroupItem 
                                      value={option} 
                                      id={`q${currentQuestion.id}-${index}`} 
                                    />
                                    <Label 
                                      htmlFor={`q${currentQuestion.id}-${index}`}
                                      className="text-sm cursor-pointer"
                                    >
                                      {String.fromCharCode(65 + index)}. {option}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            ) : (
                              <Input
                                placeholder="Type your answer..."
                                value={userAnswers[currentQuestion.id] || ""}
                                onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                              />
                            )}
                            <Button 
                              onClick={submitAnswer}
                              disabled={!userAnswers[currentQuestion.id]}
                              className="w-full"
                              size="sm"
                            >
                              Submit Answer
                            </Button>
                          </div>
                        ) : (
                          <Alert>
                            <AlertDescription>
                              <div className="space-y-2">
                                <p className="font-medium">
                                  Correct Answer: {currentQuestion.correctAnswer}
                                </p>
                                <p className="text-sm">
                                  Your Answer: {userAnswers[currentQuestion.id] || "No answer"}
                                </p>
                                {userAnswers[currentQuestion.id] === currentQuestion.correctAnswer ? (
                                  <p className="text-green-600 font-medium">✓ Correct!</p>
                                ) : (
                                  <p className="text-red-600 font-medium">✗ Incorrect</p>
                                )}
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground space-y-2">
                      {nextQuestionCountdown > 0 ? (
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <div className="text-lg text-orange-600 font-bold animate-pulse">
                            Next Q in {nextQuestionCountdown}s
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Get ready...</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm">Watch the video carefully.</p>
                          <p className="text-sm">Questions will appear at specific moments.</p>
                          {completedQuestions > 0 && (
                            <p className="text-xs text-green-600">
                              ✓ {completedQuestions} question{completedQuestions > 1 ? 's' : ''} completed
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {submittedQuestions.size > 0 && (
                    <div className="space-y-2">
                      <Separator />
                      <h4 className="text-sm font-medium">Completed Questions:</h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {questions.filter(q => submittedQuestions.has(q.id)).map((q) => (
                          <div key={q.id} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">Q{q.id}</p>
                              <p className={`${
                                userAnswers[q.id] === q.correctAnswer 
                                  ? "text-green-600" 
                                  : "text-red-600"
                              }`}>
                                {userAnswers[q.id] === q.correctAnswer ? "✓" : "✗"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPhase === "complete") {
    const correctAnswers = questions.filter(q => 
      submittedQuestions.has(q.id) && userAnswers[q.id] === q.correctAnswer
    ).length;
    const totalQuestions = questions.length;
    const submittedCount = submittedQuestions.size;
    const scorePercentage = submittedCount > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-3xl font-bold">Demo Complete!</CardTitle>
            <div className="text-5xl font-bold text-blue-600">
              {correctAnswers}/{totalQuestions}
            </div>
            <p className="text-lg text-muted-foreground">
              You answered {correctAnswers} out of {totalQuestions} questions correctly ({scorePercentage}%)
            </p>
            {submittedCount < totalQuestions && (
              <p className="text-sm text-orange-600">
                {totalQuestions - submittedCount} question{totalQuestions - submittedCount > 1 ? 's' : ''} skipped
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-medium">Question Summary:</h3>
              {questions.map((q) => {
                const wasSubmitted = submittedQuestions.has(q.id);
                const answerText = wasSubmitted 
                  ? (userAnswers[q.id] === q.correctAnswer ? "✓ Correct" : "✗ Incorrect")
                  : "⊘ Skipped";
                const answerColor = wasSubmitted 
                  ? (userAnswers[q.id] === q.correctAnswer ? "text-green-600" : "text-red-600")
                  : "text-gray-500";
                
                return (
                  <div key={q.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm">Q{q.id}: {q.question}</span>
                    </div>
                    <span className={`text-sm font-medium ${answerColor}`}>
                      {answerText}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-4">
              <Button onClick={resetDemo} size="lg">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}