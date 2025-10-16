import { Html, Body, Container, Preview, Tailwind, Head } from '@react-email/components'
import * as React from 'react'

interface BaseProps {
  preview?: string
  children: React.ReactNode
}

export const Base: React.FC<BaseProps> = ({ preview, children }) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-[#F3EDE7] my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#E8DCD2] rounded-[28px] my-[40px] mx-auto p-0 max-w-[620px] w-full overflow-hidden shadow-[0_24px_60px_rgba(34,28,24,0.12)]">
            <div className="max-w-full break-words">
              {children}
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
