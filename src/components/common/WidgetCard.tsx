import { PropsWithChildren } from 'react'

type WidgetCardProps = PropsWithChildren<{
  title: string
  actions?: React.ReactNode
}>

export function WidgetCard({ title, actions, children }: WidgetCardProps) {
  return (
    <section className="widget-card" aria-label={title}>
      <header className="widget-card__header">
        <h2 className="widget-card__title">{title}</h2>
        {actions ? <div className="widget-card__actions">{actions}</div> : null}
      </header>
      <div className="widget-card__body">
        {children}
      </div>
    </section>
  )
}


