"use client"

import Image from "next/image"
import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const AUTH_IMAGE_SRC =
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758560328/login-register-novo-image_euyyf4.webp"

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState<LOGIN_VIEW>(LOGIN_VIEW.SIGN_IN)

  return (
    <div className="bg-[#FAF6F3] py-12 md:py-20">
      <div className="content-container flex flex-col-reverse gap-12 lg:flex-row lg:items-stretch lg:gap-20">
        <div className="flex w-full items-center justify-center lg:w-[50%]">
          {currentView === LOGIN_VIEW.SIGN_IN ? (
            <Login setCurrentView={setCurrentView} />
          ) : (
            <Register setCurrentView={setCurrentView} />
          )}
        </div>
        <div className="relative w-full overflow-hidden border border-[#e6ddd5] bg-white/20 shadow-[0px_30px_80px_rgba(64,58,51,0.15)] lg:w-[50%]">
          <div className="relative h-[260px] w-full sm:h-[340px] md:h-[420px] lg:h-full lg:min-h-[540px]">
            <Image
              src={AUTH_IMAGE_SRC}
              alt="Softly lit bedroom setting with neutral tones"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1023px) 100vw, 48vw"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginTemplate
