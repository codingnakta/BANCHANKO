export { ChatFab } from './components/ChatFab'
export { ChatInput } from './components/ChatInput'
export { ChatEmptyState } from './components/ChatEmptyState'
export { SuggestionChips } from './components/SuggestionChips'
export { MessageBubble } from './components/MessageBubble'
export { useChat } from './hooks/useChat'
export { answerQuestion, pickMascot } from './api/answerQuestion'
export { retrieveContext, detectTopics, type Topic } from './api/retrieveContext'
export {
  SUGGESTED_QUESTIONS,
  SUGGESTION_CHIPS,
  MASCOT_BY_TOPIC,
  DEFAULT_MASCOT,
  type SuggestionChip,
  type MascotKey,
} from './constants'
export { MASCOT_IMAGE, MASCOT_NAME } from './mascots'
