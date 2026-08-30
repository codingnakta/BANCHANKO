import { Link } from 'react-router'
import { formatDate, formatTime } from '@/lib/date'
import { cn } from '@/lib/utils'
import { DEFAULT_MASCOT } from '../constants'
import { MASCOT_IMAGE, MASCOT_NAME } from '../mascots'
import { ActionCard } from './ActionCard'
import type { ChatMessage } from '@/types'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <li className="flex justify-end">
        {/* 오른쪽 아래 모서리는 각지게 두어 말풍선 꼬리처럼 보이게 한다 */}
        <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-none bg-brand-400 px-4 py-2.5 text-[15px] text-white">
          {message.text}
        </p>
      </li>
    )
  }

  const mascot = message.mascot ?? DEFAULT_MASCOT

  return (
    <li className="flex items-start gap-2">
      <img
        src={MASCOT_IMAGE[mascot]}
        alt={`${MASCOT_NAME[mascot]}의 답변`}
        draggable={false}
        className="mt-0.5 size-8 shrink-0 select-none object-contain"
      />
      <div className="max-w-[85%]">
        <div
          className={cn(
            'rounded-2xl rounded-tl-none px-4 py-2.5 text-[15px] whitespace-pre-wrap',
            message.status === 'answered'
              ? 'bg-white text-ink-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
              : 'bg-ink-100 text-ink-700',
          )}
        >
          {message.text}
        </div>

        {/* 교사가 부탁한 일의 제안 — 눌러야 실제로 반영된다 */}
        {message.action && <ActionCard action={message.action} />}

        {/* 답변 근거의 출처와 최종 갱신 시각을 함께 표시한다 (F-CCZIQT) */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 rounded-xl border border-ink-200 bg-white/60 px-3 py-2">
            <p className="mb-1.5 text-[11px] font-medium text-ink-500">참고한 학급 정보</p>
            <ul className="flex flex-col gap-1">
              {message.sources.map((source, i) => (
                <li key={`${source.label}-${i}`} className="text-xs text-ink-600">
                  {source.href ? (
                    <Link to={source.href} className="text-brand-700 hover:underline">
                      {source.label}
                    </Link>
                  ) : (
                    <span className="text-ink-700">{source.label}</span>
                  )}
                  {source.updatedAt && (
                    <span className="ml-1.5 text-ink-400">
                      · {formatDate(source.updatedAt, 'M월 d일')} {formatTime(source.updatedAt)} 기준
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </li>
  )
}
