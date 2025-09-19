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
    <section className="w-full py-16 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Heading */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-[#474546] mb-4">
            STAY IN THE KNOW
          </h2>
          
          {/* Subheading */}
          <h3 className="text-xl md:text-2xl lg:text-3xl font-medium text-[#474546] mb-6">
            Illuminate your inbox with DUSK
          </h3>
          
          {/* Description */}
          <p className="text-base md:text-lg text-[#474546] mb-8 leading-relaxed opacity-90 max-w-md mx-auto">
            Plus, receive exclusive offers, early access to sales, a first look at new collections and more!
          </p>
          
          {/* Subscription Form with Integrated Button */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="relative flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-6 py-4 pr-32 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#474546] focus:border-transparent text-[#474546] placeholder-gray-400 transition-all duration-300"
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
          
          {/* Privacy Note */}
          <p className="text-xs text-gray-500 mt-6 opacity-75">
            By subscribing, you agree to our Privacy Policy and consent to receive updates from DUSK.
          </p>
        </div>
      </div>
    </section>
  )
}

export default NewsletterSubscription