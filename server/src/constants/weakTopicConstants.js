// Central place for every threshold used by weak-topic detection (Phase 10),
// and for the shared topic-length cap used across quiz + study mode topics.

// A topic needs at least this many combined quiz/study-mode answers before
// it is considered at all. A single wrong answer never triggers a warning.
export const MIN_TOPIC_ATTEMPTS = 3;

// A topic's accuracy (0-100) must fall below this value to be flagged.
export const WEAK_TOPIC_ACCURACY = 60;

// "Recent" performance for a topic looks at only its most recent N answers,
// across quizzes and study mode combined, most recent first.
export const RECENT_ATTEMPTS_LIMIT = 10;

// When there are enough recent answers to be meaningful, overall and recent
// accuracy are blended into a single combined score, weighted toward recent
// performance so genuine improvement can lift a topic out of "review"
// status. Below MIN_TOPIC_ATTEMPTS recent answers, overall accuracy alone
// is used (not enough recent data to weight separately).
export const OVERALL_WEIGHT = 0.4;
export const RECENT_WEIGHT = 0.6;

// A previously-weak topic (overall accuracy below WEAK_TOPIC_ACCURACY) is
// reported as "improved" once its recent accuracy has risen at least this
// many percentage points above its overall accuracy.
export const IMPROVEMENT_THRESHOLD = 15;

// Shared cap on topic label length, enforced when quiz questions and study
// mode turns are saved. Keeps topics concise (spec section 4) and keeps
// normalized grouping keys well-behaved.
export const MAX_TOPIC_LENGTH = 60;