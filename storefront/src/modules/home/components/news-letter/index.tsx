"use client"

import { useState } from 'react'

const NewsletterSubscription = () => {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle subscription logic here
    console.log('Subscribed with email:', email)
    setEmail('')
  }

  return (
    <section className="w-full py-9 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Heading */}
          <h2 className="text-xl font-light text-[#474546] mb-4">
            STAY IN THE KNOW
          </h2>
          
          {/* Subheading */}
          <h3 className="text-xl md:text-2xl lg:text-4xl font-medium text-[#474546] mb-6">
            Illuminate your inbox with NOVO
          </h3>
          
          {/* Description */}
          <p className="w-full text-base md:text-lg text-[#474546] mb-8 leading-relaxed opacity-90  ">
            Plus, receive exclusive offers, early access to sales, a first look at new collections and more!
          </p>
          
          {/* Subscription Form with Integrated Button */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="relative flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-6 py-3 pr-32 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#474546] focus:border-transparent text-[#474546] placeholder-gray-400 transition-all duration-300"
                required
              />
              <button
                type="submit"
                className="absolute right-1 bg-[#474546] hover:bg-gray-700 text-white py-3 px-6 rounded-full font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                SUBSCRIBE
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default NewsletterSubscription