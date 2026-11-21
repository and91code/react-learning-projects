import type { ReactNode } from 'react'

type PageHeadingProps = {
  eyebrow: string
  title: string
  description: string
  icon?: ReactNode
  action?: ReactNode
}

export function PageHeading({ eyebrow, title, description, icon, action }: PageHeadingProps) {
  return (
    <header className="route-heading">
      {icon && <div className="route-icon">{icon}</div>}
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  )
}
